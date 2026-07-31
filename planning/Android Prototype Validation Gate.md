# Android Prototype Validation Gate

**Status:** Gate **open** — physical-device validation not executed in authoring environment  
**Last updated:** July 2026  
**Owner:** Mobile / Engineering  
**Scope:** Prototypes B, C, D — Android build correctness, automated tests, device readiness

> This gate consolidates physical-device testing. Individual runbooks remain authoritative for step detail:
> - [prototypes/android-tracking/VALIDATION_RUNBOOK.md](../prototypes/android-tracking/VALIDATION_RUNBOOK.md)
> - [prototypes/native-bridge/VALIDATION_RUNBOOK.md](../prototypes/native-bridge/VALIDATION_RUNBOOK.md)
> - [prototypes/local-database/VALIDATION_RUNBOOK.md](../prototypes/local-database/VALIDATION_RUNBOOK.md)

---

## 1. Gate purpose

Confirm MileRecover Android prototypes compile, pass automated tests where tooling permits, and are ready for controlled physical-device evidence gathering — **without promoting prototype code to production**.

---

## 2. Required prototypes

| Letter | Directory | Android artifact |
|---|---|---|
| **B** | `prototypes/android-tracking/` | Standalone Kotlin FGS tracking validation |
| **C** | `prototypes/native-bridge/android/` | RN host + native bridge module |
| **D** | `prototypes/local-database/harness/candidates/native-sqlite-kotlin/` | Native SQLite Robolectric harness |

Each project is **standalone** — no shared Android monorepo.

---

## 3. Required development tools

| Tool | Minimum | Purpose |
|---|---|---|
| JDK | 17 | Gradle, Kotlin |
| Android SDK | API 34+ (C: 35) | Compile, Robolectric |
| Android build-tools | 34.0.0+ | assembleDebug |
| Gradle wrapper | Per `GRADLE_WRAPPER.md` | CLI builds |
| Node.js | 20+ | Prototype C JS tests |
| ADB | Latest stable | Device validation |
| Physical device or emulator | API 26+ | Stages 2–4 |

**Environment variables:** `JAVA_HOME`, `ANDROID_HOME` or `ANDROID_SDK_ROOT`

**Gitignored locally:** `local.properties`, `*.apk`, Gradle caches, raw diagnostics

---

## 4. Recommended starting device

- **Primary:** Pixel-class device, Android 14 (API 34), stock or near-stock ROM
- **Battery optimization:** Document state (unrestricted vs optimized) — do not bypass OEM policy deceptively
- **Permissions:** Grant location incrementally per runbook; use synthetic movement only

---

## 5. Broader device matrix (before production ADR)

| Tier | Example | Android | Why |
|---|---|---|---|
| Reference | Pixel 7/8 | 14–15 | Baseline |
| Samsung | Galaxy A or S series | 13–14 | OEM background policy |
| Budget | Motorola / Nokia | 12–13 | minSdk guard validation |
| Emulator | API 34 x86_64 | 14 | Smoke only — not a gate pass substitute |

---

## 6. Test order

### Stage 1 — Build validation (desktop)

1. **Prototype D** — `./gradlew :app:testDebugUnitTest`, `assembleDebug`
2. **Prototype B** — `./gradlew :app:testDebugUnitTest`, `assembleDebug`
3. **Prototype C** — `npm test`, `npm run typecheck`, `./gradlew :app:testDebugUnitTest`, `assembleDebug`

### Stage 2 — Emulator smoke

1. **C** — bridge pull/ack, push hint + pull, JS reload
2. **B** — FGS start/stop, notification channel, buffer insert
3. **D** — optional logcat timing spot-check if instrumented wrapper added later

### Stage 3 — Physical-device controlled validation

1. **B** — permissions, FGS, process death, reboot evaluation, background, screen off
2. **C** — native generation while JS absent, replay, acknowledgment, reload
3. **D** — native SQLite timings via Robolectric on JVM **or** logcat if run on device wrapper

### Stage 4 — Controlled movement validation (B primary)

Stationary → walking → short drive → longer drive → multi-stop; network off; battery saver; screen off; task removed.

**Synthetic routes only** — no real home/work addresses.

### Stage 5 — Result review

Event loss, duplicate rate, restart behavior, buffer integrity, bridge replay, acknowledgment correctness, latency, battery, privacy review.

Update each prototype `RESULTS.md` by environment type (JVM / emulator / physical).

---

## 7. Evidence collection

