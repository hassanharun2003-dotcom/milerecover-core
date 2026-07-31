# Contributing to MileRecover

**Repository:** `milerecover-core` — product OS + Phase 0 engineering monorepo foundation  
**Last Updated:** July 2026

---

## What this repository is

- Product vision, PRD, architecture, design, research, planning
- Phase 0 engineering governance: ADRs, CI checks, prototype briefs, workspace layout
- **Future** application code in `apps/` and `packages/` — not implemented in Phase 0

---

## Before you change anything

1. [Company Constitution](docs/Company%20Constitution.md) and [Core Principles](docs/03%20Core%20Principles.md)
2. [Trust Rules](docs/04%20Trust%20Rules.md) and [Product DNA](docs/Product%20DNA.md)
3. [Technical Implementation Plan](planning/Technical%20Implementation%20Plan.md) for engineering work
4. [Engineering Principles](docs/Engineering%20Principles.md) and relevant [ADR](docs/adr/README.md)

---

## Decision precedence

| Type | Where to record |
|---|---|
| Product / founder decision | [Decision Log](docs/Decision%20Log.md) (DEC-XXX) |
| Engineering / architecture decision | [docs/adr/](docs/adr/) |
| Phase or gate change | TIP + Product approval |

ADRs and code **must not** override Constitution, Trust Rules, PRD, or locked DEC entries.

---

## Pull request workflow

1. Branch from `main` (or team default)
2. Run `npm run check:all` (Node 20+, no install required)
3. Complete [.github/pull_request_template.md](.github/pull_request_template.md)
4. Update living docs when boundaries or behavior change
5. Add ADR for engineering forks; Decision Log for product forks

### Branch naming (recommended)

- `docs/…`, `phase0/…`, `prototype/a-ios-tracking`, `feat/…` (post–Phase 4)

### Commit messages

Complete sentences; state **why**. Example: `Add ADR-0004 synthetic data policy for Phase 0 CI`.

---

## Required checks (Phase 0)

| Check | Command |
|---|---|
| All repository checks | `npm run check:all` |
| Foundation files | `npm run check:docs` |
| Import boundaries | `npm run check:boundaries` |
| Sensitive filenames | `npm run check:sensitive-files` |
| Doc links | `npm run check:links` |

CI runs the same checks on pull requests ([repository-quality.yml](.github/workflows/repository-quality.yml)).

---

## No real data, no secrets

- Never commit `.env`, keys, keystores, local databases, or real user exports
- Never commit exact routes, customer coordinates, calendar content, or import files
- See [Synthetic Test Data Policy](docs/Synthetic%20Test%20Data%20Policy.md) and [SECURITY.md](SECURITY.md)

---

## Dependencies

Phase 0 has **no production dependencies**. When adding packages:

1. Complete [Dependency and Vendor Policy](docs/Dependency%20and%20Vendor%20Policy.md) evaluation
2. No vendor lock from a prototype trial alone
3. No analytics/crash/maps SDK receiving raw location data

---

## Prototypes

- Work only in `prototypes/<name>/` until promotion review
- Follow brief README + [Prototype Governance](planning/Prototype%20Governance.md)
- Default disposition: **discard** after report
- Prototype code **must not** be imported by `apps/` or `packages/` without ADR

---

## Feature implementation readiness

Do not implement product features until TIP Definition of Ready (§29) and phase prerequisites are met. Phase 0 does not authorize tracking, UI, sync, subscriptions, or backend business logic.

---

## Documentation expectations

- Cross-link related OS documents
- Status header: Foundational | Living | Draft | Planned
- Separate product behavior, technical decisions, and implementation notes

---

## Security escalation

Do not file public issues with vulnerability details. See [SECURITY.md](SECURITY.md) and [Incident Response Runbook](architecture/Incident%20Response%20Runbook.md).

---

## Review expectations (small team)

- One engineering reviewer for code; product reviewer for PRD-impacting changes
- Security review for dependencies, auth, or data handling
- QA review for test data and fixture policy

---

## Related

- [README.md](README.md)
- [Phase 0 Checklist](planning/Phase%200%20Checklist.md)

---

*Trust over automation — including in process.*
