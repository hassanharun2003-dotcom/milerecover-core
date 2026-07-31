# Engineering Principles

**Status:** Foundational — Phase 0  
**Last Updated:** July 2026  
**Owner:** Engineering

These principles govern **how** MileRecover is built. Product behavior is defined in the PRD, Product DNA, and Trust Rules.

---

## Core engineering values

1. **Truth and data integrity first** — mileage records reflect evidence, not guesses.
2. **Native ownership of background tracking** — Swift/Kotlin own OS location and background execution (DEC-002).
3. **Offline-first operation** — capture and review work without network (DEC-003).
4. **Local operational source of truth** — encrypted local database for capture/review/export paths.
5. **Backend-independent capture** — active trip detection does not require API connectivity after setup.
6. **Explicit provenance** — every trip knows how it was created (auto, manual, recovered, import).
7. **Immutable evidence** — raw tracking batches and audit events are append-only.
8. **Mutable annotations with audit history** — user edits are allowed with logged changes.
9. **Idempotency** — sync mutations and native events dedupe safely.
10. **No naive last-write-wins** — conflicts surface to users or documented merge rules.
11. **Deterministic rules before AI** — calculations and state decisions prefer deterministic logic.
12. **AI suggestions never become records automatically** — user confirmation required (DEC-004).
13. **Narrow native bridges** — typed, versioned, testable contract between native and shared layers.
14. **Typed contracts** — domain, transport, and native event types stay distinct.
15. **Privacy by minimization** — collect and log the minimum necessary; no coordinates in analytics.
16. **Synthetic data only** — no real user routes or imports in development (ADR-0004).
17. **Small-team operational simplicity** — boring, operable systems over resume-driven architecture.
18. **Managed services without unnecessary lock-in** — extractable data and documented exit paths.
19. **Modular monolith before microservices** — one deployable backend at launch (DEC-030).
20. **Observability without sensitive payloads** — diagnostics use enums and redaction.
21. **Feature flags cannot bypass trust rules** — no silent trip creation or privacy weakening.
22. **Prototype before committing to risky infrastructure** — TIP §25, ADR-0003.
23. **Boring technology is acceptable** when it improves reliability.
24. **Dependencies must justify maintenance and security cost** — see Dependency and Vendor Policy.

---

## Technical decision filter

Before adopting a library, service, or pattern, answer:

| Question | Must be |
|---|---|
| Does this preserve truth? | Yes |
| Does capture work without the backend? | Yes (for capture path) |
| Does it work offline where required? | Yes |
| Is provenance preserved? | Yes |
| Is rollback possible? | Yes |
| Does it expose sensitive data? | No |
| Does it create unnecessary vendor lock-in? | No / mitigated |
| Can a small team operate it safely? | Yes |
| Has the risky assumption been validated? | Yes (prototype if high-risk) |
| Does it contradict a locked product decision? | No |

If any answer fails, stop or escalate to ADR + founder review.

---

## Related documents

- [03 Core Principles.md](./03%20Core%20Principles.md)
- [04 Trust Rules.md](./04%20Trust%20Rules.md)
- [Technical Implementation Plan.md](../planning/Technical%20Implementation%20Plan.md)
- [Dependency and Vendor Policy.md](./Dependency%20and%20Vendor%20Policy.md)
- [adr/0002-application-boundaries.md](./adr/0002-application-boundaries.md)

---

*Never invent mileage — in product or in engineering shortcuts.*
