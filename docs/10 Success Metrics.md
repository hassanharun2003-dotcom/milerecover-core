# MileRecover Success Metrics

**Status:** Foundational — aligned with DEC-025–DEC-029  
**Last Updated:** July 2026  
**Owner:** Product / Data

**Commercial governance:** [Growth and Sustainability Principles.md](./Growth%20and%20Sustainability%20Principles.md)

---

## Measurement Philosophy

We measure **trust delivered**, not trips manufactured.

Vanity metrics that conflict with **never invent mileage** are excluded by policy.

**Downloads and gross revenue** are context metrics — not sole success measures.

---

## North Star Metric

### Defensible Miles Confirmed (DMC)

**Definition:** Sum of business miles where user confirmed trip AND Proof Score ≥ threshold (default: 70) AND trip source is not AI-only.

**Why:** Captures value users actually trust—not raw detection volume.

**Target (Month 6):** 1M cumulative DMC — *approved stretch target; calibrate from beta baseline*

**Status:** North star — primary product success measure

---

## Metric Status Legend

| Label | Meaning |
|---|---|
| **Target** | Approved goal for launch/beta phase |
| **Baseline** | Measure first; set target after beta |
| **Calibration needed** | Define instrumentation before target |

---

## Product Trust Metrics

| Metric | Definition | Target / Status |
|---|---|---|
| **Supported-trip capture reliability** | % expected driving time with engine active when permissions allow | Target ≥92% tracking uptime |
| **Tracking-failure detection time** | Median time from degradation to user-visible Protection Health | Baseline in beta |
| **Phantom trip rate** | Auto trips rejected / total auto trips | Target <3% launch; <5% beta |
| **Duplicate rate** | Duplicate candidates / total trips | Calibration needed |
| **Correction rate** | User edits or edge-repair accepts / confirmed trips | Baseline |
| **Data-loss incidents** | User-reported or verified sync loss events | Target **0** critical |
| **Battery impact** | Avg daily % consumed | Target <4% iOS, <5% Android |
| **Proof Score accuracy** | Score predicts confirm/reject | Target ≥85% calibration |
| **Gap honesty rate** | Periods with explicit gap markers / detected gaps | Target 100% |

---

## User Value Metrics

| Metric | Definition | Target / Status |
|---|---|---|
| **Defensible Miles Confirmed** | North star (above) | See north star |
| **Credible recovery candidates** | Suggestions with minimum evidence shown / gaps scanned | Baseline |
| **User-confirmed recovered miles** | Miles from accepted recovery suggestions | Baseline |
| **Time to first value** | Install → first user-confirmed trip | Baseline |
| **Weekly review effort** | Median minutes in Review per weekly active | Baseline; watch fatigue |
| **Review completion rate** | Pending reviewed within 7 days | Target ≥70% |
| **Export success rate** | Exports completed without support | Target ≥95% |
| **CPA / employer acceptance** | Panel accepts export without rework | Target ≥85% beta CPA; ≥90% launch goal |

---

## Retention Metrics

| Metric | Definition | Target / Status |
|---|---|---|
| **Active protected users** | WAU/MAU with Protection Health ≠ off | Baseline |
| **Week 1 retention** | Return day 7 | Target ≥45% beta; ≥50% launch goal |
| **Subscription retention** | Paid cohort month-over-month | Baseline by tier |
| **Annual renewal** | Annual subs renewed at term | Baseline |
| **Protection Health recovery** | Users fixing degraded state within 14d | Baseline |

---

## Commercial Metrics

| Metric | Definition | Target / Status |
|---|---|---|
| **Free → Plus** | Free installs converting to Plus within 90d | Baseline; segment by persona |
| **Free → Pro** | Free installs converting to Pro within 90d | Baseline |
| **Plus → Pro** | Plus subs upgrading to Pro | Baseline |
| **Rescue → subscription** | Rescue IAP buyers who subscribe within 30d | Baseline |
| **Any Free → Paid** | Plus OR Pro within 90d | Calibration: prior draft 8–12% — **validate in beta, not locked** |
| **Annual plan mix** | Paid subs on annual | Target ≥65% *if beta supports* |
| **Refund rate** | Refunds / gross transactions | Baseline; investigate spikes |
| **Contribution margin** | Revenue − variable costs per user | Calibration needed — see Growth Principles §11 |
| **Channel CAC** | Spend / attributed install by channel | Measure before scaling paid |
| **CAC payback** | Months to recover CAC | Do not scale channel until baseline <6mo *hypothesis* |
| **MAU** | Monthly active users | Context metric — Year 1 goal 25k *planning assumption* |
| **MRR / recognized revenue** | Finance definitions per Growth Principles §11 | Finance-owned |

