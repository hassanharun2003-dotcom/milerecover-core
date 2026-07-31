# Prototype C — Android first physical-device pass

**Status:** **Pass 2 complete** — 24/24 scenarios on SM-A166U (31 July 2026)  
**Scope:** First-pass bridge validation only (24 scenarios)  
**Out of scope:** Process death, 5,000-event bursts, background FGS, iOS

**Device:** Samsung SM-A166U · Android Studio Quail 3 · JDK 17 · Metro debug build  
**Policy:** [Synthetic Test Data Policy](../../docs/Synthetic%20Test%20Data%20Policy.md) — no real coordinates in evidence

All steps below use **visible UI buttons** in the debug host. Banner must read:

**NON-PRODUCTION — VALIDATION ONLY**

Record results in [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md) and [RESULTS.md](./RESULTS.md).

---

## UI button reference

| Button | Purpose |
|---|---|
| **Refresh stats** | Reload buffer counters |
| **Clear prototype data** | Wipe native prototype DB |
| **Reset validation UI state** | Clear JS handler cache + last-fetch cache (native buffer unchanged) |
| **Verify contract header** | Log contract/API version check |
| **Generate 1 synthetic event** | Single event |
| **Generate exactly 10 events** | Ten-event burst (scenarios 8–12) |
| **Generate burst (100)** | Large batch (optional) |
| **Fetch without acknowledging** | Pull only — caches event IDs for partial ack |
| **Fetch pending + ack all** | Full pull + acknowledge |
| **Acknowledge first 5 only** | Partial ack (requires prior fetch without ack) |
| **Acknowledge remaining 5** | Complete ten-event partial flow |
| **Stop push observation** | Unsubscribe push hint listener |
| **Restart push observation** | Re-subscribe push hint listener |
| **Simulate JS restart** | Clear JS idempotency only |
| **Replay unacknowledged (pull again)** | Second pull; logs ack-able cache if pull empty |
| **Simulate duplicate insertion** | Native duplicate rejection hook |
| **Simulate unsupported schema event** | Native schema rejection hook |
| **Export sanitized diagnostics** | Export + on-screen preview + privacy badge |

---

## Scenario checklist (pass 2 — SM-A166U, 31 July 2026)

| # | Scenario | Pass 1 | Pass 2 |
|---|---|---|---|
| 1 | App installs and launches | Pass | **Pass** |
| 2 | Empty-buffer fetch | Pending | **Pass** |
| 3 | Generate one synthetic event | Pass | **Pass** |
| 4 | Fetch pending event | Pass | **Pass** |
| 5 | Verify contract version and sequence | Pending | **Pass** |
| 6 | Acknowledge one event | Pass | **Pass** |
| 7 | Verify pending count becomes zero | Pass | **Pass** |
| 8 | Generate ten-event burst | Pass (100) | **Pass** |
| 9 | Fetch in ordered batch | Pass | **Pass** |
| 10 | Partially acknowledge five | Pending | **Pass** |
| 11 | Verify five remain pending | Pending | **Pass** |
| 12 | Acknowledge remaining five | Pass (100 full) | **Pass** |
| 13 | Generate events while JS observation is stopped | Pending | **Pass** |
| 14 | Restart observation | Pending | **Pass** |
| 15 | Confirm events remain available through pull | Pending | **Pass** |
| 16 | Simulate JavaScript reload | Pass | **Pass** |
| 17 | Confirm unacknowledged events replay | Pending | **Pass** |
| 18 | Simulate duplicate insertion | Pending | **Pass** |
| 19 | Confirm duplicate is rejected or visibly counted | Pending | **Pass** |
| 20 | Simulate unsupported schema | Pending | **Pass** |
| 21 | Confirm event is rejected and not automatically acknowledged | Pending | **Pass** |
| 22 | Export sanitized diagnostics | Pending | **Pass** |
| 23 | Confirm no coordinate fields appear | Pending | **Pass** |
| 24 | Clear prototype data | Pending | **Pass** |

