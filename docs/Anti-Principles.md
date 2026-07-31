# MileRecover Anti-Principles

**Status:** Foundational — Binding  
**Last Updated:** July 2026  
**Owner:** Founding Team

---

## Purpose

Anti-principles define what MileRecover **refuses to become** — even when tempting for growth, revenue, or competitive pressure.

If a proposal violates this document, it is rejected unless the [Company Constitution.md](./Company%20Constitution.md) is formally amended (founding team unanimous).

These are the shadow of our [03 Core Principles.md](./03%20Core%20Principles.md): principles say what we do; anti-principles say what we **never** do.

---

## Anti-Principle 1 — We Will Not Be an Ad Product

**We will never:**
- Show display ads in the app
- Sell attention to third parties
- Offer "free" tiers funded by ad targeting of location patterns
- Partner with data brokers for monetization

**Why:** Ads incentivize engagement over accuracy. Location + ads is a trust catastrophe.

**Instead:** Subscription value on defensibility ([09 Pricing.md](./09%20Pricing.md), DEC-006 in [Decision Log.md](./Decision%20Log.md)).

---

## Anti-Principle 2 — We Will Not Sell Location Data

**We will never:**
- Sell, license, or share raw or derived location trails
- Provide "anonymized" driving feeds to third parties
- Use location for ad profiling — even "aggregated"

**Why:** Our users drive for a living. Their routes are business-sensitive.

**Instead:** [Security.md](../architecture/Security.md), Trust Rules E4, [Company Constitution.md](./Company%20Constitution.md) Article IV.

---

## Anti-Principle 3 — We Will Not Use Dark Patterns

**We will never:**
- Shame users for low mileage totals
- Make cancellation harder than signup
- Pre-check "business" on all trips to inflate totals
- Use fake urgency ("Claim before midnight!")
- Hide reject or delete flows
- Require excessive permissions without degradation preview

**Why:** **Trust over automation** requires respecting user agency.

**Instead:** [Interaction Rules.md](../design/Interaction%20Rules.md), [06 User Psychology.md](./06%20User%20Psychology.md).

---

## Anti-Principle 4 — We Will Not Silently Create Mileage

**We will never:**
- Auto-log trips below confidence threshold into business totals
- Backfill gaps with estimated distances
- Round distances up in exports
- Re-insert user-rejected trips without explicit restore
- Create trips from calendar, bank, or AI alone

**Why:** **Never invent mileage** is non-negotiable.

**Instead:** [04 Trust Rules.md](./04%20Trust%20Rules.md) Category A, [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md).

---

## Anti-Principle 5 — We Will Not Chase Feature Bloat

**We will never:**
- Ship competitor features without accuracy benchmarks
- Add expense tracking, invoicing, or payroll to chase "suite" status in MVP
- Launch integrations before core tracking is reliable
- Market capabilities not yet built

**Why:** **Accuracy over features.** Breadth without proof erodes the brand.

**Instead:** [08 Feature Roadmap.md](./08%20Feature%20Roadmap.md) explicit exclusions, [MVP.md](../planning/MVP.md).

---

## Anti-Principle 6 — We Will Not Fake AI Certainty

**We will never:**
- Present AI suggestions as confirmed facts
- Auto-fill export fields from LLM output without user edit
- Claim "AI verified" mileage
- Hide model involvement in classification
- Let AI drive tracking or trip state transitions

**Why:** **AI assists but never replaces evidence.**

**Instead:** [AI Architecture.md](../architecture/AI%20Architecture.md), AISuggestionChip pattern in [Component Library.md](../design/Component%20Library.md).

---

## Anti-Principle 7 — We Will Not Be a Complex Accounting Suite (MVP)

**We will never (in MVP):**
- Replace QuickBooks or full expense platforms
- Provide tax filing, quarterly estimates, or bookkeeping
- Bundle banking, receipt OCR for all expenses, or payroll
- Position as "complete tax OS" before mileage proof is best-in-class

**Why:** Focus wins trust. Mileage depth before suite breadth.

**Instead:** Integrations tier 2+ ([Integrations.md](../architecture/Integrations.md)); export to CPAs first.

---

## Anti-Principle 8 — We Will Not Hide Tracking Failures

**We will never:**
- Show "100% tracked" when engine was off or permission denied
- Suppress gap days to improve dashboard aesthetics
- Blame users silently when battery optimization kills tracking
- Fail closed to fake data — we fail open to **honest gaps**

**Why:** **Every work mile accounted for** includes showing what's **not** accounted.

**Instead:** GapIndicator, TrackingStatusBar, [10 Success Metrics.md](./10%20Success%20Metrics.md) tracking uptime.

---

## Anti-Principle 9 — We Will Not Maximize Deductions as Brand

**We will never:**
- Tagline around "save $X,XXX"
- Optimize UX to increase claimed miles regardless of legitimacy
- Compare users to "average deductions"
- Gamify mileage totals (leaderboards, streaks, celebrations for miles logged)

**Why:** Incentivizes invention and audit risk. Users are professionals, not players.

**Instead:** [Manifesto.md](./Manifesto.md), Proof Score on **defensibility** not **volume**.

---

## Anti-Principle 10 — We Will Not Sacrifice Battery for Precision

**We will never:**
- Run continuous high-accuracy GPS when not in confirmed drive
- Ignore Low Power Mode without user-visible behavior change
- Hide battery impact of tracking

**Why:** Disabled tracking helps no one (**battery friendly**).

**Instead:** [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md), adaptive sampling.

---

## Review Checklist

Before shipping any feature, ask:

| Question | If yes → STOP |
|---|---|
| Does this create mileage without evidence? | Anti-Principle 4 |
| Does this sell or expose location? | Anti-Principles 1, 2 |
| Does this pressure users to claim more? | Anti-Principles 3, 9 |
| Does this add breadth without accuracy proof? | Anti-Principle 5 |
| Does AI decide without user? | Anti-Principle 6 |
| Does this hide when tracking failed? | Anti-Principle 8 |

---

## Related Documents

- [Company Constitution.md](./Company%20Constitution.md)
- [03 Core Principles.md](./03%20Core%20Principles.md)
- [04 Trust Rules.md](./04%20Trust%20Rules.md)
- [Manifesto.md](./Manifesto.md)
