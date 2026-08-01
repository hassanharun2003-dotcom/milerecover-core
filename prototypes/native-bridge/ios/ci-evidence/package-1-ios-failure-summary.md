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

## First genuine defect (run `30696030032` @ `00dec05`)

**Target:** `MileRecoverProtoBridgeC`  
**Phase:** Swift compile (`PrototypeBridgeModule.swift`)  
**Error class (run `30696242923` @ `4b5362c`):** Swift compile — `'nil' is not compatible with expected argument type 'Any'` in `clearPrototypeData` (`resolve(nil)`). Xcode exit **65**.

**Prior error class (run `30696030032` @ `00dec05`):** `No such module 'React'` — fixed via Obj-C bridging header (removed `import React`).

## Prior defect (run `30673874293` @ `9140b15`)

`#if canImport(React)` guard stripped the Swift module body while `PrototypeBridgeModule.m` still exported symbols.

## Repairs applied

1. Add `MileRecoverProtoBridgeC-Bridging-Header.h` with React headers; set `SWIFT_OBJC_BRIDGING_HEADER` in pbxproj
2. Remove `import React` from Swift; expose RN types via bridging header
3. Replace `resolve(nil)` with `resolve(NSNull())` in `clearPrototypeData`
4. Remove `#if canImport(React)` guard; implement `startObserving()` / `stopObserving()`
5. Remove `UIRequiredDeviceCapabilities` arm64 restriction from Info.plist
6. CI workflow: fail on pod install errors; require workspace (no bare xcodeproj fallback)

## Verification pending

macOS `xcodebuild` confirmation on next CI run (no local Xcode on Windows host).

## Not claimed

- Metro/JS bundle runtime test (template XCTest may fail without packager — not Package 1 gate)
- Physical-device permission/lifecycle matrix (Package 2)
