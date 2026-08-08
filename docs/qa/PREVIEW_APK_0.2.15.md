# MileRecover 0.2.15 — Preview APK (install/update fix)

**Status:** Preview / Samsung device-QA candidate only. Do **not** publish production.  
**Branch:** `cursor/mile-recover-0.2.14-install-fix-03e0`  
**Baseline:** `cursor/mile-recover-0.2.14-ux-bfeb` (preserves 0.2.14 UX simplification)

## Diagnosis (published 0.2.13 vs published 0.2.14)

Compared actual GitHub Release assets:

| Field | 0.2.13 (GitHub) | 0.2.14 (GitHub) |
|---|---|---|
| package | `com.milerecover.app` | `com.milerecover.app` |
| versionName | `0.2.13` | `0.2.14` |
| versionCode | `56` | `60` |
| signer SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` | same |
| signer SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` | same |
| DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` | same |
| schemes (minSdk 21 check) | v1+v2+v3 | v1+v2+v3 |
| minSdk / targetSdk | 24 / 36 | 24 / 36 |
| ABIs | arm64-v8a, armeabi-v7a, x86, x86_64 | same |
| zipalign | OK | OK |
| resources.arsc | Stored | Stored |
| testOnly | false | false |
| manifest (normalized) | identical except version | identical except version |

**PackageManager upgrade rules:** published 0.2.14 is a valid upgrade of published GitHub 0.2.13 (same package + same signing cert + higher versionCode).

**Samsung “App not installed” cause:** Android rejected the update because the installed package on-device is not update-compatible with the APK being installed. The published 0.2.13↔0.2.14 pair itself is not the incompatibility. During the 0.2.13 recovery cycle, EAS cloud builds used remote credentials `8D9HztdVix` (signer family `8D:78:7A:C8…`), while GitHub preview APKs use the recovered preview keystore (`E6:62:40:…`). A device still carrying an EAS-signed (or any non-preview) `com.milerecover.app` install will fail Samsung PackageInstaller update with generic **“App not installed”** (signature mismatch / `UPDATE_INCOMPATIBLE`). Uninstall is only required if the installed signer is not `E6:62:40:…`.

## Corrected identity (0.2.15)

| Field | Value |
|---|---|
| versionName | `0.2.15` |
| versionCode | `70` |
| runtimeVersion | `0.2.15` |
| preview channel | `preview-foundation-0.2.15` |
| build label | `0.2.15-install-fix.1` |
| package | `com.milerecover.app` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| Cert SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| Cert SHA-256 | `E4:3C:30:99:0A:9C:2A:DE:1B:60:5C:EB:CA:78:79:14:9A:C3:25:89:C9:46:8C:42:84:F0:41:9E:9B:43:F3:4D` |
| Signing schemes | v1=true, v2=true, v3=true |
| APK filename | `MileRecover-preview-0.2.15.apk` |
| APK size | `46713834` bytes |
| APK SHA-256 | `badf90b15cca73c4b5654bfabb9c98c48a7b057f6195f44bb3f76df9582439be` |
| Keystore | Existing `milerecover-preview-release.keystore` (alias `milerecover`) — **no new keystore** |
| Build path | Local `expo prebuild` + `gradlew assembleRelease` (`APP_VARIANT=preview`) + `npm run sign:android-apk` |

## Google OAuth (unchanged)

| Client | ID |
|---|---|
| Android | `449552437729-31su4paii7a88i92f8nv8n0nbsuv57tr.apps.googleusercontent.com` |
| Web | `449552437729-7jlpok6jdahqfcvb3v0l2jlj20mst0r6.apps.googleusercontent.com` |

## Gate results

| Check | Result |
|---|---|
| domain tests | 123/123 passed |
| mobile-expo tests | 188/188 passed |
| typecheck domain + mobile-expo | pass |
| check:all | pass |
| APK static gate (unzip, zipalign, apksigner v1+v2+v3, DN, package/version, arm64, resources.arsc Stored) | **PASS** |
| `adb install` + Welcome launch | **BLOCKED** — nested KVM `kernel BUG` on this VM |
| Static in-place upgrade vs published 0.2.13 | **PASS** (same package/signer, versionCode 70 > 56) |

## Confirmations

- No new signing key created
- No production publish
- 0.2.14 UX simplification preserved
