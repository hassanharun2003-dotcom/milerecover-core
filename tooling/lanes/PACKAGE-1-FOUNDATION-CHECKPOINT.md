# Package 1 — Mobile foundation checkpoint

**Tag:** `checkpoint/mobile-foundation-package-1-complete`  
**Integrated main:** `382595d` (`.env.example` CI fix; iOS merge `e54af39`; Android FF `82c6608`)  
**Rollback baseline:** `a963de0` · lane tags `checkpoint/android-package-1-start`, `checkpoint/ios-package-1-start`

---

## Lane commits (pre-merge)

| Lane | Branch | Commit | CI run | Result |
|------|--------|--------|--------|--------|
| Android | `milestone/android-validation` | `82c6608` | [30696030130](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30696030130) | success |
| iOS | `milestone/ios-readiness` | `0ef906f` | [30696431294](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30696431294) | success |

## Merge into main

| Merge | Strategy | Notes |
|-------|----------|-------|
| Android @ `82c6608` | fast-forward | No conflicts |
| iOS @ `0ef906f` | merge commit | No conflicts; 22 iOS scaffold files |

## Combined verification (integrated main)

| Check | Result |
|-------|--------|
| `npm run check:all` | pass |
| Prototype C typecheck | pass |
| Prototype C Jest | 39/39 |
| Prototype C benchmark | pass |
| Evidence-only bridge reevaluation | 24/24 |
| Validator smoke test | 24/24 |
| Android JVM/Robolectric | 20/20 |

## Main-branch CI (post-integration)

| Workflow | Run | Result |
|----------|-----|--------|
| Prototype Android JVM Tests | 30697802109 @ `b3481a3` | success |
| Prototype C iOS Simulator Validation | 30697802106 @ `b3481a3` | success |
| Repository quality | 30698275933 @ `382595d` | success |

## Deferred (Package 2+)

- Physical-device FGS/process-death lifecycle (Android)
- iOS permission/lifecycle matrix on device with Metro
- Product screens, production entitlements, TestFlight, signing

## Scope preserved

- React Native 0.76.5 · contract major 1 · API `1.0.0-prototype-c`
- No shared-contract version change · no production feature paths
