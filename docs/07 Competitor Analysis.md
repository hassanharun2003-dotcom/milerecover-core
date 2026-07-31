# MileRecover Competitor Analysis

**Status:** Living Document  
**Last Updated:** July 2026  
**Owner:** Product / Strategy

---

## Market Context

The U.S. mileage tracking market is mature, crowded, and commoditized on "automatic trip detection." Incumbents compete on trip volume, pricing, and integrations—not defensibility.

MileRecover enters on a different axis: **audit-ready evidence** and **honest accounting**.

Philosophy anchor: **Every work mile accounted for. Never invent mileage.**

---

## Competitive Landscape Summary

| Segment | Examples | Strengths | Weaknesses |
|---|---|---|---|
| Auto-tracking leaders | MileIQ, Everlance, Hurdlr | UX polish, brand awareness, integrations | Over-automation, phantom trips, cloud-dependent |
| Expense suites | Expensify, QuickBooks | Ecosystem, accountant adoption | Mileage is secondary feature |
| Niche / vertical | TripLog, Stride | Price, simplicity | Dated UX, weak proof narrative |
| Platform-native | Uber driver stats | Accurate for platform trips | Incomplete for true business mileage |
| Manual / spreadsheet | Google Sheets, paper logs | User trust, full control | Incomplete, no recovery |

---

## Deep Dive: Primary Competitors

### MileIQ (Microsoft)

**Positioning:** Automatic mileage tracking, market leader  
**Pricing:** ~$6–8/month  
**Strengths:** Brand, Microsoft ecosystem, polished auto-detection  
**Weaknesses:**
- Aggressive auto-classification; users report personal trip mislogs
- Limited transparency on detection confidence
- Recovery/historical reconstruction weak
- Philosophy misaligned: optimizes trips logged

**MileRecover differentiation:**
- Proof Score vs binary logged/not logged
- **Trust over automation** default
- Recovery Engine for gap periods

---

### Everlance

**Positioning:** Mileage + expense tracking for freelancers  
**Pricing:** Freemium, ~$8–12/month premium  
**Strengths:** Broader expense features, bank connections  
**Weaknesses:**
- Feature breadth over mileage depth
- Auto-tracking accuracy mixed in reviews
- AI/expense categorization can feel opaque

**MileRecover differentiation:**
- **Accuracy over features** — mileage depth first
- Clear AI boundaries per Trust Rules

---

### Hurdlr

**Positioning:** Tax tracking for self-employed  
**Pricing:** ~$8–17/month tiers  
**Strengths:** Tax estimates, quarterly payments, accountant features  
**Weaknesses:**
- Mileage not core competency
- Users often pair with dedicated mileage app

**MileRecover differentiation:**
- Best-in-class mileage evidence, integrate later with tax suites

---

### TripLog

**Positioning:** Long-running mileage logger  
**Pricing:** One-time / low subscription  
**Strengths:** Established, odometer workflows, offline capable  
**Weaknesses:**
- Dated UX, weak mobile-first experience
- No modern proof/confidence narrative

**MileRecover differentiation:**
- Modern UX with TripLog's odometer respect
- **Offline first** as first-class architecture

---

### Stride Tax

**Positioning:** Free tax + mileage for gig workers  
**Pricing:** Free (monetization via other products)  
**Strengths:** Free, gig worker brand  
**Weaknesses:**
- Basic tracking, upsell-driven
- Limited defensibility features

**MileRecover differentiation:**
- Premium proof tier, not ad/upsell mileage

---

## Feature Comparison Matrix (Target State)

| Capability | MileIQ | Everlance | TripLog | MileRecover |
|---|---|---|---|---|
| Auto trip detection | ✓ | ✓ | ✓ | ✓ (conservative) |
| Confidence / proof scoring | ✗ | Partial | ✗ | ✓ |
| Recovery from gaps | ✗ | Partial | Manual | ✓ |
| Offline-first | Partial | Partial | ✓ | ✓ |
| AI classification | ✓ | ✓ | ✗ | ✓ (assist-only) |
| Audit-ready export | Partial | Partial | ✓ | ✓ |
| Battery optimization | Partial | Partial | Partial | ✓ (native engine) |
| Never invent policy | ✗ | ✗ | ✓ | ✓ (explicit) |

---

## Competitive Moats (MileRecover)

1. **Proof Score** — proprietary confidence framework tied to IRS evidence standards
2. **Recovery Engine** — defensible reconstruction, not backfill fiction
3. **Trust brand** — "the app that doesn't inflate your log"
4. **Native Tracking Engine** — battery + accuracy co-optimization
5. **Philosophy consistency** — marketing, product, and behavior aligned

---

## Threats

| Threat | Likelihood | Mitigation |
|---|---|---|
| Incumbent adds "proof score" marketing | High | Substance over label; calibrate score |
| Apple/Google native mileage | Low-Medium | Depth, recovery, CPA exports |
| Price race to bottom | Medium | Value on defensibility, not volume |
| User expectation of "magic" | High | Onboarding, conservative defaults |

---

## Strategic Positioning Statement

**For** self-employed professionals who need defensible mileage records,  
**MileRecover** is the mileage recovery platform  
**That** accounts for every legitimate work mile with evidence-based proof,  
**Unlike** automatic trackers that optimize trip count,  
**We** never invent mileage and prioritize trust over automation.

---

## Related Documents

- [../research/Mileage Apps Research.md](../research/Mileage%20Apps%20Research.md)
- [../research/Competitor Reviews.md](../research/Competitor%20Reviews.md)
- [08 Feature Roadmap.md](./08%20Feature%20Roadmap.md)
- [09 Pricing.md](./09%20Pricing.md)
