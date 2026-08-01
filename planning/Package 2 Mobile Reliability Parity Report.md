# Package 2 — Mobile Reliability Parity Report

**Date:** 1 August 2026  
**Contract:** major `1` · API `1.0.0-prototype-c` · RN `0.76.5`  
**Lanes:** Android `milestone/android-validation` · iOS `milestone/ios-readiness`

---

## Summary

| Area | Android | iOS | Match |
|------|---------|-----|-------|
| Event envelope fields | Kotlin `NativeEvent` | Swift `NativeEventEnvelope` | **Yes** (same semantic fields) |
| Schema major | `1` (PrototypeConfig) | `NativeEventEnvelope.contractMajor = 1` | **Yes** |
| Bridge API version | `1.0.0-prototype-c` | `NativeEventEnvelope.bridgeApiVersion` | **Yes** |
| Max batch size | 100 | 100 | **Yes** |
| Insertion ordering | `sequenceNumber` ascending | `sequenceNumber` ascending | **Yes** |
| Fetch semantics | pending → delivered on fetch | pending → delivered on fetch | **Yes** |
| Acknowledgement | partial / idempotent / unknown IDs | partial / idempotent / unknown IDs | **Yes** |
| Duplicate handling | idempotency key + session/seq UNIQUE | sessionId:sequenceNumber duplicate | **Yes** (mechanism differs, outcome same) |
| Unsupported schema | `EventIngestGate` → rejected | Not native-ingested (bridge subset) | **Partial** — iOS buffer tests use valid schema only |
| Persistence | SQLite file | Application Support JSON | **Yes** (different store, same durability intent) |
| Replay | pending survives process death (JVM + device harness) | pending survives re-init (XCTest) | **Yes** at prototype level |
| Diagnostics privacy | coordinate redaction in export | `DiagnosticSanitizer` coordinate exclusion | **Yes** |
| Failed processing ack | never ack failed events | delivered-not-ack until explicit ack | **Yes** |

**Unresolved contract mismatch:** none requiring shared `contract/` change.

---

## Evidence layers

| Layer | Android | iOS |
|-------|---------|-----|
| Pure JVM | `EventIngestGateTest`, serializer/util | — |
| Robolectric / simulator native | SessionManager, buffer, process recreation | 14 Swift XCTests |
| Physical device | `run-package-2-device-validation.ps1` scenarios A–J | **Launch gate** — physical iPhone required |
| Cloud macOS CI | `prototype-android-jvm.yml` | `prototype-c-ios-simulator.yml` + validation script |

---

## Bridge method parity (Prototype C)

| Method | Android (device-validated) | iOS |
|--------|---------------------------|-----|
| `getBridgeApiVersion` | ✅ | ✅ native constant test |
| `getContractVersion` | ✅ | ✅ native constant test |
| `fetchPendingEvents` | ✅ | ✅ buffer semantics in XCTest |
| `acknowledgeEvents` | ✅ | ✅ buffer semantics in XCTest |
| `clearPrototypeData` | ✅ | ✅ buffer clear in XCTest |
| `generateSyntheticEvents` | ✅ | ⏳ launch gate (not in iOS bridge subset) |
| `getBufferStats` | ✅ | ⏳ launch gate |
| `exportSanitizedDiagnostics` | ✅ | ⏳ partial — sanitizer unit tested |
| `simulateDuplicateInsertion` | ✅ | ⏳ duplicate covered in buffer XCTest |
| `simulateUnsupportedSchemaEvent` | ✅ | ⏳ launch gate for native ingest path |

iOS bridge subset is intentional for Package 2 simulator scope; Jest contract tests remain cross-platform authority.

---

## Lifecycle terminology

| Term | Android | iOS |
|------|---------|-----|
| Session requested | SharedPreferences + FGS | N/A (Prototype C scope) |
| Service active | FGS + notification | N/A |
| Process recovery | `markRecovering`, buffer restore | app relaunch + file buffer |
| JS reload | Prototype C device validation | simulator manual / launch gate |
| Background/foreground | device harness scenario C | simulator matrix L3 |

---

## Launch gates (physical iPhone / Samsung device)

- Android scenarios A–J when adb device unavailable: **blocked** with JSON evidence
- iOS Metro UI smoke, permission prompts on device, background modes: **physical iPhone required**
- Reboot + wireless adb repair: **manual** on both platforms

---

## Rollback

- `checkpoint/android-package-2-start` @ `16d40ce`
- `checkpoint/ios-package-2-start` @ `16d40ce`
- Package 1: `checkpoint/mobile-foundation-package-1-complete`
