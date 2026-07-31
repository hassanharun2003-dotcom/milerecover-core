# Mileage Apps Research

**Status:** Research  
**Last Updated:** July 2026  
**Owner:** Product / Research

---

## Research Objective

Understand the U.S. mileage tracking app landscape to inform MileRecover positioning: **every work mile accounted for** with **accuracy over features**.

---

## Market Segments

### 1. Automatic Mileage Trackers
**Examples:** MileIQ, Everlance, Hurdlr, TripLog  
**Core promise:** Passive trip detection  
**User expectation:** "Set and forget"

**Research finding:** Users love convenience but distrust accuracy. App Store reviews consistently cite personal trips logged as business and vice versa.

**MileRecover implication:** **Trust over automation** — default review mode is differentiated, not deficient.

---

### 2. Expense Suite Mileage Modules
**Examples:** Expensify, QuickBooks Self-Employed  
**Core promise:** Mileage as part of broader tax/expense picture

**Research finding:** Mileage is a checkbox feature. Power users maintain dedicated mileage apps alongside.

**MileRecover implication:** Depth on proof beats breadth on expenses (MVP).

---

### 3. Gig / Platform Tools
**Examples:** Stride, platform driver apps  
**Core promise:** Free or bundled tracking for gig workers

**Research finding:** Platform apps cover platform trips only. Off-platform business miles are underserved.

**MileRecover implication:** Recovery for gaps between platform data and total business travel.

---

### 4. Manual-First Loggers
**Examples:** Spreadsheets, TripLog manual mode, paper IRS logs  
**Core promise:** User control

**Research finding:** Highest user trust, lowest completeness.

**MileRecover implication:** Manual + odometer as first-class citizens, not fallback afterthought.

---

## Feature Frequency Analysis

| Feature | Market prevalence | User satisfaction |
|---|---|---|
| Auto detection | 95% | Medium |
| Swipe classify | 80% | Medium-High |
| IRS export | 70% | Medium |
| Offline mode | 40% | High where present |
| Odometer mode | 50% | High |
| Confidence scoring | 5% | N/A — whitespace |
| Gap recovery | 10% | Low satisfaction |
| AI classification | 30% | Mixed |

**Whitespace:** Proof/confidence, honest gaps, recovery without invention.

---

## Pricing Research Summary

| App | Free Tier | Paid |
|---|---|---|
| MileIQ | 40 trips/mo | ~$6–8/mo |
| Everlance | Limited | ~$8–12/mo |
| TripLog | Trial | ~$3–4/mo or one-time |
| Stride | Free | Upsell services |
| Hurdlr | Limited | ~$8–17/mo |

Market accepts **$6–10/month** for dedicated mileage. Value anchor is tax savings narrative — MileRecover anchors on **audit peace of mind**.

---

## Technology Patterns

| Pattern | Common approach | MileRecover approach |
|---|---|---|
| Location | Constant GPS | Adaptive native engine |
| Background | Always-on high accuracy | Significant-change + drive mode |
| Storage | Cloud-first | **Offline first** local SQLite |
| Classification | Auto business default | Conservative pending review |
| AI | Auto-categorize expenses | Assist-only, labeled |

---

## User Acquisition Channels (Competitor)

- App Store ASO ("mileage tracker," "IRS mileage")
- Tax season SEM (Jan–Apr spike)
- CPA partnerships / affiliate
- Gig worker communities
- Real estate forums

MileRecover channel hypothesis: CPA referral + "trust" word-of-mouth.

---

## Key Takeaways

1. Market is mature but trust-poor
2. No leader owns "defensible mileage" positioning
3. Battery and offline are unsolved satisfiers
4. AI is emerging but triggers distrust without transparency
5. Recovery at tax time is acute pain, poorly served

---

## Related Documents

- [Competitor Reviews.md](./Competitor%20Reviews.md)
- [User Pain Points.md](./User%20Pain%20Points.md)
- [../docs/07 Competitor Analysis.md](../docs/07%20Competitor%20Analysis.md)
