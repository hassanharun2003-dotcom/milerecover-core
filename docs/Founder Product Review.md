# MileRecover — Founder Product Review

**Status:** Strategic review — pre-implementation gate  
**Date:** 31 July 2026  
**Owner:** Founding Team / Product  
**Audience:** Founders, Product, Design, Engineering leadership

**Scope:** Product strategy and experience only. No code. Preserves locked decisions DEC-007–DEC-029.

**Evidence considered:** Product DNA, PRD, Experience Bible, Growth Principles, Pricing, MVP, Launch Plan, research, Prototype B physical validation (FGS/lifecycle/ack on SM-A166U — tracking foundation promising; full product UX not yet built).

---

## 1. Executive verdict

MileRecover is **strategically coherent and unusually trust-aligned** for a mileage category poisoned by phantom trips, silent failures, and tax-hack marketing. The documentation stack is founder-grade: clear emotional promise, honest gaps, bounded recovery, four-tab simplicity, and monetization that does not hostage honesty.

**Verdict:** **Proceed to implementation** with discipline. The product is **not over-scoped on paper**, but launch risk is **execution density** (native tracking + offline + recovery + subscriptions + four polished tabs) and **first-session clarity** under permission friction. Do not add features to feel larger. Ship the loop: **protect → review exceptions → recover with confirmation → prove**.

**Launch readiness (product definition):** Strong.  
**Launch readiness (shippable product):** Not yet — engineering and device matrix incomplete.

Prototype B second pass validates that **native capture and lifecycle honesty are achievable**; it does not validate Recovery, Proof, or onboarding — those remain design/spec commitments.

---

## 2. What MileRecover is really selling

Not GPS. Not a tax refund.

MileRecover sells **relief from incomplete records** and **defensible confidence** for people whose income or reimbursement depends on drives they cannot perfectly remember.

| Layer | What user buys |
|---|---|
| **Emotional** | "I am not quietly losing money or audit posture because my app lied or went silent." |
| **Functional** | Automatic capture + honest gaps + user-confirmed recovery + exportable proof |
| **Economic** | Time saved on review/export + reduced reimbursement/CPA friction — **estimated**, never guaranteed |

Free proves **protection quality**. Plus proves **daily completeness and proof tools**. Pro proves **employer/CPA workflows**. Rescue proves **scoped recovery sessions** without subscription trickery.

---

## 3. Core emotional promise

> **You are protected — and you can prove it.**

Secondary line for functional clarity:

> **Every work mile accounted for — never invent mileage.**

The promise fails if users feel **monitored** (surveillance framing), **sold to** (deduction maximizer), or **trapped** (export hostage). Documentation consistently avoids these — maintain ruthlessly in implementation copy.

---

## 4. First 60 seconds review

### Mapped sequence (target)

| Second | Screen / moment | User mental model |
|---|---|---|
| 0–3 | Splash | Brand; calm; not alarmist |
| 3–12 | Welcome | "Work-mile **protection** with proof" — one sentence differentiation |
| 12–25 | Value prop slide | **Never invent mileage · you review · gaps shown honestly** |
| 25–40 | Driver type (1 tap) | "Built for my kind of driving" — not tax outcome |
| 40–50 | Single pain pick (optional compress) | Recognition — phantom trips / missed miles / audit fear |
| 50–60 | **Home preview or protection illustration** — *before* OS permission | User sees **what they'll get**, not what they'll grant |

**Permission education and OS prompt:** seconds 60–120 (second minute), not inside first 60.

### Judgment

| Question | Assessment |
|---|---|
| Promise immediately understandable? | **Yes**, if Welcome stays one line + contrast vs "auto-log everything" |
| User knows why different? | **At risk** if first screen looks like MileIQ clone — lead with **recovery + honest gaps + pending review** |
| Recovery too early? | **No** in copy; **Yes** if UI shows recovery before first capture — mention in onboarding, activate after first gap |
| Value before permissions? | **Required** — DEC-008 education order; show Home mock or "how protection works" diagram |
| Too many questions before utility? | **Risk** — compress onboarding to **≤4 meaningful taps** before permission; defer vehicle odometer, calendar, account |
| Protected or burdened? | Protected if permission screen explains **user review each drive** |
| Estimated value honest? | Yes if labeled **estimated** and basis chosen once (DEC-020) |
| Payment too early? | **No paywall in first session** — locked and correct |

