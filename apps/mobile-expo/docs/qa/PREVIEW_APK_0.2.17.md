# Preview APK 0.2.17 — AGP-native Gradle signing (no post-build mutation)

## Hard rule

This release eliminates the historical post-build APK mutation/resign pipeline.
The published APK bytes are exactly `android/app/build/outputs/apk/release/app-release.apk`
from `gradlew assembleRelease` with `signingConfigs.release`.

## Pipeline

```
source
→ expo prebuild (withPreviewReleaseSigning)
→ Gradle / AGP assembleRelease
→ signingConfigs.release (recovered preview keystore)
→ verify-only gate
→ byte-for-byte GitHub prerelease publish
```

**Forbidden after Gradle:** Python zipfile, `zip -d`, unzip/repack, manual manifest/resources edits, custom resign (`sign-android-apk.sh` is a disabled stub).

## Identity

| Field | Value |
|---|---|
| versionName | `0.2.17` |
| versionCode | `72` |
| package | `com.milerecover.app` |
| signer SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| channel | `preview-foundation-0.2.17` |
| build label | `0.2.17-agp-native.1` |
| local gated sha256 | `221ca0c8531a36a7c9bd947258fe7aab3a32d45934f0c8f108dd93152c76e24f` |

## Structural comparison (ZIP framing)

| APK | Samsung physical | dd | utf8 | META-INF signer | .so packaging | Provenance |
|---|---|---:|---:|---|---|---|
| 0.2.12 | installed | 1016 | 1343 | MILERECO.* | deflated | custom resign |
| 0.2.13 | installed + QA | 1016 | 1343 | MILERECO.* | deflated | custom resign |
| 0.2.15 | clean-install FAIL | 1016 | 1344 | MILERECO.* | deflated | custom resign |
| 0.2.16 | untrusted / hypothesis patch | 0 | 3 | MILERECO.* | deflated | zip -d + resign |
| **0.2.17** | **physical gate pending** | **0** | **0** | **CERT.*** (AGP) | deflated | **Gradle signingConfig only** |

## Honesty on Samsung root cause

Exact Samsung PackageInstaller rejection of 0.2.15 was **not reproduced** on AOSP emulator
(`adb install` Success for both 0.2.15 and 0.2.16). Data-descriptor framing alone cannot be
the Samsung-specific root cause because known-good 0.2.12/0.2.13 also had `dd=1016`.

What is proven: the release path used a **nonstandard post-AGP mutation/resign pipeline**.
0.2.17 removes that entire class of defect by publishing only AGP-produced signed bytes.

## Build / gate commands

```bash
EXPECT_VERSION_NAME=0.2.17 EXPECT_VERSION_CODE=72 \
OUT_APK=/opt/cursor/artifacts/apk/MileRecover-preview-0.2.17.apk \
REQUIRE_LAUNCH=0 \
bash scripts/build-agp-release-apk.sh
```
