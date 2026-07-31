# MileRecover Product DNA

**Status:** Foundational — Product Source of Truth  
**Last Updated:** July 2026  
**Owner:** Founding Team / Product  
**Supersedes:** Informal navigation and tier assumptions in prior drafts where noted

---

## How to Use This Document

Product DNA defines **what MileRecover must always feel like**, how we decide, what quality means, what we refuse to become, and how every experience protects the user.

| Layer | Document |
|---|---|
| Law & rights | [Company Constitution.md](./Company%20Constitution.md), [04 Trust Rules.md](./04%20Trust%20Rules.md) |
| Principles | [03 Core Principles.md](./03%20Core%20Principles.md), [Anti-Principles.md](./Anti-Principles.md) |
| **Product identity & decisions** | **This document** |
| Experience & emotion | [Experience Bible.md](../design/Experience%20Bible.md) |
| Visual & interaction | [Design Bible.md](../design/Design%20Bible.md), [Interaction Rules.md](../design/Interaction%20Rules.md) |

**Locked founder decisions:** [§17 Founder Decisions Applied](#17-founder-decisions-applied) — binding on product, design, engineering, support, and marketing.

---

## 1. Product Identity

### What MileRecover is

MileRecover is the **most trusted protection system** for people who drive for work. It captures driving evidence, surfaces gaps honestly, helps users recover missing records with confirmation, and produces **defensible proof** — not inflated mileage logs.

Category: **Work-mile protection and proof** — not generic GPS logging.

### What MileRecover is not

- A mileage maximizer or tax-refund promise
- A surveillance or location-data product
- A general accounting suite or tax-filing service (at launch)
- An AI that fabricates trips or distances
- A fleet-management platform

See [Anti-Principles.md](./Anti-Principles.md).

### The category we are trying to own

**Protected work-mile records** — completeness with evidence, calm review, exportable proof.

### The customer outcome

**Eliminate the fear of missing legitimate work miles.**

Users are not paying for GPS. They pay for **confidence, completeness, calm, and defensible records**.

### The emotional promise

> **You are protected — and you can prove it.**

### The functional promise

> **Every work mile accounted for — never invent mileage.**

Drive → evidence captured → gaps detected → user confirms → proof improves → complete records exportable.

---

## 2. The Core Product Loop

Locked loop (DEC-016). Each stage: user action · system action · evidence · control · emotion · failure risk · recovery · metric.

### Drive

| Dimension | Specification |
|---|---|
| User action | Drives for work with tracking enabled (or will add manually later) |
| System action | Native engine captures raw movement per [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md); battery-friendly sampling |
| Evidence | Raw tracking events; timestamps; optional motion activity |
| User control | Pause tracking; permission level; automation tier |
| Emotional outcome | Protected (passive) |
| Failure risk | Engine off; OEM kill; permission loss |
| Recovery | Tracking-health status on Home; manual trip path |
| Success metric | Tracking uptime ≥92% ([10 Success Metrics.md](./10%20Success%20Metrics.md)) |

### Protected

| Dimension | Specification |
|---|---|
| User action | None required during drive |
| System action | Session recorded; draft/pending drive created when thresholds met |
| Evidence | Linked location batch; detection confidence |
| User control | User has not yet confirmed — pending state only |
| Emotional outcome | Calm assurance that capture is working |
| Failure risk | False positive trip |
| Recovery | Reject in Review; never silent confirm |
| Success metric | Phantom trip rate <3% |

### Possible gap detected

| Dimension | Specification |
|---|---|
| User action | May notice Home status or no-driving prompt |
| System action | Gap analysis: unaccounted day, missing segment, or no-driving confirmation needed |
| Evidence | Absence of trips + tracking health log — **not** invented miles |
| User control | Confirm "no driving" or add/recover with evidence |
| Emotional outcome | Informed (not alarmed) |
| Failure risk | Silent completeness; user thinks they're covered |
| Recovery | No-driving confirmation flow (DEC-010); recovery scan when available |
| Success metric | Gap honesty rate 100% |

### User reviews evidence

| Dimension | Specification |
|---|---|
| User action | Review tab: confirm business, personal, reject, edit, split |
| System action | Apply classification; update Proof Score factors |
| Evidence | Map, source badge, confidence, Proof Score breakdown |
| User control | Full override; reject requires detail view |
| Emotional outcome | In control, confident |
| Failure risk | Review fatigue; wrong confirm |
| Recovery | Undo 4s; edit; audit trail |
| Success metric | Review completion ≥70% within 7 days |

### Missing drive recovered or dismissed

| Dimension | Specification |
|---|---|
| User action | Accept recovery suggestion, add manual trip, or dismiss |
| System action | Create trip only on explicit accept; or mark day accounted |
| Evidence | User attestation, import row, odometer, or sensor record — never calendar alone |
| User control | Per-item accept/dismiss (DEC-004) |
| Emotional outcome | Relief without guilt about "fake" miles |
| Failure risk | Invented recovery |
| Recovery | Lower Proof Score on recovered; source labeled |
| Success metric | CPA export acceptance ≥85% beta |

### Proof improves

| Dimension | Specification |
|---|---|
| User action | Add purpose, confirm odometer, resolve flags |
| System action | Recalculate Proof Score; period completeness update |
| Evidence | Updated trip metadata |
| User control | All edits user-initiated |
| Emotional outcome | Confidence increases |
| Failure risk | Score without explanation |
| Recovery | Tap breakdown; educational hints only |
| Success metric | Proof Score calibration ≥85% predict confirm/reject |

### Confidence increases

| Dimension | Specification |
|---|---|
| User action | Checks Home protection status or Proof tab |
| System action | Show protected miles, estimated value (allowed language), tracking health |
| Evidence | Confirmed vs pending vs gap totals |
| User control | Transparency toggles (personal routes privacy) |
| Emotional outcome | Calm |
| Failure risk | Inflated "value" marketing |
| Recovery | Estimated value disclaimers (DEC-009) |
| Success metric | NPS ≥40 year 1 |

### Weekly checkup

| Dimension | Specification |
|---|---|
| User action | Respond to weekly digest or open Review |
| System action | Summarize pending count, gaps, tracking health |
| Evidence | Period rollup |
| User control | Notification preferences; quiet hours |
| Emotional outcome | Low-effort habit |
| Failure risk | Notification spam |
| Recovery | Pattern-aware escalation only (DEC-011) |
| Success metric | Week 1 retention ≥45% beta |

### Repeat

Loop continues. Tax season intensifies export from **Proof** tab, not a separate product surface.

---

## 3. Product Decision Hierarchy

When product, design, and business priorities conflict, resolve in this order:

| Rank | Principle | Application |
|---|---|---|
| 1 | **Customer safety and truth** | Never invent mileage; no false completeness; no guaranteed tax outcomes |
| 2 | **Evidence integrity** | Trips require sensor or user evidence; exports match confirmed records |
| 3 | **User control** | Confirm before business totals; delete/export rights; no silent automation |
| 4 | **Accuracy** | Ship proof before parity; phantom rate monitored |
| 5 | **Privacy** | No data sale; minimum location collection; personal route controls |
| 6 | **Simplicity** | Four tabs; one primary action; no clutter |
| 7 | **Reliability and battery** | Offline first; tracking that stays enabled |
| 8 | **Accessibility** | WCAG AA; VoiceOver; Reduce Motion |
| 9 | **Financial value** | Fair tiers; honesty not paywalled |
| 10 | **Growth** | Only after 1–9 satisfied |
| 11 | **Visual novelty** | Never at expense of clarity |

**Relation to Constitution:** Ranks 1–3 subsume [03 Core Principles.md](./03%20Core%20Principles.md) hierarchy for **product tradeoffs**. Constitutional principles still bind engineering trust rules.

**Example:** A growth feature that auto-logs low-confidence trips fails at rank 1–3. A prettier chart that hides gaps fails at rank 1 and 6.

---

## 4. Quality Standard

**Best in category** = most trusted protection, not most trips logged. We do **not** claim perfect tracking.

| Domain | Standard | Measurable / testable |
|---|---|---|
| **Tracking** | Conservative detection; false positives worse than misses | Phantom rate <3%; missed drive <8% acceptable ([Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)) |
| **Missing-trip recovery** | Suggestions with evidence; user confirms each | Zero silent gap fill; recovery accept rate tracked |
| **Classification** | Pending until user or opt-in auto-rule above threshold | Business export requires attestation (Trust Rule A5) |
| **Reports** | CPA-acceptable PDF/CSV with source + Proof Score + gaps | ≥85% CPA panel acceptance beta |
| **Offline behavior** | Capture, review, export without network | 7-day offline zero loss test |
| **Battery use** | Adaptive native engine | <4% iOS / <5% Android daily target |
| **Privacy** | No sale; encrypt; delete/export | DEC-006; Privacy Policy compliance |
| **Accessibility** | WCAG 2.1 AA; dynamic type; color-independent states | Per-release a11y checklist |
| **Customer support** | Believe user; no blame for OS limits; no invented records | P2 response 24h; trust incidents escalated |
| **Subscription experience** | Transparent; cancel via platform; restore purchases | No dark patterns audit quarterly |
| **Onboarding** | Full personalized launch flow (DEC-008) | Completion <3 min median |
| **Error recovery** | Needs repair surfaced; manual path always | No silent data loss |

---

## 5. Simplicity Standard

1. **One primary action per screen** — documented in screen specs ([Experience Bible.md](../design/Experience%20Bible.md)).
2. **Four primary tabs only** — Home · Review · Proof · Profile (DEC-007). No fifth tab for Trips, Export, or Settings.
3. **Progressive disclosure** — Proof Score breakdown, export metadata, advanced automation behind taps.
4. **Exception-based review** — Default Conservative; batch high-confidence only with summary modal.
5. **No unnecessary dashboard metrics** — Home shows protection status + estimated value + next action, not vanity charts.
6. **No feature without verified user problem** — [Feature Admission Test §10](#10-feature-admission-test); cite [User Pain Points.md](../research/User%20Pain%20Points.md).
7. **No configuration before value** — Philosophy + driver type before account; permissions after education.
8. **No repeated questions** — Onboarding answers inform Profile; don't re-ask driver type weekly.
9. **No jargon without explanation** — "Proof Score" paired with "defensibility" on first use.
10. **No notification without useful next action** — [Notification DNA §11](#11-notification-dna).

---

## 6. Trust Standard

For each sensitive action: **see · control · audit · never silent**.

| Action | User must see | User must control | Audit history | Cannot happen silently |
|---|---|---|---|---|
| **Tracking start** | Status: active/limited; battery mode | Pause; automation level | Engine session start | Covert high-GPS |
| **Tracking stop** | Reason: user, battery, permission, OEM | Resume; acknowledge gap | Stop reason + timestamp | Fake "100% protected" |
| **Permission loss** | Degradation banner; what still works | Re-open settings; manual mode | Permission state change | Continue auto-log fiction |
| **AI suggestion** (H1+) | "AI suggested" label | Accept/edit/dismiss/opt-out | Model version + user action | Auto-fill export fields |
| **Missing-trip reconstruction** (H1+) | Source + required user distance | Per-item accept/dismiss | Recovery suggestion record | Bulk promote to confirmed |
| **Trip edit** | Before/after distance source | Save or revert | `trip.edited` event | Distance rounded up |
| **Trip deletion** | Confirm modal | Soft delete 30d | `trip.deleted` | Hard delete without confirm |
| **Import** (H1+) | Each row as suggestion | Row-by-row accept | Import metadata | Auto-import all |
| **Export** | Preview: confirmed, excluded pending, gaps | Format/range; include pending toggle | Report snapshot id | Pending in default export |
| **Personal-route privacy** | Personal trips excluded from business totals | Hide from shared exports | Classification events | Share personal without opt-in |
| **Subscription** | Tier comparison; renewal terms | Decline; platform cancel | Purchase events via store | Paywall on gap visibility |
| **Data deletion** | Scope; retention window | Cancel within window | Deletion request | Delayed without notice |

Full rules: [04 Trust Rules.md](./04%20Trust%20Rules.md).

---

## 7. Personalization Standard

### May adapt by driver type (DEC-008, DEC-012)

| Element | Adaptation |
|---|---|
| **Language** | Home headlines ("Showing miles," "Reimbursable miles," "Job travel") |
| **Home metrics** | Estimated value label: deduction vs reimbursement |
| **Suggested purposes** (H1+) | Templates by industry — user confirms |
| **Work schedules** | Review digest timing; quiet hours default |
| **Connected evidence sources** (H1+) | Calendar, import prioritized by onboarding |
| **Review patterns** | Batch thresholds; gig vs sporadic copy |
| **Report defaults** | CSV columns for employee reimbursement vs Schedule C |

Launch personas: self-employed, independent drivers, **employees receiving reimbursement** (DEC-012), plus types in [Experience Bible §6](../design/Experience%20Bible.md).

### Must never change

- [04 Trust Rules.md](./04%20Trust%20Rules.md) and seven core principles
- Evidence requirements and **never invent mileage**
- **Four-tab navigation** (DEC-007)
- Core visual identity ([Design System.md](../design/Design%20System.md))
- User control and deletion/export rights
- Privacy commitments (DEC-006)
- Single app — no white-label per segment

---

## 8. Emotional Design Standard

| Moment | Desired | Wrong | Required communication | Next action | Anti-patterns |
|---|---|---|---|---|---|
| **First launch** | Curious, safe | Sold to | Protection + proof promise | Continue onboarding | Savings claims |
| **First permission** | Informed consent | Surveillance | Why background; review each drive; no data sale | Continue to OS prompt | Permission before education |
| **First tracked drive** | Curious | "Logged!" | Trip is **pending** | Open Review after drive | Per-trip push default |
| **First missed-drive detection** | Alerted not scared | "We found $X" | Gap or no-driving question | Confirm or add trip | Auto-fill miles |
| **First recovery** (H1+) | Cautious hope | Magic fix | Source + lower Proof Score | Accept or dismiss | Bulk accept |
| **Weekly review** | Routine | Dread | N pending; batch option if ≥85 | Review tab | Accept all silent |
| **Tracking failure** | Informed | Abandoned | What/how/fix/recovery scan | Fix permission or manual | Hide failure |
| **Offline use** | Relieved | Anxious | Saved locally | Continue work | Blocking spinner |
| **Report export** | Prepared | Blind send | Preview + disclaimer | Generate from Proof | Pending hidden |
| **Subscription decision** | Fair exchange | Trapped | Tier purpose; founding terms if shown | Subscribe or continue Free | Fake countdown |
| **Cancellation** | Respected | Guilted | Export reminder; platform steps | Export then cancel | Hidden cancel |
| **Support** | Heard | Dismissed | Plain explanation; ticket id | Follow steps | "Working as intended" for phantoms |

Detail: [Experience Bible.md](../design/Experience%20Bible.md).

---

## 9. Competitor-Learning Framework

Learn from [07 Competitor Analysis.md](./07%20Competitor%20Analysis.md), [Competitor Reviews.md](../research/Competitor%20Reviews.md), [Mileage Apps Research.md](../research/Mileage%20Apps%20Research.md) — **never copy proprietary UI**.

For each competitor feature, complete:

| Question | Purpose |
|---|---|
| What do users **praise**? | Extract real value (e.g., swipe speed) |
| What do users **complain** about? | Avoid (phantom trips, battery, opaque auto-log) |
| What **problem** does it solve? | Map to [User Pain Points.md](../research/User%20Pain%20Points.md) ID |
| What **emotional outcome** do users want? | Usually calm + trust, not max miles |
| What should we **preserve**? | Swipe review ergonomics — with confirm rules |
| What should we **simplify**? | Expense-suite clutter → four-tab focus |
| What should we **redesign**? | Auto-log → protected pending + Proof |
| What should we **reject**? | Silent backfill, deduction maximizer UX, data sale |

**MileIQ:** Preserve passive capture intent; reject silent business classification.  
**Everlance:** Preserve breadth awareness; reject mileage-as-side-feature depth.  
**TripLog:** Preserve odometer respect; reject dated density.  
**Stride/free tier:** Preserve accessibility; reject upsell mileage hacks.

New features must pass [Feature Admission Test §10](#10-feature-admission-test).

---

## 10. Feature Admission Test

Before roadmap entry ([08 Feature Roadmap.md](./08%20Feature%20Roadmap.md)):

1. Which **verified user pain** does it solve? (ID from research)
2. How **often** does pain occur?
3. What **evidence** supports it? (reviews, interviews, support tickets)
4. Does it **reduce work** for the user?
5. Does it **improve confidence** (not just miles logged)?
6. Can it be explained in **one sentence**?
7. Does it fit the **four-tab model** without clutter?
8. **Privacy, battery, legal, or trust risk?** Mitigation required.
9. Can outcome be **measured**?
10. Is there a **simpler** solution?
11. Feature vs **service** vs **support workflow**?
12. What do we **remove or defer** to make room?

**Fails if:** any of 1–3 unanswered; increases invention risk; fails trust hierarchy; cannot fit four tabs without harming simplicity.

---

## 11. Notification DNA

### Rules (DEC-011)

- Notify only when **user action is meaningful**
- No engagement bait; no generic daily "open the app"
- No repeated alerts for same issue without **escalation logic**
- Respect work hours and quiet hours (defaults from onboarding work style)
- Clear action-oriented wording; show **estimated impact** when useful (not guaranteed tax)
- Category-level controls in Profile
- **Critical tracking-health** warnings preserved when protection likely interrupted

### Escalation ladder

1. **Passive** — Home tracking-health indicator  
2. **In-app** — Banner when user opens app  
3. **Push** — Meaningful risk (e.g., 3+ unaccounted days with tracking enabled)  
4. **Strong** — Protection likely interrupted (permission revoked, engine killed 48h+)

Every alert includes: **what happened · why it matters · how to fix · recovery scan available?**

### Approved examples

- "3 drives need review — about 12 min." → Review tab  
- "Tracking paused since Tuesday. Work miles may be unprotected. Fix permissions." → Profile → Tracking  
- "No driving detected Tuesday. Is that correct?" → Confirm or add trip  

### Rejected examples

- "You're missing $412 in deductions!"  
- "Open MileRecover to stay on streak!"  
- "New trip logged!" (without review context)  
- Third identical push in 24h with no escalation  

---

## 12. Support DNA

1. **Believe the user's experience** — phantom trips are real reports, not user error.  
2. **Never blame** for iOS/Android permission or battery restrictions — explain plainly.  
3. **Explain what happened** in plain language; link Help Center articles.  
4. **Help reconstruct** only where evidence exists (export, odometer, partial sessions).  
5. **Never invent records** to close tickets.  
6. **Escalate tracking failures** per [Incident Response Runbook.md](../architecture/Incident%20Response%20Runbook.md).  
7. **Preserve privacy** — no raw GPS in tickets without explicit consent.  
8. **Paid tiers** (Plus/Pro) receive timely human support SLAs.  
9. **Repeated issues** → product fix + Decision Log if architectural.

---

## 13. Subscription DNA

Aligned with DEC-013, DEC-014; tier names authoritative here. Dollar amounts in [09 Pricing.md](./09%20Pricing.md) require sync to Plus/Pro/Rescue naming — see [§18 Open Founder Decisions](#18-open-founder-decisions).

### Principles

- **Value before paywall** — Full capture, review, Proof Score visibility on Free  
- **Transparent pricing** — Tier purpose clear; renewal terms plain  
- **Easy cancellation** — Platform subscription settings; no dark retention  
- **Restore purchases** — Required  
- **No fake urgency** — Founding offer: annual only, transparent, no false countdown (DEC-014)  
- **No confusing trials** — If trial exists, end date and price stated upfront  
- **Honesty not hostage** — Gap visibility, confidence indicators, tracking health never paywalled  
- **Paid saves time or protects more value than cost** — Export depth, recovery tools, history, support  

### Launch tiers (DEC-013)

| Tier | Role |
|---|---|
| **Free** | Capture, review, trip-level Proof, limited export window |
| **Plus** | Expanded history, standard export, period Proof |
| **Pro** | Full-year export, recovery tools (H1 features gated here), priority sync/support |
| **Mileage Rescue** (one-time) | Targeted recovery assist for a period — not invented miles |
| **Full-Year Rescue** (one-time) | Seasonal deep recovery + export assist — user confirms all entries |

**Not at launch:** Pro+ (supersedes prior Pro+ draft in 09 Pricing).

### Founding member (DEC-014)

- Annual offer during early launch; terms honored for existing members unless they change plans  
- No false scarcity; no hidden renewal  

---

## 14. Language DNA

### Approved vocabulary

Protection, protected drives, proof, confidence, review, recovery, complete records, tracking health, evidence, estimated value, potential mileage value, reimbursement value, estimated deduction value, confirmed, pending, unaccounted, defensible.

### Restricted vocabulary

Use carefully with disclaimer: deduction, reimbursement (must match persona), automated, background location (pair with user benefit).

### Phrases to avoid

Guaranteed savings, guaranteed tax refund, you saved this much in taxes, IRS approved, audit proof, maximize deduction, AI verified, auto-logged (without pending), 100% complete (with gaps), surveillance, we track you.

### Examples

| Context | Approved | Rejected |
|---|---|---|
| **Uncertainty** | "Possible drive — please review." | "Trip logged successfully." |
| **Success** | "14 drives confirmed this week." | "14 drives logged — great job!" |
| **Tracking failure** | "Protection paused — fix tracking or add trips manually." | "All miles captured." |
| **Recovery** | "Add this trip? You'll enter distance." | "We recovered 8.4 mi." |
| **Subscription** | "Pro includes full-year proof export." | "Unlock your missing $2,400!" |
| **Estimated value** | "Estimated deduction value for confirmed miles: $X (not tax advice)." | "You saved $X on taxes!" |

DEC-009, DEC-015.

---

## 15. What We Will Never Become

Reaffirms [Anti-Principles.md](./Anti-Principles.md):

- Advertising platform  
- Location-data broker  
- General accounting suite  
- Tax-filing company (launch product)  
- Social network  
- Surveillance product  
- Gamified driving app  
- Dark-pattern subscription business  
- AI that fabricates mileage  
- Bloated fleet-management system  
- Product that hides tracking failures  

---

## 16. Product Review Checklist

Before approving **feature · screen · notification · AI suggestion · tracking change · paywall · report · privacy change**:

### Truth & trust
- [ ] Cannot invent mileage (DEC-004, Trust Rules A1–A2)
- [ ] Pending ≠ confirmed in UI and totals
- [ ] Gaps and no-driving days handled per DEC-010
- [ ] AI (if any) labeled provisional (H1+)

### Product DNA
- [ ] Fits **four-tab** model (DEC-007)
- [ ] One primary action
- [ ] Passes feature admission test (§10)
- [ ] Uses approved language (§14)
- [ ] Notification follows DNA (§11) if applicable

### Quality
- [ ] Offline path defined
- [ ] Battery impact considered
- [ ] Failure state equals success state design effort
- [ ] Accessibility: labels, contrast, motion fallback

### Business
- [ ] Paywall does not gate honesty features
- [ ] Subscription copy transparent (§13)
- [ ] No guaranteed tax outcomes

Sign-off: Product + Design + Engineering (if technical) + QA.

---

## 17. Founder Decisions Applied

| # | Decision | Rationale | Document impact |
|---|---|---|---|
| 1 | **Four tabs:** Home, Review, Proof, Profile | Reduce clutter; merge trips into Review, exports into Proof, settings into Profile | Supersedes five-tab drafts in Apple HIG References, Design Bible IA |
| 2 | **Full personalized onboarding at launch** | Recognition without separate apps | DEC-008 |
| 3 | **Estimated value language; no guaranteed savings** | Trust over tax-hack marketing | DEC-009 |
| 4 | **No-driving day confirmation** | Completeness without invention | DEC-010 |
| 5 | **Pattern-aware tracking-health alerts** | Calm over noisy push | DEC-011 |
| 6 | **Employee reimbursement persona at launch** | Underserved launch segment | DEC-012 |
| 7 | **Free, Plus, Pro, Rescue one-times; no Pro+** | Clear ladder + seasonal SKUs | DEC-013; 09 Pricing sync pending |
| 8 | **Founding member annual offer rules** | Growth without dark patterns | DEC-014 |
| 9 | **Protection-centered language** | Category ownership | DEC-015 |
| 10 | **Core product loop** (§2) | Aligns team on emotional/function flow | DEC-016 |

Recorded formally in [Decision Log.md](./Decision%20Log.md) DEC-007–DEC-016.

---

## 18. Open Founder Decisions

Unresolved after this document and locked decisions:

1. **Plus vs Pro price points and feature split** — [09 Pricing.md](./09%20Pricing.md) still lists Free/Pro/Pro+; map dollar amounts to Plus/Pro and document Rescue one-time prices.  
2. **Mileage Rescue vs Full-Year Rescue scope** — Exact deliverables (human assist vs product features only).  
3. **Home "today's estimated value"** — Show by default or opt-in; reimbursement vs deduction by persona default.  
4. **Recovery scan availability** — MVP manual-only vs H1 calendar/import when alerting (align [MVP.md](../planning/MVP.md)).  
5. **Founding member price point** — Prior doc suggested $49/yr; confirm with Plus or Pro tier.  
6. **Employee reimbursement CSV template** — Employer-specific columns vs generic.  
7. **Quiet hours default** — Global vs driver-type default.

*Closed by this prompt:* tab count, onboarding depth, no-driving days, alert philosophy, employee persona, Pro+ removal, founding offer rules, protection language, core loop.

---

## Related Documents

- [Experience Bible.md](../design/Experience%20Bible.md)
- [Decision Log.md](./Decision%20Log.md)
- [MVP.md](../planning/MVP.md)
- [Manifesto.md](./Manifesto.md)
- [Company Constitution.md](./Company%20Constitution.md)

---

*MileRecover — Protection you can prove.*
