# Current preview delivery — 0.2.12 Figma production lock

**Branch:** `impl/figma-production-lock-0.2.12`  
**Commit:** `9c60af51f018ccd9aa729d1c321693447f17fc3a`  
**Build label:** `0.2.12-figma-lock.1`  
**App version / runtime:** `0.2.12`  
**Channel:** `preview-foundation-0.2.12`  
**versionCode:** PENDING  
**Package:** `com.milerecover.app`  
**Signing:** MileRecover Preview keystore (unchanged; not rotated)

## Direct install

PENDING — publish after APK hard gate.

Target: https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.12/MileRecover-preview-0.2.12.apk

## Pre-build QA

- mobile-expo: 148/148
- domain: 123/123
- typecheck: green
- `npm run check:all`: green

## What this RC is

Figma production-lock implementation on top of the 0.2.11 foundation:

- Locked design system / production screens
- Home single primary CTA (no duplicate Add Drive)
- Preview channel/runtime isolated to `0.2.12` / `preview-foundation-0.2.12`
- Same Samsung-compatible v1+v2+v3 resign path

## Honest limitations

- Google OAuth / Maps / RevenueCat remain external when secrets/products absent
- Samsung hardware may not be available in CI VM; emulator used when present

See `docs/qa/DESIGN_LOCK_0.2.12.md` for full gate status.
