# Package 2 — Mobile reliability checkpoint

**Tag:** `checkpoint/mobile-foundation-package-2-complete`  
**Integrated main:** see tag annotation  
**Rollback baseline:** `16d40ce` · lane tags `checkpoint/android-package-2-start`, `checkpoint/ios-package-2-start`

---

## Lane commits (pre-merge)

| Lane | Branch | Commit | CI run | Result |
|------|--------|--------|--------|--------|
| Android | `milestone/android-validation` | `e2454e5` | [30699892730](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30699892730) | success |
| iOS | `milestone/ios-readiness` | `729e933` | [30711137266](https://github.com/hassanharun2003-dotcom/milerecover-core/actions/runs/30711137266) | success |

## Merge into main

| Merge | Strategy | Notes |
|-------|----------|-------|
| Android @ `e2454e5` | fast-forward | SessionManager/ProcessRecreation tests, device harness, P2 docs |
| iOS @ `729e933` | merge commit | Hostless logic XCTest target, CI fixes, Swift buffer test injectable path |

## Parity report

`planning/Package 2 Mobile Reliability Parity Report.md`

## Deferred (device-only)

- Android scenarios A–J on physical Samsung (blocked: no device)
- iOS Metro UI smoke and permission matrix on physical iPhone
