# Applications

Future deployable applications live here.

| Path | Purpose |
|---|---|
| [mobile/](./mobile/) | React Native shared UI and product orchestration |
| [backend/](./backend/) | TypeScript modular monolith (DEC-030) |

## Allowed

- Application entrypoints (future)
- Platform wiring and dependency injection (future)
- App-specific configuration schemas (non-secret)

## Prohibited

- Domain business rules (belong in `packages/domain`)
- Disposable prototype code (belong in `prototypes/`)
- Secrets, `.env`, keystores
- Real user data fixtures

## Entry criteria

Phase 0 complete; Phase 1+ per [Technical Implementation Plan.md](../planning/Technical%20Implementation%20Plan.md).

## References

- ADR-0001, ADR-0002
- DEC-001, DEC-002, DEC-030
