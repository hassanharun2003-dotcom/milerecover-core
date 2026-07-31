# Prototype C — Platform parity matrix

**Status:** Android implemented; iOS source ready — **iOS compile validation pending**

Legend: ✅ Implemented | ⏳ Pending device/compile | — N/A

---

## Bridge methods

| JS method | Android | iOS | Inputs | Outputs | Error codes | Idempotency | Offline | Lifecycle notes | Validation |
|---|---|---|---|---|---|---|---|---|---|
| `getBridgeApiVersion` | ✅ Kotlin | ⏳ Swift | — | string | bridge_unavailable | Yes | Yes | Safe before JS ready | Jest mock ✅ / device ⏳ |
| `getContractVersion` | ✅ | ⏳ | — | string | bridge_unavailable | Yes | Yes | — | ⏳ |
| `getSupportedSchemaVersions` | ✅ | ⏳ | — | number[] | — | Yes | Yes | — | ⏳ |
| `generateSyntheticEvents` | ✅ | ⏳ | count, sessionId | inserted, duplicateRejected | persistence_failure | No | Yes | Native persists before JS | Robolectric buffer ✅ |
| `fetchPendingEvents` | ✅ | ⏳ | batchSize | events[], hasMore, fetchedCount | invalid_batch_size, fetch_failure | Delivery idempotent | Yes | **Pull authoritative** | Jest ✅ / device ⏳ |
| `acknowledgeEvents` | ✅ | ⏳ | eventIds[] | acknowledged, alreadyAcknowledged, unknown, failed | acknowledgment_failure | Ack idempotent | Yes | Unknown IDs explicit | Jest ✅ |
| `getBufferStats` | ✅ | ⏳ | — | stats map | — | Yes | Yes | — | ⏳ |
| `exportSanitizedDiagnostics` | ✅ | ⏳ | — | sanitized map/json | serialization_failure | Yes | Yes | No coordinates | Jest + Robolectric ✅ |
| `clearPrototypeData` | ✅ | ⏳ | — | null | — | No | Yes | Wipes prototype DB/file | Jest ✅ |
| `simulateUnsupportedSchemaEvent` | ✅ | ⏳ | — | rejected flag | — | — | Yes | Does not auto-ack | ⏳ |
| `simulateDuplicateInsertion` | ✅ | ⏳ | — | duplicateRejected | — | — | Yes | UNIQUE constraint | Robolectric ✅ |

---

## Push hint event

| Event | Android | iOS | Semantics | Validation |
|---|---|---|---|---|
| `PrototypeEventsAvailable` | ✅ DeviceEventManager | ⏳ RCTEventEmitter | Wake-up only; **not** durable delivery | Documented ⏳ device |

---

## Error envelope (JavaScript)

All native rejections map to prototype error shape:

```typescript
{ code, message, retryable, affectedEventIds, nativeComponent, contractVersion }
```

Categories: `unsupported_schema`, `malformed_event`, `buffer_unavailable`, `persistence_failure`, `fetch_failure`, `acknowledgment_failure`, `unknown_event`, `invalid_batch_size`, `serialization_failure`, `bridge_unavailable`, `prototype_fault`.

---

## Contract version

| Layer | Value |
|---|---|
| Event schema major | 1 |
| Bridge API | `1.0.0-prototype-c` |
| Max batch (calibration) | 100 |

---

## Android vs iOS semantic equivalence

| Behavior | Android | iOS | Match? |
|---|---|---|---|
| Persist before delivery | SQLite | JSON file | ✅ equivalent semantics |
| No delete-on-delivery | ✅ | ✅ | ✅ |
| Ordered by sequenceNumber | ✅ | ✅ | ✅ |
| Duplicate session+seq rejected | ✅ | ✅ | ✅ |
| Partial batch ack | ✅ | ✅ | ✅ |
| Sanitized diagnostics | ✅ | ✅ | ✅ |

Material divergence: **none identified in source review** — device proof pending for iOS.

---

## Related

- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
- [ios/README.md](./ios/README.md)
