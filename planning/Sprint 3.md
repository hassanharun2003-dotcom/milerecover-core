# MileRecover Sprint 3

**Duration:** 2 weeks  
**Sprint Goal:** Proof Score, export, sync, and auth — MVP feature complete  
**Status:** Planned  
**Last Updated:** July 2026

---

## Sprint Theme

**"Defensible output."**

Users can score their trips, export audit-ready logs, sync across devices, and authenticate — all **offline first** where promised.

---

## Prerequisites

- Sprint 2 complete: review lifecycle working
- Backend staging environment provisioned

---

## Objectives

1. Proof Score v1 calculation and UI
2. PDF and CSV export (on-device)
3. Export preview with gap/pending disclosure
4. Backend sync (push/pull)
5. Auth (email, Apple, Google)
6. Subscription integration (RevenueCat)
7. Automation level settings

---

## Deliverables

| Deliverable | Owner | Done |
|---|---|---|
| Proof Score calculator (client) | Mobile + Backend | [ ] |
| ProofScoreMeter component | Mobile | [ ] |
| PDF export generator | Mobile | [ ] |
| CSV export generator | Mobile | [ ] |
| Export preview screen | Mobile | [ ] |
| Sync engine (push/pull) | Mobile + Backend | [ ] |
| Auth flows | Mobile + Backend | [ ] |
| RevenueCat integration | Mobile | [ ] |
| Automation settings screen | Mobile | [ ] |
| Staging deployment | Backend | [ ] |

---

## User Stories

| ID | Story | Points |
|---|---|---|
| S3-1 | User sees Proof Score on each trip | 5 |
| S3-2 | User taps score to see factor breakdown | 3 |
| S3-3 | User exports PDF mileage log offline | 8 |
| S3-4 | Export excludes pending trips by default | 3 |
| S3-5 | Export notes unaccounted gaps | 2 |
| S3-6 | User syncs trips when coming online | 5 |
| S3-7 | User signs in with Apple/Google | 5 |
| S3-8 | User upgrades to Pro for full export | 3 |
| S3-9 | User sets automation to Conservative | 2 |

**Total:** ~36 points

---

## Proof Score (Sprint 3 Scope)

Implement v1 rule-based model from [../architecture/Proof Score.md](../architecture/Proof%20Score.md):

- GPS continuity factor
- User confirmation factor
- Purpose documented factor
- Distance integrity factor
- Source trust factor

Recalculate on trip edit. Store factors JSON for breakdown UI.

---

## Export Specification

### PDF
- IRS-aligned columns per [../research/IRS Research.md](../research/IRS%20Research.md)
- Footer: generation timestamp, device, sync status
- Section: excluded pending trips count
- Section: unaccounted days list

### CSV
- All confirmed business trips
- Columns: date, destination, purpose, miles, source, proof_score, ai_assisted, confirmed_at

**Offline:** Both formats generated from local DB without API call.

---

## Sync Scope

- Mutation queue outbound
- Delta pull inbound
- Conflict: last-write-wins with notification for confirm/reject conflicts
- Sync indicator component

---

## Backend (Sprint 3)

Minimum viable backend:
- Auth endpoints
- Sync push/pull
- Trip validation (Trust Rules)
- Subscription webhook (RevenueCat)

---

## Test Plan

| Test | Pass |
|---|---|
| Proof Score matches manual calculation (10 fixtures) | ✓ |
| PDF opens correctly, CPA panel review | ✓ |
| CSV imports to Excel without errors | ✓ |
| 7-day offline → sync → no data loss | ✓ |
| Auth + sync on second device | ✓ |
| Free tier: watermarked/current month only | ✓ |
| Pro tier: full year export | ✓ |
| Export with 0 confirmed trips → honest empty state | ✓ |

---

## Out of Scope (Sprint 3)

- Recovery Engine (calendar/import)
- AI purpose suggestions
- CPA portal
- Server-side PDF generation
- Multi-vehicle

---

## Definition of Done

- [ ] MVP feature checklist in [MVP.md](./MVP.md) complete
- [ ] All Trust Rules Category A tests pass
- [ ] Beta build uploaded to TestFlight + Play Internal
- [ ] Monitoring (Sentry, basic analytics) live
- [ ] Sprint demo: full user journey install → drive → review → export

---

## Post-Sprint

→ Beta Testing (4 weeks)  
→ Launch Plan execution

---

## Related Documents

- [Sprint 2.md](./Sprint%202.md)
- [Beta Testing.md](./Beta%20Testing.md)
- [../architecture/Proof Score.md](../architecture/Proof%20Score.md)
- [../architecture/Offline First.md](../architecture/Offline%20First.md)
