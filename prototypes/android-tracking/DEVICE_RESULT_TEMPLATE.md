# Prototype B — Device result template

Copy one file per device/session. **Do not include private route details or exact coordinates.**

---

## Session metadata

| Field | Value |
|---|---|
| Date | |
| Tester | |
| Prototype commit | |
| Device manufacturer / model | |
| Android version | |
| Security patch level | |
| Memory class (if known) | |
| Battery settings summary | |
| Permission configuration | |

---

## Scenarios completed

| # | Scenario | Pass / Fail | Notes |
|---|---|---|---|
| 1 | Clean installation | | |
| 2 | Permission grant | | |
| 3 | Permission denial | | |
| 4 | Partial permission | | |
| 5 | Permission revocation while active | | |
| 6 | Start session | | |
| 7 | Background operation | | |
| 8 | Screen-off operation | | |
| 9 | Task removal | | |
| 10 | Process death | | |
| 11 | Force stop | | |
| 12 | Device reboot | | |
| 13 | Network loss (airplane) | | |
| 14 | Battery saver | | |
| 15 | Battery optimization restricted | | |
| 16 | Long stationary period | | |
| 17 | Short controlled movement test | | |
| 18 | Longer controlled drive | | |
| 19 | Multi-stop controlled drive | | |
| 20 | Repeated service start | | |
| 21 | Repeated service stop | | |
| 22 | Sanitized diagnostic export | | |
| 23 | Data deletion | | |
| 24 | Reinstallation | | |

---

## Observations

| Field | Value |
|---|---|
| Event loss observed? | Yes / No — describe without coordinates |
| Duplicate events observed? | Yes / No — count / type |
| Service restart behavior | |
| Battery impact (qualitative) | |
| Diagnostic artifact ID / filename | |
| Unexpected behavior | |

---

## Conclusion

| Field | Value |
|---|---|
| Overall pass / fail | |
| Meets TIP success criteria? | |
| Follow-up task | |

---

## Platform limitations noted

- Force-stop recovery: ___
- Boot FGS restrictions (Android 12+): ___
- OEM-specific behavior: ___
