---
title: HTB Certificate
slug: certificate
lang: en
platform: Hack The Box
category: Active Directory
headline: ZIP upload abuse, credential reuse, Account Operators and forged AD CS certificates
difficulty: Hard
objective: Administrator
date: 2026-06-03
tags: [Active Directory, Web Upload, MySQL, BloodHound, SeManageVolumePrivilege, AD CS]
---

# HTB Certificate

## Executive Summary

Certificate starts with a web application that allows ZIP uploads behind a session identifier. By abusing ZIP handling, a PHP web shell is executed and local configuration files reveal database credentials. The database contains password hashes, one of which is cracked to obtain `sara.b`.

Active Directory enumeration shows that `sara.b` can abuse group relationships to reset passwords and pivot through `lion.sk` and `ryan.k`. The final escalation abuses `SeManageVolumePrivilege` to obtain full access to the CA private material, forge an Administrator certificate and authenticate as Domain Administrator.

## Initial Web Access

After port enumeration and web fuzzing, `uploads.php` was discovered. The endpoint required an `s_id` parameter, and valid identifiers could be discovered through Burp Intruder. Registration was required before uploading files.

The upload handler accepted ZIP files. A malicious archive was created by combining a benign ZIP and a malicious ZIP containing `shell.php`.

```bash
chmod +x shell.php
cat benign.zip malicious.zip > combined.zip
nc -lvnp 4444
```

![[Pasted image 20250603023348.png|ZIP upload abuse and reverse shell execution]]

## Database Credential Exposure

Local enumeration found `db.php`, which exposed credentials for MySQL.

![[Pasted image 20250603023452.png|db.php discovery]]

![[Pasted image 20250603023515.png|MySQL credentials in db.php]]

The database contained user hashes. The hash for `sara.b` was cracked successfully.

```text
$2y$04$CgDe/Thzw/Em/M4SkmXNbu0YdFo6uUs3nB.pzQPV.g8UdXikZNdH6
Password: Blink182
```

![[Pasted image 20250603023814.png|Database user hash]]

![[Pasted image 20250603024214.png|Cracked sara.b password]]

## Active Directory Path

BloodHound data showed that `sara.b` had Account Operators-style control and could reset the password of `lion.sk`.

![[Pasted image 20250603024730.png|BloodHound data collection]]

![[Pasted image 20250603081512.png|sara.b can reset lion.sk password]]

After authenticating as `lion.sk`, the user flag was recovered.

![[Pasted image 20250603081835.png|WinRM as lion.sk and user flag]]

The next pivot was to reset `ryan.k`. That account had `SeManageVolumePrivilege`, which became the key escalation primitive.

![[Pasted image 20250603081940.png|lion.sk privilege review]]

![[Pasted image 20250603082114.png|Password reset to ryan.k]]

![[Pasted image 20250603082344.png|SeManageVolumePrivilege enabled]]

## CA Material Extraction

`SeManageVolumeExploit.exe` was uploaded and executed to gain full permissions over `C:`.

```text
https://github.com/CsEnox/SeManageVolumeExploit/releases/tag/public
```

![[Pasted image 20250603082918.png|SeManageVolumeExploit upload]]

![[Pasted image 20250603083038.png|Full access over C drive]]

The CA PFX was exported and downloaded to the attacker machine.

![[Pasted image 20250603083303.png|CA PFX export]]

![[Pasted image 20250603083557.png|CA PFX download]]

## Forging Administrator Certificate

With the CA private key compromised, Certipy was used to forge a certificate for Administrator.

```bash
certipy forge -ca-pfx ca.pfx \
  -upn 'administrator@certificate.htb' \
  -subject 'CN=Administrator,CN=Users,DC=certificate,DC=htb' \
  -out forged_admin.pfx
```

![[Pasted image 20250603083907.png|Forged Administrator certificate]]

After synchronizing time with the domain controller, the forged certificate was used to request a Kerberos TGT and recover the Administrator hash.

![[Pasted image 20250603095200.png|Administrator TGT and NT hash]]

```text
d804304519bf0143c14cbf1c024408c6
```

The Administrator hash provided full domain access.

![[Pasted image 20250603095636.png|Administrator shell]]

## Key Takeaways

- ZIP upload workflows must validate archive contents after extraction, not only file extension.
- Application configuration files often bridge web compromise into database access.
- Account Operators-style privileges can create powerful password reset chains.
- `SeManageVolumePrivilege` can expose sensitive CA material if filesystem protections are bypassed.
- Compromised CA private keys allow certificate forgery and complete domain takeover.
