# MileRecover 0.2.14 — Preview APK (UX simplification)

**Status:** Preview / Samsung device-QA candidate only. Do **not** publish production.  
**Branch:** `cursor/mile-recover-0.2.14-ux-bfeb`  
**Baseline:** `cursor/mile-recover-0.2.13-0cd3` (Google auth / signing identity)

## Identity

| Field | Value |
|---|---|
| versionName | `0.2.14` |
| versionCode | `60` |
| runtimeVersion | `0.2.14` |
| preview channel | `preview-foundation-0.2.14` |
| build label | `0.2.14-device-qa.1` |
| package | `com.milerecover.app` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| Cert SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| Cert SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |
| Signing schemes | v1=true, v2=true, v3=true |
| APK filename | `MileRecover-preview-0.2.14.apk` |
| APK size | `46709643` bytes |
| APK SHA-256 | `612bf1ad886d2eb928ad468b1d83aa73c3214c7cbff1ea0e5f8f6fa185dbabbb` |
| Keystore | Existing `milerecover-preview-release.keystore` (alias `milerecover`) — **no new keystore** |
| Build path | Local `expo prebuild` + `gradlew assembleRelease` (`APP_VARIANT=preview`) + `npm run sign:android-apk` |

## Google OAuth (unchanged)

| Client | ID |
|---|---|
| Android | `449552437729-31su4paii7a88i92f8nv8n0nbsuv57tr.apps.googleusercontent.com` |
| Web | `449552437729-7jlpok6jdahqfcvb3v0l2jlj20mst0r6.apps.googleusercontent.com` |

Both client IDs are embedded in the APK extras. No credential rotation.

## Gate results

| Check | Result |
|---|---|
| domain tests | 123/123 passed |
| mobile-expo tests | 188/188 passed |
| typecheck domain + mobile-expo | pass |
| check:all | pass |
| APK static gate (unzip, zipalign, apksigner v1+v2+v3, DN, package/version, arm64, resources.arsc Stored) | **PASS** |
| `adb install` + Welcome launch | **BLOCKED** — no device/emulator attached on this VM |

Evidence: `/opt/cursor/artifacts/gate/0.2.14/` and `/opt/cursor/artifacts/apk/MileRecover-preview-0.2.14.apk`.

## Confirmations

- No new signing key created
- No production publish
- Real Google auth retained (not mocked)
