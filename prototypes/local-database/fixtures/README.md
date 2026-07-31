# Synthetic fixtures — Prototype D

Generated datasets for local database benchmarks.

## Rules

- **Synthetic coordinates only** — fictional grid starting at (10.0, 10.0)
- No real customer names, routes, or imports
- **Do not commit** generated `.db` files or full-size exports with `controlled_evidence`

## Generate

```bash
cd prototypes/local-database/harness
npm run generate:fixtures
```

Produces `fixtures/synthetic-sample.json` (small structural sample).

Full benchmark datasets are generated in-memory during harness runs.
