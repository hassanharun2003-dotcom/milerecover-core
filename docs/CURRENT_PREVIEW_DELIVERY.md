# Current preview delivery — 0.2.0 final product recovery

**Branch:** `cursor/final-product-recovery-29cb`  
**PR:** https://github.com/hassanharun2003-dotcom/milerecover-core/pull/12  
**Commit:** `d22d0d1`  
**App version / runtime:** `0.2.0`  
**versionCode:** `22`  
**Build label:** `0.2.0-product-recovery.1`  
**Channel:** `preview`  
**Build method:** Local EAS (`eas build --profile preview --platform android --local`)  
**Not a development client:** confirmed (no DevLauncher paths; `APP_VARIANT=preview`)  
**Appearance:** polished light theme only (`userInterfaceStyle: light`)

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.0/MileRecover-preview-0.2.0.apk

Latest alias:

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.0/MileRecover-preview-latest.apk

Release page: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/tag/android-preview-0.2.0

## Artifact checks

| Check | Result |
|---|---|
| SHA-256 | `1744f17bec3ee5d0467286e683f60ad517f4c99a63401424f3dbd9bc390ab3f9` |
| Size | ~84.8 MB |
| Package | `com.milerecover.app` |
| versionName | `0.2.0` |
| versionCode | `22` |
| Background location | present |
| Foreground service location | present |
| Dev client | absent |

## What this build recovers

- Deterministic onboarding Welcome / resume / completed Home
- Readable light theme (dark theme not shipped)
- Canonical protection states (never Protected before verified capture)
- GPS drift discarded before Review / Free allowance
- Simplified Home · Review · Proof · Profile
- Review setup + preview Reset app for testing

## Phone QA

`docs/qa/PHONE_QA_15MIN.md`
