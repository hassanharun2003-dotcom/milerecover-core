# Prototype C — Native event buffer and React Native bridge

**TIP letter:** C  
**Status:** Implementation complete — **Android device validation pass 1 pending**  
**Directory:** `prototypes/native-bridge/`

> **Warning:** Disposable validation — **not** the MileRecover production app.  
> Do **not** import into `apps/` or `packages/`. Code discarded by default (ADR-0003).

---

## Prototype question

Can a narrow, typed, versioned native-to-React-Native boundary reliably buffer native evidence events, deliver them after JS starts, preserve ordering, support explicit acknowledgment, replay unacknowledged events, and operate offline without leaking tracking logic into UI?

This validates the **communication boundary only** — not production tracking reliability.

---

## Prerequisites (Windows + SM-A166U)

| Tool | Purpose |
|---|---|
| Node.js ≥ 20 | Contract tests, harness, Metro |
| npm | Prototype dependencies |
| Android Studio Quail 3 | Import/build Android project |
| JDK 17 | Via Android Studio → Settings → Build → Gradle JDK |
| Android SDK API 35 + build-tools 35.0.0 | Compile (see `android/build.gradle`) |
| Samsung SM-A166U | Wireless debugging (validated for Prototype B) |

---

## 1. JavaScript preparation

From repository root or prototype folder:

```powershell
cd prototypes\native-bridge
npm install
npm run typecheck
npm test
npm run benchmark
```

All four should pass before opening Android Studio.

---

## 2. Android Studio — open project

1. **Open folder:** `prototypes/native-bridge/android`  
   (Not the repo root — the `android/` subfolder.)
2. **Gradle JDK:** File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK → **17**.
3. **`local.properties`:** Copy `android/local.properties.example` → `android/local.properties` and set:
   ```properties
   sdk.dir=C\:\\Users\\YourUser\\AppData\\Local\\Android\\Sdk
   ```
4. **Gradle wrapper (one time, if `gradlew.bat` missing):**
   ```powershell
   cd prototypes\native-bridge\android
   gradle wrapper --gradle-version 8.10.2
   ```
   See [android/GRADLE_WRAPPER.md](./android/GRADLE_WRAPPER.md). Android Studio may also offer to create the wrapper on first sync.

---

## 3. Command-line Android build (after wrapper exists)

From `prototypes/native-bridge/android` on Windows:

```powershell
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:assembleDebug
```

**Note:** Gradle builds were **not** verified in the Cursor authoring environment — run on your machine with JDK 17 + SDK (same environment as Prototype B).

---

## 4. Run on device (SM-A166U)

**Terminal 1 — Metro** (from `prototypes/native-bridge`):

```powershell
npm start
```

**Terminal 2 — install** (optional CLI alternative to Studio Run):

```powershell
npm run android
```

**Android Studio Run configuration:**

| Setting | Value |
|---|---|
| Module | `app` |
| Device | Samsung SM-A166U (wireless debugging) |
| Build variant | `debug` |

Debug manifest enables cleartext Metro traffic (`android/app/src/debug/AndroidManifest.xml`).

---

## 5. First device validation

Follow [ANDROID_FIRST_DEVICE_PASS.md](./ANDROID_FIRST_DEVICE_PASS.md) (24 scenarios, pass 1).  
Record evidence in [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md) and [RESULTS.md](./RESULTS.md).

---

## Minimal debug UI

Non-production host (`com.milerecover.prototype.nativebridge`) exposes:

- Bridge connection state, contract versions, buffer counts
- Generate synthetic events / burst
- Pull pending events (authoritative)
- Push hint listener (`PrototypeEventsAvailable` — wake-up only)
- Simulate JS restart (clears JS idempotency only)
- Export sanitized diagnostics
- Clear prototype data

Partial ack, duplicate, and unsupported-schema scenarios use **React Native DevTools console** — see first device pass doc.

No product tabs, maps, sync, auth, or tracking detection.

---

## Native bridge API (Android)

| JS / native method | Purpose |
|---|---|
| `generateSyntheticEvents` | Insert synthetic burst |
| `fetchPendingEvents` | **Authoritative pull** |
| `acknowledgeEvents` | Explicit ack |
| `getBufferStats` | Buffer counters |
| `clearPrototypeData` | Wipe prototype DB |
| `exportSanitizedDiagnostics` | Redacted export |
| `simulateDuplicateInsertion` | Duplicate test hook |
| `simulateUnsupportedSchemaEvent` | Schema rejection hook |
| `addListener` / `removeListeners` | RN EventEmitter contract (push hints) |

Replay is validated by **fetch without ack**, then fetch again — there is no separate `simulateReplay` native method.

---

## Artifacts

| Document | Purpose |
|---|---|
| [ANDROID_FIRST_DEVICE_PASS.md](./ANDROID_FIRST_DEVICE_PASS.md) | SM-A166U pass 1 (24 scenarios) |
| [BRIDGE_COMPARISON.md](./BRIDGE_COMPARISON.md) | Legacy vs TurboModule vs JSI |
| [PLATFORM_PARITY.md](./PLATFORM_PARITY.md) | Method parity matrix |
| [VALIDATION_RUNBOOK.md](./VALIDATION_RUNBOOK.md) | 26 manual scenarios |
| [DEVICE_RESULT_TEMPLATE.md](./DEVICE_RESULT_TEMPLATE.md) | Device evidence capture |
| [RESULTS.md](./RESULTS.md) | Measured vs pending evidence |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | Prototype deps only |
| [android/GRADLE_WRAPPER.md](./android/GRADLE_WRAPPER.md) | Wrapper bootstrap |

---

## Diagnostic export

Use **Export sanitized diagnostics** in the debug UI, or call native `exportSanitizedDiagnostics()`.  
Exports exclude exact coordinates by default.

---

## Clear data

Use **Clear prototype data** in UI or native `clearPrototypeData()`.  
Reinstall app for full wipe.

---

## Relationship to other prototypes

| Prototype | Relationship |
|---|---|
| **B (android-tracking)** | B validates native FGS capture; C validates RN bridge over a **separate** prototype buffer — not imported from B |
| **D (local-database)** | D evaluates production DB candidates; C uses **prototype-only** SQLite (Android) / JSON file (iOS) — not a DB decision |

---

## Known limitations

- Legacy Native Module chosen for prototype — not a production bridge lock
- RN 0.76.5 used for harness — version not locked
- iOS compile/build **pending** in non-Mac environments
- Node/Jest benchmarks simulate buffer semantics — **not** mobile bridge latency
- Gradle wrapper scripts may need one-time local generation
- No TurboModule/Codegen measured in this pass

---

## Promotion / discard

- **Do not promote** prototype host, buffer, or UI to `apps/mobile`
- Contract **concepts** may inform `packages/contracts` after rewrite and ADR review
- Default: **discard** code after decision; archive `RESULTS.md` and benchmark JSON

---

## Test commands summary

```powershell
cd prototypes\native-bridge
npm test                    # Jest — contract, buffer, bridge, privacy, stress
npm run typecheck
npm run benchmark           # Node harness → harness/output/harness-benchmark.json
cd android
.\gradlew.bat :app:testDebugUnitTest
.\gradlew.bat :app:assembleDebug
```
