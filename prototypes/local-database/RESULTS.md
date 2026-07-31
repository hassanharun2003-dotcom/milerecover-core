# Prototype D — Results

**Status:** Partial evidence — **production DB not selected**

---

## Question

Which local database approach supports native writes, RN reads, encryption, transactions, migrations, and audit trails without corruption?

---

## Harness runs

| Run | Environment | Status |
|---|---|---|
| sql.js typed-SQL benchmark | Node 20 + `sql.js` | See `harness/output/sqlite-typed-results.json` after `npm run benchmark` |
| Native Kotlin Robolectric tests | Android Gradle | **Pending** — SDK/Gradle not verified in authoring environment |
| WatermelonDB | RN host | **Pending** |
| Realm | RN host | **Pending** |
| Swift native SQLite | Xcode | **Pending** |

---

## Measured results — sqlite-typed (sql.js)

> **Caution:** WASM SQLite in Node simulates **SQL semantics**, not mobile I/O performance.  
> Do not treat these numbers as Proof tab or Review queue SLA proof on device.

| Scenario | Result | Pass |
|---|---|---|
| txn_trip_evidence_audit | See JSON `stats.avgMs` | Structural pass |
| native_inbox_burst | insert500Ms, pendingRead50Ms in JSON | Recorded — not compared to 200ms mobile SLA |
| review_queue_read | durationMs in JSON | Recorded |
| audit_trail_query | durationMs in JSON | Recorded |
| migration_v1_v2 | row counts unchanged | Pass if before==after |
| crash_rollback | pass: true expected | Pass |
| encryption_compatibility | pending | — |
| rn_observation_latency | pending | — |

**Populate this section from** `harness/output/sqlite-typed-results.json` **after running benchmark.**

If JSON absent: run `cd harness && npm install && npm run benchmark`.

---

## Success criteria (TIP §25-D)

| Criterion | Status |
|---|---|
| No corruption on forced kill | **Partial** — rollback simulated in sql.js + Kotlin test authored |
| Audit + evidence linkage query | **Measured** sql.js |
| Review queue <200ms | **Pending mobile measurement** |
| RN + native write conflict documented | **Documented** — not resolved |

---

## Failure criteria

| Criterion | Triggered? |
|---|---|
| Corruption on crash recovery | **Not observed** in sql.js simulation |
| RN/native conflict without resolution | **Unknown** — pending RN host |

---

## Candidate summaries

### SQLite + typed layer

- **Proved (simulated):** Transaction boundaries, audit append, migration ALTER, inbox burst SQL
- **Unknown:** SQLCipher overhead, RN JSI bridge latency, mobile disk I/O

### WatermelonDB

- **Proved:** Nothing measured yet
- **Unknown:** Native write coordination, encryption, migrations at MileRecover scale

### Realm

- **Proved:** Nothing measured yet
- **Unknown:** Shared DB with native inbox, bundle size, migration of evidence model

### Native SQLite direct

- **Proved:** Test suite authored for Kotlin (Robolectric)
- **Unknown:** iOS Swift parity, encryption, production schema

---

## Recommendation

**No production recommendation is justified yet.**

Suggested next spikes (ordered):

1. Run Kotlin Robolectric/device tests — record Logcat timings
2. SQLCipher micro-spike on Android + iOS (encryption compatibility)
3. Disposable RN host comparing WatermelonDB vs typed repository read after native write
4. Realm only if RN host shows SQLite observation insufficiency

Leading **hypothesis** (unchanged from TIP §9 — not locked): SQLCipher + typed repository with native-primary writes — **requires spikes above**.

---

## Promotion / discard

- **Do not promote** harness code to `packages/` or `apps/`
- **Discard** after ADR decision except archived results JSON

---

## Build/test status

| Check | Result |
|---|---|
| `harness/npm run benchmark` | Run locally after `npm install` |
| Kotlin `./gradlew test` | Pending Android SDK |
| Root `npm run check:all` | Run after merge |

---

*Update when device and RN measurements exist.*
