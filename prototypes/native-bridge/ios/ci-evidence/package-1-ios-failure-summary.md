# Package 1 — iOS simulator CI failure summary

**Run:** [30673874293](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30673874293)  
**Commit:** `9140b15`  
**Job:** `iOS simulator build (unsigned)` — failed at **Build for iOS Simulator** (pod install succeeded)

## Observed CI progression

| Step | Result |
|------|--------|
| Node contract/privacy tests | **Pass** |
| CocoaPods `pod install` | **Pass** (after `47cdf63` hardening) |
| `xcodebuild` simulator build | **Fail** (~13s on first attempt; ~13s on `9140b15`) |

## First genuine defect (run `30696364425` @ `6c4ac49`)

**Target:** CocoaPods / Podfile  
**Phase:** `pod install`  
**Error class:** `use_native_modules!` requires `@react-native-community/cli-platform-ios`, which is not installed in the prototype package (only RN core + metro/babel devDeps). Prior CI masked this because `pod install | tee` returned tee's exit code.

## Secondary defect (run `30696242923` @ `4b5362c`)

**Target:** `MileRecoverProtoBridgeC`  
**Phase:** Swift compile — `'nil' is not compatible with expected argument type 'Any'` in `clearPrototypeData` (`resolve(nil)`). Xcode exit **65**.

## Prior defect (run `30673874293` @ `9140b15`)

`#if canImport(React)` guard stripped the Swift module body while `PrototypeBridgeModule.m` still exported symbols.

## Repairs applied

1. Podfile: drop `use_native_modules!` (manual PrototypeBridge wiring); use explicit `../node_modules/react-native` path
2. Add `MileRecoverProtoBridgeC-Bridging-Header.h` with React headers; set `SWIFT_OBJC_BRIDGING_HEADER` in pbxproj
3. Remove `import React` from Swift; expose RN types via bridging header
4. Replace `resolve(nil)` with `resolve(NSNull())` in `clearPrototypeData`
5. Remove `#if canImport(React)` guard; implement `startObserving()` / `stopObserving()`
6. Remove `UIRequiredDeviceCapabilities` arm64 restriction from Info.plist
7. CI workflow: fail on pod install errors; require workspace (no bare xcodeproj fallback)

## Verification pending

macOS `xcodebuild` confirmation on next CI run (no local Xcode on Windows host).

## Not claimed

- Metro/JS bundle runtime test (template XCTest may fail without packager — not Package 1 gate)
- Physical-device permission/lifecycle matrix (Package 2)
