---
title: HTB Chemistry
slug: chemistry
lang: en
platform: Hack The Box
category: Python Application Exploitation
headline: pymatgen CIF RCE, SQLite hash cracking and aiohttp arbitrary file read
difficulty: Retired
objective: Root / Administrator
date: 2024-10-21
tags: [Linux, pymatgen, CIF, SQLite, aiohttp]
---

# HTB Chemistry

## Executive Summary

Chemistry allows CIF file uploads and rendering. The backend uses a vulnerable pymatgen path, allowing crafted CIF content to execute commands when viewed.

## Initial Access

A modified example CIF triggers a reverse shell. Local application files include a database with user hashes, and cracking the `rosa` hash gives SSH access.

## Privilege Escalation

Process and port enumeration identifies an internal aiohttp service on port 8080. Port forwarding exposes it locally, and CVE-2024-23334 allows arbitrary file read through the static file handler, including `/root/root.txt`.

## Key Commands

```bash
ssh rosa@chemistry.htb
```

```bash
ssh -L 8080:127.0.0.1:8080 rosa@chemistry.htb
```

```bash
curl http://127.0.0.1:8080/static/../../../../root/root.txt
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241021161526.png|chemistry evidence 01]]

![[Pasted image 20241021165229.png|chemistry evidence 02]]

![[Pasted image 20241021170410.png|chemistry evidence 03]]

![[Pasted image 20241021170342.png|chemistry evidence 04]]

![[Pasted image 20241021170806.png|chemistry evidence 05]]

![[Pasted image 20241021171000.png|chemistry evidence 06]]

![[Pasted image 20241021171107.png|chemistry evidence 07]]

![[Pasted image 20241021171205.png|chemistry evidence 08]]

![[Pasted image 20241021171921.png|chemistry evidence 09]]

![[Pasted image 20241021171952.png|chemistry evidence 10]]

![[Pasted image 20241021172807.png|chemistry evidence 11]]

![[Pasted image 20241021172953.png|chemistry evidence 12]]

![[Pasted image 20241021195159.png|chemistry evidence 13]]

![[Pasted image 20241021195424.png|chemistry evidence 14]]

![[Pasted image 20241021200000.png|chemistry evidence 15]]

![[Pasted image 20241021200013.png|chemistry evidence 16]]

![[Pasted image 20241021200354.png|chemistry evidence 17]]

![[Pasted image 20241021200810.png|chemistry evidence 18]]

![[Pasted image 20241021200937.png|chemistry evidence 19]]

![[Pasted image 20241021203831.png|chemistry evidence 20]]
