# MileRecover User Psychology

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product / UX

---

## Purpose

Understanding how users *feel* about mileage tracking is as important as understanding what they *need*. MileRecover's UX must address emotional realities—not just functional requirements.

---

## Core Emotional Landscape

### Audit Anxiety
Self-employed users don't fear the app. They fear the **IRS letter**.

**Manifestations:**
- Hypervigilance about "wrong" entries
- Preference for under-logging over over-logging
- Distrust of automation they didn't witness
- Seeking CPA validation as ultimate proof

**Design response:**
- Proof Score as anxiety reducer (quantified confidence)
- Transparent trip sources — **trust over automation**
- Export preview before submission
- Language: "accounted for" not "maximized"

---

### Learned Distrust
Most users have been burned by mileage apps that:
- Created phantom trips
- Drained batteries
- Lost data offline
- Promised "effortless" and delivered corrections

**Design response:**
- Conservative defaults
- Show what the app *didn't* log
- **Never invent mileage** — visible gaps build trust paradoxically
- Reliability metrics in settings ("tracking uptime")

---

### Cognitive Load Avoidance
Users want mileage handled—but only if handling is trustworthy.

**The paradox:** They won't review 200 trips/month unless review is fast and meaningful.

**Design response:**
- Batch review with smart grouping
- High-confidence trips: one-tap confirm
- Low-confidence trips: forced detail view
- Weekly digest vs daily nagging

---

### Identity: Professional, Not "Tax Cheater"

Users see themselves as legitimate business operators. Apps that feel like "deduction hacks" cause shame and churn.

**Design response:**
- Professional visual language (see Design Bible)
- Copy aligned with accounting norms
- No gamification of miles logged
- **Accuracy over features** positioning

---

## Behavioral Patterns

### The January-March Panic
Tax season drives spikes in installs, recovery usage, and exports.

**Implication:** Recovery Engine and export must peak perform Q1; onboarding must set year-round habits.

### The Disable-After-Drain Cycle
User enables tracking → battery drain → disables → forgets → gap → guilt → re-enables.

**Implication:** **Battery friendly** is retention, not performance. Surface battery impact proactively.

### The CPA Handoff Ritual
User exports → emails CPA → CPA responds with corrections → user fixes → re-exports.

**Implication:** Export formats must match CPA expectations first time. Diane persona is critical.

### The Personal/Business Boundary Stress
Trips with mixed purpose (home depot + personal) cause decision fatigue.

**Implication:** Split trip UX, partial business classification, clear IRS-aligned purpose fields.

---

## Trust Formation Model

```
Awareness → Skeptical trial → First accurate trip confirmed →
First honest gap shown → Proof Score understood →
First successful export → CPA acceptance → Habit loop → Advocacy
```

**Critical moment:** First honest gap. If we invent miles here, trust dies permanently.

---

## Motivation vs. Fear Matrix

| Motivation | Fear | MileRecover Answer |
|---|---|---|
| Recover lost deductions | Audit | Proof Score + evidence trail |
| Save time | Wrong data | Review queue, not blind automation |
| CPA approval | App unreliability | Export quality, source transparency |
| Battery life | Missing miles | Offline first + efficient engine |

---

## UX Principles Derived from Psychology

1. **Calm over clever** — reduce anxiety, don't amplify FOMO on deductions
2. **Show your work** — users trust process visibility
3. **Defaults are conservative** — earn automation through opt-in
4. **Celebrate confirmation, not volume** — "47 trips confirmed" not "47 trips logged"
5. **Gaps are okay** — prompt recovery, don't hide

---

## Onboarding Emotional Arc

| Stage | User Feeling | Goal |
|---|---|---|
| Install | Skeptical hope | Clear philosophy statement |
| Permissions | Defensive | Honest rationale, degradation preview |
| First trip | Curious | Show detection + confidence |
| First review | Evaluative | Easy confirm/reject |
| First week | Cautious optimism | Weekly summary, Proof Score intro |
| First export | Anxious | Preview, CPA-ready formatting |

---

## What Users Must Never Feel

- Tricked into claiming more miles
- Locked into AI decisions they can't override
- Punished for going offline
- Judged for low mileage totals
- Overwhelmed by notifications

---

## Related Documents

- [05 User Personas.md](./05%20User%20Personas.md)
- [04 Trust Rules.md](./04%20Trust%20Rules.md)
- [../design/Interaction Rules.md](../design/Interaction%20Rules.md)
- [../design/Design Bible.md](../design/Design%20Bible.md)
