---
title: HTB Cicada
slug: cicada
lang: en
platform: Hack The Box
category: Active Directory
headline: SMB disclosure, LDAP descriptions, credential reuse and SeBackupPrivilege
difficulty: Easy
objective: Administrator
date: 2024-10-03
tags: [Active Directory, SMB, LDAP, SeBackupPrivilege, Pass the Hash]
---

# HTB Cicada

## Executive Summary

Cicada is an Active Directory machine where anonymous and guest-accessible SMB content exposes a default password. User enumeration identifies valid principals, and LDAP data later reveals another password stored in a user description field. That credential provides access to a developer share containing a PowerShell backup script with credentials for `emily.oscars`. The final privilege escalation abuses `SeBackupPrivilege` to copy registry hives, extract the Administrator NTLM hash and authenticate via Pass-the-Hash.

## Enumeration and SMB Disclosure

Port and service enumeration identified a Windows domain controller.

![[Pasted image 20241003184214.png|Open port scan]]
![[Pasted image 20241003184633.png|Service enumeration]]

SMB shares were listed and the `HR` share was readable.

![[Pasted image 20241003193114.png|SMB share listing]]

Inside `HR`, the file `Notice from HR.txt` contained a default password.

![[Pasted image 20241003193216.png|HR notice file]]
![[Pasted image 20241003193308.png|Default password disclosure]]

## User Enumeration and Credential Discovery

Users were enumerated with NetExec RID brute force.

```bash
nxc smb 10.10.11.35 -u guest -p '' --rid-brute
```

![[Pasted image 20241003202234.png|RID brute force output]]
![[Pasted image 20241003202304.png|Discovered users]]

Kerbrute confirmed valid users for `cicada.htb`.

```bash
kerbrute userenum -d "cicada.htb" users.txt --dc "CICADA-DC.cicada.htb"
```

![[Pasted image 20241003203314.png|Kerbrute valid users]]

Testing the default password identified `michael.wrightson` as a valid account.

![[Pasted image 20241003204245.png|Default password validation]]

LDAP domain dump revealed that `david.orelious` had a password stored in the `description` field.

```bash
ldapdomaindump -u 'cicada.htb\michael.wrightson' -p 'Cicada$M6Corpb*@Lp#nZp!8' 10.10.11.35
```

![[Pasted image 20241003205439.png|LDAP domain dump]]
![[Pasted image 20241003210029.png|Password in description field]]
![[Pasted image 20241003210009.png|david.orelious credential disclosure]]

## Developer Share and WinRM Access

`david.orelious` had access to the `DEV` share, which contained `Backup_script.ps1`.

```bash
smbclient //10.10.11.35/DEV -U david.orelious
```

![[Pasted image 20241003210640.png|DEV share access]]
![[Pasted image 20241003210813.png|Backup script download]]

The script exposed credentials for `emily.oscars`, which allowed WinRM access.

![[Pasted image 20241003211121.png|emily.oscars credentials]]
![[Pasted image 20241003211303.png|WinRM as emily.oscars]]

## SeBackupPrivilege Abuse

Privilege enumeration showed `SeBackupPrivilege` enabled for `emily.oscars`.

![[Pasted image 20241003211941.png|SeBackupPrivilege enabled]]

Following a standard SeBackupPrivilege workflow, the registry hives were backed up and downloaded.

![[Pasted image 20241003212155.png|Registry backup workflow]]
![[Pasted image 20241003212302.png|Hive backup completed]]
![[Pasted image 20241003213615.png|Hive files downloaded]]

The Administrator NTLM hash was extracted from the hives.

![[Pasted image 20241003214003.png|Administrator hash extraction]]

Pass-the-Hash produced an Administrator shell.

```bash
evil-winrm -i CICADA-DC.cicada.htb -u 'administrator' -H '2b87e7c93a3e8a0ea4a581937016f341'
```

![[Pasted image 20241003214339.png|Administrator shell]]

## Key Takeaways

- Default passwords in onboarding documents are dangerous even when access is read-only.
- LDAP `description` fields are common places for accidental credential exposure.
- Backup scripts often contain reusable service or user credentials.
- `SeBackupPrivilege` can be enough to extract registry hives and recover Administrator hashes.
