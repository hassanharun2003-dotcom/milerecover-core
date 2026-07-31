# MileRecover MVP Definition

**Status:** Foundational — launch scope locked (DEC-018–DEC-024)  
**Last Updated:** July 2026  
**Owner:** Product

**Authority:** [Product DNA.md](../docs/Product%20DNA.md) · [09 Pricing.md](../docs/09%20Pricing.md) · [Recovery Engine.md](../architecture/Recovery%20Engine.md)

---

## MVP Thesis

Ship the smallest product that proves MileRecover's core promise:

> **Every work mile accounted for — with evidence — without inventing mileage.**

MVP is **trust-complete** and **recovery-complete at launch scope** — a protection system with bounded Recovery Engine (DEC-021), not a generic auto-logger.

---

## Launch vs Deferred

| Area | Required at launch | Deferred post-launch |
|---|---|---|
| **Personalization** | Driver type, work style, pain, vehicle, permission education, tracking preference, **estimated-value basis selection** (DEC-020) | Advanced automation rules by industry |
| **Recovery** | Gap detection, calendar matching, known-place transitions, import analysis, edge repair, no-driving confirm, evidence display, user-confirmed reconstruction (DEC-021) | Bank matching, email scanning, delivery-platform integrations, unlimited multi-source reconstruction |
| **Tracking** | Native engine v1, conservative default, manual entry, pause/resume, Protection Health | — |
| **Review** | Queue, history, confirm/personal/reject, split, **no-driving three-option flow** (DEC-024) | — |
| **Proof** | Proof Score (Plus+), PDF/CSV (Plus+), basic CSV (Free), employee reimbursement CSV (Pro, DEC-022) | CPA portal, extended audit pack |
| **Home** | Protection status, estimated value (default on, hide toggle), tracking health | — |
| **Notifications** | Pattern-aware alerts, **quiet hours 9 PM–7 AM** (DEC-023) | — |
| **Monetization** | Free, Plus, Pro, Mileage Rescue, Full-Year Rescue, Founding Member Pro (DEC-018, DEC-019) | Pro+ (never) |
| **Navigation** | Four tabs: Home, Review, Proof, Profile (DEC-007) | — |

---

## In Scope (Launch)

### Personalized onboarding (DEC-008)
- Driver type: delivery/rideshare, realtor, contractor, healthcare, sales, employee reimbursement, business owner, multi-job
- Work style, biggest pain, vehicle setup
- Permission education before OS prompt
- Tracking preference (Conservative default)
- **Estimated-value calculation basis** selection (deduction / reimbursement / potential mileage — DEC-020)

### Bounded Recovery Engine (DEC-021) — launch
- Gap candidates between captured drives
- Calendar events without matching drives (Plus+; opt-in calendar)
- Known work-location transitions
- Competitor-import gap analysis (Free: 7-day preview; Plus+: full)
- Late-start / early-stop correction suggestions
- No-driving-day confirmation (DEC-024)
- Evidence and confidence on every suggestion
- User-confirmed reconstructed trips only — **no silent creation**

### Tracking
- Native Tracking Engine v1 (iOS + Android)
- Conservative auto-detection (default)
- Manual trip entry unlimited (Free+)
- Auto capture: **40 trips/month Free**; unlimited Plus+
- Pause/resume; Protection Health / tracking-health status

### Review & classification
- Review queue; trip history under Review tab
- Business / personal / reject; trip split
- AI-assisted classification suggestions (Plus+; user confirms)
- Smart start/end corrections (Plus+; user confirms)

### Proof & export
- Proof Score (Plus+)
- PDF + CSV (Plus+)
- Basic CSV (Free)
- Employee reimbursement CSV (Pro, DEC-022)
- Export preview with pending/gap disclosure
- Proof Package (Pro)

### Platform
- Offline-first local database; background sync
- Auth (email, Apple, Google)
- RevenueCat: Free, Plus, Pro, Rescue IAPs, Founding Member Pro
- Profile: vehicles (Free: 1; Plus+: multiple), businesses (Pro), subscription, quiet hours, hide estimated value

---

## Out of Scope (Launch)

| Feature | Horizon |
|---|---|
| Bank transaction recovery | Post-launch |
| Universal receipt inbox / full email scanning | Post-launch |
| Delivery-platform integrations | Post-launch |
| CPA portal / employer admin | H2+ |
| Pro+ tier | Never at launch |
| Fleet / team management | H3 |
| Web app | H2+ |

---

## MVP User Stories

### Must Have

1. **As Marcus**, I want trips detected while I drive so I don't forget them.
2. **As Marcus**, I want calendar gaps surfaced so I can confirm missing client drives.
3. **As Jordan**, I want a standard reimbursement CSV my employer accepts.
4. **As Elena**, I want offline review at job sites.
5. **As Priya**, I want to reject phantom trips.
6. **As any user**, I want no-driving prompts so empty days aren't silently "complete."
7. **As any user**, I want estimated value shown honestly with option to hide money.
8. **As any user**, I want notifications to respect quiet hours unless tracking is at risk.

### Should Have

9. **As Plus user**, I want Proof Score before export.
10. **As Pro user**, I want multiple businesses and client tracking.
11. **As outage user**, I want Mileage Rescue for recent months without a full Pro subscription.

---

## MVP Success Criteria

| Criterion | Target |
|---|---|
| Phantom trip rate | <5% beta |
| Week 1 retention | ≥45% beta |
| CPA / employer export acceptance | ≥85% beta panel |
| Recovery suggestion accept rate | Tracked; no silent accepts |
| Offline 7-day test | Zero data loss |
| Onboarding completion | <3 min median |
| Critical Trust Rule violations | 0 |

---

## MVP Architecture Components

| Component | Launch version |
|---|---|
| Native Tracking Engine | v1 |
| Recovery Engine | v1 bounded (DEC-021) |
| Proof Score | v1 (Plus+) |
| AI assist | Classification + edge suggestions (Plus+); never auto-approves |
| Backend | Sync + auth + subscriptions |

---

## Related Documents

- [Recovery Engine.md](../architecture/Recovery%20Engine.md)
- [09 Pricing.md](../docs/09%20Pricing.md)
- [Launch Plan.md](./Launch%20Plan.md)
- [Sprint 3.md](./Sprint%203.md)
