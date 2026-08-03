# Expo UI validation — locked product experience

**Branch:** `milestone/expo-mobile-foundation`  
**Tip commit:** see `git rev-parse HEAD` on this branch  
**Design source:** Official MileRecover design board (forest green + white, four-tab IA)  
**Rollback point:** `74044d5` (prior polish commit baseline)

## Implemented screens

| Area | Screens |
|------|---------|
| Onboarding | Welcome hero, need selection, usage type, protection checklist, optional setup, ready summary |
| Home | Protected, recovery, limited protection, offline presentations |
| Review | Needs review / Reviewed segments, map placeholder, provenance badges, undo |
| Proof | Ready hero card, blocked state, provenance list, export placeholders |
| Profile | Membership banner, grouped settings, dev scenario switcher |
| Import | Bring mileage, processing, preview, exceptions, failure/retry |
| Supporting | Manual trip (validation), trip details, recovery, protection alert, export states, plans, help |

## Visual QA — issues found and fixed (this milestone)

| Issue | Fix |
|-------|-----|
| Home showed redundant "Home" header | Removed; status card leads |
| Weekly stats didn't match design board demo | Updated fully_protected to 87.6 / 2 / 12 mi |
| Offline copy was generic "Sync pending" | Changed to "Saved safely offline" with plain-language sync note |
| Protection limited CTA routed to Profile | Routes to Protection Alert with system-settings action |
| Onboarding welcome used alert card not hero | Added WelcomeHero with brand mark |
| Protection setup showed fake "Education only" grid | Honest checklist with pending/planned labels |
| Ready step claimed Background/Location "Ready" | Honest "Not granted yet" until tracking + OS prompts |
| Optional setup implied immediate configuration | Copy clarifies Profile-after-Home; not enabled yet |
| Review cards lacked map thumbnail and provenance | MapPlaceholder + badges; undo on reviewed items |
| Proof summary card had poor dark-card hierarchy | ProofHeroCard with trips/miles/unresolved |
| Import jumped straight to preview | Processing state with cancel; failure/retry path |
| Export had no loading/success/failure | Added processing, success, and retry states |
| Buttons lacked pressed feedback | Pressed opacity on primary/secondary |
| Manual trip accepted empty distance | Form validation with accessible error message |
| Screen evidence tests returned empty trees | SafeAreaProvider initialMetrics in test harness |

## Screenshot / render evidence

Automated render evidence is written on test run to:

- `docs/assets/ui-evidence/onboarding-evidence.json`
- `docs/assets/ui-evidence/home-evidence.json`
- `docs/assets/ui-evidence/stack-evidence.json`

**No Android emulator or adb** was available on this host. Evidence is deterministic Jest render copy, not device PNGs.

Run: `npm run test:mobile-expo` from repository root.

## Test commands and results

```bash
npm run check:all          # PASS
npm run test:domain        # 27/27 PASS
npm run typecheck:mobile-expo  # PASS
npm run test:mobile-expo   # 31/31 PASS
npm --prefix apps/mobile-expo run export:validate  # PASS
npm --prefix apps/mobile-expo run config:validate  # PASS
npm --prefix apps/mobile-expo run deps:validate    # PASS
```

## Preview delivery

| Item | Status |
|------|--------|
| Verified preview APK | Build `a0fcf6cd` — package `com.milerecover.app`, runtime `0.1.2` |
| GitHub prerelease | Tag `android-preview-0.1.2` → `MileRecover-preview-0.1.2.apk` |
| Direct install URL | https://github.com/hassanharun2003-dotcom/milerecover-core/releases/download/android-preview-0.1.2/MileRecover-preview-0.1.2.apk |
| APK SHA-256 | `87f38692ddc82e9b31ccfbfc70f45443b7ae1c25097d1e1ea583b3ea2a0b5b00` |
| Preview workflow doc | `docs/PREVIEW_UPDATE_WORKFLOW.md` |
| OTA publish for runtime `0.1.2` | Published — update group `52208176-a688-400d-ab11-11f76e9b3de4` |

## Android runtime status

| Item | Status |
|------|--------|
| Export bundle | PASS |
| Emulator launch | NOT AVAILABLE (adb/emulator not in PATH) |
| Physical device smoke | NOT VERIFIED |
| Prior preview APK (`0.1.0`) | `dfb98852-77d7-4185-bdd5-a07fde5a3ad9` |
| Verified preview upgrade | `a0fcf6cd` (`0.1.2`) |

## iOS readiness

| Item | Value |
|------|-------|
| Bundle ID | `com.milerecover.app` |
| EAS project | `c61d0a3c-ba3d-40e1-9764-5118fa2429f3` |
| Safe areas | SafeAreaProvider + tab/stack screens |
| Portrait lock | `app.config.ts` |
| App Store submit | NOT STARTED |

## Physical device — still unverified

- Onboarding persist across force-close
- Tab layout on small Android phone
- Safe area on iPhone notch devices
- Real PNG screenshots on hardware
- OTA apply on device after install of preview APK `a0fcf6cd` (update published; device confirmation pending)

## Known limitations

- Import/export use fixture logic only (by design for this milestone)
- Tracking permissions are educational placeholders until `expo-location` / task manager
- Home/Review/Proof still driven by demo fixtures; domain Protection Health not fully wired
- No RevenueCat or real payments

## Design polish landed (this continuation)

- Design docs reconciled to forest green + four-tab IA
- DS primitives: DestructiveButton, OfflineBanner, ErrorBanner, FormError, UndoSnackbar, tabular nums
- Manual trip attestation + editable date
- Trip details Business / Personal / Reject
- Vehicle + work location save flows
- Tracking Active honest stub; Coming Later for unshipped Profile rows
- Review 4s undo snackbar; Review tab badge for pending count
- StartupGate migrated onto design-system

## Next milestone

1. Physical device smoke on preview APK `a0fcf6cd` (install via GitHub prerelease URL)
2. Confirm Profile → About shows **Preview channel connected** / **0.1.2-preview.1** after OTA
3. Background tracking engine (`expo-location`, `expo-task-manager`) with screen-off test matrix
