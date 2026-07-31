# MileRecover Product Brief

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product  
**Version:** 0.1

---

## Executive Summary

MileRecover is a mobile-first mileage recovery and tracking platform for self-employed professionals who need **audit-ready evidence**, not inflated auto-logs.

Unlike incumbent mileage apps that optimize for trip count and automation confidence theater, MileRecover optimizes for **defensibility**: every mile traceable, every gap visible, every AI suggestion confirmable.

**Tagline:** Every work mile accounted for.

---

## Problem

Self-employed drivers face a triple failure:

1. **Manual logging fails** — trips forgotten, odometer readings missed, spreadsheets abandoned
2. **Automatic tracking fails** — personal trips misclassified, phantom trips created, battery drain causes disablement
3. **Recovery fails** — users arrive at tax season with partial records and apps that either invent history or offer no help

The cost is not just lost deductions. It's **audit anxiety** and **trust erosion** in every tool they've tried.

---

## Solution

MileRecover combines:

| Layer | Purpose |
|---|---|
| **Native Tracking Engine** | Battery-efficient, platform-native location capture |
| **Recovery Engine** | Reconstructs defensible mileage from calendars, receipts, partial logs |
| **Proof Score** | Quantifies how well each trip would hold up under scrutiny |
| **AI Layer** | Classifies and summarizes; never creates trips without evidence |
| **Export & Reporting** | IRS-aligned formats with full audit trail |

---

## Target Market

**Primary:** U.S. self-employed professionals driving 5,000–30,000 business miles/year  
**Initial wedge:** Real estate agents, contractors, and field service workers  
**Expansion:** Gig workers, delivery independents, small fleet operators

**TAM context:** ~15M self-employed workers in the U.S.; mileage deduction claimed by millions annually. See [07 Competitor Analysis.md](./07%20Competitor%20Analysis.md).

---

## Differentiation

| Competitors | MileRecover |
|---|---|
| Maximize trips logged | Maximize trips **defensible** |
| "Set and forget" automation | **Trust over automation** — review workflows |
| Cloud-dependent | **Offline first** |
| Aggressive background GPS | **Battery friendly** native engine |
| AI auto-classification | **AI assists but never replaces evidence** |
| Silent gap-filling | **Never invent mileage** — explicit gaps |

---

## Core User Journey

```
Install → Grant permissions (with clear rationale)
       → Baseline tracking begins (conservative mode)
       → Review detected trips (confirm / reject / edit)
       → Recovery prompts for gaps (calendar, manual, odometer)
       → Proof Score surfaces weak entries
       → Export audit-ready report
       → Repeat monthly / quarterly habit
```

---

## MVP Scope

See [../planning/MVP.md](../planning/MVP.md). MVP delivers:

- Trip detection with confidence scoring
- Manual trip entry and editing
- Business/personal classification with user confirmation
- Proof Score per trip and per period
- Offline capture with sync
- Basic IRS mileage log export

**Explicitly out of MVP:** AI recovery from photos, CPA portal, team/fleet features, multi-vehicle support.

---

## Business Model (Summary)

Freemium with proof-tier gating. See [09 Pricing.md](./09%20Pricing.md).

---

## Key Risks

| Risk | Mitigation |
|---|---|
| Users expect "magic" auto-tracking | Onboarding sets expectations; Trust Rules enforced in UX |
| Battery/permission backlash | Battery friendly engine; transparent permission UX |
| AI hallucination in classification | AI assists only; no trip creation from AI alone |
| Commodity comparison to MileIQ et al. | Lead with Proof Score and recovery, not trip count |

---

## Philosophy Checklist

Every feature proposal must pass:

- [ ] Does it help account for real work miles?
- [ ] Could it invent mileage? (If yes → reject)
- [ ] Does it prioritize trust over automation?
- [ ] Is accuracy preserved over feature breadth?
- [ ] Is it battery friendly?
- [ ] Does it work offline?
- [ ] Does AI remain assistive, not authoritative?

---

## Related Documents

- [08 Feature Roadmap.md](./08%20Feature%20Roadmap.md)
- [10 Success Metrics.md](./10%20Success%20Metrics.md)
- [../architecture/System Architecture.md](../architecture/System%20Architecture.md)
- [../design/Design Bible.md](../design/Design%20Bible.md)
