# Prototype C — iOS cloud build readiness

**Status:** Sources present; **full simulator CI blocked** until RN iOS app scaffold exists  
**Last assessed:** 31 July 2026

---

## Swift module completeness

| Component | File | Status |
|-----------|------|--------|
| Event envelope | `PrototypeBridge/NativeEventEnvelope.swift` | Present |
| File-backed buffer | `PrototypeBridge/PrototypeEventBuffer.swift` | Present |
| Diagnostic sanitizer | `PrototypeBridge/DiagnosticSanitizer.swift` | Present |
| RN native module | `PrototypeBridge/PrototypeBridgeModule.swift` | Present (RCTEventEmitter) |
| Obj-C bridge registration | `PrototypeBridge/PrototypeBridgeModule.m` | Present (`RCT_EXTERN_MODULE`) |

**Gap:** Methods in `.m` are a subset of Android bridge surface — parity expansion tracked in [PLATFORM_PARITY.md](../PLATFORM_PARITY.md).

---

## Objective-C / Swift bridge registration

- `PrototypeBridgeModule.m` declares extern methods for core pull/ack/clear paths
- Swift module must be linked into an RN iOS app target (not yet scaffolded)

---

## Application target structure

| Item | Status |
|------|--------|
| `ios/Podfile` | **Missing** |
| `ios/*.xcodeproj` | **Missing** |
| `ios/*.xcworkspace` | **Missing** |
| RN 0.76 iOS template | **Not generated** |

**Required next step (iOS lane, separate build package):** Generate RN iOS project via approved RN CLI init preserving existing `PrototypeBridge/` sources.

---

## React Native iOS dependencies

- Root `package.json`: `react-native@0.76.5`, `@react-native-community/cli-platform-ios@15.x` (via lockfile)
- CocoaPods required after scaffold — **do not upgrade** without approval

---

## Deployment target assumptions

- RN 0.76 typically requires **iOS 15.1+** minimum — confirm when Podfile created
- Simulator: latest iOS simulator on hosted macOS runner

---

## Bundle identifier placeholders

- Android prototype uses `com.milerecover.prototype.nativebridge`
- iOS should mirror: `com.milerecover.prototype.nativebridge` (placeholder, non-production)

---

## Signing-independent simulator build

**Possible after scaffold:**

```bash
cd prototypes/native-bridge/ios
pod install
xcodebuild -workspace *.xcworkspace -scheme * -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

**Current:** Cannot run — no Xcode project.

---

## Physical device / TestFlight requirements (later)

| Requirement | Status |
|-------------|--------|
| Apple Developer Program membership | Required — not verified in repo |
| App ID / bundle registration | Pending |
| Development/distribution certificates | Not in repo (correct) |
| Provisioning profiles | Not in repo (correct) |
| TestFlight upload | Out of scope until simulator CI green |

---

## GitHub Actions (unsigned simulator only)

Workflow: `.github/workflows/prototype-c-ios-simulator.yml`

- Runs on `macos-latest`
- Node tests + typecheck always
- Xcode build step **documents blocker** until Podfile exists
- No signing secrets, no TestFlight upload
- **Not claimed passed** until executed on GitHub with scaffold

---

## Blockers summary

1. No RN iOS app target / Podfile / `.xcodeproj`
2. No GitHub remote configured (local-only git as of setup)
3. Swift module not wired into build graph
4. Apple Developer account items not documented in repo

---

## Related

- [ios/README.md](./README.md)
- [PLATFORM_PARITY.md](../PLATFORM_PARITY.md)
- [Parallel Mobile Development Plan](../../planning/Parallel%20Mobile%20Development%20Plan.md)