**Evidence directory:** `device-validation-20260731-134617/` (logcat tails capture UI log lines uiautomator marks invisible).

**Harness note (31 July 2026):** The original pass-2 automation reported **28 steps / 16 passed / 12 failed** (exit 1) because step assertions searched uiautomator XML for React Native log TextViews that are off-screen/invisible. Decisive logcat and stats evidence supports **24/24** device scenarios passing. No bridge or device failures were observed.

**Evidence-only reevaluation (authoritative):**

```powershell
.\scripts\evaluate-device-evidence.ps1 -EvidenceDir device-validation-20260731-134617
# or
.\scripts\run-device-pass2.ps1 -EvaluateOnly -EvidenceDir device-validation-20260731-134617
```

Writes `validation-summary.json` (24 scenarios, evidence source per assertion). Exits **0** when all required evidence passes.

**Live device rerun:** `.\scripts\run-device-pass2.ps1` from prototype root (requires Metro + wireless ADB).

---

## Pass 2 — button-by-button sequence (complete remaining scenarios)

Run on SM-A166U with Metro connected. Tap **Refresh stats** after each major step unless noted.

### A. Clean baseline (2, 24)

1. **Clear prototype data**
2. **Refresh stats** → expect `pendingCount: 0`
3. **Fetch without acknowledging** → log `fetched 0` (scenario **2**)
4. (End of session) repeat clear for scenario **24**

### B. Single-event flow (3, 4, 5, 6, 7)

5. **Generate 1 synthetic event**
6. **Verify contract header** → log shows `Contract verify PASS` (scenario **5**)
7. **Fetch pending + ack all** OR **Fetch without acknowledging** then ack via full fetch (scenarios **4**, **6**)
8. **Refresh stats** → `pendingCount: 0` (scenario **7**)

### C. Ten-event partial ack (8, 9, 10, 11, 12)

9. **Clear prototype data**
10. **Generate exactly 10 events**
11. **Fetch without acknowledging** → log shows `seq=[1, 2, … 10]` (scenarios **8**, **9**)
12. **Acknowledge first 5 only** → log `ack=5`
13. **Refresh stats** → note `acknowledgedCount: 5`; UI shows 5 unacked in last fetch cache (scenario **11**)
14. **Acknowledge remaining 5** → log `ack=5`
15. **Refresh stats** → `pendingCount: 0`, `acknowledgedCount: 10` (scenario **12**)

### D. Observation gap + replay (13, 14, 15, 16, 17)

16. **Clear prototype data**
17. **Stop push observation**
18. **Generate exactly 10 events** (while observation stopped — scenario **13**)
19. **Restart push observation** (scenario **14**)
20. **Fetch without acknowledging** → events retrieved via pull (scenario **15**)
21. **Simulate JS restart**
22. **Replay unacknowledged (pull again)** → log confirms replay or ack-able cache (scenario **17**)
23. **Acknowledge first 5 only** then **Acknowledge remaining 5** (complete ack after replay test)
24. (Scenario **16** covered by step 21 — buffer preserved)

### E. Error hooks (18, 19, 20, 21)

25. **Simulate duplicate insertion** → log `rejected=true` (scenario **18**)
26. **Refresh stats** → `duplicateRejectedCount` increased (scenario **19**)
27. **Simulate unsupported schema event** → log `rejected=true` (scenario **20**)
28. **Refresh stats** → `rejectedCount` increased; `acknowledgedCount` unchanged (scenario **21**)

### F. Diagnostics & privacy (22, 23)

29. **Export sanitized diagnostics** → preview appears on screen (scenario **22**)
30. Confirm badge **Coordinate privacy check: PASS** (scenario **23**)
31. Verify preview JSON has no `latitude`, `longitude`, `lat`, `lng` keys

### G. Cleanup (24)

32. **Clear prototype data**
33. **Refresh stats** → all counts zero