### Recommended leanest high-trust sequence

1. Welcome → differentiation (protection, not maximization)  
2. Driver type → pain (1–2 taps)  
3. **Estimated-value basis** (deduction / reimbursement / potential mileage — one tap)  
4. **"How it works"** (3 bullets: capture pending · you confirm · gaps honest)  
5. Permission education → OS prompt  
6. Land on **Home** with Protection Health + "Drive normally — we'll show pending trips in Review"  
7. **No account gate** until after permission education (or optional sign-in after first value event)

---

## 5. First-session onboarding review

**Strengths:** Personalization without separate apps; pain-driven expectations; permission-after-education; employee reimbursement persona included.

**Risks:**
- **Account creation timing** — if forced before first Home view, trust drops (surveillance + commitment).
- **Calendar connect** in onboarding — defer to Plus upsell moment after first gap or first week.
- **Estimated-value basis** — good for relevance; pair with **hide money toggle** mention in Profile preview.
- **Recovery explanation** — one calm screen ("We surface gaps — you confirm") sufficient; do not demo fake recovered dollars.

**Recommendation:** Cap onboarding at **<3 minutes median** (DNA quality bar). Anything optional skips without penalty.

---

## 6. Permission-timing review

| Principle | MileRecover fit |
|---|---|
| Ask with context | **Strong** — permission education screen is mandatory before OS prompt |
| Degrade gracefully | **Strong** — Protection Health + manual trips + honest "limited protection" |
| Never during paywall/error | **Locked** — Growth Principles §5 |

**Order:** Education → user taps Continue → OS dialog. If denied: land Home with **clear limited mode**, not guilt.

**Background location:** Separate optional step after foreground success — "For protection when app is closed" — not bundled in first dialog confusion.

Prototype B validated **foreground explanation before system dialog** on device — replicate in production onboarding.

---

## 7. First-value moment

**Definition:** First moment user believes MileRecover is **working for them truthfully**.

**Primary candidate:** First **pending trip appears in Review** after a real drive with map/evidence visible — user thinks: *"It caught something, but it's asking me — not assuming."*

**Timing target:** Same day as first drive; if no drive yet, **Protection Health = active** + "Waiting for first drive" is acceptable but weaker.

**Anti-value:** Empty Home with charts, or "0 miles saved."

---

## 8. Aha moment

### Primary aha moment (choose one)

**First user-confirmed recovered trip** (or first accepted gap closure: no-driving confirm, import row, calendar match) where user explicitly taps **Accept** and sees completeness improve **with source labeled**.

**Why primary:** This is MileRecover's **category differentiation**. Competitors auto-log; MileRecover **recovers without inventing**. The emotional shift is: *"It found what I missed — and didn't fake it."*

**Make visible without exaggeration:**
- Review item: "Possible missing drive — calendar event · you enter distance"  
- After accept: Home completeness tick up; Proof tab shows **recovered** badge with lower Proof Score factor explained  
- Copy: "You confirmed this trip — we didn't add it automatically."

### Secondary aha moment

**First successful export preview** (PDF or reimbursement CSV) where user sees **confirmed miles, gaps disclosed, sources listed** and thinks: *"I could send this to my employer/CPA."*

**Why secondary:** Converts anxiety (PP3, PP6) into **preparedness** — strong for Jordan persona and tax season, but depends on Plus/Pro gate appropriately.

---

## 9. Trust-building sequence

Recommended trust ladder (days 0–14):

1. **Day 0:** Honest promise; permission with education; no paywall  
2. **Day 0–1:** Pending trip review — user confirms/rejects; undo available  
3. **Day 1–3:** Protection Health visible; if degraded, plain fix path  
4. **Day 3–7:** First gap or no-driving prompt — honesty over fake completeness  
5. **Day 7:** Weekly review digest (after quiet hours); batch option if high confidence  
6. **Week 2+:** Recovery suggestion with evidence; user accept/dismiss  
7. **Before export/paywall:** Export preview shows **pending excluded by default**

Never skip rungs (e.g., recovery before user understands pending state).

---

## 10. Home experience review

**Purpose:** "Am I covered?" — not a dashboard of vanity metrics.

**Must show:** Protection Health · today's pending/confirmed summary · estimated value (toggleable) · **one next action** (Fix tracking **or** Review N items **or** Confirm no-driving).

**Must not show:** Gamified streaks · guaranteed savings · business totals including pending · charts for engagement.

