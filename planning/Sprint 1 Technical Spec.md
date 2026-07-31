# MileRecover Sprint 1 — Technical Specification

**Status:** Planned  
**Duration:** 2 weeks  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering Lead  
**Parent:** [Sprint 1.md](./Sprint%201.md) (sprint plan summary)

---

## Document Scope

This specification defines **implementation requirements** for Sprint 1 only. It separates:

| Layer | This document |
|---|---|
| **Product principles** | Referenced, not redefined — see [03 Core Principles.md](../docs/03%20Core%20Principles.md) |
| **Customer promises** | Out of scope for Sprint 1 (no export, no Proof Score UI) |
| **Technical decisions** | [Decision Log.md](../docs/Decision%20Log.md) DEC-001, DEC-002, DEC-003 |
| **Implementation details** | This spec |

**Sprint 1 proves one thing:** reliable native trip detection and local persistence on one iPhone and one Android device — **offline**, **battery-conscious**, **evidence-backed**.

No polished UI. No Recovery Engine. No backend sync.

---

## Objective

Validate the **Native Tracking Engine** pipeline end-to-end:

```
Platform sensors → Deterministic state machine → Raw events persisted →
Trip draft emitted → Local database → Debug visibility (minimal RN list)
```

Success means a real drive on reference devices produces exactly one trip draft with linked location evidence — with zero network calls.

---

## Reference Devices (Sprint 1 Only)

Sprint 1 optimizes for **two physical devices** before expanding the matrix.

| Platform | Reference device | OS target |
|---|---|---|
| iOS | iPhone 14 or newer | iOS 17+ |
| Android | Google Pixel 7 or equivalent | Android 14 |

Simulators/emulators are used for development; **acceptance tests require real drives** on reference devices.

Other devices (Samsung A-series, iPhone 11) are Sprint 2+ matrix expansion.

---

## In Scope

### Application repository setup
- Separate application repo (not this OS repo)
- React Native New Architecture scaffold
- iOS and Android native module targets (Swift, Kotlin)
- TypeScript types for bridge contract (no UI components beyond debug list)

### Native Tracking Engine v0
- Implement [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md) through **Completed drive** state
- **Needs repair** state handling for interrupted sessions
- Motion activity gating (CMMotionActivity / Activity Recognition)
- Adaptive location accuracy per state
- Distance computation: filtered path sum (Haversine); no map matching
- Trip draft emission with `detection_confidence` and `flags`

### Local persistence
- Persist **Raw tracking events** and **Trip** drafts per [Data Model.md](../architecture/Data%20Model.md)
- Native-thread writes to SQLite (avoid JS bridge for raw GPS)
- Schema migration v1
- Works in airplane mode

### React Native bridge (minimal)
- `startTracking` / `stopTracking` / `getEngineStatus`
- Event: `onTripDraftCreated` (summary payload only — not raw GPS stream)
- Debug screen: flat list of trip drafts (timestamp, distance, confidence, flags)

### Permissions (basic)
- Location permission request with placeholder rationale string
- Engine behavior documented for When In Use vs Always (full UX in Sprint 2)

### Testing & measurement
- Simulated path test harness (injected coordinates)
- Real-drive acceptance on both reference devices
- 4-hour idle battery baseline per device
- Airplane-mode persistence test

---

## Out of Scope (Sprint 1)

| Item | Deferred to |
|---|---|
| Polished UI / design system | Sprint 2 |
| Review queue, swipe, classification | Sprint 2 |
| Proof Score calculation or display | Sprint 3 |
| Recovery Engine (any suggestions) | H1 |
| Export PDF/CSV | Sprint 3 |
| Backend API and sync | Sprint 3 |
| Auth and subscriptions | Sprint 3 |
| Multi-device sync | Sprint 3 |
| AI (any form) | H1 |
| Vehicle entity (multi-vehicle) | H2 |
| Map visualization | Sprint 2 |
| CPA-facing features | H2 |
| Broad device QA matrix | Sprint 2+ |

---

## Technical Deliverables

| ID | Deliverable | Acceptance owner |
|---|---|---|
| TD-1 | RN app runs on reference iPhone and Pixel | Mobile |
| TD-2 | Swift NTE module with state machine | iOS |
| TD-3 | Kotlin NTE module with state machine parity | Android |
| TD-4 | SQLite schema v1: trips, raw_tracking_events, engine_sessions | Mobile |
| TD-5 | Native → SQLite write path (no network) | Mobile |
| TD-6 | RN bridge + TypeScript interface | Mobile |
| TD-7 | Debug trip list screen | Mobile |
| TD-8 | Simulated path test suite (≥10 scenarios) | Mobile |
| TD-9 | Battery idle report (4 hr, both devices) | Mobile |
| TD-10 | Sprint demo recording + written test results | Mobile Lead |

---

## Architecture References

| Topic | Document |
|---|---|
| State transitions | [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md) |
| Entity definitions | [Data Model.md](../architecture/Data%20Model.md) |
| Engine goals | [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md) |
| Offline policy | [Offline First.md](../architecture/Offline%20First.md) |
| DEC-001 RN UI | [Decision Log.md](../docs/Decision%20Log.md) |
| DEC-002 Native engines | [Decision Log.md](../docs/Decision%20Log.md) |

