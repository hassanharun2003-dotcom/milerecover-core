# Prototype D — Local database comparison matrix

**Status:** Evidence gathering — **no production decision locked**  
**Last updated:** Generated with harness run (see RESULTS.md)

Legend:

| Evidence | Meaning |
|---|---|
| **MEASURED** | Benchmark or test produced numbers in this repo |
| **SIMULATED** | Structural stand-in (e.g. sql.js ≠ mobile SQLite) |
| **DOCUMENTED** | Architecture/policy analysis only |
| **PENDING** | Requires RN host, device, or SQLCipher spike |

---

## Requirement criteria (from TIP §9 + Data Model)

| Criterion | SQLite + typed layer | WatermelonDB | Realm | Native SQLite (Kotlin/Swift) |
|---|---|---|---|---|
| **Transactions** | MEASURED (sql.js) / SIMULATED | PENDING (RN host) | PENDING (RN host) | MEASURED pending Gradle — tests written |
| **Offline-first support** | DOCUMENTED ✓ | DOCUMENTED ✓ designed | DOCUMENTED ✓ | DOCUMENTED ✓ |
| **Encryption compatibility** | PENDING (SQLCipher spike) | PENDING (plugin/wrapper) | DOCUMENTED (built-in option) | PENDING (SQLCipher) |
| **Audit-history support** | MEASURED append query | DOCUMENTED | DOCUMENTED | MEASURED pending |
| **Performance (review queue)** | MEASURED sql.js ms — not mobile | PENDING | PENDING | PENDING device |
| **Migration strategy** | MEASURED ALTER v1→v2 | DOCUMENTED WDB migrations | DOCUMENTED schemaVersion | MEASURED onUpgrade test |
| **React Native compatibility** | DOCUMENTED good | DOCUMENTED good | DOCUMENTED moderate | DOCUMENTED bridge only |
| **Native Kotlin interop** | DOCUMENTED good w/ shared DB discipline | DOCUMENTED moderate conflict risk | DOCUMENTED high conflict risk | **Best** — MEASURED pending |
| **Native Swift interop** | DOCUMENTED good | DOCUMENTED moderate | DOCUMENTED moderate | PENDING Swift harness |
| **Background-thread safety** | DOCUMENTED (app responsibility) | DOCUMENTED | DOCUMENTED | DOCUMENTED native threads |
| **Query flexibility** | MEASURED SQL | DOCUMENTED observers | DOCUMENTED objects | MEASURED SQL |
| **Maintenance risk** | Low — DOCUMENTED | Medium — DOCUMENTED | Medium — vendor — DOCUMENTED | Low — DOCUMENTED |
| **Licensing** | SQLite PD — DOCUMENTED | Apache — DOCUMENTED | Apache — DOCUMENTED | SQLite PD — DOCUMENTED |
| **Vendor lock-in** | Low | Medium (Nozbe patterns) | Medium (Realm API) | Low |
| **Long-term sustainability** | High | Medium | Medium (MongoDB stewardship) | High |
| **Testing complexity** | Low — MEASURED Node harness | Medium — needs RN | Medium — needs RN | Medium — Robolectric/device |
| **Bundle size implications** | Smallest — DOCUMENTED | Medium — DOCUMENTED | Larger — DOCUMENTED | Smallest + native code |

---

## Scenario coverage

| Scenario ID | sqlite-typed | WatermelonDB | Realm | native-sqlite-kotlin |
|---|---|---|---|---|
| txn_trip_evidence_audit | MEASURED | PENDING | PENDING | Test authored — run pending |
| native_inbox_burst | MEASURED | PENDING | PENDING | Test authored — run pending |
| review_queue_read | MEASURED | PENDING | PENDING | PENDING |
| audit_trail_query | MEASURED | PENDING | PENDING | PENDING |
| migration_v1_v2 | MEASURED | PENDING | PENDING | Test authored — run pending |
| crash_rollback | MEASURED pass | PENDING | PENDING | Test authored — run pending |
| encryption_compatibility | PENDING | PENDING | PENDING | PENDING |
| rn_observation_latency | PENDING | PENDING | PENDING | N/A |

---

## Preliminary patterns (not a final recommendation)

| Pattern | Observation |
|---|---|
| Native GPS write + RN read | Native SQLite direct aligns with Prototype B; ORM layers need **shared-file coordination** evidence |
| Encryption | SQLCipher + typed SQL and Realm encryption are leading **candidates to spike** — not measured here |
| WatermelonDB | Strong RN offline story; native write path remains **highest unknown** |

**No winner declared.** See [RESULTS.md](./RESULTS.md).

---

## Related

- [Technical Implementation Plan §9](../../planning/Technical%20Implementation%20Plan.md)
- [architecture/Data Model.md](../../architecture/Data%20Model.md)
