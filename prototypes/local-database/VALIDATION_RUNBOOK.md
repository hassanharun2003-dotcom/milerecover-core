# Prototype D — Validation runbook

## Prerequisites

- Node.js 20+
- Optional: Android Studio + SDK for Kotlin module
- Optional: Future RN disposable host (not in this pass)

---

## 1. Generate synthetic fixtures

```bash
cd prototypes/local-database/harness
npm install
npm run generate:fixtures
```

Verify `fixtures/synthetic-sample.json` contains `"synthetic": true` markers — no real addresses.

---

## 2. Run sql.js benchmark harness

```bash
cd prototypes/local-database/harness
npm run benchmark
```

**Expected artifacts:**

- `harness/output/sqlite-typed-results.json`
- `harness/output/summary.json`

Copy key timings into [RESULTS.md](./RESULTS.md).

---

## 3. Run native Kotlin benchmarks

```bash
cd prototypes/local-database/harness/candidates/native-sqlite-kotlin
./gradlew :app:testDebugUnitTest
```

Capture Logcat lines tagged `ProtoD.NativeSQLite`.

---

## 4. WatermelonDB (pending)

1. Create disposable RN host (future task — not Prototype D this pass)
2. Implement schema from `candidates/watermelon/schema-mapping.json`
3. Run scenarios in [benchmark-scenarios.json](./scenarios/benchmark-scenarios.json)
4. Document native write conflict behavior

---

## 5. Realm (pending)

Same as WatermelonDB using `candidates/realm/schema-mapping.json`.

---

## 6. Encryption spike (pending)

| Step | Action |
|---|---|
| 1 | Integrate SQLCipher on Android test app |
| 2 | Measure open/read/write overhead vs plain SQLite |
| 3 | Repeat on iOS with Keychain-wrapped key |
| 4 | Record in COMPARISON_MATRIX encryption row |

---

## 7. RN observation latency (pending)

Measure time from native inbox insert → RN UI query update for each candidate.

---

## Pass/fail recording

Use table in [RESULTS.md](./RESULTS.md). Do not claim mobile SLA from sql.js alone.

---

## Privacy

- No real routes in datasets
- Do not commit `.db` files or `harness/output/` with controlled evidence
- Add `harness/output/*.json` to local ignore if containing sensitive research exports

---

## Related

- [COMPARISON_MATRIX.md](./COMPARISON_MATRIX.md)
- [Prototype Governance.md](../../planning/Prototype%20Governance.md)
