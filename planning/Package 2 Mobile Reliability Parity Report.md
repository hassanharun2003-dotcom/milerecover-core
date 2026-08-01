# Package 2 — Mobile Reliability Parity Report

**Date:** 1 August 2026  
**Contract:** major `1` · API `1.0.0-prototype-c` · RN `0.76.5`  
**Lanes:** Android `milestone/android-validation` @ `e2454e5` · iOS `milestone/ios-readiness` @ `729e933`  
**Integrated main:** see `checkpoint/mobile-foundation-package-2-complete`

---

## Summary

| Area | Android | iOS | Match |
|------|---------|-----|-------|
| Event envelope fields | Kotlin `NativeEventEnvelope` | Swift `NativeEventEnvelope` | **Yes** |
| Schema major | `1` | `1` (`NativeEventEnvelope.schemaVersion`) | **Yes** |
| Bridge API | `1.0.0-prototype-c` | `1.0.0-prototype-c` | **Yes** |
| Buffer semantics | SQLite + in-memory gate | File-backed JSON buffer | **Parity validated in JVM/logic tests** |
| Duplicate rejection | session+sequence key | session+sequence key | **Yes** |
| Ack batch partial/unknown | tested | tested | **Yes** |
| Diagnostic coordinate redaction | tested | tested | **Yes** |
| Unsigned simulator / JVM CI | Gradle `:app:testDebugUnitTest` | `MileRecoverProtoBridgeCLogicTests` hostless XCTest | **Both green** |

---

## Automated test counts (Package 2 closure)

| Layer | Count | Evidence |
|-------|-------|----------|
| Android JVM/Robolectric | **30/30** | Local Gradle @ `e2454e5`; CI run 30699892730 |
| iOS Node contract | **9/9** | CI run 30711137266 Node job |
| iOS Node privacy | **5/5** | CI run 30711137266 Node job |
| iOS hostless logic XCTest | **14/14** | `PrototypeEventBufferTests` (8), `DiagnosticSanitizerTests` (3), `BridgeVersionTests` (3); CI run 30711137266 |
| iOS unsigned simulator build | **pass** | CI run 30711137266 build step |
| Root `npm run check:all` | **pass** | Pre-push on integrated main |

---

## Deferred device-only validation (not falsely marked passed)

### Android physical scenarios A–J

**Status:** **blocked** — no Samsung/adb device connected at validation time.  
**Evidence:** `prototypes/android-tracking/device-validation/package-2-validation-summary.json` (all scenarios `blocked`, reason `No adb device connected`).  
**Harness:** `prototypes/android-tracking/scripts/run-package-2-device-validation.ps1` (ready; requires connected device).

### iOS physical-device gates

**Status:** **deferred** — not executed on this machine (no physical iPhone, no Metro UI smoke in CI).  
**Manual plan:** `prototypes/native-bridge/ios/PERMISSION_LIFECYCLE_TEST_PLAN.md`  
**CI skip:** `MileRecoverProtoBridgeCTests/testRendersWelcomeScreen` uses `XCTSkip` (Metro required).

---

## CI workflow runs (lane closure)

| Workflow | Branch / SHA | Run ID | Result |
|----------|--------------|--------|--------|
| Prototype C iOS Simulator Validation | `milestone/ios-readiness` @ `729e933` | [30711137266](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30711137266) | success |
| Prototype Android JVM Tests | `milestone/android-validation` @ `e2454e5` | [30699892730](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30699892730) | success |

---

## Root cause resolved (iOS CI blocker)

Package 2 added `init(fileURL:)` to `PrototypeEventBuffer.swift` for isolated XCTest storage but left the default `init()` as a **designated** initializer delegating via `self.init(fileURL:)`. Swift requires `convenience init()` for that pattern; without it, unsigned simulator `xcodebuild build` failed with exit code 65. Fixed in `729e933`.

Secondary hardening: hosted `MileRecoverProtoBridgeCTests` target restored to Package 1 `.m`-only sources; Package 2 Swift logic tests run only via hostless `MileRecoverProtoBridgeCLogicTests` scheme (`8d4df6e`).

---

## Scope preserved

- No production features, signing material, Pods, or build products committed
- No shared contract version change
- Android lane behavior unchanged by iOS fixes
