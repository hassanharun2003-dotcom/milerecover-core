# Direct-install Android preview APK — evidence

## Canonical download

- **Direct APK:** https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-0.1.6.apk
- **Latest alias:** https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-latest.apk
- **Release page:** https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.6

## Artifact

| Field | Value |
|---|---|
| Filename | `MileRecover-preview-0.1.6.apk` |
| SHA-256 | `4a509da59ad67ce04e86ae01434c6361b9837dacb5251280d42e495239e6e836` |
| Package | `com.milerecover.app` |
| versionName | `0.1.6` |
| versionCode | `16` |
| Runtime | `0.1.6` |
| Channel | `preview` |
| Build label | `0.1.6-mvp.4` |
| Embedded commit | `11253c6d075f81feb155ca6183551cfcfc262a3a` |
| Build | Local EAS preview APK with remote Expo keystore (cloud queue canceled) |
| Cloud sibling (canceled) | `b10e7baa-4387-496a-a136-60890b653575` |

## Device verification (emulator-5554, soft TCG)

Completed before emulator hang:

1. Public HTTPS download of the APK (no GitHub auth) — SHA match (`download-sha256.txt`)
2. APK present as `/sdcard/Download/MileRecover-preview-0.1.6.apk`
3. Install success — versionCode 16 (`03-install.txt`, `04-package-info.txt`)
4. Standalone launch into MileRecover welcome (no Dev Launcher / no Metro) — `04-first-launch.png`, `04-launch-texts.txt`, `04-logcat-launch.txt` (`ReactNativeJS: Running "main"`, `dev.expo.updates` enabled)
5. Profile → About shows preview / runtime 0.1.6 / channel preview / commit `11253c6d075f` / build `0.1.6-mvp.4` — `05-about-texts.txt`, `05-about.png`

## Post-install OTA

Published to preview after APK install verification:

| Field | Value |
|---|---|
| Marker | `OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T19:40:00Z` |
| Update group | `cb4c45b9-1ad5-4c86-9956-488ce33bdd76` |
| Android update ID | `019fce54-0ce2-7d30-ba73-b7429b322b45` |

Apply-cycle screenshots were blocked when the software emulator hung (no KVM). Founder phone install of the public APK should download this marker on the next cold starts. Publish a clean OTA (empty `PREVIEW_CHANNEL_MARKER`) after confirming.
