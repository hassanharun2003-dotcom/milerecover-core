# Current preview delivery — 0.1.9 continuous release pass

**Branch:** `cursor/continuous-release-pass-29cb`  
**PR:** https://github.com/hassanharun2003-dotcom/milerecover-core/pull/11  
**App version / runtime:** `0.1.9`  
**versionCode:** `21`  
**Build label:** `0.1.9-continuous-pass.1`  
**Channel:** `preview`  
**Build method:** Local EAS (`eas build --profile preview --platform android --local`)  
**Not a development client:** confirmed (no DevLauncher paths; `APP_VARIANT=preview`; expo-dev-client excluded)

## Direct install (preferred)

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.9/MileRecover-preview-0.1.9.apk

Latest alias:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.9/MileRecover-preview-latest.apk

Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.9

## Artifact checks

| Check | Result |
|---|---|
| SHA-256 | `ecd35468221dd04d60955ed9debd2cb002b30525151fa83ab86600228fbcb861` |
| Size | ~84.5 MB |
| Package | `com.milerecover.app` |
| versionName | `0.1.9` |
| versionCode | `21` |
| Background location | present |
| Foreground service location | present |
| Dev client | absent |

## What this build fixes vs 0.1.8

- Dark theme contrast (semantic tokens through design system + tabs)
- Fresh install / reset always starts onboarding at Welcome
- Protection never claims “Protected” without a verified capture (`configured_waiting`)
- Stable Home composition (skeleton, single next action)
- Manual drive date/time picker reliability + high-distance confirmation
- Visual PNG QA harness + release regression suite

## Phone QA

`docs/qa/PHONE_QA_15MIN.md` — only physical-device-dependent checks.

## Notes

- EAS cloud Android free-plan quota may still be exhausted; this APK was produced with a **local** EAS build using the same preview profile, remote signing credentials, and preview channel.
- Automatic background tracking still requires physical-device QA.
- Visual evidence PNGs: `docs/assets/ui-evidence/png/`
- Regression matrix: `docs/qa/CONTINUOUS_RELEASE_REGRESSION.md`
