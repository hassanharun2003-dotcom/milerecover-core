# Current preview delivery — 0.2.12 Figma production lock

**Branch:** `impl/figma-production-lock-0.2.12`  
**Implementation commit:** `9c60af51f018ccd9aa729d1c321693447f17fc3a`  
**Build label:** `0.2.12-figma-lock.1`  
**App version / runtime:** `0.2.12`  
**Channel:** `preview-foundation-0.2.12`  
**versionCode:** `54`  
**Package:** `com.milerecover.app`  
**Signing:** MileRecover Preview keystore (unchanged; not rotated)  
**APK SHA-256:** `cd1f8f9f76fcce625c360c54499eea45a188efd45bc4afd86914f350dc46e7f2`

## Direct install

https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.2.12/MileRecover-preview-0.2.12.apk

Release tag: `android-preview-0.2.12`

## Pre-build QA

- mobile-expo: 148/148
- domain: 123/123
- typecheck: green
- `npm run check:all`: green

## Runtime proof (API 34 emulator)

- Clean install → intro / Get started
- Onboarding → Home
- Force-stop → reopen → Home
- APK gate PASS (v1+v2+v3, DN exact, Welcome visible)
- Screenshots: `/opt/cursor/artifacts/screenshots/0.2.12/`

## What this RC is

Figma production-lock implementation on top of the 0.2.11 foundation:

- Locked design system / production screens
- Home single contextual primary CTA (no duplicate Add Drive)
- Preview channel/runtime isolated to `0.2.12` / `preview-foundation-0.2.12`
- Same Samsung-compatible v1+v2+v3 resign path with recovered preview keystore

## Honest limitations

- Google OAuth / Maps / RevenueCat remain external when secrets/products absent
- Samsung hardware visual verification is founder-side (emulator used here)

See `docs/qa/DESIGN_LOCK_0.2.12.md` for full gate status.
