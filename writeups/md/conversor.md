---
title: HTB Conversor
slug: conversor
lang: en
platform: Hack The Box
category: XXE and Linux Privilege Escalation
headline: XSLT file write to code execution, SQLite credential recovery and needrestart abuse
difficulty: Retired
objective: Root / Administrator
date: 2026-05-12
tags: [Linux, XSLT, File Write, SQLite, needrestart]
---

# HTB Conversor

## Executive Summary

Conversor allows users to upload transformation files without sufficient parser restrictions. An XSLT payload writes a Python script into the application scripts directory and triggers a reverse shell as `www-data`.

## Initial Access

The payload uses `exsl:document` to write server-side code that downloads and executes a staged shell from the attacker host. Submitting the XML and XSLT pair through the converter triggers execution.

## Credential Recovery

The application directory contains a SQLite database with user hashes. Cracking the relevant MD5 hash recovers credentials for a valid local user.

## Privilege Escalation

`sudo -l` exposes `needrestart`. A crafted Perl configuration creates a SUID copy of `/bin/bash`, which is then executed with `-p` to preserve root privileges.

## Key Commands

```bash
sqlite3 users.db .dump
```

```bash
echo 'system("cp /bin/bash /tmp/poc; chmod u+s /tmp/poc")' > /tmp/bash.conf
```

```bash
sudo /usr/sbin/needrestart -r l -c /tmp/bash.conf
```

```bash
/tmp/poc -p
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20260512175949.png|conversor evidence 01]]

![[Pasted image 20260512180120.png|conversor evidence 02]]

![[Pasted image 20260512180530.png|conversor evidence 03]]

![[Pasted image 20260512180646.png|conversor evidence 04]]

![[Pasted image 20260512181155.png|conversor evidence 05]]

![[Pasted image 20260512181705.png|conversor evidence 06]]

![[Pasted image 20260512181835.png|conversor evidence 07]]

![[Pasted image 20260512182508.png|conversor evidence 08]]

![[Pasted image 20260512183314.png|conversor evidence 09]]

![[Pasted image 20260512183524.png|conversor evidence 10]]

![[Pasted image 20260512183737.png|conversor evidence 11]]

![[Pasted image 20260512184336.png|conversor evidence 12]]

![[Pasted image 20260512184440.png|conversor evidence 13]]

![[Pasted image 20260512185706.png|conversor evidence 14]]

![[Pasted image 20260512190020.png|conversor evidence 15]]

![[Pasted image 20260512190351.png|conversor evidence 16]]

![[Pasted image 20260512190605.png|conversor evidence 17]]

![[Pasted image 20260512211238.png|conversor evidence 18]]

![[Pasted image 20260512212138.png|conversor evidence 19]]

![[Pasted image 20260512212542.png|conversor evidence 20]]

![[Pasted image 20260512212640.png|conversor evidence 21]]
