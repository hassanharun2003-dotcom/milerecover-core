# Prototype C — Device result template

Copy this section per device/emulator session. **Synthetic data only.**

---

## Session metadata

| Field | Value |
|---|---|
| Date | |
| Engineer | |
| Platform | Android / iOS |
| Environment | emulator / simulator / physical device |
| Device model | |
| OS version | |
| RN version | 0.76.5 (prototype — not locked) |
| Bridge approach | Legacy Native Module |
| Git commit | |

---

## Scenario results

| # | Scenario | Pass/Fail | Notes | Log reference |
|---|---|---|---|---|
| 4 | Empty-buffer fetch | | | |
| 5 | Single event | | | |
| 6 | Ten-event batch | | | |
| 7 | Large burst | | | |
| 8 | Duplicate insertion | | | |
| 9 | Replay without ack | | | |
| 14 | JS reload | | | |
| 15 | JS unavailable during gen | | | |
| 19 | Process recreation | | | |
| 24 | Sanitized export | | | |

---

## Benchmarks (device-measured only)

| Batch size | Native persist ms | Fetch ms | JS validate ms | Ack ms | Round-trip ms |
|---|---|---|---|---|---|
| 1 | | | | | |
| 10 | | | | | |
| 100 | | | | | |
| 500 | | | | | |
| 1000 | | | | | |

> Do not copy Node/Jest numbers here — those are simulation-only.

---

## Push hint validation

| Check | Result |
|---|---|
| Hint received when listener registered | |
| Events still available after hint missed | |
| Pull matches native pending count | |

---

## Privacy check

| Check | Result |
|---|---|
| Logcat / OS log free of coordinates | |
| Diagnostic export redacted | |

---

## Overall

| Field | Value |
|---|---|
| Session pass/fail | |
| Blockers | |
| Follow-up | |
