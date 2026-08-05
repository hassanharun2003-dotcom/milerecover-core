# MileRecover — Final Release Audit

**Date:** 2026-04-08  
**Branch:** `cursor/final-production-pass-29cb`  
**App version / runtime:** `0.1.7`  
**Build label:** `0.1.7-final.1`  
**Channel:** `preview`

---

## Implemented product flows

- Onboarding (v8) → Home / Review / Proof / Profile
- Drive protection setup with guided permissions
- Automatic trip capture (Expo Location + TaskManager + Android FGS notification)
- Review classification with undo + rate snapshot at accept
- Manual drive entry with rate snapshot
- Vehicle setup with canonical titles / nickname lock
- Country / unit / currency / rate honesty
- Proof readiness (required vs recommended) + CSV/PDF export
- Missing-drive scan with Free 1/month gate
- Plans / Rescue paywall (single preview notice)
- Offline-first AsyncStorage persistence for trips + product UI

---

## Native tracking architecture

| Layer | Implementation |
|---|---|
| Foreground | `expo-location` `watchPositionAsync` |
| Background | `expo-task-manager` task `milerecover-tracking` |
| Android FGS | Expo Location `foregroundService` notification while active |
| Persistence | Sample buffer `@milerecover/tracking/samples/v1` + machine state key |
| Domain machine | IDLE → POSSIBLE_MOVEMENT → TRACKING → POSSIBLE_STOP → FINALIZING → NEEDS_REVIEW / FAILED_RECOVERABLE |
| Quality | Accuracy/speed filter + impossible-jump rejection (no invented geometry) |
| AppContext sync | Engine runtime mapped to `trackingEngineState` + `lastConfirmedCaptureAt` |
| Free allowance | 40 auto trips / calendar month; engine stops when exhausted |
| Manual fallback | Always available; protection off ⇒ zero hidden continuous tracking |

**Honest limitation:** Battery-optimization restriction cannot be probed without a dedicated native module; deep-link to Android battery settings is provided. Motion/activity recognition is not yet a hard dependency. Perfect detection is not claimed.

---

## Permission behavior

1. Explain → ask foreground → explain → ask background  
2. Location-services-off treated as location denied  
3. Background denial → NEEDS_ATTENTION with Fix CTA  
4. Settings deep-link for system repair + battery optimization intent (Android)

---

## Background / battery / offline

- Background updates registered when permission granted
- FGS notification while capture active
- Offline sample buffering to AsyncStorage
- Process resume rehydrates buffer + machine state and refreshes diagnostics every 30s
- Reboot recovery relies on Expo TaskManager registration (platform-dependent)

---

## Data migrations

- Vehicle identity canonicalize on load (`migrateVehicleIdentity`)
- Locale profile migration preserved
- Product entitlement: store-verified cache preserved across restart
- New fields: `missingScanPeriodKey`, `missingScansUsedThisPeriod`, `importPreviewStartedAt`, `nicknameUserSet`
- Trip `rateSnapshot` preferred for historical value; missing snapshot surfaced honestly

---

## Privacy review

- Analytics: product events only; no raw routes, addresses, notes, plates, receipts, names
- Diagnostics remain behind About version ×7
- Local-first storage; import inspects CSV locally

---

## Accessibility review

- Safe-area screens retained
- Sentence-case CTAs; touch targets via design system
- Preview paywall avoids duplicate notices and respects bottom safe area via FixedHeaderScrollScreen
- Remaining: full screen-reader pass on physical devices recommended

---

## Purchase readiness

- RevenueCat when keys + `EXPO_PUBLIC_ENABLE_STORE_PURCHASES=1`
- Preview builds: one compact preview banner; purchase CTAs disabled with clear reason
- Free forever rules encoded: 40 auto/mo, 1 scan/mo, 1 vehicle, CSV
- **External blocker:** live store products + RevenueCat dashboard configuration

---

## Report readiness

- Required vs recommended issues with matching CTA copy
- CSV on Free; PDF gated to paid
- Line items prefer `rateSnapshot`

---

## Android evidence

- Evidence directory: `ui-evidence/final-production/`
- New preview APK required for native tracking sync (runtime `0.1.7`)
- Emulator/KVM may be unavailable in CI cloud; prefer EAS preview APK + physical device

---

## iOS readiness

- Same JS tracking architecture; iOS background modes already declared
- Remaining: TestFlight build, motion permission UX polish, App Store purchase config

---

## Exact external credentials still required

1. RevenueCat Apple + Google API keys (production)
2. Store product IDs live in App Store Connect / Play Console
3. `EXPO_PUBLIC_ENABLE_STORE_PURCHASES=1` for production
4. Google Sign-In client IDs (if auth enabled in release)
5. EAS project credentials for signed preview/production builds

---

## Known limitations (honest)

- Battery optimization detection not automatic
- Map rendering of route points not yet a first-class map SDK screen (route evidence flagged via `hasRouteCoordinates`)
- Free 7-day import preview window field exists; full gating UX still thin
- Clock manipulation on Free monthly reset is best-effort (calendar month of trip startAt)
- Do not claim launch-ready for store submission until store products + signed production builds are verified

---

## Rollback

1. Reinstall prior APK `0.1.6` (runtime `0.1.6`) from previous GitHub release  
2. Or republish OTA only for JS-only regressions on the matching runtime  
3. Local data keys remain compatible for trips; vehicle migration is additive

---

## OTA / native compatibility

- `runtimeVersion.policy = appVersion` → `0.1.7` OTAs only install on `0.1.7` binaries
- Preview channel wiring unchanged (`APP_VARIANT=preview` required for `updates.enabled`)
- JS-only fixes after this APK can ship via `update:preview` without a new native build **unless** native modules/config change again

---

## Release checklist

- [x] Domain tests green  
- [x] Mobile tests green  
- [x] Typecheck green  
- [x] check:all green  
- [ ] EAS preview APK published + direct install URL  
- [ ] Physical-device protection + background validation  
- [ ] Store products + RevenueCat live  
- [ ] Production privacy policy / store listings  
