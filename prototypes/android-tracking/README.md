# Prototype B — Android tracking and foreground service

**TIP letter:** B  
**Status:** Implementation prepared — **device validation pending**  
**Package:** `com.milerecover.prototype.androidtracking`

> **Warning:** Technical validation prototype only. Not MileRecover production software.  
> **Do not import** this code from `apps/` or `packages/` without promotion review (ADR-0003).

---

## Question answered

Can Kotlin + a foreground service reliably capture location evidence offline with durable buffering, process recovery, and privacy-safe diagnostics on reference Android hardware?

---

## Hypothesis

Platform location APIs + FGS + native SQLite buffer sustain validation sessions through background operation on a reference Pixel, with honest handling of permission and OEM limits.

---

## Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer recommended
- Android SDK 34 platform + build-tools
- JDK 17
- Physical device recommended (Pixel 7 / Android 14 reference)
- USB debugging enabled for device tests

---

## Build

```bash
cd prototypes/android-tracking
# Generate wrapper if missing (requires Gradle installed once):
# gradle wrapper

./gradlew assembleDebug          # Unix
gradlew.bat assembleDebug        # Windows
```

**Note:** Gradle wrapper JAR may need to be generated via Android Studio “Sync Project” on first open if `gradlew` is not executable yet.

Output: `app/build/outputs/apk/debug/app-debug.apk` (local only — **do not commit**)

---

## Run tests

```bash
cd prototypes/android-tracking
./gradlew test
```

Tests use synthetic data only. See `app/src/test/`.

---

## Install on device

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## Validation sequence

1. Read [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
2. Run scenarios on physical device
3. Record results in [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md)
4. Update [RESULTS.md](./RESULTS.md)

---

## Operator UI (minimal)

- Permission explain + incremental request
- Start / stop validation session
- Status: permissions, FGS state, battery optimization, buffer counts
- Export **sanitized** diagnostics (default — no exact coordinates)
- Optional **sensitive research export** (confirmed, local only)
- Clear all prototype data
- Open system settings / battery optimization

---

## Export sanitized diagnostics

Tap **Export sanitized diagnostics** → file written to app internal storage:

`files/diagnostics/sanitized_diagnostics_*.json`

Pull with:

```bash
adb exec-out run-as com.milerecover.prototype.androidtracking cat files/diagnostics/<filename>
```

**Do not commit** pulled files if they might contain sensitive research content.

---

## Delete all data

Tap **Clear all prototype data** — removes SQLite buffer, session prefs, and local export files.

---

## Architecture (prototype-only)

| Component | Role |
|---|---|
| `TrackingForegroundService` | FGS + location sampling |
| `SqliteEventBuffer` | Durable events (**not** production DB — see Prototype D) |
| `SessionManager` | Session id + sequence + prefs |
| `BootReceiver` | Boot recovery evaluation |
| `DiagnosticExporter` | Privacy-safe exports |

See [DEPENDENCIES.md](./DEPENDENCIES.md).

---

## Success / failure criteria

| Success (device validation) | Failure |
|---|---|
| 10/10 controlled drives record samples without silent loss | >20% missed capture |
| FGS visible while active | Silent OEM kill without fault event |
| Offline airplane mode works | Default export leaks coordinates |

Full TIP criteria in [RESULTS.md](./RESULTS.md).

---

## Explicit non-goals

- React Native / Prototype C
- Product trips, Proof Score, Recovery, sync, backend
- Production thresholds or notification design
- Locked map/analytics/crash vendors

---

## Known limitations

- Activity recognition uses replaceable stub
- Boot FGS restart may fail Android 12+ — recorded as fault
- Force-stop prevents recovery until user reopens app
- `SQLiteOpenHelper` does not prove Prototype D encryption/choice

---

## Promotion / discard

**Discard by default** per [Prototype Governance.md](../../planning/Prototype%20Governance.md).  
Informs Phase 3 native module — not automatic promotion.

---

## Related documents

- [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md)
- [RESULTS.md](./RESULTS.md)
- [Technical Implementation Plan.md](../../planning/Technical%20Implementation%20Plan.md) §25-B
- [Native Tracking Engine.md](../../architecture/Native%20Tracking%20Engine.md)
