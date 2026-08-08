# MileRecover 0.2.13 — Preview APK (device-QA candidate)

**Status:** Preview / Samsung device-QA candidate only. Do **not** publish production.  
**Branch:** `cursor/mile-recover-0.2.13-0cd3`  
**Source agent (keystore):** `bc-c2d41d16-7b43-42fd-bedf-1c2f6f6929cb`  
**Recovery agent (this VM):** `bc-24200079-d6cd-5969-8454-6dbdf66e26c5`

## Identity

| Field | Value |
|---|---|
| versionName | `0.2.13` |
| versionCode | `59` |
| runtimeVersion | `0.2.13` |
| preview channel | `preview-foundation-0.2.13` |
| build label | `0.2.13-device-qa.1` |
| package | `com.milerecover.app` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| Cert SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| Cert SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |
| Signing schemes | v1=true, v2=true, v3=true |
| APK filename | `MileRecover-preview-0.2.13.apk` |
| APK size | `46701451` bytes |
| APK SHA-256 | `f4d340d734006db280794f5e272629410d12c60819de03668ca4f4ea6e6fba85` |
| Keystore | Recovered existing `milerecover-preview-release.keystore` (alias `milerecover`) — **no new keystore** |
| Build path | Local `expo prebuild` + `gradlew assembleRelease` (`APP_VARIANT=preview`) + `npm run sign:android-apk` |
| ABIs | `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |

## Keystore recovery (fresh VM)

1. Confirmed `CURSOR_API_KEY` injected (value never printed).
2. Listed artifacts via `GET https://api.cursor.com/v0/agents/bc-c2d41d16-7b43-42fd-bedf-1c2f6f6929cb/artifacts`.
3. Downloaded `/opt/cursor/artifacts/credentials/milerecover-preview-release.keystore` via Artifacts download API (presigned S3 URL).
4. Placed at `apps/mobile-expo/credentials/milerecover-preview-release.keystore` (gitignored) and mirrored under `/opt/cursor/artifacts/credentials/`.
5. `keytool` verified alias `milerecover` and SHA-1 match above.

## Build notes

- EAS cloud Android builds were blocked (free-plan monthly quota exhausted).
- Docker/`eas build --local` unavailable (nested overlayfs mount failure on this VM).
- Used host Gradle release build with EAS preview env pulled locally (Google client IDs embedded; values not committed).
- Remote EAS `versionCode` at build time was `59` (autoIncrement had advanced after failed cloud attempts); APK uses `59`.

## Gate results

| Check | Result |
|---|---|
| domain tests | 123/123 passed |
| mobile-expo tests | 172/172 passed |
| APK static gate (unzip, zipalign, apksigner v1+v2+v3, DN, package/version, arm64, resources.arsc Stored) | **PASS** |
| `adb install` + Welcome launch + alive | **BLOCKED** — nested KVM on this fresh VM hits `kernel BUG at arch/x86/kvm/x86.c` when creating vCPUs; emulator stays `offline` |

Evidence: `/opt/cursor/artifacts/gate/0.2.13/` and `/opt/cursor/artifacts/apk/MileRecover-preview-0.2.13.apk`.

## Next device step

Install the signed APK on Samsung hardware per `docs/qa/DEVICE_QA_0.2.13_SAMSUNG.md`. Stop before production publication.


## Direct download (Samsung QA)

- Release: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.2.13
- APK: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.13/MileRecover-preview-0.2.13.apk
- SHA-256: `0a8d7ecb55845141096bc0eca9c588e56f7277d82b0593c0d3b03a1b6495a0bb`
- Signer SHA-1: `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31`
- Cursor agent artifacts path: `/opt/cursor/artifacts/apk/MileRecover-preview-0.2.13.apk`
