# Synthetic fixtures

Approved **synthetic** test data for golden files and simulations.

## Allowed

- Hand-authored fake CSV rows (format-only)
- Synthetic route JSON with fictional labels
- Expected export snapshots with fake trips

## Prohibited

- Real customer imports
- Real GPS traces
- `sensitive/` or `private/` subfolders (gitignored)

## Review

Human review required before merge — no real addresses or client names.

See [Synthetic Test Data Policy.md](../../docs/Synthetic%20Test%20Data%20Policy.md).
