# Prototypes

Disposable **technical validation** work (TIP §25, ADR-0003).

## Rules

- Each subdirectory maps to a TIP prototype letter (A–J)
- Prototype code **must not be imported** by `apps/` or `packages/` unless formally promoted after ADR review
- Default disposition: **discard** after report
- Synthetic data only — [Synthetic Test Data Policy.md](../docs/Synthetic%20Test%20Data%20Policy.md)

## Lifecycle

See [Prototype Governance.md](../planning/Prototype%20Governance.md).

## Prohibited shortcuts (never)

- Real secrets
- Unauthorized real user location data
- Silent mileage creation

## Entry criteria

Phase 0 exit approval → Phase 1 begins prototypes A, B, C, I.
