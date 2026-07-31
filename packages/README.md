# Shared packages

Platform-independent and cross-cutting libraries.

| Package | Purpose |
|---|---|
| [domain/](./domain/) | Product rules, types, validators |
| [contracts/](./contracts/) | DTOs, native events, API transport shapes |
| [config/](./config/) | Non-secret config schemas |
| [testing/](./testing/) | Synthetic fixtures and test helpers |

## Dependency rules

Documented in [tooling/schemas/boundary-rules.json](../tooling/schemas/boundary-rules.json) and ADR-0002.

**`domain` must not import apps, RN, native SDKs, databases, HTTP, or vendors.**

## Prohibited

- Prototype code
- Vendor SDK wrappers (unless promoted via ADR)
- Secrets

## Entry criteria

Phase 2+ for domain implementation; contracts may start in Phase 0 as type stubs only (future).
