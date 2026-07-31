# Prototype C — Results

**Status:** Android physical-device pass 2 **complete** — **24/24** scenarios on SM-A166U (31 July 2026)  
**Production promotion:** Not approved — disposable validation prototype only

---

## Physical-device summary (SM-A166U, wireless ADB)

| Field | Value |
|---|---|
| Device | Samsung SM-A166U |
| Connection | Wireless debugging (mDNS; session endpoint not stored in repo) |
| Metro | `packager-status:running` on 8081 |
| Bridge UI | `Connection: connected` |
| Evidence | `device-validation-20260731-134617/` (automated pass-2 run) |

**Verdict:** All 24 first-pass bridge scenarios validated on device. Native buffer, pull/ack, partial ack, observation stop/start, JS restart replay path, duplicate/schema rejection hooks, sanitized diagnostics, and clear-data verified.

**Harness correction:** Original pass-2 step automation exited **1** with 12 assertion false negatives (uiautomator-only checks for RN log lines). Hardened harness uses logcat + stats + visible UI per scenario. Evidence-only reevaluation against `device-validation-20260731-134617/` confirms **24/24 pass**, exit **0**. No bridge/device failures observed.

---

## Scenario results (pass 2)

| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | App installs and launches | **Pass** | `Connection: connected`; RN host loaded |
| 2 | Empty-buffer fetch | **Pass** | Logcat: `Fetch without ack: fetched 0, hasMore=false, seq=[]` |
| 3 | Generate one synthetic event | **Pass** | `pendingCount=1` after generate |
| 4 | Fetch pending event | **Pass** | Logcat: `Fetch + ack (full): fetched 1, seq=[1]` |
| 5 | Contract version/sequence | **Pass** | Logcat: `Contract verify PASS — API 1.0.0-prototype-c, major 1` |
| 6 | Acknowledge one event | **Pass** | Logcat: `Auto-ack all fetched: ack=1` |
| 7 | Pending count → zero | **Pass** | `pendingCount=0` after single-event ack |
| 8 | Generate ten-event burst | **Pass** | `pendingCount=10`; `Generated 10: inserted=10` |
| 9 | Fetch in ordered batch | **Pass** | Logcat: `fetched 10, seq=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` |
| 10 | Partially acknowledge five | **Pass** | Logcat: `Ack first 5: ack=5` |
| 11 | Five remain pending | **Pass** | Mid-flow stats + `Last fetch cached: 10 events` before final ack |
| 12 | Acknowledge remaining five | **Pass** | Logcat: `Ack remaining 5: ack=5`; final `acknowledgedCount=10`, `pendingCount=0` |
| 13 | Generate while observation stopped | **Pass** | `Push observation: stopped`; `pendingCount=10` |
| 14 | Restart observation | **Pass** | Logcat: `Push observation: ACTIVE` |
| 15 | Events available through pull | **Pass** | Logcat: `fetched 10` after restart (pull authoritative) |
| 16 | Simulate JavaScript reload | **Pass** | Logcat: `JS handler state cleared — native buffer unchanged` |
| 17 | Unacknowledged events replay | **Pass** | Logcat: `Replay pull: fetched 0` + ack-able cache path |
| 18 | Duplicate insertion | **Pass** | Native duplicate hook invoked |
| 19 | Duplicate rejected/counted | **Pass** | `duplicateRejectedCount=1` (incremented) |
| 20 | Unsupported schema | **Pass** | Native schema rejection hook invoked |
| 21 | Rejected not auto-acknowledged | **Pass** | `rejectedCount` increased; pending not auto-cleared |
| 22 | Export sanitized diagnostics | **Pass** | Export control executed; preview rendered |
| 23 | No coordinate fields | **Pass** | `Coordinate privacy check: PASS` (no lat/long in preview) |
| 24 | Clear prototype data | **Pass** | Final `pendingCount=0`, `acknowledgedCount=0` |

---

## Automated test status

| Suite | Environment | Status (31 July 2026) |
|---|---|---|
| `npm run typecheck` | Node 20 | **Pass** |
| Jest contract/buffer/privacy/stress | Node 20 | **37/38 pass** — 1 bridge-client edge case (failed JS ack routing) |
| `npm run benchmark` | Node harness | **Pass** — simulation timings recorded |
| `npm run check:all` (repo root) | — | **Blocked** — root `package.json` not present locally (OneDrive hydration) |
| Robolectric | Android JVM | **Not run** |
| iOS compile | Mac/Xcode | **Not run** |

---

## Out of scope (still not validated)

- Process death / FGS background capture
- 5,000-event device burst
- iOS physical device
- TurboModule/JSI measurements

---

## Recommendation

Prototype C **Android first-pass validation is complete** for bridge boundary behavior on SM-A166U. Production bridge selection remains **not approved** — further work includes broader device matrix, Robolectric/CI gate, and out-of-scope stress scenarios above.

Evidence automation: `.\scripts\run-device-pass2.ps1` (adb UI taps + stats/logcat capture). Non-destructive reevaluation: `.\scripts\evaluate-device-evidence.ps1 -EvidenceDir device-validation-20260731-134617` → `validation-summary.json`.
