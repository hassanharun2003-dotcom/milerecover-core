# Prototype C — iOS permission & lifecycle test plan

**Scope:** Simulator and local Mac validation only. No TestFlight, no production entitlements.  
**Bundle ID:** `com.milerecover.prototype.nativebridge`  
**Last updated:** 31 July 2026

---

## Purpose

Validate that the iOS native bridge and file-backed buffer behave correctly across app lifecycle transitions and permission states relevant to Prototype C. This prototype does **not** require location, motion, or background location — only documents placeholder keys and lifecycle durability.

---

## Preconditions

| Item | Requirement |
|------|-------------|
| macOS | Xcode 15+ with iOS 17+ simulator |
| Dependencies | `npm ci` in `prototypes/native-bridge`, then `cd ios && pod install` |
| Build | Unsigned simulator: `CODE_SIGNING_ALLOWED=NO` |
| Metro | Optional for UI tests; native buffer tests can run without JS bundle |

---

## Permission matrix (prototype scope)

| Permission / capability | Info.plist key | Prototype C need | Test action |
|-------------------------|----------------|------------------|-------------|
| Location (when in use) | `NSLocationWhenInUseUsageDescription` | **Not used** — empty placeholder | Confirm app launches without prompt |
| Background modes | `UIBackgroundModes` | **Not declared** | N/A for simulator scaffold |
| App Tracking Transparency | `NSUserTrackingUsageDescription` | **Not used** | Confirm no ATT prompt on launch |
| Local network (Metro) | `NSAllowsLocalNetworking` | **Yes** (debug) | Metro connects in DEBUG builds |

**Pass criteria:** Cold launch shows no permission dialogs except any explicitly triggered in a future test harness.

---

## Lifecycle scenarios

### L1 — Cold launch

1. Install app on simulator (`xcodebuild` or `npx react-native run-ios`).
2. Launch app.
3. Verify no crash; LaunchScreen → RN root (if Metro running).

**Expected:** App process starts; native module registers via `RCT_EXTERN_MODULE`.

### L2 — JS reload (Fast Refresh / Cmd+R)

1. With Metro running, trigger reload.
2. Call `PrototypeBridgeModule.getBridgeApiVersion()` from JS (when wired).

**Expected:** Native buffer file on disk unchanged; pending events retained in Application Support.

### L3 — App background → foreground

1. Send app to background (Home gesture).
2. Wait ≥ 30 s (simulate JS suspension).
3. Return to foreground.

**Expected:** Events accumulated in native buffer while backgrounded remain fetchable via `fetchPendingEvents`. Push hints (`PrototypeEventsAvailable`) may be deferred until foreground if JS was suspended.

### L4 — App terminate → relaunch

1. Force-quit app from app switcher.
2. Relaunch.

**Expected:** `prototype_c_bridge.json` under Application Support reloads; unacknowledged events still pending.

### L5 — Clear prototype data

1. Invoke `clearPrototypeData` from JS bridge.
2. Relaunch app.

**Expected:** Buffer file empty or reset; `fetchPendingEvents` returns zero events.

### L6 — Three relaunches (parity with Android)

Mirror Android `test-three-relaunches.ps1` intent:

1. Seed synthetic events (native test hook or JS generator when available).
2. Relaunch app three times without clearing data.
3. After each relaunch, pull batch and verify monotonic sequence integrity.

**Expected:** No duplicate delivery after ack; sequence numbers stable per session.

---

## Native module surface (manual / XCTest)

| Method | Verify |
|--------|--------|
| `getBridgeApiVersion` | Returns semver string |
| `getContractVersion` | Returns contract major |
| `fetchPendingEvents` | Respects batch size 1–max |
| `acknowledgeEvents` | Idempotent ack; unknown IDs reported |
| `clearPrototypeData` | Wipes buffer |

---

## CI alignment

GitHub Actions workflow `.github/workflows/prototype-c-ios-simulator.yml`:

- **Build:** unsigned simulator when `Podfile` + `.xcodeproj` exist
- **Test:** `xcodebuild test` when `MileRecoverProtoBridgeCTests` target present
- **Artifacts:** build/test logs uploaded; no signing secrets

Full lifecycle scenarios L2–L6 require manual Mac runs until native unit tests cover buffer persistence.

---

## Evidence capture

For each manual run, record:

- Simulator OS version and device model
- Xcode build log path
- Screenshot or log snippet for permission prompts (should be none)
- Buffer file path: `Library/Application Support/prototype_c_bridge.json` (simulator container)

Store summaries under `device-validation-*/validation-summary.json` per Android convention — do not commit raw simulator containers.

---

## Out of scope (later packages)

- Physical device provisioning
- TestFlight upload
- Background location / FGS parity (Prototype B scope)
- Production Keychain or Core Data migration

---

## Related

- [README.md](./README.md)
- [IOS_CLOUD_BUILD_READINESS.md](./IOS_CLOUD_BUILD_READINESS.md)
- [PLATFORM_PARITY.md](../PLATFORM_PARITY.md)
