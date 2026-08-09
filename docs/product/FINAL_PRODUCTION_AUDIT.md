# MileRecover — Final Production Audit

**Date:** 2026-04-08  
**Branch base:** `cursor/ultimate-ux-rebuild-v8-29cb` @ `ec9d828`  
**Scope:** Full repository audit before final production completion pass

---

## 1. Confirmed current architecture

### Navigation
- Expo Router file-based: `(tabs)/` Home · Review · Proof · Profile
- Stack overlays: Trip details, Manual drive, Vehicles, Rate, Country, Tracking health, Protection, Plans, Rescue, Import, Recovery, Diagnostics (7-tap)
- Onboarding gate via `ProductContext.onboardingCompleted`

### Dual state stores (split-brain risk)
| Store | Persistence key | Owns |
|---|---|---|
| `ProductContext` (`@milerecover/product-ui/v4`) | Product UI prefs, vehicles, workplaces, locale, entitlement, import | Plan, vehicles, onboarding, locale/rate |
| `AppContext` (`@milerecover/app-state/v1`) | Trips, recovery, review queue, permissions, tracking flags | Trips, recovery, engine state shell |

### Domain packages
- `packages/domain` — trips, entitlements, localization, rates, tracking segmentation, recovery, reports, import
- `packages/product` — onboarding copy, Free forever copy, paywall messaging
- Mobile services: `trackingEngine.ts` (real expo-location + TaskManager), `billing.ts` (RevenueCat), `analytics.ts`, `updates.ts`

### Tracking (partially real)
- Background task `milerecover-background-location` via `expo-task-manager`
- Foreground `watchPositionAsync` + background updates + Android FGS notification text via Expo Location
- Domain segmentation in `packages/domain/src/tracking/segmentation.ts`
- **Gap:** `AppContext.trackingEngineState` never leaves `idle` — Protection Center and recovery heuristics read a stale shell
- Battery optimization always reported `false`; motion permission unused; no boot-complete receiver beyond Expo task persistence

### Entitlements (product rules partially encoded)
- Locked Free: unlimited manual, **40 auto/month**, 1 vehicle, tracking health, **1 missing scan/month**, CSV — **not fully enforced in code**
- Plus/Pro/Rescue product IDs exist; capabilities map omits Free auto quota and scan quota

### Reports
- CSV builder exists and is used
- PDF via `expo-print` HTML → share sheet (Plus+)
- Readiness checklist exists but export gating and CTA counts disagree

### Purchases
- RevenueCat when `EXPO_PUBLIC_REVENUECAT_*` set; else preview/mock
- Preview builds correctly disable purchase CTAs when configured

### OTA / native
- Runtime policy: `appVersion` (0.1.6)
- Preview channel wired; `updates.enabled` when `APP_VARIANT=preview|production`
- Prior APK: versionCode 16, not a dev client

---

## 2. Contradictions

1. **Rate dual SOT** — `localeProfile.activeRate` is live; `state.mileageRate` is dead; Home/Proof can disagree when snapshot missing
2. **`rateSnapshot` written but never read** — accepted trip value recalculates from live rate
3. **Vehicle nickname corrupted** — save overwrites nickname with `[year make model]` then displays year+make+model again
4. **Protection status vs engine state** — UI can say Active while engine shell stays `idle`
5. **Proof readiness** — “Needs attention” vs checklist vs “Fix N issue” can disagree
6. **Review empty copy** — claims drives ready for Proof when classification empty ≠ report ready
7. **Free plan marketing vs code** — 40 auto trips and 1 scan/month not enforced
8. **Import** — vehicle never linked; Free 7-day import preview window not gated
9. **Paywall** — preview notice can duplicate with purchase-disabled messaging

---

## 3. Broken / weak state transitions

| Transition | Issue |
|---|---|
| Auto trip finalize → Review | Works via events, but `trackingEngineState` not updated |
| Auto trip → persisted trips | In-memory `recentAutoTripKeys` only; no DB dedupe vs existing trips |
| Permission revoke while tracking | Health can go stale until next refresh |
| Entitlement load | Demo entitlement wiped to Free on restart unless demo mode |
| Country/unit change | Does not mark rate for review or explain historical snapshots |
| Free auto limit | No transition when 40th auto trip of month saved |

---

## 4. Duplicated state sources

- Distance unit: `localeProfile.distanceUnit` vs trip `distanceUnit` vs rate unit
- Currency: locale vs rate vs trip snapshot
- Plan: `ProductContext.entitlement` vs billing customer info cache
- Protection: `trackingEnabled` + permissions + `protectionStatus` + unused engine shell
- Rate: `activeRate` vs dead `mileageRate` vs `rateSnapshot` (write-only)

---

## 5. Native requirements (this pass)

- Keep Expo Location FGS + background permission flow
- Sync engine state into AppContext
- Battery optimization: detect + deep-link (Android)
- Motion/activity: request where available; degrade gracefully
- Task registration persisted across restart (Expo TaskManager)
- Process-death recovery: rehydrate engine + resume if protection on
- Trip state machine: IDLE → POSSIBLE_MOVEMENT → TRACKING → POSSIBLE_STOP → FINALIZING → NEEDS_REVIEW | FAILED_RECOVERABLE
- Offline point buffering (existing + harden)
- Reject impossible jumps / low-accuracy points (domain + engine)
- Manual start/stop fallback
- Zero hidden tracking when protection off
- New APK required (native config / behavior change)

---

## 6. Migration requirements

- Vehicle records: canonicalize title; preserve user nicknames; fix impossible composites on load
- Trips: ensure `rateSnapshot` populated for accepted work trips missing it when a rate existed at accept time is **not** invented — leave null and surface “missing historical rate”
- Entitlement: add `automaticTripsUsedThisPeriod`, `missingScansUsedThisPeriod`, period keys
- Schema version bump in both persistence keys with safe defaults
- Preview local data must not crash after upgrade

---

## 7. Launch blockers (ranked)

1. Free 40 auto trips/month + 1 scan/month not enforced
2. `rateSnapshot` not used for historical value → Proof/details/Home mismatch
3. Vehicle save corrupts nickname / contradictory cards
4. Tracking engine state never synced → false Protection / recovery behavior
5. Proof readiness count vs CTA mismatch
6. Review empty wording overclaims Proof readiness
7. Auto-trip persistence dedupe incomplete
8. Paywall duplicate preview notices
9. Import incomplete vs locked Free preview rules
10. Battery optimization never measured
11. No production evidence pack under `ui-evidence/final-production/`
12. Version/APK not bumped for native pass

---

## 8. Test coverage gaps

| Area | Gap |
|---|---|
| Rate snapshot immutability | No test that live rate change leaves accepted trip value |
| Free 40 auto allowance | Missing |
| Missing scan monthly reset | Missing |
| Vehicle canonicalization | Missing |
| Proof required vs recommended CTA | Weak |
| Trip state machine | Missing dedicated machine tests |
| Process recovery / engine sync | Missing |
| GPS jump rejection | Partial in segmentation |
| Paywall single preview notice | Missing |
| Persistence after restart | Partial |
| Report CSV/PDF structure | Partial |
| Boot / battery deep-link | Missing (platform) |

---

## 9. Proceed

This audit is the source of truth for the implementation that follows in the same branch. All blockers above are in scope for the final production pass.
