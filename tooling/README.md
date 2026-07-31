# Tooling

Repository scripts, schemas, and synthetic fixtures — **no product behavior**.

| Path | Purpose |
|---|---|
| [scripts/](./scripts/) | Dependency-free validation scripts |
| [schemas/](./schemas/) | Boundary rules, future JSON schemas |
| [fixtures/](./fixtures/) | Approved synthetic test data |

## Prohibited

- Production app logic
- Secrets, real user data
- Long-running services

## Commands

```bash
npm run check:all
```

See [Phase 0 Checklist.md](../planning/Phase%200%20Checklist.md).