**Empty state:** "Enable tracking to protect your miles" — action to permission re-entry, not subscribe.

**Founder note:** Home is the **trust heartbeat**. If Protection Health lies, the product dies.

---

## 11. Review-tab experience

**Purpose:** Exceptions + history — "What needs my decision?"

**Strengths in spec:** Pending default; reject from detail; batch only ≥85 with summary modal; no-driving three-option flow (DEC-024).

**Risks:** Review fatigue for high-volume drivers — **exception-based** batching is essential; gig drivers need **volume ergonomics** without silent accept.

**Empty state (good):** "No items need review — you're protected" — reinforces success without nagging.

---

## 12. Proof-tab experience

**Purpose:** Defensibility — "Can I defend this period?"

**Strengths:** Proof Score breakdown; gap disclosure in export preview; employee reimbursement CSV (Pro).

**Risk:** Proof Score feels like **black box** — first tap must explain factors in plain language.

**Empty state:** "Confirm trips in Review to build proof" — links upward in loop, not guilt.

**Paywall:** Proof Score and PDF behind Plus — **justified after** user has confirmed trips; **never** block gap visibility.

---

## 13. Profile experience

**Purpose:** Control — rules, privacy, subscription, support.

**Must feel:** Settings graveyard **no** — **control center** for protection rules, quiet hours, hide money, vehicles, subscription transparency.

**Subscription:** Tier visible; restore purchases; cancel path points to platform; Founding Member terms explicit.

---

## 14. Recovery experience

**Launch scope (DEC-021):** Bounded — calendar, import, known places, edge repair, no-driving — **no bank/email/platform**.

**UX rule:** Every suggestion = evidence + confidence + **user distance entry where needed** + accept/dismiss.

**Rescue IAP:** Scoped workflow ($14.99 / $29.99) — separate from subscription; message scope **before** purchase.

**Do not:** Show aggregate "$ recovered" marketing numbers from suggestions.

---

## 15. Protection Health experience

**Rename internally consistent:** Tracking health / Protection Health — user-facing language **protection-centered** (DEC-015).

**Escalation ladder (DEC-011):** Passive Home → in-app banner → push only with pattern + meaning.

**Never:** "100% protected" when engine off.

Prototype B validates **FGS + buffer + ack** mechanics; production must map to **user-visible Protection Health**, not engineer diagnostics.

---

## 16. Notification strategy

| Category | User benefit | Default | Quiet hours | Off by default? |
|---|---|---|---|---|
| Tracking health (critical) | Prevent silent loss | On | May break if delay risks records | **No** — but strict escalation |
| Missing-trip suggestion | Close gap honestly | On | Wait until 7 AM | No |
| Weekly review digest | Low-effort habit | On | Wait | No |
| No-driving confirmation | Completeness | On | Wait | No |
| Permission degradation | Fix protection | On | Critical only | No |
| Export/report ready | Task completion | On | Wait | **Yes** — optional |
| Subscription/billing | Platform required | On | Wait for non-critical | Partial — billing per store |
| Support | Ticket updates | On | Wait | User choice |
| Review eligibility (OS) | — | N/A | Never push marketing | — |
| Marketing / promotional | — | — | **Prohibited** | **Yes — off always** |

**Prohibited wording:** Dollar savings guarantees · streaks · "You're missing $X" · per-trip "logged!" without review context.

**Default off:** Marketing; engagement bait; export-ready non-urgent; referral prompts.

---

## 17. Review-request timing

**Preserved:** DEC-026 — native OS APIs only; no rewards; no rating gating.

### Top three moments (ranked)

1. **After first user-confirmed recovered trip** (accept tapped, trip in confirmed state) — strongest alignment with differentiation; user felt relief + control.  
2. **After successful export saved/shared** (PDF or reimbursement CSV completed) — preparedness moment; Jordan/CPA persona.  
3. **After clean weekly review** (≥3 trips reviewed, queue empty, no critical Protection Health issue) — habit + competence.

**Require two signals where possible:** e.g., recovered trip **and** no Action-needed health; export **and** Proof Score ≥ threshold.

### Explicitly rejected moments

Onboarding · permissions · paywall · errors · cancellation · deletion · support crisis · immediately after subscribe · first launch · tracking failure · repeated dismiss within cooldown.

**Cooldown:** 120 days attempt / 90 days after dismiss — per Growth Principles.

