# MileRecover 0.2.10 — launch candidate

## Identity
- package: `com.milerecover.app`
- versionName: `0.2.10`
- runtimeVersion / channel: `0.2.10` / `preview-foundation-0.2.10`
- Signing: same proven 0.2.8 preview keystore (v1+v2+v3, non-empty DN)
- SHA-1: `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31`

## Product completion in this build
- Country catalog with ISO codes + flag markers in onboarding/Edit Setup
- Notifications screen + Home bell + deep-link routing + quiet-hour aware scheduling
- Trial offer card fixed (no longer suppressed by Free’s limited auto-capture)
- Trial still **never** auto-starts on install/onboarding
- Maps native path gated on `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (polyline fallback otherwise)
- Preview-only Reset App restored; **hidden in production**
- Welcome/Protection copy tightened to launch-candidate hierarchy
- Google Sign-In: native chooser path; button **hidden** until OAuth secrets exist

## External one-time actions (required for full Google chooser)
See `docs/qa/GOOGLE_SIGNIN_0.2.9.md` and environment setup actions:
1. Create Google Cloud Android + Web OAuth clients for `com.milerecover.app` + preview SHA-1
2. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` + `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in EAS
3. Rebuild APK
4. Optional: Maps + RevenueCat keys

Until secrets exist, a production-style Auth screen shows only **Continue without an account** — never a dead Google button.

## Published proof
- Tag: `android-preview-0.2.10`
- Direct APK: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.10/MileRecover-preview-0.2.10.apk
- SHA-256: `fb999bce3f9dd937e8f6fc8470a8ddd6b89b46ce6a63e4c783e280246d18e929`
- versionCode: `46`
- GitHub-downloaded asset adb install: Success
- Emulator screenshots: `/opt/cursor/artifacts/screenshots/0.2.10/`
