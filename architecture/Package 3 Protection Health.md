# Package 3 — Protection Health

**Status:** Implemented in `packages/domain`  
**User-facing name:** Protection Health (DEC-015)  
**Principle:** Never claim full protection unless inputs support the claim.

---

## Inputs (all required for calculation)

| Input | Type | Source |
|-------|------|--------|
| `locationPermission` | `PermissionState` | OS permission API |
| `backgroundLocationPermission` | `PermissionState \| 'not_applicable'` | OS permission API |
| `motionPermission` | `PermissionState \| 'not_applicable'` | OS permission API (optional platform) |
| `trackingEngineState` | `active \| idle \| stopped \| unavailable` | Native tracking module |
| `batteryOptimizationRestricted` | `boolean` | Android settings / iOS Low Power unknown → false |
| `lastConfirmedCaptureAt` | `number \| null` | Native buffer / trip pipeline (epoch ms) |
| `lastSyncAt` | `number \| null` | Sync client when exists; null in offline-only P3 |
| `now` | `number` | Injected clock (testable) |
| `pendingReviewCount` | `number` | Review queue |

Constants (domain):
- `STALE_CAPTURE_MS` = 24h — no confirmed capture → attention
- `CRITICAL_STALE_MS` = 72h — at_risk if engine should be active

---

## Score (deterministic, explainable)

Weighted factors (sum capped at 100):

| Factor | Condition | Points |
|--------|-----------|--------|
| Location | `granted` | 25 |
| | `restricted` | 10 |
| | else | 0 |
| Background location | `granted` | 30 |
| | `restricted` | 8 |
| | else | 0 |
| Motion | `granted` or `not_applicable` | 10 |
| | `restricted` | 5 |
| | else | 3 |
| Engine | `active` | 25 |
| | `idle` + capture within `STALE_CAPTURE_MS` | 18 |
| | `idle` stale | 8 |
| | `stopped` / `unavailable` | 0 |
| Battery optimization | not restricted | 10 |
| | restricted | 0 |

**Level mapping (never “100% protected” copy):**

| Level | Conditions |
|-------|------------|
| `protected` | Score ≥ 85 **and** background `granted` **and** engine ∈ `{active, idle}` **and** location `granted` |
| `attention` | Score ≥ 50 **or** pendingReviewCount > 0 **or** stale capture **or** motion denied |
| `at_risk` | Background denied/restricted **or** engine stopped with recent driving expectation **or** score < 50 |
| `limited` | Location denied — automatic capture unavailable |

`reasons[]` lists every factor that reduced score or triggered escalation (for UI + tests).

---

## UX copy rules

- Use level label + plain reason, not opaque percentages on Home
- Optional numeric score shown only in Tracking Active / debug with “How this is calculated” link
- Red only for `limited` or permission failures; amber for `attention`; green tones for `protected`

See `planning/Package 3 UX State Matrix.md` (Increment 1).
