# MileRecover Tracking State Machine

**Status:** Foundational — Authoritative for Sprint 1+  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering  
**Companion:** [Native Tracking Engine.md](./Native%20Tracking%20Engine.md) (engine overview)

---

## Purpose

This document defines the **deterministic state machine** governing the Native Tracking Engine. It specifies when evidence is captured, when trip drafts are created, and when failures are surfaced honestly.

**AI must not control state transitions.** ML may inform *signals* (motion classification) but only rule-based thresholds advance states.

Philosophy: **Never invent mileage**, **battery friendly**, **trust over automation**.

---

## States

| State | Description |
|---|---|
| **Idle** | Engine active but not observing vehicle movement |
| **Possible vehicle movement** | Early motion signals; sampling increased cautiously |
| **Drive candidate** | Sustained movement suggesting a drive; evidence accumulating |
| **Confirmed drive** | Thresholds met; full recording mode |
| **Possible stop** | Movement ceased; waiting to confirm trip end |
| **Completed drive** | Session finalized; trip draft eligible for emission |
| **Needs repair** | Interrupted or ambiguous session requiring user attention |

**User pause** from any state → **Idle** (with defined finalize/discard rules below).

---

## State Diagram

```
                    ┌──────────────────────────────────────┐
                    │                 Idle                  │
                    └───────────────┬──────────────────────┘
                                    │ motion signal
                                    ▼
                    ┌──────────────────────────────────────┐
                    │        Possible vehicle movement      │
                    └───────────────┬──────────────────────┘
                          timeout   │   sustained movement
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
                  [Idle]              ┌──────────────────────┐
                                      │    Drive candidate    │
                                      └──────────┬───────────┘
                                    timeout    │    thresholds met
                     ┌────────────────────────┴────────────┐
                     ▼                                       ▼
                  [Idle]                         ┌──────────────────────┐
                                                 │   Confirmed drive     │
                                                 └──────────┬───────────┘
                                               stop signal │
                                                            ▼
                                                 ┌──────────────────────┐
                                                 │    Possible stop      │
                                                 └──────────┬───────────┘
                                    resume movement        │ confirmed stop
                     ┌─────────────────────────────────────┤
                     ▼                                       ▼
            [Confirmed drive]                    ┌──────────────────────┐
                                                 │   Completed drive     │
                                                 └──────────┬───────────┘
                                                            │ emit draft
                                                            ▼
                                                         [Idle]

        Any state + app kill / corruption / unrecoverable gap
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Needs repair      │─── user discard ──→ [Idle]
                         └──────────────────────┘
                                    │
                                    └── user repair/accept partial ──→ trip draft → [Idle]
```

---

## Global Rules

| Rule | Requirement |
|---|---|
| SM-1 | State transitions are **deterministic** given same inputs |
| SM-2 | **AI/ML may set input flags** (e.g., `motion=automotive`) but **not** transition states directly |
| SM-3 | Raw tracking events written in: Possible vehicle movement (sparse), Drive candidate+, Confirmed drive (full) |
| SM-4 | Trip draft emitted **only** from Completed drive or repaired Needs repair |
| SM-5 | No trip draft from Drive candidate alone |
| SM-6 | Distance never computed across untracked gaps — flag instead |
| SM-7 | User pause stops sampling within 5 seconds |

---

## State Specifications

### Idle

**Meaning:** Engine enabled; low-power monitoring only.

**Entry conditions:**
- Engine started by user or app launch with tracking enabled
- Completed drive finalized
- Possible vehicle movement / Drive candidate timed out
- User pause
- Needs repair discarded

**Behavior:**
- Significant location changes or equivalent low-power watch
- Motion activity polled at low frequency
- **No** high-accuracy GPS

**Exit conditions → Possible vehicle movement:**
- Speed >8 mph OR automotive motion activity OR significant location delta suggesting travel

