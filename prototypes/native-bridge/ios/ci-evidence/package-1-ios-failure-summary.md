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

## First genuine defect (inferred from scaffold + CI step timing)

**Target:** `MileRecoverProtoBridgeC`  
**Phase:** Swift compile / Obj-C module registration  
**Likely cause:** `PrototypeBridgeModule.swift` wrapped entire implementation in `#if canImport(React) … #endif`. When the conditional failed or stripped the class body, `PrototypeBridgeModule.m` still declared `RCT_EXTERN_MODULE(PrototypeBridgeModule, RCTEventEmitter)` — producing **undefined symbols / empty module** at link or compile time.

**Secondary risk:** `UIRequiredDeviceCapabilities` = `arm64` in `Info.plist` can block some simulator destinations.

## Repairs applied

1. Remove `#if canImport(React)` guard; use unconditional `import React`
2. Implement `startObserving()` / `stopObserving()` on `RCTEventEmitter` subclass
3. Remove `UIRequiredDeviceCapabilities` arm64 restriction from Info.plist
4. CI workflow: explicit workspace/scheme paths (`MileRecoverProtoBridgeC`)

## Verification pending

macOS `xcodebuild` confirmation on next CI run (no local Xcode on Windows host).

## Not claimed

- Metro/JS bundle runtime test (template XCTest may fail without packager — not Package 1 gate)
- Physical-device permission/lifecycle matrix (Package 2)
