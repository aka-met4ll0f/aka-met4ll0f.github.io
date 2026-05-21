---
title: HTB Editorial
slug: editorial
lang: en
platform: Hack The Box
category: SSRF and Source Review
headline: SSRF to internal API, Git history credential recovery and vulnerable GitPython sudo path
difficulty: Retired
objective: Root / Administrator
date: 2024-10-22
tags: [Linux, SSRF, Internal API, GitPython, SUID]
---

# HTB Editorial

## Executive Summary

Editorial has a URL-fetch feature that can reach internal services. Port probing through the SSRF identifies a local API on port 5000.

## Initial Access

The internal API exposes endpoints and credentials for the `dev` user, enabling SSH access.

## User Pivot

A Git repository under the user home contains commit history with a previous credential for `prod`. That credential is still valid.

## Privilege Escalation

`prod` can run a Python script through sudo. The script uses a vulnerable GitPython pattern, allowing command execution during clone and setting SUID on `/bin/bash`.

## Key Commands

```bash
git log
```

```bash
git log -p <commit>
```

```bash
sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py <malicious-repo>
```

```bash
/bin/bash -p
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20241022212125.png|editorial evidence 01]]

![[Pasted image 20241022212301.png|editorial evidence 02]]

![[Pasted image 20241022215636.png|editorial evidence 03]]

![[Pasted image 20241022215805.png|editorial evidence 04]]

![[Pasted image 20241022215844.png|editorial evidence 05]]

![[Pasted image 20241022215932.png|editorial evidence 06]]

![[Pasted image 20241022215732.png|editorial evidence 07]]

![[Pasted image 20241022220222.png|editorial evidence 08]]

![[Pasted image 20241022220335.png|editorial evidence 09]]

![[Pasted image 20241022220435.png|editorial evidence 10]]

![[Pasted image 20241022220821.png|editorial evidence 11]]

![[Pasted image 20241022221036.png|editorial evidence 12]]

![[Pasted image 20241022221317.png|editorial evidence 13]]

![[Pasted image 20241022221551.png|editorial evidence 14]]

![[Pasted image 20241022221601.png|editorial evidence 15]]

![[Pasted image 20241022221712.png|editorial evidence 16]]

![[Pasted image 20241022222305.png|editorial evidence 17]]

![[Pasted image 20241022222406.png|editorial evidence 18]]

![[Pasted image 20241022222836.png|editorial evidence 19]]

![[Pasted image 20241022222959.png|editorial evidence 20]]

![[Pasted image 20241022223137.png|editorial evidence 21]]

![[Pasted image 20241022223213.png|editorial evidence 22]]

![[Pasted image 20241022223358.png|editorial evidence 23]]

![[Pasted image 20241022223759.png|editorial evidence 24]]

![[Pasted image 20241022224834.png|editorial evidence 25]]

![[Pasted image 20241022225129.png|editorial evidence 26]]

![[Pasted image 20241022225753.png|editorial evidence 27]]

![[Pasted image 20241022230143.png|editorial evidence 28]]

![[Pasted image 20241022230218.png|editorial evidence 29]]

![[Pasted image 20241022230257.png|editorial evidence 30]]

![[Pasted image 20241022230428.png|editorial evidence 31]]

![[Pasted image 20241022230500.png|editorial evidence 32]]
