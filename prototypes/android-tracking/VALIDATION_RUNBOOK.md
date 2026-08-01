# Prototype B — Validation runbook

**Audience:** Engineering / QA performing physical-device validation  
**Prototype:** `prototypes/android-tracking/`  
**Not MileRecover production software**

Record results using [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md). Update [RESULTS.md](./RESULTS.md) after sessions.

---

## Evidence layers (Package 2)

| Layer | Command / artifact | Scope |
|---|---|---|
| **Pure JVM** | `./gradlew :app:testDebugUnitTest` — `EventIngestGateTest` | Schema gate without Android framework |
| **Robolectric** | Same Gradle task — session, buffer, diagnostics tests | SharedPreferences + SQLite on JVM |
| **Physical device** | `.\scripts\run-package-2-device-validation.ps1 -Execute` | Scenarios A–J; writes [device-validation/package-2-validation-summary.json](./device-validation/package-2-validation-summary.json) |
| **Not simulatable** | Manual runbook steps | Force-stop UX, reboot, OEM recents, controlled drives |

CI ([prototype-android-jvm.yml](../../.github/workflows/prototype-android-jvm.yml)) covers JVM/Robolectric only.

---

## Platform limitations (read first)

| Scenario | Android behavior |
|---|---|
| **User force-stop** | App cannot receive boot or restart services until user opens app again |
| **Task removal (swipe recents)** | Process may die; service may restart with START_STICKY if session still requested — verify events |
| **Boot FGS start (Android 12+)** | Starting foreground service from `BOOT_COMPLETED` may be restricted — prototype records `boot_fgs_restricted` fault |
| **Force-stop vs process death** | Force-stop clears app state; ordinary process death may preserve SharedPreferences + SQLite |

---

## 1. Clean installation

| | |
|---|---|
| **Preconditions** | APK built from prototype module; device factory or app uninstalled |
| **Steps** | Install debug APK; launch once |
| **Expected** | Warning text visible; no session active; buffer empty |
| **Evidence** | Screenshot of initial status (no coordinates) |
| **Pass/fail** | |

---

## 2. Permission grant

| | |
|---|---|
| **Preconditions** | Fresh install |
| **Steps** | Tap explain & request foreground permissions → grant fine location + notifications |
| **Expected** | Permission summary not `denied`; `permission_changed` event in buffer |
| **Evidence** | Sanitized export permission fields |
| **Pass/fail** | |

---

## 3. Permission denial

| | |
|---|---|
| **Preconditions** | Fresh install or permissions reset |
| **Steps** | Deny location permission |
| **Expected** | Start session blocked with toast; no false “protected” messaging |
| **Evidence** | Status shows denied |
| **Pass/fail** | |

---

## 4. Partial permission

| | |
|---|---|
| **Preconditions** | Coarse granted, fine denied (or vice versa) |
| **Steps** | Request permissions selectively via settings |
| **Expected** | Summary reflects partial; start allowed only if foreground capable |
| **Evidence** | Permission summary + events |
| **Pass/fail** | |

---

## 5. Permission revocation while active

| | |
|---|---|
| **Preconditions** | Active validation session |
| **Steps** | Revoke location in system settings while FGS running |
| **Expected** | Location faults or unavailable events; no silent continuation |
| **Evidence** | Event types `location_unavailable` or `prototype_fault` |
| **Pass/fail** | |

---

## 6. Start session

| | |
|---|---|
| **Preconditions** | Permissions granted |
| **Steps** | Tap Start validation session |
| **Expected** | Persistent notification; state `SERVICE_ACTIVE`; session_requested true |
| **Evidence** | Notification visible; sanitized export |
| **Pass/fail** | |

---

## 7. Background operation

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Home button; wait ≥2 min |
| **Expected** | Notification persists; buffer count increases if moving |
| **Evidence** | Buffer total before/after |
| **Pass/fail** | |

---

## 8. Screen-off operation

| | |
|---|---|
| **Preconditions** | Active session, backgrounded |
| **Steps** | Turn screen off ≥5 min |
| **Expected** | Service continues or records fault — not silent loss |
| **Evidence** | Sequence continuity in export |
| **Pass/fail** | |

---

## 9. Task removal

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Swipe app from recents |
| **Expected** | Document service restart behavior; events may include `process_recovery` |
| **Evidence** | Event log categories |
| **Pass/fail** | |
| **Limitation** | OEM-dependent |

---

