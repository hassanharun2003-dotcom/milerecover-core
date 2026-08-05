# Current preview delivery — final production pass

**Branch:** `cursor/final-production-pass-29cb`  
**Commit:** `da1088244a2e655bf994741f3d0ce049c94d115c`  
**App version / runtime:** `0.1.7`  
**versionCode:** `17`  
**Build label:** `0.1.7-final.1`  
**Channel:** `preview`  
**EAS build ID:** `8b28bed1-c747-42b6-bcb3-e8afc0e1f908`

## Direct install (preferred)

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.7/MileRecover-preview-0.1.7.apk

Latest alias:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.7/MileRecover-preview-latest.apk

Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.1.7

## Artifact checks

| Check | Result |
|---|---|
| SHA-256 | `f72fcf92d52a76bf215ef95f5b928586a12a1938377f2b829b80e94b8641b68a` |
| Size | ~85 MB |
| `updates.enabled` | `true` |
| `extra.appVariant` | `preview` |
| `expo-dev-client` plugin | absent (standalone) |
| Runtime policy | `appVersion` → `0.1.7` |

## EAS artifact mirror

https://expo.dev/artifacts/eas/qKD4VXkiflRIAmzuSbymxOPAMdi49bA7BOQCcXkM2vg.apk

## Why this APK

Native tracking foundation changes (engine → AppContext sync, trip state machine persistence, FGS notification, Free 40-trip allowance gating, battery settings deep-link). Future JS-only OTAs for runtime `0.1.7` install on this binary via the preview channel.