---

## Detailed steps (UI actions)

### 1. App installs and launches

| Field | Detail |
|---|---|
| **Action** | Android Studio → Run `app` debug on SM-A166U (Metro running). |
| **Expected** | Banner **NON-PRODUCTION — VALIDATION ONLY**; `Connection: connected`. |
| **Pass/Fail** | Pass 1 ✓ · Pass 2: _pending_ |

### 2. Empty-buffer fetch

| Field | Detail |
|---|---|
| **Action** | **Clear prototype data** → **Fetch without acknowledging**. |
| **Expected** | Log: `fetched 0`; no errors. |
| **Pass/Fail** | Pass 2: _pending_ |

### 3–7. Single event + contract + ack

| Field | Detail |
|---|---|
| **Action** | **Generate 1 synthetic event** → **Verify contract header** → **Fetch pending + ack all** → **Refresh stats**. |
| **Expected** | Contract PASS; `pendingCount: 0`; `acknowledgedCount ≥ 1`. |
| **Pass/Fail** | Pass 1 partial ✓ · Pass 2: _pending_ |

### 8–12. Ten-event partial acknowledgment

| Field | Detail |
|---|---|
| **Action** | **Clear prototype data** → **Generate exactly 10 events** → **Fetch without acknowledging** → **Acknowledge first 5 only** → **Refresh stats** → **Acknowledge remaining 5** → **Refresh stats**. |
| **Expected** | Sequences 1–10; after first ack 5 remain in cache; final `acknowledgedCount: 10`, `pendingCount: 0`. |
| **Pass/Fail** | Pass 2: _pending_ |

### 13–15. Observation stopped; pull authoritative

| Field | Detail |
|---|---|
| **Action** | **Stop push observation** → **Generate exactly 10 events** → **Restart push observation** → **Fetch without acknowledging**. |
| **Expected** | Events persist; pull succeeds regardless of push hints. |
| **Pass/Fail** | Pass 2: _pending_ |

### 16–17. JS restart and replay

| Field | Detail |
|---|---|
| **Action** | **Fetch without acknowledging** (do not ack) → **Simulate JS restart** → **Replay unacknowledged (pull again)**. |
| **Expected** | Native buffer preserved; events remain ack-able. |
| **Pass/Fail** | Pass 1 (16) ✓ · Pass 2: _pending_ |

### 18–21. Duplicate and unsupported schema

| Field | Detail |
|---|---|
| **Action** | **Simulate duplicate insertion** → **Refresh stats** → **Simulate unsupported schema event** → **Refresh stats**. |
| **Expected** | `duplicateRejectedCount ≥ 1`; `rejectedCount ≥ 1`; no silent ack. |
| **Pass/Fail** | Pass 2: _pending_ |

### 22–23. Sanitized diagnostics

| Field | Detail |
|---|---|
| **Action** | **Export sanitized diagnostics** — read on-screen preview and privacy badge. |
| **Expected** | Badge **PASS**; no coordinate keys in JSON. |
| **Pass/Fail** | Pass 2: _pending_ |

### 24. Clear prototype data

| Field | Detail |
|---|---|
| **Action** | **Clear prototype data** → **Refresh stats**. |
| **Expected** | All counts zero. |
| **Pass/Fail** | Pass 2: _pending_ |

---

## Push vs pull reminder

- `PrototypeEventsAvailable` is a **wake-up hint only**.
- **`Fetch without acknowledging` / native pull is authoritative** for delivery.
- **Stop push observation** tests hint loss without blocking pull.

---

## Session summary (pass 1 — 31 July 2026)

| Field | Value |
|---|---|
| Device | Samsung SM-A166U |
| Scenarios passed | 9 / 24 |
| Notes | Core path validated; no bridge failures |

---

## Related

- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md) — extended 26-scenario runbook
- [Android Prototype Validation Gate.md](../../planning/Android%20Prototype%20Validation%20Gate.md)
