# Architecture Decision Records (ADR)

Engineering decisions that affect implementation structure, boundaries, tooling, and technical tradeoffs are recorded here.

## Relationship to other documents

| Document | Purpose |
|---|---|
| [Decision Log.md](../Decision%20Log.md) | **Product** and founder decisions (DEC-XXX) |
| **ADRs (this folder)** | **Engineering** decisions |
| [Technical Implementation Plan.md](../../planning/Technical%20Implementation%20Plan.md) | Phase program and gates |

**ADRs may not override:** Company Constitution, Core Principles, Trust Rules, PRD, Product DNA, or locked Decision Log entries.

## Status values

- **Proposed** — under discussion
- **Accepted** — active guidance
- **Superseded** — replaced by a newer ADR (keep file for history)
- **Rejected** — considered and declined (keep file for history)

## Process

1. Copy [0000-template.md](./0000-template.md)
2. Assign the next sequential number (`0005-...`)
3. Open PR with architecture review
4. Link from affected architecture or planning docs
5. If a decision locks a vendor or runtime, require validation evidence (prototype or benchmark)

## Index (Phase 0)

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-monorepo-workspace.md) | Monorepo workspace layout | Accepted |
| [0002](./0002-application-boundaries.md) | Application and package boundaries | Accepted |
| [0003](./0003-prototype-before-production.md) | Prototype before production commitment | Accepted |
| [0004](./0004-no-real-user-data-in-development.md) | Synthetic data only in development | Accepted |

Validation-required choices (local DB, maps, entitlements vendor, etc.) **do not** get ADRs until evidence exists.
