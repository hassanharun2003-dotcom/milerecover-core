# Current preview delivery — 0.2.7 startup.1

**Branch:** `cursor/startup-crash-0.2.7-29cb`  
**Build label:** `0.2.7-startup.1`  
**App version / runtime:** `0.2.7` (isolated from 0.2.6)  
**Channel:** `preview-foundation-0.2.7`  
**versionCode:** `35`  
**Commit:** `8dc79013ca8e60e27698a1aad6af5ec7bd4dd516`  
**SHA-256:** `e21fc2099fce2486be6ccfcc84c5f11e44c10e32c66595ae90757c6087587119`  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`)

## Why 0.2.6 opened and closed

See `docs/qa/STARTUP_CRASH_0.2.6.md`.

Expo Updates `checkAutomatically: 'ON_LOAD'` ran a remote check inside `StartupProcedure` **before** React Native JS started. Failures (`UpdateFailedToLoad` / DNS) delayed first paint 15–32s. Fixed in 0.2.7 with `checkAutomatically: 'NEVER'`.

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.7/MileRecover-preview-0.2.7.apk

Do **not** use 0.2.6. Uninstall older builds first if needed.

## Cold-launch proof (API 34 emulator)

- Process alive **60s** after cold launch and again after force-stop/reopen
- Welcome visible on clean install (`docs/assets/ui-evidence/device/0.2.7/raw/01-welcome.png`)
- Home after onboarding + reopen (`02-home.png`, `03-reopen.png`)
- Log: `StartStartup` → `EndStartup` with **no** remote `Check` / **no** `UpdateFailedToLoad`
- **No** `FATAL EXCEPTION` for `com.milerecover.app`

## Smoke script

`apps/mobile-expo/scripts/android-launch-smoke.sh`  
`npm run smoke:android-launch` (set `APK=...`)
