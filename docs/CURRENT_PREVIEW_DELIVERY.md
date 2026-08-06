# Current preview delivery — 0.2.7 startup.8

**Branch:** `cursor/startup-crash-0.2.7-29cb`  
**Build label:** `0.2.7-startup.8`  
**App version / runtime:** `0.2.7`  
**Channel:** `preview-foundation-0.2.7`  
**versionCode:** `42`  
**Package:** `com.milerecover.app`  
**Commit:** `c325793a1bf194c0bc14da17d4bcf7f8dbf85845`  
**SHA-256:** `f120665f89e9ae16c523199903b86c57d2c9c559821a419cac15fe97a66176bd`  
**Build method:** Local EAS preview APK (`APP_VARIANT=preview`)

## Why 0.2.6 opened and closed

See `docs/qa/STARTUP_CRASH_0.2.6.md`.

Native Expo Updates ran `checkAutomatically: ON_LOAD`, hit `UpdateFailedToLoad` on DNS/network failure before JS started, and delayed/failed cold start on constrained devices.

## What 0.2.7 fixes

1. `updates.checkAutomatically: NEVER` + isolated runtime/channel `0.2.7` / `preview-foundation-0.2.7`
2. Startup ErrorBoundary + deferred optional services
3. Durable onboarding: write verified completion **before** Home unlock; documentDirectory stamp backup when AsyncStorage is slow/wedged
4. Hydrate is read-only (no clobber of in-flight onboarding taps)

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.7/MileRecover-preview-0.2.7.apk

## Cold-launch proof (API 34 emulator, AVD `mile_pixel6`, TCG)

- Same PID alive **≥60s** after cold launch
- Clean install → Welcome
- Onboarding → Home
- Force-stop → reopen → **Home**
- Durable `product-ui/v4` completion + `files/onboarding-complete-v1.json` stamp
- Native Updates: `StartStartup` → `EndStartup` with **no** remote Check on cold start
- **No** `FATAL EXCEPTION` for `com.milerecover.app`
- Screenshots: `docs/assets/ui-evidence/device/0.2.7/raw/`

## Smoke script

`apps/mobile-expo/scripts/android-launch-smoke.sh`

## Honest limitations

- Samsung hardware not available in this VM (API 34 emulator used)
- Deferred JS update checks after Home may still log `UpdateFailedToLoad` when offline; they must not block or kill startup
- System UI ANRs are common on TCG emulators and are environmental, not app fatals
