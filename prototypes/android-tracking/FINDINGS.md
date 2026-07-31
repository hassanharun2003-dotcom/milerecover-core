# Prototype B — Physical-device findings

**First session:** 31 July 2026  
**Second session:** 31 July 2026 — **successful re-test**  
**Device:** Samsung SM-A166U (wireless debugging)  
**Tooling:** Android Studio Quail 3  
**Status:** Core lifecycle/ack fixes **validated on device** — extended runbook scenarios **remaining**

---

## Validated behavior

| Area | Pass 1 | Pass 2 |
|---|---|---|
| Project import / Gradle build | Pass | Pass |
| App install / wireless deploy | Pass | Pass |
| Foreground permission explanation | Pass | Pass |
| Foreground location permission | Granted | `foreground_only` |
| Notification permission | Granted | Pass |
| Foreground service notification | Displayed | Pass |
| FGS start / stop | Start pass | **Start + stop pass** |
| Event buffer permission changes | Pass | Pass |
| Notification calibration-only wording | Pass | Pass |
| Lifecycle UI synchronization | **Fail** | **Pass** |
| Pending acknowledgement | Unclear | **Pass** (10 → 0) |
| Duplicate acknowledgement | Not tested | **Pass** (*No pending events*) |

---

## Validated fixes (second pass)

| Issue | Fix applied | Device re-test |
|---|---|---|
| Spurious `RECOVERING` on normal start | `START_FLAG_REDELIVERY` replaces broken heuristic | **Pass** — clean lifecycle to `STOPPED` |
| UI/service desync on stop | `SessionStateNotifier` + delayed refresh | **Pass** — `FGS session requested: false` after stop |
| Pending ack UX | Label + ack count toast | **Pass** — 10 → 0 |
| Missing import (`SessionStateNotifier`) | Import in `TrackingForegroundService.kt` | **Pass** — build + deploy |

---

## Unexpected behavior (first pass only — resolved)

| # | Observation | Status |
|---|---|---|
| 1 | Tracking state `SESSION_REQUESTED` → `RECOVERING` instead of clean lifecycle | **Resolved** (pass 2) |
| 2 | Stop toast *"No active session"* with stale UI | **Resolved** (pass 2) |
| 3 | Pending events increased; ack flow unclear | **Resolved** (pass 2) |
| 4 | UI stale relative to service lifecycle | **Resolved** (pass 2) |

---

## Open issues

| Area | Status |
|---|---|
| Background location | **Not validated** |
| Activity recognition | **Not validated** |
| Movement / controlled drives | **Not validated** |
| Process death recovery | **Not validated** |
| Device reboot / boot receiver | **Not validated** |
| Battery optimization restrictions | **Not validated** |
| Multi-device OEM matrix | **Not validated** |
| Long-session event loss | **Not validated** |

---

## Root causes (first pass — historical)

### 1. Defective redelivery heuristic (**confirmed in code review**)

`intentIsRedelivery()` returned `locationCollector != null` after assignment on every start → forced `RECOVERING`.

### 2. Async stop vs immediate UI refresh

Stop asynchronous; UI refreshed before prefs cleared.

### 3. No service→UI notification

Fixed via `SessionStateNotifier`.

### 4. Pending events require explicit acknowledgement (**by design**)

Validated on pass 2: operator ack 10 → 0; second ack correctly reports no pending.

---

## Required follow-up validation

Per [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md):

1. Background location scenarios
2. Activity recognition optional path
3. Controlled movement tests
4. Process death / task removal
5. Device reboot / boot recovery evaluation
6. Battery saver and optimization restrictions
7. Second reference device (non-Samsung)

---

## Promotion status

| Decision | Status |
|---|---|
| Promote to production | **No** |
| Current milestone (FGS + lifecycle + ack on device) | **Validated** |
| Full Prototype B / gate sign-off | **Incomplete** — remaining runbook scenarios |
| Production ADR | **Prohibited** |

---

## Related

- [RESULTS.md](./RESULTS.md)
- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
- [Android Prototype Validation Gate.md](../../planning/Android%20Prototype%20Validation%20Gate.md)
