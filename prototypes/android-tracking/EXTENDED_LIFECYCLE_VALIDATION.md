# Extended lifecycle validation (Prototype B)

**Purpose:** Document manual scenarios for foreground-service restart, process death, app relaunch, and pending-event recovery.  
**Audience:** Device operators running validation on physical hardware with USB debugging.

> Synthetic fixtures for offline replay live in [fixtures/synthetic-device-db/](./fixtures/synthetic-device-db/).  
> Automated JVM buffer tests do **not** substitute for these device scenarios.

---

## Prerequisites

- Debug APK installed: `com.milerecover.prototype.androidtracking`
- USB debugging enabled
- [scripts/run-lifecycle-validation.ps1](./scripts/run-lifecycle-validation.ps1) reviewed (skeleton — operator confirms each step)
- No secrets or production credentials in adb commands

---

## Scenario A — FGS restart after swipe-away

**Hypothesis:** Session prefs + buffer survive user removing the task from recents while FGS should restart or record a fault.

1. Start validation session; confirm notification visible.
2. Swipe app away from recents.
3. Wait 30s; check notification and operator UI after relaunch.
4. Export sanitized diagnostics.

**Pass signals:** `service_active` or explicit `prototype_fault` with recoverable metadata; pending events retained.

---

## Scenario B — Process death (adb)

**Hypothesis:** SQLite buffer persists; `process_recovery` emitted on next launch.

1. Start session; insert at least one location sample (or wait for automatic sample).
2. Run process kill via script Step `KillProcess`.
3. Relaunch app from launcher.
4. Verify buffer pending count > 0 before ack processing.
5. Export sanitized diagnostics.

**Pass signals:** `process_recovery` event; no silent loss of pre-death pending events.

---

## Scenario C — Force-stop boundary

**Hypothesis:** Android force-stop clears runtime state; recovery is honest after user reopens app.

1. Start session.
2. `adb shell am force-stop com.milerecover.prototype.androidtracking`
3. Reopen app manually (no boot receiver expectation).
4. Document whether session was restorable vs new session required.

**Pass signals:** Documented behavior matches [README.md](./README.md) known limitations.

---

## Scenario D — Pending-event recovery after relaunch

**Hypothesis:** Unacknowledged events remain in SQLite and appear in sanitized export.

1. Start session; ensure ≥3 pending events (pause before any ack/export pipeline).
2. Kill process (Scenario B).
3. Relaunch; pull sanitized export.
4. Compare event count to pre-death operator UI buffer count.

**Pass signals:** Event count monotonic; sequence ordering preserved.

---

## Recording results

Copy [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md) per run. Attach:

- Scenario id (A–D)
- adb command log (local only)
- Sanitized export hash/filename (do not commit export JSON)

---

## CI boundary

GitHub Actions workflow [prototype-android-jvm.yml](../../.github/workflows/prototype-android-jvm.yml) runs `:app:testDebugUnitTest` on push to `milestone/android-validation`. It does **not** execute these adb scenarios.

---

## Related

- [scripts/run-lifecycle-validation.ps1](./scripts/run-lifecycle-validation.ps1)
- [BATTERY_MEASUREMENT_METHODOLOGY.md](./BATTERY_MEASUREMENT_METHODOLOGY.md)
- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
