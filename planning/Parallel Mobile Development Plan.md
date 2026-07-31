# Parallel Mobile Development Plan

**Repository:** `milerecover-core`  
**Scope:** Prototype B (Android tracking) and Prototype C (native bridge) only — **not production product features**  
**Checkpoint:** Prototype C Android 24/24 device validation (31 July 2026)

---

## 1. Shared foundation

- Versioned bridge contracts (`contract/` — schema major 1, API `1.0.0-prototype-c`)
- Synthetic fixtures only ([Synthetic Test Data Policy](../docs/Synthetic%20Test%20Data%20Policy.md) when present)
- Cross-platform Jest tests (contract, buffer simulation, privacy, stress)
- Platform parity matrix ([PLATFORM_PARITY.md](../prototypes/native-bridge/PLATFORM_PARITY.md))
- Lane merge gate ([tooling/lanes/check-lane-merge.ps1](../tooling/lanes/check-lane-merge.ps1))

---

## 2. Android lane

**Branch:** `milestone/android-validation`

**Current status:** Prototype C Android first-pass **24/24 passed** on SM-A166U; harness hardened with evidence-only reevaluation.

**Next work (concurrent):**

- Extended Prototype B lifecycle validation (FGS, process death — when scoped)
- Robolectric / JVM native buffer tests in CI
- Device database and evidence capture (synthetic only)
- Battery measurement methodology (documented, not production)

**Evidence anchor:** `prototypes/native-bridge/device-validation-20260731-134617/validation-summary.json`

---

## 3. iOS lane

**Branch:** `milestone/ios-readiness`

**Current status:** Swift module sources compile-ready in isolation; **no RN iOS app target / Podfile / `.xcodeproj` yet** — cloud simulator build blocked until scaffold exists.

**Next work (concurrent, no feature implementation yet):**

- RN iOS project scaffold (separate approved build package)
- Cloud macOS simulator build via GitHub Actions
- Wire `PrototypeBridge` into RN host
- Permission/lifecycle test plan
- TestFlight readiness **later** (requires Apple Developer signing)

See [IOS_CLOUD_BUILD_READINESS.md](../prototypes/native-bridge/ios/IOS_CLOUD_BUILD_READINESS.md).

---

## 4. Branch / worktree rules

| Branch | Purpose |
|--------|---------|
| `milestone/android-validation` | Android-only changes |
| `milestone/ios-readiness` | iOS-only changes |
| `milestone/shared-contracts` | Cross-platform contracts and tests |

**Worktrees:** Prefer `C:\Dev\milerecover-worktrees\` (outside OneDrive) to avoid sync conflicts:

- `worktrees/android` → `milestone/android-validation`
- `worktrees/ios` → `milestone/ios-readiness`
- `worktrees/shared` → `milestone/shared-contracts`

Do **not** duplicate `node_modules` or `build/` across worktrees — run `npm ci` per worktree.

---

## 5. Contract-freeze rules

1. Shared lane owns contract version bumps.
2. Android/iOS lanes may **consume** contracts; they may not change `contract/` without shared-lane PR.
3. Breaking changes require: parity doc update, both platform stubs updated, Jest suite green.
4. Freeze window: 48h before any lane merges to a integration branch.

---

## 6. Merge order

1. Shared contracts merge first (if changed)
2. Android and iOS lanes merge in parallel **only** when shared contract unchanged
3. Integration smoke (typecheck + contract tests) on merge base
4. No production `apps/` or `packages/` merges without separate launch gate

---

## 7. Required test matrix

| Test | Android lane | iOS lane | Shared lane |
|------|--------------|----------|-------------|
| `npm run typecheck` | ✓ | ✓ | ✓ |
| `npm test` (contract/buffer/privacy) | smoke | smoke | full |
| Device validation 24/24 | evidence reeval | — | — |
| Robolectric (Android) | when CI added | — | — |
| iOS simulator build | — | when scaffold exists | — |
| Validator smoke test | ✓ | — | — |

---

## 8. Conflict-resolution process

1. Identify owning lane via [Lane Ownership Boundaries.md](./Lane%20Ownership%20Boundaries.md)
2. Non-owner reverts local changes to forbidden paths
3. Shared-lane mediates contract conflicts
4. Document resolution in lane merge report (`tooling/lanes/reports/`)

---

## 9. Rollback procedure

1. Note checkpoint tag: `checkpoint/prototype-c-android-24-of-24`
2. `git checkout milestone/android-validation`
3. `git reset --hard checkpoint/prototype-c-android-24-of-24` (lane lead approval only)
4. Re-run evidence-only evaluation to confirm 24/24
5. File incident note in planning/

---

## 10. Platform parity checklist

- [ ] All bridge methods implemented on both platforms
- [ ] Error envelope codes match
- [ ] Pull authoritative / push hint semantics match
- [ ] Partial ack behavior match
- [ ] Sanitized diagnostics — no coordinates
- [ ] Duplicate/schema rejection hooks match
- [ ] Device validation evidence on both platforms

---

## 11. What can run concurrently

- Android extended validation + iOS scaffold prep
- Prototype B lifecycle tests + iOS Swift wiring
- Shared contract tests + either platform native tests
- Documentation and CI workflow preparation

---

## 12. What must remain sequential

- Contract version bumps → then platform implementations
- Shared contract merge → before dependent native changes
- Physical-device sign-off → before claiming platform parity
- TestFlight/upload → after simulator CI green + signing setup

---

## 13. Cloud-macOS validation

- GitHub Actions `prototype-c-ios-simulator.yml` on `macos-latest`
- Unsigned simulator build only — **no signing secrets**
- Runs Node tests always; Xcode build when iOS scaffold exists
- Logs archived as artifacts

---

## 14. Physical-device validation

| Platform | Status |
|----------|--------|
| Android (Prototype C) | **24/24 complete** — SM-A166U |
| Android (Prototype B) | Partial — extended validation pending |
| iOS | Not started — requires Mac + scaffold + signing for device |

---

## 15. Launch gates (production — out of scope here)

Production promotion requires separate packages for: apps/, packages/, backend, subscriptions, and full test matrix. **This plan does not authorize production feature work.**

---

## Recommended concurrent execution order

### Android

1. Extended Prototype B lifecycle validation  
2. Android native unit tests (Robolectric)  
3. Database/device evidence (synthetic)  
4. Battery measurements  

### iOS

1. Compile-ready native bridge (done — sources present)  
2. RN iOS scaffold + cloud simulator build  
3. iOS native tracking prototype  
4. Permission/lifecycle tests  
5. TestFlight readiness (later)  

### Shared

1. Versioned contracts (frozen at major 1)  
2. Deterministic domain tests  
3. Privacy tests  
4. Synthetic fixtures  
5. Parity checks  
