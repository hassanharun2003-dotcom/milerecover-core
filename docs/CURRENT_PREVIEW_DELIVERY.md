# Current preview delivery — final production pass

**Branch:** `cursor/final-production-pass-29cb`  
**App version / runtime:** `0.1.7`  
**Build label:** `0.1.7-final.1`  
**Channel:** `preview`

## Why a new APK is required

Native tracking foundation changes (engine → AppContext sync, trip state machine persistence, FGS copy, Free 40-trip allowance gating, battery settings deep-link). Runtime policy is `appVersion`, so OTAs for `0.1.7` only install on `0.1.7` binaries.

## Install

Publish via EAS preview profile, then attach the APK to a GitHub prerelease:

- Tag pattern: `android-preview-0.1.7`
- Assets: `MileRecover-preview-0.1.7.apk` and `MileRecover-preview-latest.apk`

Until the EAS build URL is published, use the EAS dashboard build artifact for account `milerecover` / project `milerecover`.

## Prior baseline (superseded for native)

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.6/MileRecover-preview-0.1.6.apk  
(versionCode 16 — JS OTAs only for runtime `0.1.6`)

## Validation

See `docs/release/FINAL_RELEASE_AUDIT.md` and `ui-evidence/final-production/`.
