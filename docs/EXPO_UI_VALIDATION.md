# Expo UI validation — locked product experience

**Branch:** `milestone/expo-mobile-foundation`  
**Design source:** Official MileRecover design board (green + white, four-tab IA)  
**Status:** Laptop-side validation complete; physical device smoke partial

## Implemented screens

| Area | Screens |
|------|---------|
| Onboarding | Welcome, need selection, usage type, protection setup, optional setup, ready |
| Home | Protected, recovery available, protection limited, offline presentations |
| Review | Needs review / Reviewed segments, uncertain trip cards |
| Proof | Ready and blocked states, export placeholders |
| Profile | Grouped settings, plan banner, dev scenario switcher |
| Import | Bring mileage, preview, exception review |
| Supporting | Manual trip, trip details, recovery, protection alert, vehicles, work locations, export, report preview, plans, help |

## Automated scenarios

Fixtures in `apps/mobile-expo/src/fixtures/scenarios.ts` — 13 deterministic demo states including new user, fully protected, recovery available, proof ready/blocked, plan tiers.

## Tests

- `__tests__/navigation.test.ts` — four-tab IA
- `__tests__/productExperience.test.tsx` — onboarding steps, scenarios, home copy mapping
- `__tests__/App.test.tsx` — foundation checks

Run: `npm run test:mobile-expo` from repository root.

## Screenshot / render evidence

Generated via Jest selector tests (`productExperience.test.tsx` validates Protected and recovery home copy). Emulator screenshots not captured on this host — documented limitation.

## Android status

- Typecheck: required green before commit
- Export validation: `npm run export:validate` in `apps/mobile-expo`
- Dev APK: [build ba9e2891](https://expo.dev/accounts/milerecover/projects/milerecover/builds/ba9e2891-f955-40d7-b3f0-e435f94cb0e2)

## iOS status

- Bundle ID: `com.milerecover.app` (app.config.ts)
- EAS project: `c61d0a3c-ba3d-40e1-9764-5118fa2429f3`
- iOS dev build: not submitted this milestone

## Physical device — still unverified

- Onboarding persist across force-close
- Tab layout on small Android phone
- Safe area on iPhone notch devices
- LAN/tunnel Metro reconnect after phone sleep

## Known issues

- Import file parsing is fixture-only (by design this milestone)
- Tracking permissions are educational placeholders
- Review undo uses same handlers on all three buttons in reviewed list (dev simplification)

## Rollback point

Tag before this milestone: commit `eb7aabe`

## Next milestone

Background tracking engine (expo-location, expo-task-manager) with screen-off test matrix — only after device smoke passes.
