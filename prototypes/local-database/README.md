# Prototype D — Local encrypted database comparison

**TIP letter:** D  
**Status:** Harness prepared — **mobile/RN evidence pending**  
**Directory:** `prototypes/local-database/`

> **Warning:** Disposable validation — **do not import** into `apps/` or `packages/`.  
> **Goal:** Gather evidence — **not** to lock a production database yet.

---

## Question

Which local database approach supports native writes, RN reads, encryption, transactions, migrations, and audit history without corruption?

---

## Candidates evaluated

| Candidate | Harness location | Evidence status |
|---|---|---|
| SQLite + typed layer | [harness/candidates/sqlite-typed/](./harness/candidates/sqlite-typed/) | sql.js benchmarks |
| WatermelonDB | [harness/candidates/watermelon/](./harness/candidates/watermelon/) | Documented — RN pending |
| Realm | [harness/candidates/realm/](./harness/candidates/realm/) | Documented — RN pending |
| Native SQLite (Kotlin) | [harness/candidates/native-sqlite-kotlin/](./harness/candidates/native-sqlite-kotlin/) | Robolectric tests authored |
| Native SQLite (Swift) | [harness/candidates/native-sqlite-swift/](./harness/candidates/native-sqlite-swift/) | Pending |

---

## Quick start

```bash
# Structural SQL benchmarks (Node)
cd prototypes/local-database/harness
npm install
npm run benchmark

# Synthetic fixture sample
npm run generate:fixtures

# Native Kotlin tests (requires Android SDK)
cd candidates/native-sqlite-kotlin
./gradlew :app:testDebugUnitTest
```

---

## Artifacts

| Document | Purpose |
|---|---|
| [COMPARISON_MATRIX.md](./COMPARISON_MATRIX.md) | Criteria × candidate evidence |
| [RESULTS.md](./RESULTS.md) | Measured vs pending results |
| [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md) | Step-by-step validation |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | Prototype deps only |
| [scenarios/benchmark-scenarios.json](./scenarios/benchmark-scenarios.json) | Scenario definitions |
| [fixtures/](./fixtures/) | Synthetic data generators |

---

## Schema

Conceptual MileRecover local tables (v1/v2 SQL in `harness/lib/`):

- `trips` — mutable annotations
- `evidence_items` — immutable inserts
- `audit_events` — append-only
- `sync_queue` — outbound mutations
- `native_event_inbox` — native GPS inbox (Prototype B alignment)

---

## Success / failure (TIP)

| Success | Failure |
|---|---|
| No corruption on rollback (simulated) | Data loss on crash without detection |
| Audit linkage queries work | RN/native write conflict unresolved |
| Migration without row loss | Mobile review queue >200ms **unvalidated** |

---

## What this does NOT prove

- Production SQLCipher configuration
- WatermelonDB or Realm on device
- iOS Swift native module
- Phase 2 production schema

See [Prototype B](../android-tracking/RESULTS.md) — SQLiteOpenHelper there is **prototype-only**, not a production decision.

---

## Promotion

**Discard by default.** ADR required to lock production local DB (Phase 2 gate).

---

## Related

- [Technical Implementation Plan §9](../../planning/Technical%20Implementation%20Plan.md)
- [Data Model.md](../../architecture/Data%20Model.md)