**Stored evidence:** None (or heartbeat event every 15 min for uptime metrics only — not used for mileage)

**Battery:** Minimum draw target state.

---

### Possible vehicle movement

**Meaning:** Something moved; not yet confident it's a drive.

**Entry conditions:** From Idle when motion signal received.

**Behavior:**
- Increase sampling to medium accuracy every 30s
- Start `session_id` and `batch_id`
- Write sparse Raw tracking events
- Start timeout timer: **90 seconds**

**Exit conditions:**
- → **Drive candidate:** Speed >10 mph sustained 30s OR automotive motion + movement
- → **Idle:** Timeout with no qualifying movement (discard session batch or mark non-trip)

**Failure cases:**
- GPS unavailable: remain max 90s then Idle; log `gps_unavailable` flag
- False trigger (walking fast): timeout returns Idle; events not linked to trip

**Stored evidence:** Sparse samples linked to `session_id`; may be purged if return Idle

---

### Drive candidate

**Meaning:** Evidence accumulating; drive not yet confirmed.

**Entry conditions:** From Possible vehicle movement with sustained movement.

**Behavior:**
- Medium-high accuracy samples every 15–30s
- Continuous Raw tracking event write
- Evaluate confirmation thresholds each sample
- Timeout: **120 seconds** without confirmation → Idle (discard as non-trip)

**Confirmation thresholds → Confirmed drive (all required):**
1. Elapsed ≥60 seconds in this state
2. Distance ≥0.3 miles computed from samples
3. Median speed ≥12 mph
4. ≥60% of motion readings automotive (if available)

**Exit conditions:**
- → **Confirmed drive:** thresholds met
- → **Idle:** timeout or movement ceases before confirmation

**Failure cases:**
- Passenger in car without automotive signal: may timeout — acceptable (**trust over automation**)
- GPS drift while parked: timeout to Idle if speed threshold not met

**Stored evidence:** Full batch linked to session; deleted if return Idle without trip

---

### Confirmed drive

**Meaning:** Active drive recording — high-confidence evidence collection.

**Entry conditions:** Drive candidate thresholds met.

**Behavior:**
- High accuracy sampling every 10–15s (platform-appropriate)
- Continuous Raw tracking event write
- Distance computed incrementally (filtered Haversine)
- Low Power Mode: reduce frequency; set `low_power` flag — do not invent samples

**Exit conditions → Possible stop:**
- Speed <5 mph sustained 2 minutes OR visit arrival detected OR user manual stop

**Exit conditions → Needs repair:**
- App killed
- GPS lost >10 minutes without resume
- Sample gap >5 minutes mid-session (unrecoverable)

**Failure cases:**
- Tunnel: GPS gap <5 min → continue with `gap` flag; no straight-line interpolation
- Phone powered off: → Needs repair on next launch

**Stored evidence:** Complete sample chain; gaps flagged in metadata

---

### Possible stop

**Meaning:** Drive may have ended; verifying stop.

**Entry conditions:** From Confirmed drive on stop signal.

**Behavior:**
- Reduce to medium accuracy every 30s
- Stop timer: **5 minutes** confirmation window
- Continue writing samples (stop verification)

**Exit conditions:**
- → **Completed drive:** Stop timer expires with speed <5 mph
- → **Confirmed drive:** Movement resumes (speed >10 mph) — merge stop as traffic pause if <5 min
- → **Needs repair:** App killed during stop wait

**Failure cases:**
- Idling in traffic >5 min before stop timer: may split incorrectly — user can merge in Sprint 2 (flag `possible_premature_stop`)

**Stored evidence:** Stop-period samples appended to same session

---

### Completed drive

**Meaning:** Session closed; computing final draft.

**Entry conditions:** From Possible stop with confirmed stop.

