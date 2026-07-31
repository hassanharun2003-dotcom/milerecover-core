# MileRecover Sprint 1

**Duration:** 2 weeks  
**Sprint Goal:** Establish project foundation and validate Native Tracking Engine proof of concept  
**Status:** Planned  
**Last Updated:** July 2026

---

## Sprint Theme

**"Capture evidence correctly."**

No UI polish. Prove we can detect drives **battery friendly**, store them **offline first**, and never create trips without evidence.

---

## Objectives

1. Repository and development environment setup (application repo — separate from this OS repo)
2. Native Tracking Engine POC on iOS and Android
3. Local database schema v1 implemented
4. React Native shell with native module bridge
5. Basic trip detection → local storage pipeline

---

## Deliverables

| Deliverable | Owner | Done |
|---|---|---|
| RN project scaffold + monorepo structure | Mobile | [ ] |
| iOS NTE POC (detect + finalize trip) | iOS | [ ] |
| Android NTE POC (detect + finalize trip) | Android | [ ] |
| Native ↔ RN bridge interface | Mobile | [ ] |
| SQLite schema: trips, location_samples | Mobile | [ ] |
| Drive detection test suite (simulated paths) | Mobile | [ ] |
| Battery baseline measurement (1 device each platform) | Mobile | [ ] |

---

## User Stories

| ID | Story | Points |
|---|---|---|
| S1-1 | Dev can run app on iOS simulator and device | 2 |
| S1-2 | NTE detects highway drive simulation (>5 mi) | 5 |
| S1-3 | NTE rejects stationary GPS drift | 3 |
| S1-4 | Trip draft saved to local SQLite offline | 3 |
| S1-5 | RN displays raw trip list from local DB | 3 |
| S1-6 | Location permission flow (basic) | 2 |

**Total:** ~18 points

---

## Technical Tasks

### Native Tracking Engine
- Implement state machine: IDLE → DETECTING → RECORDING → FINALIZING
- CMMotionActivity / Activity Recognition integration
- Adaptive location accuracy
- Write location batches to SQLite from native thread

### Database
- Implement `trips`, `location_samples`, `sync_metadata` tables
- WatermelonDB or raw SQLite adapter evaluation
- Migration v1

### Bridge
- `TrackingEngineModule.start/stop/getStatus`
- `onTripDetected` event emitter
- TypeScript interface definitions

---

## Test Plan

| Test | Pass |
|---|---|
| Simulated 10mi drive → 1 trip draft | ✓ |
| 30min stationary → no trip | ✓ |
| Airplane mode → trip saved locally | ✓ |
| App kill during recording → partial trip recovered | ✓ |
| Battery 4hr test <2% drain idle | ✓ |

---

## Out of Scope (Sprint 1)

- Review UI / swipe
- Proof Score
- Export
- Backend sync
- Auth
- Design system implementation

---

## Risks

| Risk | Mitigation |
|---|---|
| RN native module complexity | Spike day 1; fallback to more native UI |
| Android foreground service UX | Research notification copy early |
| Battery target missed | Adjust sampling day 8 |

---

## Definition of Done

- [ ] Trip detected on both platforms from real drive test
- [ ] Trip persisted in SQLite, visible in debug list UI
- [ ] Zero network calls required for capture
- [ ] Trust Rules A1 satisfied (evidence required for trip)
- [ ] Sprint demo recorded for team

---

## Philosophy Check

- [ ] No trip without location batch evidence
- [ ] Offline capture verified
- [ ] Battery measurement documented

---

## Related Documents

- [MVP.md](./MVP.md)
- [Sprint 2.md](./Sprint%202.md)
- [../architecture/Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
