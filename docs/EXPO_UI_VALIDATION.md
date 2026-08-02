# Expo UI validation — locked product experience

**Branch:** `milestone/expo-mobile-foundation`  
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
| Protection limited CTA routed to Profile | Routes to Protection Alert with "Restore protection" |
| Onboarding welcome used alert card not hero | Added WelcomeHero with brand mark |
| Protection setup showed fake "Education only" grid | Honest checklist with pending/planned labels |
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
npm run test:mobile-expo   # 24/24 PASS
npm --prefix apps/mobile-expo run export:validate  # PASS
npm --prefix apps/mobile-expo run config:validate  # PASS
npm --prefix apps/mobile-expo run deps:validate    # PASS
```

## Android runtime status

| Item | Status |
|------|--------|
| Export bundle | PASS (885 modules) |
| Emulator launch | NOT AVAILABLE (adb/emulator not in PATH) |
| Physical device smoke | NOT VERIFIED |
| Prior dev APK (pre-polish) | [ba9e2891](https://expo.dev/accounts/milerecover/projects/milerecover/builds/ba9e2891-f955-40d7-b3f0-e435f94cb0e2) |
| Updated dev APK | See EAS build section below |

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
- LAN/tunnel Metro reconnect after phone sleep
- Real PNG screenshots on hardware

## Known limitations

- Import/export use fixture logic only (by design)
- Tracking permissions are educational placeholders
- No RevenueCat or real payments
- CI remote status requires GitHub Actions check (gh CLI unavailable in agent shell)

## Next milestone

Physical device smoke on updated Android dev build, then background tracking engine (expo-location, expo-task-manager) with screen-off test matrix.
