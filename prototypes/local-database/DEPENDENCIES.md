# Prototype D — Dependencies

**Scope:** `prototypes/local-database/` only — not production lock-in

---

## Node harness (`harness/`)

| Name | Version | Purpose | Production implication |
|---|---|---|---|
| sql.js | 1.10.3 | In-memory/WASM SQLite for structural SQL benchmarks | **None** — stand-in only, not mobile engine |

Install:

```bash
cd prototypes/local-database/harness
npm install
```

Produces `harness/package-lock.json` and `harness/node_modules/` — **gitignored**.

---

## Native Kotlin module (`harness/candidates/native-sqlite-kotlin/`)

| Name | Version | Purpose |
|---|---|---|
| Android Gradle Plugin | 8.2.2 | Build test APK |
| Kotlin | 1.9.22 | Language |
| androidx.core:core-ktx | 1.12.0 | Context |
| junit | 4.13.2 | Tests |
| robolectric | 4.11.1 | JVM Android SQLite tests |

Platform SQLite — no third-party DB SDK.

---

## Explicitly not added (pending RN host)

| Name | Why deferred |
|---|---|
| @nozbe/watermelondb | Requires React Native host |
| realm | Requires RN + native binaries evaluation |
| better-sqlite3 | Native Node addon — not mobile relevant |
| @op-engineering/op-sqlite | Candidate for future RN spike — not evaluated here |

---

## Security / data

- sql.js runs entirely in memory — no real user data
- Synthetic generators use fictional coordinate grid only

---

## Removal path

Delete `prototypes/local-database/harness/node_modules` and prototype Android build dirs; no production dependency graph affected.
