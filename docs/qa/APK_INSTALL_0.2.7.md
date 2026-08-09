# 0.2.7 Samsung sideload install failure

## Symptom

On Samsung: download APK → Open → brief “Preparing app…” → installer closes.
No “Do you want to install this app?” prompt. App not installed.

## Exact published artifact

- Tag: `android-preview-0.2.7`
- SHA-256: `f120665f89e9ae16c523199903b86c57d2c9c559821a419cac15fe97a66176bd`
- package `com.milerecover.app` versionName `0.2.7` versionCode `42`

## Validation of that APK

| Check | Result |
|---|---|
| unzip -t | OK |
| zipalign -c -P 16 -v 4 | OK |
| apksigner verify | OK |
| aapt badging | OK |
| arm64-v8a / armeabi-v7a / x86 / x86_64 | present |
| adb install -r -d | **Success** |
| adb install --no-streaming | **Success** |

## Proven artifact defects (even though adb install succeeds)

1. **v1 JAR signing disabled** (`Verified using v1 scheme: false`). AGP 8 + EAS release signing produced **v2-only**.
2. **Empty certificate DN**: `CN=, OU=, O=, L=, ST=, C=US` from Expo remote auto-keystore.
3. **Legacy packaging off** (`extractNativeLibs=false`) — uncompressed libs were aligned, but Samsung PackageInstaller sideload is more reliable with extracted libs.

`adb install` uses PackageManager APIs that accept v2-only signatures. Samsung’s Downloads/My Files → PackageInstaller “Preparing app…” path is stricter and can exit without the confirm UI when signature/cert metadata is hostile.

## Fix in 0.2.8

- Re-sign with **v1 + v2 + v3**
- Certificate with non-empty DN (`CN=MileRecover Preview, O=MileRecover, C=GB`)
- `useLegacyPackaging: true` (extract native libs)
- Required gate: `scripts/android-apk-release-gate.sh`