---

## 18. Referral timing

**Separate from reviews (DEC-026).**

**Best moment:** After **first month with successful export** or **second month of active protection** — user has repeated value, not euphoria from single recovery.

**Never:** Same session as review prompt; immediately after recovery accept; permission flows.

**Default:** Referral surfacing **off** until user opens Profile → Referrals or post-export optional card (dismiss permanently).

---

## 19. Paywall timing

**Approved (Growth §5):** Free limit hit (40 auto trips); deliberate Plus feature tap; export requiring Plus; import preview elapsed; Pro workflow selection.

**Prohibited:** Onboarding; permission; Protection Health fix; deletion; errors; blocking existing records.

**Primary pattern:** **Limit-triggered sheet** with clear "what you already have" vs "what unlocks" + **Continue Free** always visible.

---

## 20. Free-to-paid conversion logic

Free must deliver: manual unlimited · 40 auto trips · basic CSV · Protection Health · gaps · review/reject · 1 recovery scan/mo · 7-day import preview.

**Conversion triggers:**
- **Volume** — 41st auto trip in month (high-intent gig/realtor)  
- **Proof depth** — user taps Proof Score / PDF  
- **Recovery depth** — second scan or calendar recovery  
- **Multi-vehicle** — practical need

**Message:** "You've confirmed X miles — unlimited tracking keeps protection complete" — not "unlock missing $."

**Target:** 8–12% free→paid in 90 days (Pricing doc) — achievable only if Free feels **complete for light users**, not crippled.

---

## 21. Plus-to-Pro upgrade logic

**Triggers:** Multiple businesses; client/project fields; employer share; reimbursement template; Proof Package; priority support.

**Context:** User already pays — upgrade is **workflow expansion**, not trust unlock.

**Message:** "Add a second business" / "Export employer-ready reimbursement report" — feature-specific sheet, not fear.

**Avoid:** Plus user feeling cheated — Pro features must be **clearly listed** on comparison at Plus purchase time.

---

## 22. Rescue purchase logic

**Separate purchase pattern** — not subscription.

**Trigger:** User selects Rescue from Proof/Profile during **tax season** or after **tracking outage**; honest scope screen first.

**Message:** "Review up to 3 recent months / one tax year — **you confirm every entry** — does not replace ongoing Plus."

**Justified:** High-intent seasonal job; avoids forcing annual sub for one-time need.

**Risk:** Rescue feels like "pay to fix our failure" — copy must emphasize **user situation** (new phone, missed reviews), not app guilt.

---

## 23. Subscription cancellation and win-back

**On cancel intent (Profile):** Export reminder · downgrade explains Free limits apply to **new** activity · records remain · platform cancel steps · **no guilt countdown**.

**Win-back:** Only via product value (email/education if opted in) — **never** export hostage · **never** fake "your miles expire."

**Founding Member:** Grandfathering transparent (DEC-019); re-subscribe at public price if lapsed.

---

## 24. Habit loop and retention

**Plain-language loop:**

Drive → app protects passively → exceptions appear in Review → user spends minutes weekly → completeness and proof improve → monthly export or employer submit → repeat.

**Assessment:**

| Criterion | Fit |
|---|---|
| Natural | **Yes** — driving already happens |
| Recurring | **Yes** — weekly review + monthly/seasonal export |
| Low effort | **If** exception-based review holds |
| Non-manipulative | **Yes** if notifications disciplined |
| Valuable without notifications | **Yes** — Home Protection Health passive |

**Minimum viable retention loop for launch:** **Weekly review completion** + **monthly completeness check on Proof** — not daily opens.

---

## 25. Empty states

Each tab empty state must **teach the loop**, not sell:

| Tab | Message direction |
|---|---|
| Home | Enable/fix tracking |
| Review | Protected — no exceptions |
| Proof | Confirm trips to build proof |
| Profile | Complete driver type for personalization |

Never empty = paywall.

---

## 26. Error and failure moments

**Tracking failure:** Protection Health + fix steps + manual trip path — **never** fake completeness.

**Sync conflict:** User chooses; audit trail.

**Export failure:** Retry; support link; no data loss claim without verification.

**Paywall error / billing:** Store messaging; no double-charge dark patterns.

**Never:** Review prompt · upsell · recovery scan push in same session as critical error.

---

## 27. Emotional design

**Palette:** Calm protection — navy/slate trust, not neon "money green."

