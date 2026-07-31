# MileRecover Core Principles

**Status:** Foundational — Non-Negotiable  
**Last Updated:** July 2026  
**Owner:** Founding Team

---

## Purpose

These principles govern every decision at MileRecover: product, engineering, design, marketing, support, and partnerships. When principles conflict with revenue, growth, or speed, **principles win**.

They are not slogans. They are **constraints**.

---

## The Seven Principles

### 1. Every Work Mile Accounted For

**Definition:** Our job is completeness of *legitimate* business travel—not completeness of GPS pings.

**In practice:**
- Surface gaps explicitly rather than hiding them
- Recovery workflows help users fill gaps with evidence
- Reports show period coverage, not just trip totals
- "Unaccounted" is a valid state we display

**Violations:**
- Showing a "100% complete" badge when gaps exist
- Excluding rejected trips from visibility without user acknowledgment

---

### 2. Never Invent Mileage

**Definition:** If MileRecover did not detect movement or receive user-provided evidence, that mile does not exist in the log.

**In practice:**
- No AI-generated trips from calendar alone
- No interpolation between known points without user confirmation
- No "estimated" miles in official exports (estimates may exist as drafts only)
- Recovery suggestions require explicit user acceptance

**Violations:**
- Backfilling trips because "the user probably drove"
- Rounding up distances to "nice" numbers
- Creating trips from incomplete sensor data above confidence threshold

---

### 3. Trust Over Automation

**Definition:** Automation proposes; the user disposes. We optimize for user confidence, not automation rate.

**In practice:**
- Default to review queues for ambiguous trips
- Show why a trip was classified (signals used)
- Allow one-tap confirm but never one-tap "accept all" without summary
- Automation settings are granular and reversible

**Violations:**
- Silent auto-logging of low-confidence trips
- Hiding classification logic
- Dark patterns that discourage review

---

### 4. Accuracy Over Features

**Definition:** We ship fewer features that are correct over many features that are plausible.

**In practice:**
- Proof Score must be calibrated before launch
- New features require accuracy benchmarks
- "Coming soon" beats shipping broken automation
- Feature roadmap prioritizes defensibility infrastructure

**Violations:**
- Shipping competitor parity features without accuracy validation
- Marketing features not yet built
- Adding integrations before core tracking is reliable

---

### 5. Battery Friendly

**Definition:** Tracking that drains the battery gets disabled; disabled tracking helps no one.

**In practice:**
- Native platform APIs over naive polling
- Geofence and significant-change location where appropriate
- User-visible battery impact indicators
- Adaptive tracking intensity based on context and user preference

**Violations:**
- Continuous high-accuracy GPS when not driving
- Background work that prevents device sleep
- Ignoring platform battery optimization guidelines

---

### 6. Offline First

**Definition:** The app must function fully without network connectivity; sync is eventual, not blocking.

**In practice:**
- Local database is source of truth during capture
- Trip review, editing, and export work offline
- Conflict resolution on sync is deterministic and user-visible
- No "loading" gates on core workflows

**Violations:**
- Requiring login ping for trip capture
- Blocking export until cloud processing completes
- Losing data on sync failure

---

### 7. AI Assists But Never Replaces Evidence

**Definition:** AI may classify, summarize, suggest, and flag—but the evidentiary record comes from sensors and user attestation.

**In practice:**
- AI classifications show confidence and reasoning
- AI cannot create exportable trips without sensor or manual evidence
- Model outputs are versioned and auditable
- Human override always available

**Violations:**
- "AI detected a trip" with no underlying GPS record
- Using LLM output as sole proof of business purpose
- Opaque model decisions in audit exports

---

## Principle Hierarchy

When principles conflict, resolve in this order:

1. **Never invent mileage** (hard stop)
2. **AI assists but never replaces evidence**
3. **Trust over automation**
4. **Accuracy over features**
5. **Every work mile accounted for**
6. **Battery friendly**
7. **Offline first**

Example: Completeness (Principle 1) never justifies invention (Principle 2).

---

## Decision Framework

For any proposal, ask:

```
1. Could this create miles that didn't happen?          → STOP
2. Does this reduce user visibility or control?         → REDESIGN
3. Does this work offline?                              → REQUIRED
4. What's the battery cost?                             → MEASURE
5. Can we prove accuracy improved?                      → BENCHMARK
6. What does the user see when AI is involved?          → DOCUMENT
```

---

## Enforcement

- **Product:** Feature specs include Principle Check section
- **Engineering:** Architecture reviews reference this document
- **Design:** Interaction Rules derived from these principles
- **QA:** Test cases for invention prevention and offline behavior
- **Marketing:** Claims reviewed against Trust Rules

See [04 Trust Rules.md](./04%20Trust%20Rules.md).

---

## Related Documents

- [04 Trust Rules.md](./04%20Trust%20Rules.md)
- [../design/Interaction Rules.md](../design/Interaction%20Rules.md)
- [../architecture/Proof Score.md](../architecture/Proof%20Score.md)
- [../architecture/AI Architecture.md](../architecture/AI%20Architecture.md)
