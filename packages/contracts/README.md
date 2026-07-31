# `packages/contracts`

Typed boundaries between mobile, native modules, backend, and jobs.

## Allowed (future)

- Native bridge event schemas (`bridgeVersion`, event IDs)
- Sync DTOs and API transport types
- Import row shapes, report metadata types
- Distinction: domain records vs transport records vs native events

## Prohibited

- UI components
- Vendor SDK implementations
- Business rule enforcement (belongs in `domain`)
- Raw GPS in default analytics contract fields

## References

- [architecture/API.md](../../architecture/API.md)
- [Native Tracking Engine.md](../../architecture/Native%20Tracking%20Engine.md)
