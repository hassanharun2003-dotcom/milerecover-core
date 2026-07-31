# WatermelonDB — Prototype D evaluation (not measured in Node harness)

**Status:** Documented — **RN host benchmark pending**

## Approach

WatermelonDB sits on SQLite with a sync-oriented schema (`@nozbe/watermelondb`). MileRecover would use it primarily for **React Native observation** while native modules write GPS batches through a coordinated path.

## Schema mapping

See [schema-mapping.json](./schema-mapping.json) for conceptual table ↔ collection mapping.

## What this candidate must prove (pending RN spike)

| Requirement | Evaluation approach |
|---|---|
| Transactions | Multi-record batch writer + rollback test in RN JSI host |
| Native Kotlin writes | Measure conflict when native SQLite writes same DB file — **high risk** |
| Encryption | Requires SQLCipher plugin or OS-level encryption wrapper — not built-in |
| Audit append-only | Custom collection or separate `audit_events` table |
| Migration | WatermelonDB migrations API v1→v2 |
| Review queue read | Observable query on `trips` where status=pending |
| RN stability | Team-maintained; verify New Architecture compatibility at chosen RN version |

## Known concerns (pre-evidence)

- Native-direct GPS writes (Prototype B path) may bypass WatermelonDB — requires bridge or shared SQLite discipline
- Encryption is not first-class — extra layer needed
- Vendor coupling to Nozbe schema/sync patterns

## Benchmark status

| Scenario | Status |
|---|---|
| All harness scenarios | **Pending** — requires disposable RN host in `prototypes/local-database/rn-host/` (future) |

## Production implication

If selected, likely as **RN read/observation layer only**, not sole native write path — pending evidence.
