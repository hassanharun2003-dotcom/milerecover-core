# Expo Migration Plan

**Status:** Active — foundation phase  
**Date:** 2026-08-02  
**Authority:** [docs/adr/0005-expo-mobile-stack.md](../docs/adr/0005-expo-mobile-stack.md)

---

## Current-state summary

| Item | State |
|------|--------|
| Bare RN app | `apps/mobile` — RN CLI 0.76.5, android/ + ios/, **unchanged** |
| Expo app | `apps/mobile-expo` — Expo SDK 57, dev-client foundation |
| Domain tests | 27/27 (packages/domain) |
| Shared packages | `@milerecover/domain`, `@milerecover/config` |
| Tracking | Not implemented in either app |
| Background location | Prototype Android only (`prototypes/android-tracking/`) |

---

## Files reusable unchanged

### packages/domain/src/**

All domain modules and persistence contract:

- `packages/domain/src/trips/types.ts`
- `packages/domain/src/recovery/types.ts`, `recovery/transitions.ts`
- `packages/domain/src/review/types.ts`
- `packages/domain/src/permissions/types.ts`
- `packages/domain/src/protection-health/calculate.ts`, `types.ts`
- `packages/domain/src/proof/summary.ts`
- `packages/domain/src/onboarding/progression.ts`
- `packages/domain/src/store/types.ts`
- `packages/domain/src/persistence/**`

### packages/domain/__tests__/**

- `package-3-domain.test.ts`
- `package-3-persistence.test.ts`

### packages/config/src/**

- `tokens.ts`, `index.ts`

### Documentation

- `architecture/**`, `planning/**`, `design/**`, `docs/adr/**`

---

## Files reusable with adaptation

| Source (apps/mobile) | Expo destination | Adaptation |
|----------------------|------------------|------------|
| `App.tsx` | `apps/mobile-expo/App.tsx` | Same structure; optional gesture-handler import |
| `src/store/**` | `apps/mobile-expo/src/store/**` | Copied as-is |
| `src/components/**` | `apps/mobile-expo/src/components/**` | Copied as-is |
| `src/screens/**` | `apps/mobile-expo/src/screens/**` | Copied as-is |
| `src/navigation/RootTabs.tsx` | same path | Copied as-is |
| `src/selectors/**` | same path | Copied as-is |
| `src/persistence/AsyncStoragePersistenceRepository.ts` | same path | Same package; works in Expo |
| `metro.config.js` pattern | `apps/mobile-expo/metro.config.js` | Expo `getDefaultConfig` + monorepo paths |
| `tsconfig.json` paths | `apps/mobile-expo/tsconfig.json` | Path aliases for domain/config |

---

## Files not migrated

| Path | Reason |
|------|--------|
| `apps/mobile/android/**` | Expo prebuild generates native projects |
| `apps/mobile/ios/**` | Expo prebuild generates native projects |
| `apps/mobile/metro.config.js` | Replaced by Expo metro config |
| `apps/mobile/babel.config.js` | Expo babel preset |
| `apps/mobile/package.json` RN CLI scripts | Replaced by Expo scripts |
| `prototypes/**` | ADR-0003 — reference only, no imports |

---

## UI parity checklist

| Screen / flow | Bare RN | Expo foundation | Notes |
|---------------|---------|-----------------|-------|
| StartupGate | ✓ | Target ✓ | All startup phases |
| Onboarding 4 steps | ✓ | Target ✓ | Copy preserved |
| Home | ✓ | Target ✓ | Protection Health |
| Review | ✓ | Target ✓ | Empty state |
| Proof | ✓ | Target ✓ | Export unavailable honest |
| Profile | ✓ | Target ✓ | Permission labels |
| Manual add (Add tab) | ✓ | Target ✓ | Guidance stub preserved |
| 5-tab navigation | ✓ | Target ✓ | Home, Review, Add, Proof, Profile |

---

## Persistence parity checklist

| Scenario | Expected |
|----------|----------|
| First launch | Empty document, onboarding welcome |
| Complete onboarding | `onboardingComplete` persisted |
| Relaunch | Skip onboarding |
| Clear storage | First-launch behavior |
| Schema v1 round-trip | Domain serialize/deserialize unchanged |
| Raw GPS | **Not stored** (foundation) |

Keys unchanged: `@milerecover/app-state/v1`, `@milerecover/app-state-backup/v1`

---

## Navigation parity checklist

| Item | Expected |
|------|----------|
| Library | `@react-navigation/native` + `@react-navigation/bottom-tabs` |
| Expo Router | **Not used** |
| Tab names | Home, Review, Add, Proof, Profile |
| Stack routes (future) | Trip detail, Tracking Active — deferred |

---

## Android and iOS validation checklist

| Check | Foundation | Device required |
|-------|------------|-----------------|
| `expo config --type public` | Required green | No |
| TypeScript strict | Required green | No |
| Domain 27 tests | Required green | No |
| `expo export` static bundle | Required green | No |
| `eas build --profile development` (Android) | Config ready | Yes — not claimed until run |
| `eas build --profile development` (iOS) | Config ready | Yes — macOS/EAS |
| Onboarding persist relaunch | Manual | Yes |
| Physical device smoke | Deferred | Yes |

---

## Background-location future phase

**Not in foundation milestone.**

Planned packages (next milestone):

- `expo-location`
- `expo-task-manager`
- Config plugins for iOS `UIBackgroundModes` and Android FGS permissions

Reference implementation patterns: `prototypes/android-tracking/` (promote via rewrite, not import).

Expo Go remains **insufficient** for production tracking.

---

## Cutover criteria (archive `apps/mobile`)

1. All UI + persistence parity checklists green on Expo dev client (Android + iOS)
2. Domain tests 27/27; Expo app typecheck green
3. CI workflow for `apps/mobile-expo` green
4. Background location milestone complete OR explicitly deferred with ADR
5. Documented rollback no longer needed
6. Tag `checkpoint/expo-mobile-foundation-complete`

---

## Rollback procedure

1. Stop Expo migration branch work
2. Continue product development on `apps/mobile` bare RN path
3. Remove or ignore `apps/mobile-expo` (domain packages unaffected)
4. Revert ADR-0005 status to Proposed if abandoning Expo entirely

No data migration required — both apps use same AsyncStorage key schema but separate installs.

---

## Related commands

See `apps/mobile-expo/README.md` for run and build commands.
