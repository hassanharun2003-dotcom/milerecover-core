# Package 1 — Android JVM CI failure summary

**Run:** [30673875539](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30673875539)  
**Commit:** `ab0bef8`  
**Reproduced locally:** yes (Gradle `:app:testDebugUnitTest`, JDK 17, Android SDK 34)

## Failed tests (3 of 20)

| Class | Method | Classification | Root cause |
|-------|--------|----------------|------------|
| `NativeEventSerializerTest` | `roundTrip_preservesFields` | Test-environment defect | Plain JUnit test calls `JSONObject.put` without Robolectric — "Method put in org.json.JSONObject not mocked" |
| `SqliteEventBufferTest` | `duplicateIdempotencyKey_rejected` | Robolectric/SQL compatibility | `incrementStat()` used `INSERT ... ON CONFLICT DO UPDATE` — unsupported by Robolectric SQLite (syntax error near `ON`) |
| `SqliteEventBufferTest` | `duplicateSessionSequence_rejected` | Implementation + Robolectric | UNIQUE violation throws `SQLiteConstraintException`; catch only checked message for `"UNIQUE"`, not exception type/cause chain |

## Passing SqliteEventBuffer tests (6/8)

- `insert_preservesSequenceOrderingOnFetch`
- `unsupportedSchema_rejectedByIngestGate`
- `persistence_survivesBufferRecreation`
- `failedProcessing_doesNotAcknowledge`
- `acknowledge_partialBatch_leavesRemainingPending`
- `fetchOrderedPending_respectsLimit`

## Repairs applied

1. `NativeEventSerializerTest` — add `@RunWith(RobolectricTestRunner)` + `@Config(sdk = [28])`
2. `SqliteEventBuffer.incrementStat` — portable SELECT/UPDATE/INSERT upsert (works on device + Robolectric)
3. `SqliteEventBuffer.insert` — `isUniqueConstraintViolation()` handles `SQLiteConstraintException` and cause chain

## Not claimed

- Physical-device FGS/process-death lifecycle (Package 2 / manual harness)
