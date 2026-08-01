# Prototype B — Device validation results

**Status:** Package 2 JVM/Robolectric suite added; physical Package 2 harness available  
**Production promotion:** Not approved

---

## Package 2 automated evidence (August 2026)

| Layer | Count | Status |
|---|---|---|
| Pure JVM (`EventIngestGateTest`) | 2 | **Pass** (30/30 local Gradle run) |
| Robolectric (session, buffer, diagnostics, process recreation) | 28 | **Pass** (same task, 30/30 total) |
| Physical device (scenarios A–J) | See summary JSON | **Blocked** — adb available, no device connected at Package 2 run |

**Evidence separation:** JVM/Robolectric results are produced by Gradle XML under `app/build/test-results/`. Physical scenarios are **never** inferred from Robolectric passes — only from harness JSON + `device-validation/runs/` artifacts.

---

## Question

Can Kotlin + foreground service achieve reliable offline location validation capture with durable buffering on reference Android hardware?

---

## Second physical-device session — 31 July 2026 (PASS)

| Field | Value |
|---|---|
| Device | Samsung SM-A166U |
| Connection | Wireless debugging / wireless deployment |
| IDE | Android Studio Quail 3 |
| Build | **Successful** |
| Install | **Successful** |

### Pass — second validation

| Check | Result |
|---|---|
| Build successful | **Pass** |
| Installed on Samsung SM-A166U | **Pass** |
| Wireless deployment validated | **Pass** |
| Foreground permission validated | **Pass** |
| Notification permission validated | **Pass** |
| Foreground service started | **Pass** |
| Foreground notification displayed | **Pass** |
| Foreground service stopped | **Pass** |
| Lifecycle synchronization fixed | **Pass** — previous bug resolved on device |
| Pending event acknowledgement validated | **Pass** |
| Duplicate acknowledgement handled correctly | **Pass** — second ack: *"No pending events"* |

### Observed values (second pass)

| Field | Value |
|---|---|
| Permission | `foreground_only` |
| FGS session requested (after stop) | `false` |
| Tracking state (after stop) | `STOPPED` |
| Pending events | `10` → `0` after acknowledgement |
| Second acknowledgement attempt | Toast: *"No pending events"* |

### Previous lifecycle bug — resolved

First pass issues (spurious `RECOVERING`, stop/UI desync) are **resolved** after code fixes and confirmed on second physical-device validation. See [FINDINGS.md](./FINDINGS.md) — **Validated Fix**.

---

## First physical-device session — 31 July 2026 (reference)

First pass identified lifecycle/UI defects. Fixes applied; second pass above confirms resolution.

| # | Issue (first pass) | Second pass |
|---|---|---|
| 1 | `SESSION_REQUESTED` → `RECOVERING` on normal start | **Resolved** |
| 2 | Stop toast vs stale UI | **Resolved** |
| 3 | Pending ack UX unclear | **Resolved** — 10 → 0 ack validated |
| 4 | UI not synchronized with service | **Resolved** |

---

## Before fix / after fix

| Concern | Before fix (pass 1) | After fix (pass 2 device) |
|---|---|---|
| Tracking state lifecycle | `RECOVERING` on normal start | **Pass** — clean stop to `STOPPED` |
| UI vs service state | Stale; stop toast mismatch | **Pass** — `FGS session requested: false` after stop |
| Pending acknowledgement | Count grew; UX unclear | **Pass** — 10 → 0; duplicate ack handled |

---

## Build configuration

| Setting | Value |
|---|---|
| Application ID | `com.milerecover.prototype.androidtracking` |
| minSdk | 26 (calibration — not final product minimum) |
| targetSdk | 34 |
| compileSdk | 34 |
| Prototype version | 0.1.0-prototype-b |

---

## Devices tested

| Device | Session | Result |
|---|---|---|
| Samsung SM-A166U | Pass 1 | Partial — defects found |
| Samsung SM-A166U | Pass 2 | **Pass** — core FGS, lifecycle, ack |

---

## Success criteria status (TIP §25)

| Criterion | Status |
|---|---|
| FGS visible; starts on device | **Pass** (SM-A166U, pass 2) |
| FGS stops cleanly; UI synchronized | **Pass** (pass 2) |
| Permission + notification flow | **Pass** |
| Event buffer + acknowledgement | **Pass** — 10 pending → 0 ack |
| Clean tracking state lifecycle | **Pass** (pass 2) |
| Offline operation | **Not fully exercised** |
| Background location / activity recognition | **Not run** |
| 10/10 drives → draft with evidence | **Not run** |
| Event loss without detection | **Not run** (movement/process death pending) |
| Duplicate session control on device | **Partial** — duplicate ack pass |

---

## Failure criteria status

| Criterion | Triggered? |
|---|---|
| Coordinate leak in default diagnostics | **Not observed** |
| Silent OEM kill | **Not observed** (short session) |
| UI/service desync | **No** (pass 2) |

---

## Android validation gate

| Stage | Status |
|---|---|
| Stage 1 build (SM-A166U) | **Pass** |
| Stage 3 physical-device (core FGS/lifecycle/ack) | **Pass** (pass 2) |
| Stage 3 remaining (background, movement, process death, reboot, battery) | **Harness ready** — run Package 2 script; reboot scenario blocked in automation |
| Stage 4 movement controls | **Not run** |
| Gate pass (full) | **Open** |

See [Android Prototype Validation Gate.md](../../planning/Android%20Prototype%20Validation%20Gate.md).

---

## Remaining Prototype B work

- Execute Package 2 physical harness on SM-A166U (`run-package-2-device-validation.ps1 -Execute`)
- Background location validation
- Activity recognition validation
- Movement testing (controlled drives)
- Manual reboot scenario (I) when adb repair path documented
- Broader device matrix (non-Samsung reference device)

---

## Recommendation

**Prototype B is validated for the current milestone** regarding:

- Physical build/deploy on SM-A166U
- Foreground permission + notification flow
- FGS start/stop with synchronized UI
- Durable buffer pending/ack semantics (Prototype C simulation)

**Not validated** for production tracking reliability, background capture, OEM matrix, or movement scenarios. Do **not** promote to `apps/mobile`. Continue runbook scenarios before any architecture lock.

---

## Promotion / discard decision

| Decision | Status |
|---|---|
| Promote to production | **No** |
| Discard after report | Default per ADR-0003 |
| Milestone evidence | Pass 2 archived in RESULTS + FINDINGS |

---

*Last updated: Package 2 Android lane — August 2026.*