| Artifact | Storage | Git |
|---|---|---|
| `RESULTS.md` updates | In repo | Yes — sanitized summaries only |
| DEVICE_RESULT_TEMPLATE | Per session | Yes — no coordinates |
| Logcat excerpts | Local | No — reference tag names only |
| APK/AAB | Local | **Never commit** |
| Raw diagnostic exports | `local-diagnostics/` | **Never commit** |

Required fields when device available: manufacturer, model, Android version, security patch, battery optimization state, permission config, commit SHA, build variant, timestamps, event/duplicate counts, sequence gaps, service restart notes.

---

## 8. Privacy controls

- Synthetic data only ([Synthetic Test Data Policy](../docs/Synthetic%20Test%20Policy.md))
- No exact routes or coordinates in committed results
- Default diagnostics must exclude coordinates (automated tests verify)
- No cloud upload during gate

---

## 9. Pass/fail criteria

Gate **passes** only when **all** are true:

- [ ] All three Android projects compile or have formally accepted blockers
- [ ] Automated tests pass or failures documented with hypothesis impact
- [ ] **B:** FGS start/stop on physical device; events while backgrounded; process-death observed; force-stop limitation confirmed
- [ ] **C:** Events before JS; replay unacknowledged; explicit ack; not dependent on push delivery
- [ ] **D:** Native SQLite Robolectric tests pass with measured JVM timings recorded
- [ ] No silent event loss in required controlled scenarios
- [ ] Duplicates prevented or visibly detected
- [ ] Default diagnostics contain no exact coordinates
- [ ] Results recorded by environment type
- [ ] **No automatic promotion**

Gate remains **open** until physical-device stages complete.

---

## 10. Failure escalation

| Severity | Action |
|---|---|
| Build blocked | Fix prototype-local defect; document in RESULTS |
| Test failure | Root-cause category; fix or accept risk with Engineering lead |
| Device-only failure | Record OEM/Android version; do not generalize without matrix |
| Privacy leak | **Stop gate**; fix before continuing |
| Hypothesis invalidated | Update RESULTS; do **not** create production ADR without review |

---

## 11. Promotion restrictions

- Prototype code **discarded by default** (ADR-0003)
- Passing the gate does **not** authorize `apps/` or `packages/` implementation
- Production ADR requires explicit review and rewrite — not copy-paste

---

## 12. Gate completion checklist

### Stage 1 (build)

- [ ] JDK + SDK installed
- [ ] Gradle wrapper generated per `GRADLE_WRAPPER.md` in each project
- [ ] `local.properties` created locally
- [ ] Prototype D `:app:testDebugUnitTest` — result recorded
- [ ] Prototype B `:app:testDebugUnitTest` — result recorded
- [ ] Prototype C `npm test` + `:app:testDebugUnitTest` — result recorded
- [ ] `assembleDebug` for B and C — result recorded

### Stage 2–4 (device)

- [ ] Emulator smoke — result recorded
- [ ] Physical device matrix — result recorded
- [ ] Movement controls — result recorded

### Stage 5 (review)

- [ ] All `RESULTS.md` updated
- [ ] Gate pass/fail decision documented here (section below)

---

## Current gate status (authoring environment)

| Check | B | C | D |
|---|---|---|---|
| JDK available | **Blocked** | **Blocked** | **Blocked** |
| Android SDK | **Blocked** | **Blocked** | **Blocked** |
| Gradle wrapper complete | **Blocked** (jar/scripts pending local `gradle wrapper`) | **Blocked** | **Blocked** (properties only) |
| JVM/Robolectric tests | **Not run** | **Not run** (JS: **Passed**) | **Not run** |
| assembleDebug | **Not run** | **Not run** | **Not run** |
| Emulator | **Not run** | **Not run** | N/A |
| Physical device | **Not run** | **Not run** | **Not run** |

**Decision:** Gate **open**. Proceed with local Android Studio setup and Stage 1 commands.

---

## Wrapper bootstrap commands

```bash
# After JDK + Gradle (or Android Studio) installed:

cd prototypes/android-tracking
gradle wrapper --gradle-version 8.2

cd prototypes/native-bridge/android
gradle wrapper --gradle-version 8.10.2

cd prototypes/local-database/harness/candidates/native-sqlite-kotlin
gradle wrapper --gradle-version 8.2
```

---

## Related

- [Prototype Governance.md](./Prototype%20Governance.md)
- [Technical Implementation Plan.md](./Technical%20Implementation%20Plan.md) §25