**Motion:** Reduce Motion respected; no slot-machine confirmations.

**Celebration:** Subtle — "14 drives confirmed" not "Awesome job saving $!"

**Tax season:** Procedural calm — checklists, not panic countdowns.

---

## 28. Language and copy

**Lead:** Protection, proof, confirmed, pending, estimated value, gaps, review, recovery.

**Avoid:** Maximize, guaranteed, IRS approved, auto-logged (without pending), surveillance.

**Employee reimbursement persona:** "Reimbursable miles" not "deduction" — DEC-012.

---

## 29. Accessibility and clarity

WCAG AA target; VoiceOver labels on Review actions; Proof Score readable without color alone; dynamic type; glove-friendly targets for contractors (Elena persona).

**Clarity test:** Can a tired user at 9 PM understand Protection Health banner in **one read**?

---

## 30. Competitive differentiation

| Competitor lesson | MileRecover adaptation |
|---|---|
| Passive capture praised | Match reliability; add **pending + review** |
| Phantom trips hated | Conservative detection + reject — **primary marketing truth** |
| Swipe classify liked | Keep ergonomics; **no default business** |
| Battery hated | Native engine targets; visible battery mode |
| Stride free liked | Generous Free **with honest limits** — not upsell hacks |
| Everlance breadth | **Reject suite clutter** — four tabs |

**Own:** **Protected completeness with honest gaps and user-confirmed recovery.**

---

## 31. Simplicity audit

**Pass:** Four tabs; one primary action; recovery bounded at launch; no Pro+; no fleet.

**Watch:**
- Proof tab feature density for Pro — use progressive disclosure  
- Review history + queue in one tab — search must be fast  
- Profile sub-screens — avoid "settings maze"

**Score:** 8/10 on paper — execution will tempt feature creep toward Everlance.

---

## 32. Feature-removal opportunities

| Candidate | Rationale |
|---|---|
| **Quarterly summaries at launch** | Defer unless Jordan persona demands — Proof period export sufficient |
| **Receipt matching at launch** | Pro scope — validate demand; high complexity |
| **AI purpose suggestions before trip #10** | Defer until user has context |
| **Multiple pain picks in onboarding** | Reduce to one required |
| **Odometer in onboarding** | Profile later — optional nudge |
| **Referral program at launch** | DEC-026 separation; defer incentives |
| **Batch review below 85 threshold** | Keep threshold — do not lower for engagement |

**Reject removal of:** Recovery at launch · no-driving flow · Protection Health · basic Free CSV · employee reimbursement CSV (Pro).

---

## 33. Friction audit

| Friction | Verdict |
|---|---|
| Permission | Necessary — mitigate with education + degradation |
| Pending review | **Intentional** — reduces phantom risk |
| Recovery user distance entry | **Intentional** — anti-invention |
| Account sign-in | Minimize delay before Home |
| Plus paywall at 41 trips | Fair if limit visible at trip 35 |
| Proof Score explanation tap | Required — not friction, trust |

**Remove:** Repeated onboarding questions; duplicate permission prompts; sync blocking spinners offline.

---

## 34. Founder scorecard

| Dimension | Score | Notes |
|---|---|---|
| Clarity | **9** | Promise and loop documented exceptionally |
| First-use value | **7** | Spec strong; depends on onboarding compression + first drive timing |
| Trust | **9** | Hierarchy and anti-patterns locked |
| Simplicity | **8** | Four tabs; launch feature set still heavy |
| Differentiation | **9** | Recovery + honest gaps + pending review |
| Retention | **7** | Loop natural; unproven until weekly review measured |
| Monetization fairness | **8** | Free usable; honesty not paywalled |
| Emotional resonance | **8** | Protection > maximization — must survive marketing |
| Permission timing | **8** | Spec correct; category baseline is hard |
| Review timing | **9** | DEC-026 conservative |
| Referral potential | **6** | Deferred; CPA channel stronger early |
| Subscription sustainability | **7** | Unit economics TBD; limits on Free sensible |
| Launch readiness | **6** | Definition ready; product/engineering/device matrix not |

**Overall:** **8.0/10** product strategy · **6/10** shippable today

---

## 35. Highest-impact improvements

