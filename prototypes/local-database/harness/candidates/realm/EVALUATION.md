# Realm — Prototype D evaluation (not measured in Node harness)

**Status:** Documented — **RN host benchmark pending**

## Approach

Realm provides object-database API with optional encryption (`EncryptionKey`). Strong for object graphs; audit-append and immutable evidence require discipline.

## Schema mapping

See [schema-mapping.json](./schema-mapping.json).

## What this candidate must prove (pending RN spike)

| Requirement | Evaluation approach |
|---|---|
| Transactions | `write` transaction wrapping trip + evidence + audit |
| Native Kotlin/Swift writes | Realm supports multiplatform but **sharing DB with native SQLite GPS path is problematic** |
| Encryption | Built-in — measure startup and migration cost on device |
| Audit history | Separate Realm object type; enforce append-only in domain layer |
| Migration | `schemaVersion` + migration function |
| Query flexibility | Review queue filter + sort performance |
| Bundle size | Measure APK/IPA delta vs SQLite-only |

## Known concerns (pre-evidence)

- Sharing database file with native SQLite inbox (Prototype B) is **not straightforward**
- Object migrations can be brittle for evidence-heavy models
- License and MongoDB stewardship — review [Dependency and Vendor Policy](../../../docs/Dependency%20and%20Vendor%20Policy.md)

## Benchmark status

| Scenario | Status |
|---|---|
| All harness scenarios | **Pending** — requires RN + Realm SDK on device |

## Production implication

Encryption story is attractive; native-write coordination risk is **high** until measured.