**Behavior:**
1. Finalize distance from filtered samples
2. Compute `detection_confidence` (0–1)
3. Attach flags: `gap`, `incomplete`, `low_power`, etc.
4. If confidence ≥ **0.4** → emit **Trip draft** (status: `pending`)
5. If confidence < 0.4 → discard session (log internal `sub_threshold` event only — **no user trip**)
6. Transition to Idle

**Minimum draft requirements (Trust Rule A1):**
- ≥10 valid samples
- Duration ≥2 minutes
- Distance ≥0.5 miles

If minimums not met → discard, no draft.

**Stored evidence:** Raw events linked to Trip; session marked complete

**Exit conditions:** → **Idle** after emit or discard

---

### Needs repair

**Meaning:** Interrupted session; user must decide.

**Entry conditions:**
- App kill during Confirmed drive or Possible stop
- Unrecoverable GPS gap >5 minutes
- Corrupted session state on relaunch

**Behavior:**
- Persist partial session with all samples collected
- Surface to user in Sprint 2+; Sprint 1 debug UI shows repair flag
- **Do not** auto-emit trip to business totals

**Exit conditions:**
- → **Completed drive:** User accepts partial → emit draft with `incomplete` flag and reduced confidence
- → **Idle:** User discards session
- → **Confirmed drive:** User resumes driving (same session continues) — rare, explicit action

**Failure cases:**
- User ignores repair: session remains in Needs repair; gap stays visible (**never invent** fill)

**Stored evidence:** Partial chain preserved until user action or 30-day purge

---

## Mapping to Native Tracking Engine Overview

[Native Tracking Engine.md](./Native%20Tracking%20Engine.md) uses simplified labels:

| Overview label | This document |
|---|---|
| IDLE | Idle |
| DETECTING | Possible vehicle movement + Drive candidate |
| RECORDING | Confirmed drive + Possible stop |
| FINALIZING | Completed drive |
| DRAFT_EMITTED | Trip draft created (Completed drive output) |
| PAUSED | Idle (user-initiated) |
| — | Needs repair |

Both documents are aligned; this spec is authoritative for implementation.

---

## Confidence Calculation (Completed drive)

Deterministic formula — not ML:

```
confidence = weighted sum of:
  - sample_density_score    (0–0.3)
  - speed_consistency_score (0–0.3)
  - motion_agreement_score  (0–0.2)
  - gap_penalty             (0 to -0.3)
  - duration_score          (0–0.2)

clamp to [0, 1]
```

Document coefficients in application repo when implemented. Changes require Decision Log entry.

---

## AI and ML Boundaries

| Input | Allowed use |
|---|---|
| Motion activity (automotive/walking) | Gate for Possible vehicle movement entry |
| On-device activity classifier | Signal only; cannot skip Drive candidate |
| LLM / cloud AI | **Not used** in state machine |
| Map matching | **Not used** in Sprint 1; if added later, cannot bridge gaps >500m |

---

## Platform Parity Requirements

iOS (Swift) and Android (Kotlin) must implement:
- Identical state names
- Equivalent thresholds (document platform-specific speed source differences)
- Same minimum draft requirements
- Same confidence formula

Cross-platform test: [Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md) T-09.

---

## Recovery Behavior (Cross-State)

| Scenario | Behavior |
|---|---|
| App relaunch mid-drive | Restore session state from SQLite; resume Confirmed drive or Needs repair |
| Permission revoked mid-drive | Finalize to Completed drive if enough evidence; else Needs repair |
| User manual stop | Confirmed drive → Completed drive immediately (skip Possible stop timer) |
| Engine stop (user pause) | Confirmed drive → Completed drive if minimums met; else discard |
| Low battery (<10%) | Continue with reduced sampling + flag; notify user once |

---

## Related Documents

- [Native Tracking Engine.md](./Native%20Tracking%20Engine.md)
- [Data Model.md](./Data Model.md) — Trip, Raw tracking event
- [Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md)
- [04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
- [AI Architecture.md](./AI%20Architecture.md)
