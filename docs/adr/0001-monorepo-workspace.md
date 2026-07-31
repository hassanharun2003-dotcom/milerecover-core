# ADR-0001 — Monorepo workspace layout

**Status:** Accepted  
**Date:** 2026-07-31  
**Owners:** Engineering / Architecture

## Decision scope

Repository structure, workspace tooling, and placement of future apps, packages, prototypes, and tooling.

## Context

MileRecover requires shared domain logic, typed contracts, native modules, backend services, and disposable validation prototypes. A small team needs clear boundaries without premature microservice or multi-repo overhead.

## Decision

1. Use a **single monorepo** (`milerecover-core`) with top-level:
   - `apps/mobile` — future React Native application
   - `apps/backend` — future TypeScript modular monolith
   - `packages/*` — shared domain, contracts, config, testing
   - `prototypes/*` — disposable validation work (TIP §25 A–J)
   - `tooling/*` — scripts, schemas, synthetic fixtures
   - Existing `docs/`, `architecture/`, `design/`, `planning/`, `research/`, `api/` remain product/architecture documentation

2. Use **pnpm workspaces** as the Phase 0 package manager / workspace tool (`pnpm-workspace.yaml`). This is an **engineering tooling** choice, not a product architecture decision.

3. Root `package.json` defines **repository checks only** in Phase 0 — no production build scripts.

4. **Do not lock** in this ADR: React Native version, backend web framework, local database library, cloud host, or third-party vendors.

## Alternatives considered

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Separate mobile and backend repos | Isolation | Contract drift, slower cross-cutting changes | Rejected for launch phase |
| npm/yarn workspaces | Familiar | pnpm stricter hoisting aids boundaries | Rejected |
| Turborepo/Nx immediately | Caching | Extra complexity before code exists | Deferred |

## Consequences

- **Positive:** One PR can update contracts + docs; clear prototype isolation
- **Negative:** Discipline required to prevent prototype → production leakage
- **Follow-up:** Revisit workspace orchestration (Turborepo) when apps have real builds

## Validation evidence

N/A — foundational layout.

## Security / privacy impact

Centralized `.gitignore` and sensitive-file checks apply repo-wide.

## Offline impact

None at repository level.

## Migration or rollback

Structure changes require ADR supersession and checklist update.

## Related product decisions

DEC-001 (React Native), DEC-030 (modular monolith backend)

## Related documents

- [Technical Implementation Plan.md](../../planning/Technical%20Implementation%20Plan.md) §26 Phase 0
- [Phase 0 Checklist.md](../../planning/Phase%200%20Checklist.md)
- [0002-application-boundaries.md](./0002-application-boundaries.md)
