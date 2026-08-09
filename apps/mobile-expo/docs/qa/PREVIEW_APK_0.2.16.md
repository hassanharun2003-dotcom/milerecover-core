# Preview APK 0.2.16 — Samsung clean-install ZIP fix

## Problem (physical Samsung source of truth)

After a complete uninstall, a fresh download of GitHub `0.2.15` (`46.71 MB`) still failed Samsung Package Installer with:

> Can't install app  
> There's a problem with the app file

This is **not** an in-place `versionCode` / signing-conflict update failure.

## Root cause

`scripts/sign-android-apk.sh` (used for 0.2.8–0.2.15) unpack/repacked the APK with **Python `zipfile`**, which rewrote nearly every entry with ZIP **data-descriptor** flag `0x08`.

Those APKs still passed ordinary static gates (`apksigner`, `zipalign -c 4`, `aapt`, `resources.arsc` Stored) but are not AGP-native ZIP framing. Samsung Package Installer can reject them at install/parse time with “problem with the app file”.

Evidence vs last physically working line (`0.2.12` / `0.2.13` packaging method was the same defective resign path; `0.2.7` AGP-native had `data_descriptor_entries=0` but empty-DN/v2-only signer). For 0.2.16 we keep the recovered preview keystore and restore **descriptor-free** ZIP framing.

| Artifact | data_descriptor_entries | Signer |
|---|---:|---|
| 0.2.7 (AGP-native, bad signer) | 0 | empty DN / v2-only |
| 0.2.13 / 0.2.15 (Python rezip) | 1016 | recovered preview `E6:62:…:1F:31` |
| 0.2.16 (zip -d + apksigner) | 0 | recovered preview `E6:62:…:1F:31` |

## Fix

1. Replace Python unpack/repack with Info-ZIP `zip -d` signature strip + `zipalign` + `apksigner` v1+v2+v3.
2. Gate must fail if any ZIP entry still has data-descriptor flag `0x08`.
3. Preserve `useLegacyPackaging: true` / `extractNativeLibs=true` and UX from 0.2.14/0.2.15.

## Identity

- package: `com.milerecover.app`
- versionName: `0.2.16`
- versionCode: `71`
- channel: `preview-foundation-0.2.16`
- build label: `0.2.16-samsung-zip-fix.1`
- signer SHA-1: `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31`
- **Not** a Play Store / production release
