# ADR-0002 — Application and package boundaries

**Status:** Accepted  
**Date:** 2026-07-31  
**Owners:** Mobile Engineering Lead, Backend Lead

## Decision scope

Dependency direction and responsibility split between shared mobile, native modules, backend, domain, and contracts.

## Context

MileRecover's highest technical risk is background tracking reliability and trust-preserving data flow. Business logic trapped in UI, native code depending on React, or backend becoming required for capture would violate locked architecture (DEC-002, DEC-003, DEC-030).

## Decision

| Layer | Owns | Must not own |
|---|---|---|
| **Native iOS (Swift)** | OS location, motion, background execution, native buffer | Business classification, React UI |
| **Native Android (Kotlin)** | FGS, fused location, reboot recovery, native buffer | Business classification, React UI |
| **`apps/mobile`** | RN UI, orchestration, sync client, review/export UX | Raw GPS sampling, OS background policy |
| **`packages/domain`** | Platform-independent rules, types, validators | RN, native SDKs, DB, HTTP, vendors |
| **`packages/contracts`** | Transport DTOs, native event schemas, API shapes | UI, vendor SDKs, implementations |
| **`apps/backend`** | Sync, entitlements reconcile, server-assisted jobs | Live trip capture requirement |

**Rules:**

- **`packages/domain`** may not import from apps, React Native, native platforms, persistence, network, analytics, or vendors.
- **`packages/contracts`** defines schemas only — no UI or vendor implementations.
- **`apps/mobile`** may depend on `domain` and `contracts`.
- Native modules may depend on `contracts` only — not React UI.
- **`apps/backend`** may depend on `domain` and `contracts` but **must not** be required for active offline capture after initial setup.
- **Local encrypted database** is the operational source of truth for capture and review (DEC-003).
- **Recovery candidates** remain separate from trips until explicit user confirmation (DEC-004, DEC-021).

## Alternatives considered

| Option | Outcome |
|---|---|
| All logic in React Native | Rejected — background tracking (DEC-002) |
| Server-primary capture | Rejected — offline-first (DEC-003) |
| Shared native C++ core day one | Deferred — team size |

## Consequences

- **Positive:** Testable domain; narrow bridges; capture survives backend outage
- **Negative:** Contract maintenance overhead
- **Follow-up:** Enforce with `check:boundaries` as source grows

## Validation evidence

Enforced by `tooling/schemas/boundary-rules.json` and CI boundary check.

## Security / privacy impact

Contracts must not embed raw coordinates in analytics event shapes.

## Offline impact

Capture and review paths must not call backend synchronously.

## Migration or rollback

Boundary changes require ADR update and boundary-rules.json revision.

## Related product decisions

DEC-001, DEC-002, DEC-003, DEC-004, DEC-021, DEC-030

## Related documents

- [Frontend.md](../../architecture/Frontend.md)
- [Offline First.md](../../architecture/Offline%20First.md)
- [Native Tracking Engine.md](../../architecture/Native%20Tracking%20Engine.md)