### Bridge contract (conceptual)

**Commands (RN → Native):**
- `startTracking(config)` — begins engine from Idle
- `stopTracking()` — user pause; transitions to Idle
- `getEngineStatus()` — returns current state name + metadata

**Events (Native → RN):**
- `onEngineStateChanged` — state name for debug only
- `onTripDraftCreated` — trip id, start/end, distance, confidence, flags

Raw coordinates **must not** stream over the bridge in Sprint 1.

---

## Acceptance Criteria

### AC-1 — Real drive detection
- Reference iPhone and reference Pixel each complete a **≥5 mile** real drive
- Exactly **one** trip draft created per drive
- Trip linked to ≥2 raw tracking event batches with timestamps

### AC-2 — False positive rejection
- 30 minutes stationary (engine active) → **zero** trip drafts
- Simulated parking-lot wander test → no draft OR draft with confidence <0.4 not promoted (engine-internal only)

### AC-3 — Offline persistence
- Full drive in airplane mode → trip draft in SQLite
- App restart → draft still present
- Zero HTTP requests during capture (network monitor verification)

### AC-4 — Interrupted drive
- App killed mid-drive → on relaunch, session in **Needs repair** or partial draft with `incomplete` flag
- No duplicate drafts for same session

### AC-5 — Trust Rule A1 (evidence)
- No trip draft without linked raw tracking events meeting minimum sample count (documented threshold: ≥10 valid samples, ≥2 minutes duration)

### AC-6 — Battery (idle)
- 4-hour idle with engine enabled: <2% battery drain on reference iPhone; <2.5% on reference Pixel
- Document sampling mode used

### AC-7 — Platform parity
- Both platforms emit trip drafts for equivalent simulated highway path (injected test)
- State machine state names match [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md)

---

## Test Scenarios

| ID | Scenario | Setup | Expected |
|---|---|---|---|
| T-01 | Highway drive | Real device, 5+ mi, 30+ mph | 1 draft, confidence ≥0.7 |
| T-02 | Stationary | Engine on, 30 min still | 0 drafts |
| T-03 | Short hop | <0.5 mi, <3 min | 0 drafts |
| T-04 | Airplane drive | Airplane on before drive | 1 draft, persisted |
| T-05 | App kill | Force quit during recording | Partial/repair state, no duplicate |
| T-06 | Tunnel gap | Simulated 3-min signal loss mid-drive | 1 draft, `gap` flag set |
| T-07 | Permission degrade | When In Use only | Documented behavior; no crash |
| T-08 | User pause | stopTracking mid-drive | Finalize or discard per spec |
| T-09 | Simulated highway | Injected coordinates both platforms | Parity within 10% distance |
| T-10 | SQLite integrity | 100 rapid samples | No lost writes, no main-thread block |

---

## Telemetry (Sprint 1 — Debug Only)

Sprint 1 telemetry is **local and dev-only**. No production analytics.

| Event | Fields | Purpose |
|---|---|---|
| `engine_state_transition` | from, to, timestamp | State machine validation |
| `trip_draft_created` | id, confidence, distance, flags | Acceptance verification |
| `sample_batch_written` | count, duration_ms | Performance |
| `battery_snapshot` | level, state, engine_state | AC-6 evidence |

Production telemetry schema defined in Sprint 3. **No raw GPS in any telemetry.**

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RN native bridge instability | Medium | High | Spike day 1; native SQLite write bypasses JS |
| Android OEM battery kill | Medium | Medium | Pixel reference first; document whitelist for beta |
| iOS Always permission denied in test | Low | Medium | Test with When In Use; document degradation |
| State machine parity drift | Medium | High | Shared spec doc; cross-platform test T-09 |
| Battery target miss | Medium | Medium | Adjust sampling day 8; document tradeoff |
| Scope creep into UI | High | Medium | This spec + Sprint 1 out-of-scope list |

---

## Definition of Done

Sprint 1 is complete when **all** are true:

- [ ] AC-1 through AC-7 passed on reference devices (written report)
- [ ] Test scenarios T-01 through T-10 executed (pass or documented exception)
- [ ] Trust Rule A1 verified — no evidence-free drafts
- [ ] [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md) implemented through Completed drive + Needs repair
- [ ] [Data Model.md](../architecture/Data%20Model.md) Trip and Raw tracking event persisted locally
- [ ] Debug list shows drafts from local DB only
- [ ] Zero network dependency for capture demonstrated
- [ ] Battery idle report attached
- [ ] Sprint demo recorded
- [ ] No Recovery Engine code paths introduced
- [ ] No polished UI beyond debug list

---

## Philosophy Check (Sprint 1)

| Principle | Sprint 1 expression |
|---|---|
| Never invent mileage | Drafts require raw events; no interpolation |
| Battery friendly | Adaptive sampling; idle measurement |
| Offline first | SQLite only; airplane mode tested |
| Trust over automation | Low-confidence sessions discarded or flagged, not promoted |
| AI assists… | No AI in Sprint 1 |

---

## Related Documents

- [Sprint 1.md](./Sprint%201.md)
- [Sprint 2.md](./Sprint%202.md)
- [MVP.md](./MVP.md)
- [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
- [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md)
- [Data Model.md](../architecture/Data%20Model.md)