## 10. Process death

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | `adb shell am kill com.milerecover.prototype.androidtracking` |
| **Expected** | On relaunch, buffer retains prior events; session state documented |
| **Evidence** | Buffer count persisted |
| **Pass/fail** | |

---

## 11. Force stop

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Settings → Force stop |
| **Expected** | **No automatic tracking** until user opens app; no false boot resume |
| **Evidence** | Boot receiver no_resume after reboot if force-stopped |
| **Pass/fail** | |
| **Limitation** | OS by design |

---

## 12. Device reboot

| | |
|---|---|
| **Preconditions** | Active session; **not** force-stopped |
| **Steps** | Reboot device |
| **Expected** | `boot_recovery_evaluated` event; resume attempt or documented fault |
| **Evidence** | Sanitized export boot decision fields |
| **Pass/fail** | |

---

## 13. Network loss

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Enable airplane mode ≥10 min |
| **Expected** | Capture continues; no network required |
| **Evidence** | Location sample events while offline |
| **Pass/fail** | |

---

## 14. Battery saver

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Enable system battery saver |
| **Expected** | `battery_status_changed` event; behavior documented |
| **Evidence** | Export battery summary |
| **Pass/fail** | |

---

## 15. Battery optimization restriction

| | |
|---|---|
| **Preconditions** | App battery optimized |
| **Steps** | Run session; optionally whitelist via settings button |
| **Expected** | Status shows optimized/restricted; transitions recorded |
| **Evidence** | Battery summary in export |
| **Pass/fail** | |

---

## 16. Long stationary period

| | |
|---|---|
| **Preconditions** | Active session, device stationary ≥30 min |
| **Steps** | Leave device still |
| **Expected** | Few or no location samples; no duplicate sessions |
| **Evidence** | Sample count stable |
| **Pass/fail** | |

---

## 17. Short controlled movement test

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Walk/drive short synthetic test route (not customer route) |
| **Expected** | Location samples with accuracy metadata in sanitized export (buckets only) |
| **Evidence** | Sample count increase |
| **Pass/fail** | |

---

## 18. Longer controlled drive

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | ≥15 min drive test environment |
| **Expected** | Continuous sample chain or documented gaps |
| **Evidence** | Sequence gap count in export |
| **Pass/fail** | |

---

## 19. Multi-stop controlled drive

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Drive with ≥2 stops |
| **Expected** | Samples pause/resume; single session id |
| **Evidence** | One session id throughout |
| **Pass/fail** | |

---

## 20. Repeated service start

| | |
|---|---|
| **Preconditions** | Session already active |
| **Steps** | Tap Start again / redeliver start intent |
| **Expected** | Duplicate start ignored; `duplicate_rejected` or single service_active |
| **Evidence** | duplicateRejectedCount |
| **Pass/fail** | |

---

## 21. Repeated service stop

| | |
|---|---|
| **Preconditions** | Active session |
| **Steps** | Tap Stop twice |
| **Expected** | Idempotent stop; no duplicate sessions left active |
| **Evidence** | session_requested false |
| **Pass/fail** | |

---

## 22. Diagnostic export

| | |
|---|---|
| **Preconditions** | Some events buffered |
| **Steps** | Export sanitized diagnostics |
| **Expected** | JSON without exact lat/lng; contains counts and states |
| **Evidence** | Inspect file locally — do not commit |
| **Pass/fail** | |

---

## 23. Data deletion

| | |
|---|---|
| **Preconditions** | Buffered data exists |
| **Steps** | Clear all prototype data |
| **Expected** | Buffer zero; prefs cleared; exports removed from app storage |
| **Evidence** | UI counts zero |
| **Pass/fail** | |

---

## 24. Reinstallation

| | |
|---|---|
| **Preconditions** | Prior install used |
| **Steps** | Uninstall → reinstall |
| **Expected** | Empty state; no orphaned files in Git |
| **Evidence** | Fresh install behavior |
| **Pass/fail** | |

---

## Controlled sensitive export (optional)

Separate action — only for internal research. Confirm dialog required. Never commit output.

---

## Reporting

1. Fill [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md)
2. Run [scripts/run-package-2-device-validation.ps1](./scripts/run-package-2-device-validation.ps1) for Package 2 scenarios A–J
3. Update [RESULTS.md](./RESULTS.md) and [FINDINGS.md](./FINDINGS.md)
4. File GitHub prototype issue if follow-up required
