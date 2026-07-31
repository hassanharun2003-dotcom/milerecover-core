# MileRecover System Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Engineering / Architecture

---

## Architecture Mission

Build a system where **every work mile accounted for** is technically true: captured reliably, stored locally first, verified by users, scored for defensibility, and exported with audit trails.

**Never invent mileage** is an architectural invariant, not a UI promise.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile Clients                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   UI Layer   │  │  Domain /    │  │  Native Tracking     │ │
│  │  (RN + Native│  │  Application │  │  Engine (Platform)   │ │
│  │   Modules)   │  │  Logic       │  │  iOS / Android       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           ▼                                     │
│              ┌────────────────────────┐                         │
│              │   Local Database       │  ← Source of truth     │
│              │   (Offline First)      │    during capture      │
│              └───────────┬────────────┘                         │
│                          │ Sync Engine                         │
└──────────────────────────┼──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (Cloud)                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ API      │  │ Sync /       │  │ Recovery   │  │ AI        │ │
│  │ Gateway  │  │ Conflict     │  │ Engine     │  │ Service   │ │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
│       └───────────────┼────────────────┼───────────────┘       │
│                       ▼                ▼                        │
│              ┌─────────────────────────────────┐               │
│              │     PostgreSQL (+ PostGIS)      │               │
│              └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Subsystems

| Subsystem | Document | Responsibility |
|---|---|---|
| Frontend | [Frontend.md](./Frontend.md) | Mobile UI, state, UX flows |
| Native Tracking Engine | [Native Tracking Engine.md](./Native%20Tracking%20Engine.md) | GPS capture, drive detection |
| Recovery Engine | [Recovery Engine.md](./Recovery%20Engine.md) | Gap suggestions from evidence |
| Proof Score | [Proof Score.md](./Proof%20Score.md) | Defensibility scoring |
| AI Architecture | [AI Architecture.md](./AI%20Architecture.md) | Bounded AI assist |
| Database | [Database.md](./Database.md) | Schema, sync, local storage |
| Offline First | [Offline First.md](./Offline%20First.md) | Sync, conflicts, local SOT |
| API | [API.md](./API.md) | REST/sync endpoints |
| Security | [Security.md](./Security.md) | Auth, encryption, privacy |
| Integrations | [Integrations.md](./Integrations.md) | Third-party connections |

---

## Architectural Principles

1. **Local-first writes** — all trip mutations commit locally before sync
2. **Evidence chain** — trip links to raw sensor batches; immutable audit log
3. **Fail closed on invention** — services reject trip creation without evidence pointer
4. **Battery budget** — tracking engine reports energy metrics; adaptive modes
5. **AI isolation** — AI service cannot write trips directly; suggestions only
6. **Deterministic sync** — conflict resolution rules are documented and testable

---

## Data Flow: Trip Lifecycle

```
1. Native Tracking Engine detects movement
2. Raw location batch → local `location_samples` table
3. Trip inference (on-device) → draft trip in `trips` (status: pending)
4. User reviews → status: confirmed | personal | rejected
5. Proof Score calculated → stored on trip
6. Sync engine pushes to cloud (encrypted)
7. Export service reads confirmed trips + scores + metadata
```

Manual and recovery trips insert at step 3 with appropriate source tag.

---

## Technology Stack (Proposed)

| Layer | Technology | Rationale |
|---|---|---|
| Mobile UI | React Native | Cross-platform velocity; native modules for tracking |
| Native modules | Swift / Kotlin | Platform GPS APIs, battery optimization |
| Local DB | SQLite (WatermelonDB or similar) | Offline-first, relational |
| Backend | Node.js or Go | Team preference TBD |
| Database | PostgreSQL + PostGIS | Geospatial queries, reliability |
| Cache/Queue | Redis | Sync jobs, rate limiting |
| Object storage | S3-compatible | Odometer photos, export archives |
| AI | Managed LLM + on-device ML | Hybrid; offline fallback |

**No code in this repository yet.**

---

## Deployment Architecture

| Environment | Purpose |
|---|---|
| Development | Local + simulators |
| Staging | Full stack, test data |
| Production | Multi-AZ, US region primary |

Mobile: TestFlight + Play Internal → Production phased rollout (5% → 25% → 100%)

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Availability (API) | 99.9% |
| Sync latency (p95) | <5s when online |
| Offline data loss | 0% |
| Location data retention | User-configurable; default 7 years |
| RPO / RTO | 1h / 4h |

---

## Related Documents

- [../docs/03 Core Principles.md](../docs/03%20Core%20Principles.md)
- [Backend.md](./Backend.md)
- [../planning/MVP.md](../planning/MVP.md)
