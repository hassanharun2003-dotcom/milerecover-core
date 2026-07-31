# Mobile application (`apps/mobile`)

**Status:** Phase 0 placeholder — React Native **not initialized**

Future home of the MileRecover React Native application (DEC-001).

## Responsibilities

- Shared presentation and navigation (four tabs — DEC-007)
- Product orchestration, review, proof, profile flows
- Domain service wiring, sync client, export UI
- Native bridge consumption (typed contracts)

## Must not own

- Operating-system background location execution (Swift/Kotlin native modules)
- Raw GPS sampling or tracking state machine
- Backend business logic

## Prohibited in Phase 0

- `react-native init`, Expo production scaffold, UI screens
- Tracking implementation, subscriptions, recovery UI

## Entry criteria

Phase 0 exit + Phase 3+ for production shell (see TIP §26).

## Promotion

Native modules attach here in later phases — not copied from `prototypes/` without ADR review.

## References

- [architecture/Frontend.md](../architecture/Frontend.md)
- [adr/0002-application-boundaries.md](../docs/adr/0002-application-boundaries.md)
