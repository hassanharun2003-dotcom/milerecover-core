# MileRecover Sprint 2

**Duration:** 2 weeks  
**Sprint Goal:** Complete core trip lifecycle — review, classify, edit — with trust-first UX  
**Status:** Planned  
**Last Updated:** July 2026

---

## Sprint Theme

**"Trust over automation — in the interface."**

Users can review every detected trip, confirm or reject, and see honest totals.

---

## Prerequisites

- Sprint 1 complete: NTE → local DB pipeline working
- Design tokens available from MRDS (this repo)

---

## Objectives

1. Review queue UI with TripCard component
2. Trip detail screen with map
3. Confirm / personal / reject state machine
4. Manual trip entry flow
5. Period summary (home screen v1)
6. Design system primitives implemented in RN

---

## Deliverables

| Deliverable | Owner | Done |
|---|---|---|
| Review queue screen | Mobile + Design | [ ] |
| Trip detail with map | Mobile | [ ] |
| Trip status state machine | Mobile | [ ] |
| Manual trip entry form | Mobile | [ ] |
| Home period summary v1 | Mobile | [ ] |
| Design tokens (color, type, spacing) | Design/Mobile | [ ] |
| TripCard + TrackingStatusBar components | Mobile | [ ] |
| Interaction Rules S1-S3 implemented | Mobile | [ ] |

---

## User Stories

| ID | Story | Points |
|---|---|---|
| S2-1 | User sees pending trips in review queue | 3 |
| S2-2 | User confirms trip as business with purpose | 5 |
| S2-3 | User rejects trip that didn't happen | 3 |
| S2-4 | User marks trip personal | 2 |
| S2-5 | User adds manual trip offline | 5 |
| S2-6 | User sees confirmed vs pending totals separately | 3 |
| S2-7 | User sees gap days without implied miles | 3 |
| S2-8 | Rejected trip does not reappear | 2 |

**Total:** ~26 points

---

## UX Requirements (from Interaction Rules)

- Confirm: swipe right or button
- Reject: detail view only + confirmation modal
- Pending never in confirmed business total
- Gap indicator without distance estimate
- Undo snackbar 4s on confirm/reject

---

## Technical Tasks

### Domain Layer
- TripValidator enforcing Trust Rules A1, A5
- Status transitions: `pending → confirmed | personal | rejected`
- Audit log append on each action

### UI
- React Navigation tab structure
- Map component integration
- Swipeable row (Reanimated + Gesture Handler)
- Form validation for manual entry

### Database
- Audit log table
- Indexes for review queue query
- Soft delete for rejected trips

---

## Test Plan

| Test | Pass |
|---|---|
| Confirm trip → appears in business total | ✓ |
| Reject trip → removed from totals, recoverable | ✓ |
| Manual entry offline → persists | ✓ |
| Edit purpose → required for business export flag | ✓ |
| Gap day shown when no trips | ✓ |
| No "accept all" without summary modal | ✓ |

---

## Design References

- [../design/Component Library.md](../design/Component%20Library.md) — TripCard, GapIndicator
- [../design/Interaction Rules.md](../design/Interaction%20Rules.md)
- [../design/Color System.md](../design/Color%20System.md)

---

## Out of Scope (Sprint 2)

- Proof Score calculation UI
- Export PDF
- Backend sync
- Auth screens (stub user)
- Subscriptions

---

## Definition of Done

- [ ] Full review loop demoable on device
- [ ] Manual + auto trips in unified list
- [ ] Trust Rules G1, G2, G5 verified in QA
- [ ] Design review sign-off on review queue
- [ ] No invented mileage paths in any flow

---

## Related Documents

- [Sprint 1.md](./Sprint%201.md)
- [Sprint 3.md](./Sprint%203.md)
- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
