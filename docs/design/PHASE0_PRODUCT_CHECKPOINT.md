# Phase 0 — Product checkpoint (image-lock protocol)

**Branch tip at checkpoint:** see git commit `image-lock-phase0-checkpoint`  
**App version at checkpoint:** `0.2.4` (`0.2.4-premium-ui.1`)  
**Goal of later phases:** rebuild presentation only; preserve working product behavior.

## Working flows (must survive)

1. Clean install → Welcome → Purpose → Region/Rate → Protection → Ready → Home  
2. Incomplete onboarding resumes at the next incomplete essential step  
3. Returning user with minimum-complete onboarding opens Home  
4. Home shows protection status, period summaries, next-up, add drive, missing-drives entry  
5. Review classification, Proof periods/exports, Profile settings, Protection Center diagnostics  
6. Guest use without account; optional Google/Apple auth when configured  
7. Local trip/persistence data survives ordinary updates

## First-run state machine (current)

`CURRENT_ONBOARDING_VERSION = 9` (`packages/domain/src/onboarding/completeness.ts`)

```
ONBOARDING_STEP_ORDER =
  welcome → purpose → locale_setup → protect_drives → ready
```

Launch resolution (`apps/mobile-expo/src/startup/launchState.ts`):

| Kind | Opens |
|---|---|
| `booting` / storage recovery | Gate |
| `migrationRequired` | Onboarding |
| `firstLaunch` / `onboardingInProgress` | Onboarding |
| `returningUser` (minimum complete) | Home |

Image-lock protocol target machine (presentation rebuild):

```
UNINITIALIZED → WELCOME → AUTH → PURPOSE → REGION_RATE → PROTECTION → READY → COMPLETE
```

Auth is a new onboarding presentation step wired to existing `src/services/auth.ts` (no fake sessions).

## Persistence keys (do not corrupt)

| Key | Role |
|---|---|
| `@milerecover/product-ui/v4` | Product UI + onboarding |
| `@milerecover/app-state/v1` | Trips / recovery / permissions shell |
| `@milerecover/tracking/*` | Tracking engine buffers |
| `@milerecover/auth-session/v1` | Optional local auth session |

## Business hooks to keep

| Screen | Hooks |
|---|---|
| Welcome | `advanceOnboarding`, `patchOnboarding`, `setPendingPostOnboardingRoute` |
| Purpose | `setPrimaryGoal`, `PRIMARY_GOAL_OPTIONS` |
| Region/Rate | `setLocaleProfile`, `formatActiveRateLabel`, country options |
| Protection | `requestLocationPermission`, `setTrackingEnabled`, `setProtectionSetupState` |
| Ready | `completeProductOnboarding`, `finishOnboarding` |
| Home | `selectProtectionView`, `selectHomePeriodSummary`, `selectPendingReviewCount`, navigation to ManualTrip / MissingDrivesIntro / Review |

## Must not rewrite

Tracking engine, recovery/gap detection, classification, proof calculations, CSV/PDF export, import, subscriptions/entitlements, permission APIs, offline persistence schemas, stored data shapes.

## Visual-QA isolation

- Harness: `src/testing/launchFixtures.ts`, `ScreenTestHarness.tsx` with `skipHydration`  
- Production boot never loads fixtures  
- Deterministic reference values only in isolated visual-QA / fixture mode  

## Tabs (locked)

`Home` · `Review` · `Proof` · `Profile`

## Design-system entry points

- Tokens: `packages/config/src/tokens.ts`  
- Primitives: `apps/mobile-expo/src/design-system/index.tsx`  
- Shells: `apps/mobile-expo/src/design-system/screenShell.tsx`
