# MileRecover Figma → RN implementation baseline

## Checkpoint (recoverable)

| Field | Value |
|---|---|
| Working branch (impl) | `impl/figma-production-lock-0.2.12` |
| Safety branch | `safety/pre-figma-impl-20260807-1040` |
| Baseline commit | `ca3e7367db2fc5804b68cbf91dfc4cd39ad8aa2b` |
| Prior design-lock branch | `cursor/final-design-lock-0.2.11-29cb` |
| Working tree at start | clean |

## Known-good 0.2.11 identity

| Field | Value |
|---|---|
| versionName | `0.2.11` |
| versionCode | `50` |
| package / applicationId | `com.milerecover.app` |
| runtimeVersion / channel | `0.2.11` / `preview-foundation-0.2.11` |
| Signing DN | `CN=MileRecover Preview, OU=Engineering, O=MileRecover, L=London, ST=England, C=GB` |
| SHA-1 | `E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31` |
| PR | https://github.com/hassanharun2003-dotcom/milerecover-core/pull/21 |
| Release tag | `android-preview-0.2.11` |
| Figma source | `5y8p0axQChkYVBcM7tgHDj` (FINAL DESIGN LOCK READY) |

## Product foundation path

Primary app: `apps/mobile-expo` (Expo 57 / RN 0.86).  
Domain/config: `packages/domain`, `packages/config`.  
Legacy bare RN shell `apps/mobile` is not the preview product path.

## Baseline checks (this machine)

- `packages/config` typecheck: pass
- `apps/mobile-expo` typecheck: 2 pre-existing `AppContext.tsx` errors (`state`/`permissions` on `never`)
- Targeted tests `launchState|onboardingComplete|designSystem`: 12 passed
- Full jest suite blocked until deps resolved (deps installed; targeted suites green)

## External blockers (unchanged)

1. Google OAuth Android/Web clients + EAS secrets
2. Optional Maps API key
3. RevenueCat / live store products (`enableStorePurchases`)

## Progress (this implementation pass)

Completed in `impl/figma-production-lock-0.2.12` on top of checkpoint `ca3e736`:

- Phase 0 baseline + safety branch recorded
- Design tokens aligned to live Figma variables/styles
- Home: removed duplicate Add Drive CTA; single contextual primary + secondary missed-drives
- Import: removed competitor names before detection
- Profile: Figma grouped hierarchy (Account / Tracking / Data / Plan / Support)
- Proof empty: “No work drives yet” copy
- Plans: Choose your plan · Free/Plus/Pro · $9.99 / $19.99 · Free stays useful
- Bottom nav height follows Figma 72pt + safe area
- Core automated suites: 45+ tests green for design/launch/home/plans/evidence

Still ahead: deeper onboarding/screen pixel fidelity, illustration asset export, emulator screenshot QA (adb not available on this host), RC APK build, remaining edge-state polish.
