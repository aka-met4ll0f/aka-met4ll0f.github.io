---
title: HTB Instant
slug: instant
lang: en
platform: Hack The Box
category: Mobile and API Exploitation
headline: APK static analysis, authenticated API LFI and Solar-PuTTY credential recovery
difficulty: Retired
objective: Root / Administrator
date: 2024-10-21
tags: [Linux, APK, JWT, LFI, Solar-PuTTY]
---

# HTB Instant

## Executive Summary

Instant starts from a downloadable Android APK. Decompiling it reveals API subdomains and authentication details needed to interact with the Swagger-exposed backend.

## Initial Access

With the JWT loaded into Swagger, an LFI endpoint reads `/etc/passwd` and then the SSH private key for `shirohige`, enabling SSH access.

## Privilege Escalation

Backups under `/opt/backups/Solar-PuTTY` contain encrypted session data. SolarPuttyCracker decrypts the backup and reveals credentials that allow switching to root.

## Publishing Note

The public source describes the private-key and password recovery path but does not publish full private-key material.

## Key Commands

```bash
jadx-gui instant.apk
```

```bash
curl -H "Authorization: Bearer <redacted-jwt>" http://api.instant.htb/download?file=/etc/passwd
```

```bash
ssh -i id_rsa shirohige@instant.htb
```

```bash
python3 SolarPuttyCracker.py sessions-backup.dat
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241021205224.png|instant evidence 01]]

![[Pasted image 20241021205245.png|instant evidence 02]]

![[Pasted image 20241021205639.png|instant evidence 03]]

![[Pasted image 20241021211524.png|instant evidence 04]]

![[Pasted image 20241021211539.png|instant evidence 05]]

![[Pasted image 20241021211606.png|instant evidence 06]]

![[Pasted image 20241021211944.png|instant evidence 07]]

![[Pasted image 20241021212036.png|instant evidence 08]]

![[Pasted image 20241021212107.png|instant evidence 09]]

![[Pasted image 20241021215942.png|instant evidence 10]]

![[Pasted image 20241021220022.png|instant evidence 11]]

![[Pasted image 20241021213022.png|instant evidence 12]]

![[Pasted image 20241021213038.png|instant evidence 13]]

![[Pasted image 20241021213057.png|instant evidence 14]]

![[Pasted image 20241021213354.png|instant evidence 15]]

![[Pasted image 20241021213428.png|instant evidence 16]]

![[Pasted image 20241021215232.png|instant evidence 17]]

![[Pasted image 20241021215242.png|instant evidence 18]]

![[Pasted image 20241021220219.png|instant evidence 19]]

![[Pasted image 20241021225032.png|instant evidence 20]]

![[Pasted image 20241021225128.png|instant evidence 21]]

![[Pasted image 20241021225204.png|instant evidence 22]]

![[Pasted image 20241021225224.png|instant evidence 23]]

![[Pasted image 20241021225354.png|instant evidence 24]]
