# Native SQLite (Kotlin) — Prototype D mobile benchmark

**Status:** Implementation prepared — **device/emulator run pending**

Standalone Android module mirroring sql.js harness scenarios using platform `SQLiteOpenHelper`.

## Package

`com.milerecover.prototype.localdb.kotlin`

## Scenarios implemented

- Transaction bundle (trip + evidence + audit)
- Inbox burst (500 rows)
- Review queue read
- Audit trail query
- Migration v1→v2 (`ALTER TABLE`)
- Crash rollback simulation

## Build

Requires Android SDK (same as Prototype B).

```bash
cd prototypes/local-database/harness/candidates/native-sqlite-kotlin
./gradlew :app:connectedDebugAndroidTest   # device/emulator
./gradlew :app:testDebugUnitTest           # JVM-side logic where applicable
```

## Output

Tests write timing metrics to Logcat with tag `ProtoD.NativeSQLite` — **no coordinates logged**.

Copy results into [RESULTS.md](../../../RESULTS.md) after device run.

## What this proves

- Native Kotlin can meet transactional + audit + inbox patterns
- Does **not** prove RN read path or SQLCipher until separate spikes

## What this does not prove

- WatermelonDB / Realm coexistence
- iOS Swift parity (see native-sqlite-swift evaluation)
- Production encryption configuration
