# MileRecover Decision Log

**Status:** Living Document  
**Last Updated:** July 2026  
**Owner:** Founding Team / Engineering

---

## Purpose

This log records significant product and technical decisions so future team members understand **why** MileRecover is built the way it is.

Decisions here sit below the [Company Constitution.md](./Company%20Constitution.md) and [03 Core Principles.md](./03%20Core%20Principles.md) but above informal discussion.

---

## Decision Record Template

Copy for each new entry:

```markdown
### DEC-XXX — [Short title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded by DEC-YYY  
**Deciders:** [Names or roles]  
**Consulted:** [Optional]

#### Context
What problem or fork prompted this decision?

#### Decision
What we chose — one clear statement.

#### Alternatives considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|

#### Consequences
- **Positive:** ...
- **Negative / tradeoffs:** ...
- **Follow-up actions:** ...

#### Principle alignment
- [ ] Every work mile accounted for
- [ ] Never invent mileage
- [ ] Trust over automation
- [ ] Accuracy over features
- [ ] Battery friendly
- [ ] Offline first
- [ ] AI assists but never replaces evidence

#### Related documents
- ...
```

---

## Index

| ID | Title | Status | Date |
|---|---|---|---|
| DEC-001 | React Native for shared UI | Accepted | 2026-07 |
| DEC-002 | Native Swift and Kotlin tracking engines | Accepted | 2026-07 |
| DEC-003 | Offline-first local storage | Accepted | 2026-07 |
| DEC-004 | User confirmation for reconstructed trips | Accepted | 2026-07 |
| DEC-005 | Recovery-first differentiation | Accepted | 2026-07 |
| DEC-006 | No sale of location data | Accepted | 2026-07 |

---

## Recorded Decisions

### DEC-001 — React Native for shared UI

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Founding team, Mobile Engineering Lead

#### Context
MileRecover must ship iOS and Android with feature parity for MVP. Team size is small. UI complexity is moderate; tracking complexity is high and platform-specific.

#### Decision
Use **React Native (New Architecture)** for shared application UI, navigation, and business logic. Platform-native modules handle tracking, permissions, and battery-sensitive work.

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Fully native (Swift + Kotlin) | Best platform integration | 2× UI/engineering surface | Too slow for MVP team |
| Flutter | Single codebase | Weaker existing team familiarity; native tracking still required | Team velocity |
| RN + native modules | Shared UI; native where it matters | Bridge complexity | **Selected** — best balance |

#### Consequences
- **Positive:** One TypeScript codebase for review, export, and settings flows ([Frontend.md](../architecture/Frontend.md))
- **Negative:** Native bridge maintenance; careful threading for GPS writes
- **Follow-up:** Sprint 1 validates bridge with tracking POC ([Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md))

#### Principle alignment
All seven principles supported; enables **offline first** shared logic and faster **accuracy over features** iteration on review UX.

---

### DEC-002 — Native Swift and Kotlin tracking engines

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Mobile Engineering Lead, AI Systems Architect

#### Context
Background location, motion activity, and battery optimization require platform APIs. JS-thread GPS processing is unreliable when backgrounded.

#### Decision
Implement the **Native Tracking Engine** separately in **Swift (iOS)** and **Kotlin (Android)**. Raw location samples write to local storage from native threads. RN receives trip draft events only.

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| RN geolocation libraries only | Simpler stack | Poor background behavior; battery cost | Fails battery and accuracy goals |
| Cross-platform C++ core | Shared detection logic | High build complexity for MVP | Over-engineering |
| Native per platform | Full API access; battery control | Two implementations | **Selected** — required for trust |

#### Consequences
- **Positive:** Meets **battery friendly** and **trust over automation** detection thresholds
- **Negative:** Dual maintenance; parity testing on both platforms
- **Follow-up:** [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md) defines deterministic behavior both platforms must implement

#### Principle alignment
Directly supports **battery friendly**, **never invent mileage** (evidence captured natively), **offline first**.

---

### DEC-003 — Offline-first local storage

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Founding team, Backend Engineering Lead

#### Context
Primary users (contractors, field workers) work in areas with poor connectivity. Cloud-first capture loses data and violates user trust.

#### Decision
**SQLite on device** is the source of truth during capture. Cloud PostgreSQL syncs asynchronously for backup and multi-device — never blocking trip creation or review.

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Cloud-first | Simpler server logic | Fails offline; network gates capture | Violates **offline first** |
| Local-only (no sync) | Maximum privacy | No backup; device loss = data loss | Unacceptable for tax records |
| Offline-first + sync | Resilient capture; cloud backup | Conflict resolution complexity | **Selected** |

