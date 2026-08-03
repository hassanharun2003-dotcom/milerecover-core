# Package 3 — Production Vertical Slice Implementation Plan

**Baseline:** `checkpoint/mobile-foundation-package-2-complete` · main `023c5b5`  
**Date:** 1 August 2026  
**Contract lock:** major `1` · API `1.0.0-prototype-c` · RN `0.76.5` (prototype reference)

---

## Goal

Deliver the first **production-quality vertical product slice** for MileRecover:

> “Protect every work mile.”

Missing-trip recovery is the wedge. Reliability and trust beat decorative UI. No fake mileage, savings, or protection claims.

---

## Repository impact analysis

| Area | Current state | Package 3 action |
|------|---------------|------------------|
| `apps/mobile/` | README placeholder | Initialize RN 0.76.5 app, 5-tab shell, onboarding + core screens |
| `packages/domain/` | README only | Typed domain models, selectors, Protection Health, state machines, Jest tests |
| `packages/config/` | README only | Design tokens (Package 3 forest-green direction) |
| `packages/contracts/` | README only | Product DTOs promoted from architecture (no prototype imports) |
| `prototypes/*` | P1/P2 foundation | **Read-only reuse** — no imports into production paths (ADR-0003) |
| `tooling/lanes/lane-config.json` | Blocks `apps/**` | Add Package 3 product lane paths or work on `main` with updated allowed paths |
| `.github/workflows/repository-quality.yml` | No root lockfiles | Extend with Package 3 domain test job; per-package lockfiles under `apps/mobile` OK |
| `design/*` | Docs only | Tokens implemented in `packages/config`; reconcile forest green vs navy in tokens doc |
| CI prototype workflows | P1/P2 green | **Unchanged** — must remain green |

### Risk register

| Risk | Mitigation |
|------|------------|
| Fake data in UI | Selectors read domain store only; fixtures isolated to `__fixtures__` / tests |
| Prototype import bleed | Boundary guard + no `prototypes/` imports in `apps/` or `packages/` |
| IA mismatch (MVP 4-tab vs P3 5-tab) | Package 3 brief wins: Home, Review, central add, Proof, Profile |
| No production persistence yet | Local repository interface in domain; SQLite adapter deferred with explicit `empty`/`stale` states |
| Physical device validation deferred from P2 | Document in P3 deferred plan; do not mark device scenarios passed |

---

## Incremental delivery sequence

### Increment 1 — Domain + tokens (this session start)
- `packages/domain`: permissions, protection health, review, recovery, trip, proof types + pure functions + tests
- `packages/config`: color, spacing, typography tokens
- `docs/architecture/Package 3 Protection Health.md`: formula + UX state matrix

### Increment 2 — App shell
- `apps/mobile`: RN init, React Navigation bottom tabs + central add action
- Wire selectors to empty/denied/error states (no placeholder mileage)
- Onboarding screens 1–4 (permission flows stubbed to native module interface)

### Increment 3 — Home + Tracking Active
- Protection Health card, today summary, period mileage from **confirmed** records only
- Tracking Active state screen

### Increment 4 — Review + Recovery
- Review queue prioritization
- Missing-trip recovery flow with explicit state transitions

### Increment 5 — Trip detail + Proof + Profile
- Trip detail with progressive disclosure
- Proof overview (no fake export)
- Profile shell

### Increment 6 — Persistence + CI closure
- Local store implementation
- Mobile build CI, domain test CI, P1/P2 regression
- Checkpoint tag `checkpoint/mobile-foundation-package-3-complete`

---

## Expected modules (Increment 1–2)

```
packages/domain/src/
  permissions/types.ts
  protection-health/calculate.ts
  protection-health/types.ts
  review/prioritize.ts
  review/types.ts
  recovery/transitions.ts
  recovery/types.ts
  trips/types.ts
  proof/summary.ts
  proof/types.ts
  onboarding/progression.ts
  store/types.ts
  index.ts

packages/config/src/
  tokens/colors.ts
  tokens/spacing.ts
  tokens/typography.ts
  index.ts

apps/mobile/src/
  navigation/RootTabs.tsx
  screens/onboarding/*
  screens/home/HomeScreen.tsx
  screens/review/ReviewScreen.tsx
  screens/proof/ProofScreen.tsx
  screens/profile/ProfileScreen.tsx
  selectors/*
  services/permissions/PermissionService.ts (interface)
  theme/useTheme.ts
```

---

## Test inventory (target)

| Suite | Location | Focus |
|-------|----------|-------|
| Protection Health | `packages/domain/__tests__/protection-health.test.ts` | Deterministic levels, no false “protected” |
| Review prioritization | `packages/domain/__tests__/review-prioritize.test.ts` | Missing trip > low confidence > classification |
| Recovery transitions | `packages/domain/__tests__/recovery-transitions.test.ts` | detected → confirmed/rejected |
| Onboarding progression | `packages/domain/__tests__/onboarding.test.ts` | Step gating |
| Proof summary | `packages/domain/__tests__/proof-summary.test.ts` | Confirmed miles only; rate optional |
| Permission mapping | `packages/domain/__tests__/permissions.test.ts` | Platform-agnostic mapping |
| P1/P2 unchanged | prototypes CI | Must stay green |

---

## Closure criteria

- All required Package 3 journeys implemented (not static mocks)
- New domain tests pass; P1/P2 checks pass
- Android/iOS builds compile
- Documentation matches implementation
- Worktrees clean; main CI green
- Tag `checkpoint/mobile-foundation-package-3-complete` only after gates pass
