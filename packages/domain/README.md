# `packages/domain`

Platform-independent product logic and types.

## Allowed (future)

- Trust Rule validators
- Proof Score rules (deterministic)
- Entitlement rule helpers (tier limits — not store SDK)
- Recovery candidate lifecycle rules (no auto-trip)
- Pure functions and domain types

## Prohibited

- React, React Native, Swift, Kotlin imports
- SQLite, Realm, WatermelonDB, HTTP clients
- Analytics, maps, crash SDKs
- UI components

## References

- [04 Trust Rules.md](../../docs/04%20Trust%20Rules.md)
- ADR-0002
