# MileRecover

**Every work mile accounted for.**

---

MileRecover is building the audit-ready mileage recovery platform for self-employed professionals. This repository is the **company operating system and engineering monorepo foundation** — vision, architecture, design, research, planning, and Phase 0 engineering governance.

**Current phase:** Phase 0 — engineering foundations (no production application yet)

---

## Philosophy

All documents align to seven core principles:

1. **Every work mile accounted for**
2. **Never invent mileage**
3. **Trust over automation**
4. **Accuracy over features**
5. **Battery friendly**
6. **Offline first**
7. **AI assists but never replaces evidence**

---

## Repository structure

```
milerecover-core/
├── apps/
│   ├── mobile/          # Future React Native app (not initialized)
│   └── backend/         # Future TypeScript modular monolith (not initialized)
├── packages/
│   ├── domain/          # Platform-independent product rules (future)
│   ├── contracts/       # Typed boundaries (future)
│   ├── config/          # Non-secret config schemas (future)
│   └── testing/         # Synthetic test helpers (future)
├── prototypes/          # Disposable validation A–J (briefs only in Phase 0)
├── tooling/             # CI scripts, schemas, synthetic fixtures
├── docs/                # Product, governance, ADRs
├── design/              # Design system and UX
├── architecture/        # Technical architecture
├── research/            # Market and domain research
├── planning/            # MVP, TIP, phases, sprints
└── api/                 # OpenAPI starter spec
```

**No production application exists yet.** React Native, backend services, databases, and cloud infrastructure are **not initialized**.

**Approved next stage after Phase 0 exit:** Phase 1 validation prototypes (iOS/Android tracking, bridge, battery) — see [Phase 0 Checklist.md](planning/Phase%200%20Checklist.md).

---

## Start Here

| If you are… | Read first |
|---|---|
| New to MileRecover | [docs/00 Vision.md](docs/00%20Vision.md) → [docs/Manifesto.md](docs/Manifesto.md) |
| **All roles (required)** | **[Product DNA](docs/Product%20DNA.md)** → **[PRD](docs/Product%20Requirements%20Document.md)** |
| **Engineering, QA, Security, Analytics, Support, Release ops (required)** | **[Technical Implementation Plan](planning/Technical%20Implementation%20Plan.md)** → **[Engineering Principles](docs/Engineering%20Principles.md)** → **[Phase 0 Checklist](planning/Phase%200%20Checklist.md)** |
| Product / growth / marketing | **[Growth and Sustainability Principles](docs/Growth%20and%20Sustainability%20Principles.md)** |
| Founding / leadership | [Company Constitution](docs/Company%20Constitution.md) → [Anti-Principles](docs/Anti-Principles.md) |
| Joining engineering | PRD → TIP → [System Architecture](architecture/System%20Architecture.md) → [ADR index](docs/adr/README.md) |
| Joining QA | PRD → TIP → [Trust Rules](docs/04%20Trust%20Rules.md) → [Synthetic Test Data Policy](docs/Synthetic%20Test%20Data%20Policy.md) |
| Planning a feature | PRD §24 → Trust Rules → TIP Definition of Ready (§29) |

### Engineering governance (Phase 0)

| Document | Purpose |
|---|---|
| [Engineering Principles](docs/Engineering%20Principles.md) | How we build |
| [Dependency and Vendor Policy](docs/Dependency%20and%20Vendor%20Policy.md) | Adding dependencies |
| [Synthetic Test Data Policy](docs/Synthetic%20Test%20Data%20Policy.md) | No real user data in dev |
| [Prototype Governance](planning/Prototype%20Governance.md) | Disposable validation lifecycle |
| [Phase 0 Checklist](planning/Phase%200%20Checklist.md) | Exit criteria |
| [docs/adr/](docs/adr/README.md) | Engineering ADRs |

### Primary app navigation (locked)

**Home · Review · Proof · Profile** — four tabs only (DEC-007).

---

## Phase 0 commands (safe checks only)

Requires Node.js 20+. No `npm install` needed.

```bash
npm run check:all
# or
node tooling/scripts/check-all.js
```

Individual checks: `check:docs`, `check:boundaries`, `check:sensitive-files`, `check:links`

**No build, start, mobile, backend, or deploy commands exist yet.**

---

## Document Index

### docs/ (product and governance)

| Document | Purpose |
|---|---|
| [Product DNA.md](docs/Product%20DNA.md) | Product source of truth |
| [Product Requirements Document.md](docs/Product%20Requirements%20Document.md) | Launch PRD |
| [Engineering Principles.md](docs/Engineering%20Principles.md) | Engineering values and decision filter |
| [Dependency and Vendor Policy.md](docs/Dependency%20and%20Vendor%20Policy.md) | Dependency evaluation |
| [Synthetic Test Data Policy.md](docs/Synthetic%20Test%20Data%20Policy.md) | Synthetic-only dev data |
| [Decision Log.md](docs/Decision%20Log.md) | Product decisions (DEC-XXX) |
| [Growth and Sustainability Principles.md](docs/Growth%20and%20Sustainability%20Principles.md) | Commercial governance |
| [04 Trust Rules.md](docs/04%20Trust%20Rules.md) | Enforceable trust rules |
| … | See full list in prior sections — vision, pricing, legal, personas |

### docs/adr/ (engineering)

| ADR | Title |
|---|---|
| [0001](docs/adr/0001-monorepo-workspace.md) | Monorepo workspace |
| [0002](docs/adr/0002-application-boundaries.md) | Application boundaries |
| [0003](docs/adr/0003-prototype-before-production.md) | Prototype before production |
| [0004](docs/adr/0004-no-real-user-data-in-development.md) | Synthetic data only |

### planning/

| Document | Purpose |
|---|---|
| [Technical Implementation Plan.md](planning/Technical%20Implementation%20Plan.md) | Authoritative engineering program |
| [Phase 0 Checklist.md](planning/Phase%200%20Checklist.md) | Phase 0 exit criteria |
| [Prototype Governance.md](planning/Prototype%20Governance.md) | Prototype lifecycle |
| [MVP.md](planning/MVP.md) | Launch scope |

### architecture/, design/, research/

Unchanged — see [System Architecture](architecture/System%20Architecture.md), [Experience Bible](design/Experience%20Bible.md), research index in git tree.

---

## Decision hierarchy

1. [Company Constitution](docs/Company%20Constitution.md)
2. [Core Principles](docs/03%20Core%20Principles.md)
3. [Trust Rules](docs/04%20Trust%20Rules.md)
4. [Product DNA](docs/Product%20DNA.md)
5. [PRD](docs/Product%20Requirements%20Document.md)
6. [Technical Implementation Plan](planning/Technical%20Implementation%20Plan.md)
7. Architecture specifications
8. **Engineering ADRs** (`docs/adr/`) — do not override product layers
9. [Decision Log](docs/Decision%20Log.md) — product decisions
10. Sprint plans

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

---

## Status

**Phase:** Phase 0 — engineering foundations  
**Last Updated:** July 2026  
**Application code:** Not started (by design)  
**Dependencies installed:** None (by design)

---

*MileRecover — Never invent mileage.*