---

## Trust & Commercial Safeguard Metrics

| Metric | Definition | Target / Status |
|---|---|---|
| **Support: missed-trip tickets** | Tickets citing lost/untracked miles | Declining vs baseline |
| **Review-prompt complaint rate** | Support/feedback citing review annoyance / prompts | Target <0.5% of prompt attempts |
| **Cancellation reasons** | Self-reported exit survey (optional) | Baseline |
| **Privacy complaints** | Formal privacy-related contacts | Target near zero |
| **Incorrect-recovery reports** | User reports recovery suggestion wrong | Baseline; feed Recovery Engine |

---

## App Store Review Instrumentation (DEC-026)

| Event | Purpose | Privacy |
|---|---|---|
| `review_prompt_eligible` | Positive value event + guards passed | No PII |
| `review_prompt_attempted` | Native API invoked | No rating stored |
| `review_prompt_os_denied` | OS did not show dialog | Count only |
| `review_prompt_cooldown_set` | User dismissed or post-attempt | Days only |

**Anti-metric:** Custom star dialogs, incentivized reviews, review-referral coupling.

---

## Sustainable Unit-Economics Categories (track, do not fabricate targets)

- Acquisition cost by channel  
- Retention by plan and persona  
- Support cost per active user  
- Variable: geocoding, storage, AI inference, notifications, export compute  
- Store fees, refunds, chargebacks  
- Gross billings vs recognized revenue vs contribution margin  

See [Growth and Sustainability Principles.md](./Growth%20and%20Sustainability%20Principles.md) §11.

---

## Anti-Metrics (Do Not Optimize)

| Anti-Metric | Why |
|---|---|
| Total miles logged | Incentivizes invention |
| Auto-log rate | Conflicts with **trust over automation** |
| Trips per user | Volume ≠ value |
| AI acceptance without review | Violates Trust Rules |
| Deduction $ estimated in growth campaigns | Legal/reputational risk |
| Review prompt volume | Conflicts with DEC-026 |
| Download count alone | Vanity without retention |

---

## Funnel Metrics

```
Install → Permission grant → First trip detected →
First trip confirmed → Week 1 retention →
First export → Paid conversion (Plus/Pro/Rescue) → Month 3 retention
```

| Stage | Target / Status |
|---|---|
| Install → Permission | Target 75% — calibrate beta |
| Permission → First trip | Target 85% |
| First trip → Confirm | Target 70% |
| Week 1 retention | Target 55% launch goal |
| Export (30 day) | Baseline 25% of actives *historical draft* |
| Free → Paid (90 day) | **Calibration needed** — do not treat 10% as locked |

---

## Cohort Health

Track by: persona · platform · automation tier · acquisition channel · plan (Free/Plus/Pro)

**Hypothesis:** Conservative mode retains better despite lower auto-log rate — validate in beta.

---

## Qualitative Signals

- App Store reviews mentioning "trust," "accurate," "complete records" — not "saved me $X"
- Support tickets citing phantom trips (declining)
- Beta CPA panel quarterly survey
- Review-prompt complaints (DEC-026)

---

## Reporting Cadence

| Report | Frequency | Audience |
|---|---|---|
| Product health dashboard | Daily | Engineering, Product |
| Trust metrics review | Weekly | Full team |
| Business review | Monthly | Leadership |
| Principle + growth audit | Quarterly | Founding team |

---

## MVP Launch Success Criteria

- [ ] Phantom trip rate <5% in beta  
- [ ] Offline capture tested on 3+ device matrix  
- [ ] CPA panel accepts ≥85% of sample exports  
- [ ] No Critical Trust Rule violations  
- [ ] Week 1 retention ≥45% (beta baseline)  
- [ ] Review prompt prohibited moments verified (DEC-026)  

See [../planning/Beta Testing.md](../planning/Beta%20Testing.md).

---

## Related Documents

- [Growth and Sustainability Principles.md](./Growth%20and%20Sustainability%20Principles.md)
- [Product Requirements Document.md](./Product%20Requirements%20Document.md) §22
- [09 Pricing.md](./09%20Pricing.md)
- [04 Trust Rules.md](./04%20Trust%20Rules.md)
