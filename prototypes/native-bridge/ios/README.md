# Prototype C — iOS validation

**Compile validation:** Scaffold present — **CI build pending first macOS runner execution**  
**Bundle ID:** `com.milerecover.prototype.nativebridge`

## Project layout

| Path | Purpose |
|------|---------|
| `Podfile` | CocoaPods — RN 0.76.5 from parent `node_modules` |
| `MileRecoverProtoBridgeC.xcodeproj` | Xcode project (simulator target) |
| `MileRecoverProtoBridgeC/` | App shell — AppDelegate, main.m, Info.plist, LaunchScreen |
| `MileRecoverProtoBridgeCTests/` | XCTest target (RN template smoke test) |
| `PrototypeBridge/` | Native module Swift + Obj-C bridge |
| `PERMISSION_LIFECYCLE_TEST_PLAN.md` | Manual lifecycle & permission test matrix |
| `IOS_CLOUD_BUILD_READINESS.md` | CI readiness checklist |

## Native module files

| File | Purpose |
|------|---------|
| `PrototypeBridge/NativeEventEnvelope.swift` | Contract envelope |
| `PrototypeBridge/PrototypeEventBuffer.swift` | File-backed prototype buffer |
| `PrototypeBridge/DiagnosticSanitizer.swift` | Privacy-safe exports |
| `PrototypeBridge/PrototypeBridgeModule.swift` | Legacy Native Module (RCTEventEmitter) |
| `PrototypeBridge/PrototypeBridgeModule.m` | Obj-C extern declarations |

## Local build (macOS only)

```bash
cd prototypes/native-bridge
npm ci
cd ios
pod install
xcodebuild \
  -workspace MileRecoverProtoBridgeC.xcworkspace \
  -scheme MileRecoverProtoBridgeC \
  -sdk iphonesimulator \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Run on simulator: `npm run ios` (from prototype root, with Metro).

## Lifecycle notes (iOS-specific)

- Buffer persists under Application Support — survives JS reload and app relaunch
- Push hints via `PrototypeEventsAvailable` — pull remains authoritative
- Background: native buffer durable; JS may be suspended — events accumulate until foreground pull

See [PERMISSION_LIFECYCLE_TEST_PLAN.md](./PERMISSION_LIFECYCLE_TEST_PLAN.md) for test scenarios.

## CI

Workflow: `.github/workflows/prototype-c-ios-simulator.yml` on branch `milestone/ios-readiness`.

Do **not** claim iOS build success until GitHub Actions macOS job completes green.

See [PLATFORM_PARITY.md](../PLATFORM_PARITY.md) and [VALIDATION_RUNBOOK.md](../VALIDATION_RUNBOOK.md).
