# Battery measurement methodology (Prototype B)

**Purpose:** Safe, repeatable battery impact observation during Android tracking validation.  
**Scope:** Prototype B calibration only — not production power budgets.

---

## Principles

1. **Compare like-for-like** — same device, OS build, network state, and screen-off policy across runs.
2. **Never commit pulled diagnostics** that may contain sensitive research exports.
3. **Use system metrics** — do not install third-party battery profilers unless approved for the validation lab.
4. **Record context** — ambient temperature, charging state, and whether battery optimization was disabled for the prototype app.

---

## Recommended setup

| Item | Guidance |
|---|---|
| Device | Reference Pixel (Android 14) or documented OEM equivalent |
| Charging | Unplugged; start each run above 50% SOC |
| Screen | Off unless the scenario explicitly tests foreground UI |
| Network | Note Wi‑Fi vs LTE vs airplane mode per scenario |
| App state | Fresh install or cleared prototype data before baseline |

---

## Measurement procedure

### 1. Baseline idle (control)

1. Reboot device; wait 5 minutes with screen off.
2. Record starting battery level via **Settings → Battery**.
3. Leave device idle (no prototype session) for **60 minutes**.
4. Record ending battery level and compute `%/hour` drain.

### 2. Active validation session

1. Clear prototype data from operator UI.
2. Grant location + notification permissions; note battery optimization status.
3. Start validation session; confirm FGS notification visible.
4. Run the scenario from [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md) (e.g. 60‑minute drive or stationary capture).
5. Stop session; export **sanitized diagnostics** only.
6. Record battery delta for the session window.

### 3. Post-run adb checks (optional)

```powershell
adb shell dumpsys batterystats --charged com.milerecover.prototype.androidtracking
adb shell dumpsys battery
```

Review `UID` wake lock and `Foreground services` sections. Do not paste full dumps into committed artifacts.

---

## What to log in RESULTS.md

- Device model + build fingerprint
- Start/end SOC (%)
- Session duration (wall clock)
- Battery optimization: exempt / restricted
- Scenario id (from runbook)
- Sanitized export filename (local path only)

---

## Anti-patterns

- Do **not** extrapolate prototype drain to production trip mileage claims.
- Do **not** disable Doze globally on the device — only document per-app exemption if used.
- Do **not** compare runs across different temperature bands without noting it.

---

## Related

- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
- [EXTENDED_LIFECYCLE_VALIDATION.md](./EXTENDED_LIFECYCLE_VALIDATION.md)
- [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md)