#### Consequences
- **Positive:** Full review and export offline ([Offline First.md](../architecture/Offline%20First.md))
- **Negative:** Sync conflict UI required; schema versioning discipline
- **Follow-up:** [Data Model.md](../architecture/Data%20Model.md) defines entity lifecycle and mutability

#### Principle alignment
Core to **offline first** and **trust over automation** (local data always available for review).

---

### DEC-004 — User confirmation for reconstructed trips

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Founding team, Product

#### Context
Users arrive with gaps — tracking off, app uninstalled, tax season panic. Competitors silently backfill or estimate. MileRecover must help without inventing.

#### Decision
All **reconstructed** mileage (calendar hints, imports, odometer recovery, gap suggestions) remains a **Recovery Suggestion** until the user explicitly accepts each entry. No bulk silent promotion to trips.

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Auto-fill from calendar | High completeness | Invents trips user didn't drive | Violates **never invent mileage** |
| One-tap "recover all" | Fast UX | User can't verify each entry | Violates **trust over automation** |
| Per-suggestion confirm | Honest; auditable | Slower | **Selected** |

#### Consequences
- **Positive:** Defensible recovery story; CPA-trusted exports
- **Negative:** More taps during tax season; Recovery UX must be fast
- **Follow-up:** Recovery Engine H1; MVP shows gaps only ([MVP.md](../planning/MVP.md))

#### Principle alignment
**Never invent mileage**, **trust over automation**, **AI assists but never replaces evidence**.

---

### DEC-005 — Recovery-first differentiation

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Founding team, Product

#### Context
Mileage tracking is a crowded market (MileIQ, Everlance, etc.). Competing on "more automatic trips" leads to phantom logs and commodity positioning.

#### Decision
Differentiate on **recovery and defensibility** — Proof Score, honest gaps, audit-ready export — not maximum auto-logged miles. Tagline: **Every work mile accounted for.**

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Auto-log parity + features | Familiar pitch | Race to bottom; trust erosion | Anti-principles |
| Expense suite breadth | Larger TAM | Dilutes mileage depth | **Accuracy over features** |
| Recovery + proof positioning | Unique; trust-aligned | Educates market | **Selected** |

#### Consequences
- **Positive:** Clear brand; aligns marketing and product ([07 Competitor Analysis.md](./07%20Competitor%20Analysis.md))
- **Negative:** Users expecting "magic" may churn early — onboarding must set expectations
- **Follow-up:** Manifesto and Beta messaging ([Manifesto.md](./Manifesto.md))

#### Principle alignment
All seven principles; strategic expression of **accuracy over features** and **trust over automation**.

---

### DEC-006 — No sale of location data

**Date:** 2026-07  
**Status:** Accepted  
**Deciders:** Founding team

#### Context
Location data is sensitive. Some apps monetize via ads or data partnerships. MileRecover's trust model forbids this.

#### Decision
MileRecover **will not sell**, **license**, or **share** user location or trip data with third parties for advertising, analytics resale, or data broker purposes. Monetization is subscription-only ([09 Pricing.md](./09%20Pricing.md)).

#### Alternatives considered

| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Anonymized data sales | Revenue stream | Destroys trust; user backlash | [Anti-Principles.md](./Anti-Principles.md) |
| Ad-supported free tier | Lower barrier | Wrong incentives; privacy risk | Rejected |
| Subscription only | Aligned incentives | Requires conversion | **Selected** |

#### Consequences
- **Positive:** Trust brand; simpler privacy story ([Security.md](../architecture/Security.md), Trust Rules E4)
- **Negative:** No ancillary revenue; must earn via product value
- **Follow-up:** Privacy policy and App Store nutrition labels

#### Principle alignment
**Trust over automation**, customer rights in [Company Constitution.md](./Company%20Constitution.md).

---

## Adding New Decisions

1. Assign next DEC-XXX id
2. Copy template above
3. Complete principle checklist
4. Link from affected architecture/planning docs
5. If decision contradicts Constitution → reject or amend Constitution first

---

## Related Documents

- [Company Constitution.md](./Company%20Constitution.md)
- [03 Core Principles.md](./03%20Core%20Principles.md)
- [Anti-Principles.md](./Anti-Principles.md)
- [System Architecture.md](../architecture/System%20Architecture.md)