| Rank | Improvement | Impact | Revenue | Trust | Eng cost | When |
|---|---|---|---|---|---|---|
| 1 | Compress onboarding; value before permission; defer account | High | Med | High | Med | **Must before implementation** |
| 2 | Nail first pending trip UX (map, pending badge, one-tap review path) | High | Med | High | Med | **Must before beta** |
| 3 | Protection Health truthfulness + escalation copy | High | Med | Critical | Med | **Must before beta** |
| 4 | Recovery accept flow with evidence + distance entry | High | High | Critical | High | **Must before launch** (DEC-021) |
| 5 | Export preview with gap/pending disclosure | High | High | High | Med | **Must before launch** |
| 6 | Exception-based batch review for high-volume drivers | Med | Med | High | Med | **Should before beta** |
| 7 | Weekly digest + quiet hours implementation | Med | Med | High | Med | **Should before launch** |
| 8 | Review prompt eligibility engine (DEC-026) | Low | Med | High | Low | **Should before launch** |
| 9 | Referral program | Low | Med | Med | Med | **Can wait post-launch** |
| 10 | Bluetooth trigger | Low | Low | Med | High | **Reject at launch** (DEC-027) |

---

## 36. What must not change

- Four tabs: Home · Review · Proof · Profile (DEC-007)  
- Free / Plus / Pro / Rescue pricing (DEC-018)  
- Recovery at launch, bounded (DEC-021)  
- No silent mileage creation · AI requires confirmation  
- Proof Score on Plus+  
- Estimated value default on + hide toggle (DEC-020)  
- Quiet hours 9 PM–7 AM (DEC-023)  
- Native review APIs only; DEC-026 timing rules  
- Founding Member Pro; no Pro+; no public complimentary beta (DEC-028)  
- Honesty features never paywalled (gaps, health, reject, basic CSV)  
- Trust > automation; evidence > AI; protection > logging  
- Sustainable growth hierarchy (DEC-025)

---

## 37. Launch readiness verdict

| Lens | Verdict |
|---|---|
| **Product strategy** | **Ready** — proceed to implementation with scorecard priorities |
| **Trust architecture** | **Ready** — do not dilute during build |
| **MVP scope** | **Heavy but justified** — resist additions |
| **Engineering** | **Not ready** — prototypes B/C/D incomplete; no production app |
| **Device/OEM matrix** | **Not ready** — SM-A166U only for FGS slice |
| **Go-to-market** | **Conditionally ready** — messaging aligned; wait for proof exports on device |

**Founder call:** **Green-light implementation** focused on **first-value path** (onboarding → permission → pending trip → review → gap/recovery → export preview). **Yellow-light public launch** until retention metrics and multi-device tracking evidence exist.

**No new DEC required** from this review. Operational note: revisit scorecard after beta Week 2 retention.

---

## Competitor-builder perspective (selected lessons)

| Principle | Why it works | Applies? | Adaptation | Risk |
|---|---|---|---|---|
| Deliver value quickly (Stripe, Duolingo early lesson) | Reduces churn before habit | **Yes** | First pending trip <24h; skip account delay | Over-skipping onboarding hurts personalization |
| Ask permissions in context (Apple HIG) | Higher grant + trust | **Yes** | Education screen — validated in Prototype B | Background ask too early kills trust |
| Paywall after value (Superhuman, Notion) | Fair conversion | **Yes** | 40-trip limit + export tap | Free must feel real |
| Ask reviews after win (Apple guidelines) | Higher quality ratings | **Yes** | DEC-026 recovered trip / export | Premature ask destroys ratings |
| Streaks (Duolingo) | Engagement | **No** | Weekly review habit without streak shame | Manipulation |
| Fear marketing (some tax apps) | Short-term conversion | **No** | Honest gaps only | Destroys category trust |
| Swipe ergonomics (MileIQ) | Speed | **Yes** | Review queue gestures + confirm rules | Silent swipe accept |

---

## Related documents

- [Product DNA.md](./Product%20DNA.md)
- [Product Requirements Document.md](./Product%20Requirements%20Document.md)
- [Growth and Sustainability Principles.md](./Growth%20and%20Sustainability%20Principles.md)
- [Experience Bible.md](../design/Experience%20Bible.md)
- [09 Pricing.md](./09%20Pricing.md)
- [MVP.md](../planning/MVP.md)
- [Launch Plan.md](../planning/Launch%20Plan.md)
- [prototypes/android-tracking/RESULTS.md](../prototypes/android-tracking/RESULTS.md)

---

*MileRecover — Protection you can prove.*
