# Current preview delivery — 0.1.8 product lock + real tracking

**Branch:** `cursor/final-product-lock-29cb`  
**Commit:** `efdf291`  
**App version / runtime:** `0.1.8`  
**versionCode:** `20`  
**Build label:** `0.1.8-product-lock.1`  
**Channel:** `preview`  
**Build method:** Local EAS (`eas build --profile preview --platform android --local`)  
**Not a development client:** confirmed (`has_dev_launcher=false`, `APP_VARIANT=preview`, expo-dev-client excluded)

## Direct install (preferred)

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.8/MileRecover-preview-0.1.8.apk

Latest alias:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.8/MileRecover-preview-latest.apk

Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.8

## Artifact checks

| Check | Result |
|---|---|
| SHA-256 | `5f6f9e5fcdaceab5b0b3a0dac3185fd8ba016b7171c07ba37e8052486e54bbae` |
| Size | ~85 MB |
| Package | `com.milerecover.app` |
| versionName | `0.1.8` |
| versionCode | `20` |
| Background location | present |
| Foreground service location | present |
| Dev client | absent |

## Notes

- EAS cloud Android free-plan quota was exhausted; this APK was produced with a **local** EAS build using the same preview profile, remote signing credentials, and preview channel.
- Automatic background tracking still requires physical-device QA (`docs/qa/REAL_DEVICE_RELEASE_QA.md`).
- Tracking audit: `docs/engineering/REAL_TRACKING_AUDIT.md`.
