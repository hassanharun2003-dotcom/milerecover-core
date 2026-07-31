# Backend application (`apps/backend`)

**Status:** Phase 0 placeholder — **not initialized**

Future TypeScript **modular monolith** (DEC-030): sync, auth, entitlements, jobs, server-assisted recovery.

## Responsibilities

- REST/sync API, subscription reconciliation, import/report jobs
- Authoritative server copy of user data (backup, multi-device)
- AI assist endpoints (suggestions only)

## Must not own

- Live trip capture (local + native)
- Autonomous trip or recovery record creation

## Prohibited in Phase 0

- PostgreSQL/Redis deployment, business route handlers, migrations
- Production infrastructure, secrets

## Entry criteria

Phase 6 primary production work; optional auth skeleton after Phase 1 tracking viability (TIP §27).

## References

- [architecture/Backend.md](../architecture/Backend.md)
- DEC-003, DEC-030
