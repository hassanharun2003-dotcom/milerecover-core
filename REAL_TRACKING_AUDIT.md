# REAL_TRACKING_AUDIT.md

**Verdict:** Automatic tracking is a real Expo Location + TaskManager pipeline with real Haversine distance and Review/Proof wiring — **not a full Native Tracking Engine, not production-proven, and not safe to claim “tracking works” without native builds + device matrix testing.** Several critical logic gaps can merge noise into trips, drop headless trip closes, and leave place labels empty forever.

**Audit branch / tree:** `cursor/real-tracking-audit-0345` (from `cursor/final-product-lock-29cb`)  
**Scope:** `apps/mobile-expo` + `packages/domain` (+ config / research for risk context)  
**Date:** 2026-08-05

---

## End-to-end path (what the code actually does)

```
App.tsx registerRootComponent
  → AppProvider (restore AsyncStorage app-state)
  → ProductProvider (trackingEnabled flag)
  → TrackingBootstrap
       if trackingEnabled && canUseAutomaticCapture && canCaptureAutomaticTrip
         → createTrackingController().startTracking()
              → request/ensure foreground permission
              → Location.watchPositionAsync (5s / 25m / Balanced)
              → tryStartBackgroundUpdates
                   → TaskManager + ACCESS_BACKGROUND_LOCATION
                   → Location.startLocationUpdatesAsync('milerecover-tracking', FGS notif)
              → appendSamples → filterSample / isImpossibleJump → AsyncStorage samples
              → maybeCloseTripFromSamples → upsertTrip (pending auto_detected)
  → ReviewScreen classifyTrip (work/personal/…)
  → Proof readiness / export (labels usually still missing)
```

Key entry points:

| Step | Function / symbol | File |
|---|---|---|
| Bootstrap | `TrackingBootstrap` | `apps/mobile-expo/App.tsx:40-104` |
| Controller factory | `createTrackingController` | `apps/mobile-expo/src/services/trackingEngine.ts:404` |
| Task define (module load) | `defineBackgroundTask` / `TASK_NAME` | `trackingEngine.ts:17,136-160` |
| Sample ingest | `appendSamples` | `trackingEngine.ts:97-134` |
| Close trip | `maybeCloseTripFromSamples` | `packages/domain/src/tracking/segmentation.ts:85-129` |
| Persist trips | `upsertTrip` | `apps/mobile-expo/src/store/AppContext.tsx:247-270` |
| Permissions | `readLocationPermissionSnapshot` / `request*` | `apps/mobile-expo/src/services/locationPermissions.ts` |
| Protection UX | `ProtectionAlertScreen` / `resolveProtectionStatus` | `SupportingScreens.tsx`, `protection-health/status.ts` |

---

## 1. Fully implemented (with evidence)

| Capability | Evidence |
|---|---|
| App boots a real tracking controller when protection is on | `TrackingBootstrap` → `createTrackingController` → `startTracking` / `stopTracking` (`App.tsx:40-82`, `trackingEngine.ts:193-273`) |
| Foreground GPS watch | `Location.watchPositionAsync` accuracy `Balanced`, `timeInterval: 5000`, `distanceInterval: 25` (`trackingEngine.ts:225-239`) |
| Background task registration via Expo TaskManager | `TaskManager.defineTask('milerecover-tracking', …)` at module load (`trackingEngine.ts:136-160`); `Location.startLocationUpdatesAsync` (`354-365`) |
| Android FGS notification config (Expo plugin + runtime) | `app.config.ts:60-66,89-97` (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`, `isAndroidForegroundServiceEnabled: true`); runtime `foregroundService.notificationTitle/Body` (`trackingEngine.ts:360-363`) |
| iOS background mode + Always strings | `UIBackgroundModes: ['location']`, `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription` (`app.config.ts:47-51`) |
| Sample filter + teleport reject | `filterSample` (`segmentation.ts:45-53`); `isImpossibleJump` max **55 m/s** (`gpsQuality.ts:20-31`); used in `appendSamples` (`trackingEngine.ts:100-111`) |
| Trip close from buffered samples | `maybeCloseTripFromSamples` → `TripRecord` `source:'auto_detected'`, `status:'pending'` (`segmentation.ts:85-129`) |
| Duplicate auto-trip suppression | `isDuplicateAutoTrip` (±120s start/end, ±0.3 mi) domain + engine + `upsertTrip` (`segmentation.ts:131-139`, `trackingEngine.ts:311-318`, `AppContext.tsx:247-254`) |
| Sample + machine persistence keys | `@milerecover/tracking/samples/v1`, `@milerecover/tracking/machine/v1` (`trackingEngine.ts:15-16`) |
| App-state persistence for trips / engine shell | `@milerecover/app-state/v1` + backup (`AsyncStoragePersistenceRepository.ts:12-13`) |
| Entitlement gate for auto capture | Free **40**/month via `FREE_AUTOMATIC_TRIP_LIMIT` / `canCaptureAutomaticTrip` (`entitlements/types.ts:44`, `usage.ts:40-49`); wired in `App.tsx:44-46` |
| Protection health scoring + status copy | `calculateProtectionHealth`, `resolveProtectionStatus` (`protection-health/*`) |
| Review path for auto trips | `buildReviewItemFromTrip` → pending/unclassified; Review UI `captureSourceLabel('auto_detected')` → “Automatic capture” (`review/types.ts:41-71`, `ReviewScreen.tsx:73-86`) |
| Route preview (observed points only, no map SDK) | `downsampleRoutePreview` max **40** points; `RouteMapPreview` RN-only (`segmentation.ts:64-79`, `design-system/index.tsx:929-999`) |
| Domain unit tests for segmentation / machine / GPS quality | `packages/domain/__tests__/production-mvp.test.ts`, `final-production-pass.test.ts` |
| Deprecated stub removed from live import path | `trackingFoundation.ts` re-exports `trackingEngine` (no longer `PreviewTrackingEngine`) |

---

## 2. Partially implemented

| Area | What’s real | What’s incomplete |
|---|---|---|
| Trip state machine | `transitionTripMachine` exists (`tripStateMachine.ts`) and is advanced from the engine | **Does not control open/close.** Production fires `QUIET_ELAPSED` then `EVIDENCE_SUFFICIENT` in one shot (`trackingEngine.ts:124-129`), which cannot reach `NEEDS_REVIEW` from `TRACKING` (needs two `QUIET_ELAPSED`s per unit test). Machine is cosmetic telemetry. |
| Background reliability | Task + FGS wired | Degrades silently to foreground-only (`engineState: 'foreground'`) when TaskManager/permission fails (`trackingEngine.ts:241-242`). No OEM-specific repair beyond generic battery deep-link. |
| Battery optimization | `openBatteryOptimizationSettings` intents exist (`locationPermissions.ts:92-108`) | `probeBatteryOptimizationRestricted` **always returns `false`** (`locationPermissions.ts:18-22`). Protection health battery factor is therefore usually “green” falsely. Protection Center battery action also calls `openSystemSettings` not `openBatterySettings` (`SupportingScreens.tsx` ~1120). |
| Motion / activity | Domain scores `permissions.motion`; onboarding has `skip_motion` | **No motion API.** Snapshot hard-codes iOS `not_determined` / Android `not_applicable` (`locationPermissions.ts:54`, `AppContext` defaults). Never requested. Architecture’s automotive gate is absent. |
| Recovery after kill | Samples remain in AsyncStorage; `startTracking` reloads buffer and may close (`trackingEngine.ts:203,244-252`) | Headless TaskManager path cannot emit trips without `activeController` (see §12 / §14). |
| Route / Proof | `routePreview` + `hasRouteCoordinates` set on auto trips | **No geocoding**; `startLabel`/`endLabel` always `null` on auto close (`segmentation.ts:121-122`). Proof recommends / marks incomplete route (`proof/readiness.ts:30,111-122`). |
| Privacy deletion | Privacy screen calls `clearLocalPrivacyCaches` + `resetLocalData` | Clears samples key but **not** `TRACKING_MACHINE_STORAGE_KEY` (`dataPrivacy.ts:59-62`). Profile-only `resetLocalData` clears app-state keys only — **leaves GPS sample buffer**. |
| Architecture / DEC-002 NTE | Docs describe Swift/Kotlin SQLite engine | Production is **JS Expo TaskManager**, not the native prototypes under `prototypes/android-tracking`. |

---

## 3. Simulated / stubbed / demo-only

| Item | Reality |
|---|---|
| `probeBatteryOptimizationRestricted` | Stub → always `false` (`locationPermissions.ts:18-22`) |
| Motion permission | Never read from OS; placeholder states only |
| Native Tracking Engine (DEC-002 / architecture docs) | **Not in production app.** Expo JS path only. |
| Demo / fixture trips | `demoModeEnabled` + `DEMO_SCENARIOS` can feed Proof UI (`ProofScreen.tsx` uses demo trips when enabled). Separate from live GPS. |
| Jest mocks | `expo-task-manager` / `expo-location` mocked unavailable/denied (`jest.setup.js:40-57`) — unit tests do **not** prove device capture |
| `getTrackingDiagnostics` without bootstrap | Constructs controller with `isAllowed: () => false` (`trackingEngine.ts:413-420`) |
| Map UI | `RouteMapPreview` is a schematic RN plot, not MapKit/Google Maps |
| Geocoding | **None** — no `reverseGeocodeAsync` / geocode usage anywhere in `apps/mobile-expo` or `packages/domain` |
| Schema claim “no raw coordinates” | Comment on `PersistedAppDocumentV1` (`schema.ts:31`) is **false in practice** — trips may store `routePreview` lat/lng arrays |

---

## 4. Requires native build

Background location + TaskManager + Android FGS **will not work as a product claim in Expo Go**. Need:

- EAS `development` / `preview` / `production` profiles (`eas.json`)
- `expo-location` + `expo-task-manager` native modules (`package.json`)
- Android permissions + FGS types baked by prebuild (`app.config.ts`)
- iOS `UIBackgroundModes: location` baked into binary

OTA JS updates can change segmentation logic, but **cannot** add missing native permission/FGS wiring.

---

## 5. Requires credentials

| Tracking itself | **No API keys** (device GPS + OS reverse-geocode APIs unused) |
|---|---|
| Turning protection on for Free | No store credential — Free gets auto with 40/month limit |
| Plus unlimited auto | RevenueCat / store keys if claiming paid unlock (`EXPO_PUBLIC_REVENUECAT_*` in `app.config.ts`) — not required for Free auto path |
| Auth / Google Sign-In | Irrelevant to GPS path |

---

## 6. Requires device testing

Nothing in-repo substitutes for:

1. Cold start with protection on → drive → 3+ min stop → pending Review trip  
2. App killed mid-drive → continue → reopen → trip appears once  
3. Reboot with Always / background granted → confirm updates resume  
4. Android 10/11/12/13/14 background permission funnel  
5. Samsung / Xiaomi / Pixel battery restrictions  
6. iOS When-In-Use only vs Always  
7. Screen off / Doze / Low Power Mode  
8. Allowance exhaustion at 40 Free trips  

Jest + domain tests only cover pure functions.

---

## 7. Android-specific risks (FGS, OEM kill, Samsung)

| Risk | Code reality |
|---|---|
| FGS required for continuous background location | Configured via Expo (`isAndroidForegroundServiceEnabled`, `FOREGROUND_SERVICE_LOCATION`) + runtime `foregroundService` notification. **Must verify** Play policy / notification channel / `foregroundServiceType=location` in actual merged manifest after prebuild. |
| OEM killers (Samsung, Xiaomi, Huawei) | Research acknowledges them (`research/Background Location Research.md:63-68`). App **does not detect** restricted battery state (`probeBatteryOptimizationRestricted` stub). Deep-link helper exists but Protection Center battery CTA opens generic settings. |
| Background permission split (Android 11+) | Guided ask exists in Protection Center; engine requests background in `ensureBackgroundPermission` during `tryStartBackgroundUpdates`. |
| TaskManager / process death | Samples can persist; trip emission tied to `activeController` (JS). |
| Doze / app standby | `timeInterval: 5000` + Balanced is optimistic; OS will batch/defer. No significant-change / activity-recognition idle strategy from architecture docs. |
| Notification honesty | Title “MileRecover is protecting drives” shown even though segmentation is crude and may miss/merge drives. |

---

## 8. iOS-specific risks

| Risk | Code reality |
|---|---|
| Always vs When-In-Use | Strings present; upgrade UX in Protection Center. If only When-In-Use, background start fails → `foreground` engine state. |
| `pausesUpdatesAutomatically: true` | Set (`trackingEngine.ts:358`). Can pause when iOS thinks device is stationary — helps battery, can delay resume / create gaps (`hasGap` → low confidence). |
| `showsBackgroundLocationIndicator: false` | Set (`trackingEngine.ts:359`). Conflicts with research guidance to show indicator when tracking; App Review / user-trust risk. |
| No `CMMotionActivity` | Architecture assumes automotive motion gating; **not implemented**. Walking/transit false positives more likely. |
| Blue-bar / status expectations | Indicator disabled; users may not see background use. |
| Background task launch without React tree | Same `activeController` null problem as Android. |

---

## 9. Exact trip-detection rules (thresholds, speeds, dwell)

### Implemented constants — `DEFAULT_TRACKING_CONFIG` (`segmentation.ts:24-30`)

| Constant | Value | Meaning |
|---|---|---|
| `minTripDistanceMeters` | **150** | ~0.093 mi minimum path length |
| `minTripDurationMs` | **90_000** | 90 seconds first→last sample |
| `stopQuietMs` | **180_000** | **3 minutes** with no new sample before close eligible |
| `maxSpeedMps` | **50** | Reject sample if reported speed > ~112 mph |
| `maxAccuracyMeters` | **80** | Reject sample if accuracy worse than 80 m |

### Related hard-coded rules

| Rule | Value | Where |
|---|---|---|
| Moving heuristic for state machine | `speedMps > 1.5` (~3.4 mph); **if `speedMps == null`, treated as moving** | `trackingEngine.ts:120` |
| Impossible jump | implied speed > **55** m/s | `gpsQuality.ts:25` |
| Gap flag for low confidence | sample gap > **120_000** ms OR any accuracy > **40** m | `segmentation.ts:101-103` |
| Route preview cap | **40** points | `downsampleRoutePreview` |
| Sample buffer cap | **2000** | `MAX_BUFFERED_SAMPLES` |
| Watch / BG sampling intent | 5 s / 25 m / Balanced | `trackingEngine.ts:225-230,354-358` |
| Duplicate window | 120 s / 0.3 mi | `isDuplicateAutoTrip` |

### What is **not** implemented (but architecture claims)

From `architecture/Tracking State Machine.md` / Native Tracking Engine — **absent in code**:

- Start gate speed >8 mph / automotive motion  
- Sustained 60s + median ≥12 mph + 0.3–0.5 mi confirmation  
- Stop = speed <5 mph for **5 minutes** (code uses **3 min without samples**, not speed dwell)  
- CLVisit / Activity Recognition  
- Discard sub-threshold sessions cleanly  
- “Needs repair” user flow for killed sessions  

### Critical behavioral truth

`maybeCloseTripFromSamples` treats the **entire cleaned buffer from first to last sample** as one trip once quiet elapses. There is **no separate trip-start detector** and **no discard** when quiet elapses but min distance/duration fail (`segmentation.ts:97-99` returns `null` and leaves buffer intact). Noise + later real drive → **merged phantom trip**.

---

## 10. Exact distance algorithm

1. Filter samples: `filterSample` (accuracy ≤80 m, speed ≤50 m/s if present).  
2. Sort by `timestamp`.  
3. `pathDistanceMeters`: sum of **Haversine** segments, Earth radius **6_371_000** m (`segmentation.ts:32-42,55-60`; duplicate helper in `gpsQuality.ts`).  
4. Convert: `miles = meters / 1609.344`.  
5. Round: `Math.round(miles * 10) / 10` (0.1 mi).  
6. **No** map-matching, Kalman, interpolation, or gap bridging. Gaps only lower `confidence` / notes.  
7. Auto trips set `evidenceMethod: 'map_estimate'`.

---

## 11. Exact persistence keys / behavior

| Key | Contents | Behavior |
|---|---|---|
| `@milerecover/tracking/samples/v1` | JSON `LocationSample[]` | Load on start; append; keep last **2000**; written after each accepted batch |
| `@milerecover/tracking/machine/v1` | Trip machine state string | Written on transition; restored if `TRACKING` / `POSSIBLE_*` / `FINALIZING`; forced `IDLE` on `stopTracking` |
| `@milerecover/app-state/v1` | Full `PersistedAppDocument` incl. trips (`routePreview` possible) | Primary store; backup previous to `@milerecover/app-state-backup/v1` |
| `@milerecover/product-ui/v4` (+ v1–v3 migrate) | Includes `trackingEnabled` | Product layer; default `trackingEnabled: false` |
| `@milerecover/last-manual-*` | Manual entry helpers | Unrelated to auto GPS |

Shell engine state in app document: `'active' \| 'idle' \| 'stopped' \| 'unavailable'` via `mapEngineRuntimeToShell`.

---

## 12. Recovery after termination / reboot

| Scenario | Expected from code |
|---|---|
| App backgrounded, JS alive | Foreground watch may pause; background updates if registered |
| Process death, task still registered | Expo may relaunch JS for `milerecover-tracking`. `defineBackgroundTask()` runs at import. `appendSamples` persists samples. **`handleClosedTrip` only runs if `activeController` set** — normally only after `TrackingBootstrap` → `startTracking`. Closed trip emission deferred until UI starts tracking again. |
| User force-stop / OEM kill | Background updates often die until next explicit start; no BootCompleted custom receiver in app config |
| Reboot | Relies on Expo/OS restarting location updates for the registered task; **not explicitly tested or asserted in repo** |
| Protection off | `stopTracking` removes watch + `stopLocationUpdatesAsync`, machine → `IDLE` |
| Relaunch with protection on | Restores samples; attempts `maybeCloseTripFromSamples` once at end of `startTracking` |

**Honest claim:** sample buffer survival is implemented; **guaranteed trip recovery after kill/reboot is not.**

---

## 13. Privacy / retention

| Policy docs | Implementation |
|---|---|
| Raw samples ~90 days (`docs/Privacy Policy.md`, research) | **No TTL purge.** Buffer capped at 2000 samples only. |
| “No raw coordinates in app document” (`schema.ts:31`) | **Violated** by persisted `routePreview` on trips |
| Export honesty | User data export JSON notes coordinates/history not included (`dataPrivacy.ts:50`) — CSV/trips export still won’t reverse-geocode; route previews live in app-state |
| Delete local data | Privacy flow clears samples + product + app-state; machine key may remain; Profile reset alone may leave samples |
| Cloud | No upload of GPS in this path (local-first) |

---

## 14. Concrete code gaps that must be fixed before claiming tracking works

Priority order — **do not market “automatic protection works” until these are closed and device-proven:**

1. **Sub-threshold quiet does not discard buffer** (`maybeCloseTripFromSamples` returns `null` without trimming) → merges junk with later drives. Need explicit discard / session windows.  
2. **No real trip start rules** (motion/speed/dwell). `speedMps == null` counts as moving (`trackingEngine.ts:120`). Architecture thresholds unimplemented.  
3. **State machine not authoritative** — close path skips `POSSIBLE_STOP → FINALIZING → NEEDS_REVIEW`; machine persisted state is misleading. Either wire it or stop claiming it.  
4. **Headless close requires `activeController`** (`appendSamples` `if (closed && activeController)`) → background-only finalization can leave trips unemitted until next foreground start; must close into durable trip store from the task itself.  
5. **`resetLocalData` / privacy inconsistency** — machine key not cleared; Profile reset may leave `@milerecover/tracking/samples/v1`.  
6. **No geocoding** — auto trips forever `startLabel/endLabel: null` → Proof route gaps / weak IRS-style logs.  
7. **Battery restriction detection stubbed** — Samsung/OEM risk invisible to Protection Health.  
8. **Motion unused** — false positives (walk / transit) unmitigated.  
9. **iOS indicator off** (`showsBackgroundLocationIndicator: false`) — trust/review risk.  
10. **Schema/privacy comment drift** — stop claiming “no coordinates” while storing `routePreview`.  
11. **Stop definition ≠ dwell** — quiet = “no samples for 3 min”, not “speed < X for Y min”; OS pause can look like a stop.  
12. **No device validation matrix** in CI — mocks force TaskManager unavailable.  
13. **DEC-002 / NTE docs vs Expo JS** — product/engineering claims must be rewritten to the Expo engine or the native engine must be integrated.  
14. **Protection Center battery CTA** uses `openSystemSettings` instead of `openBatterySettings`.  
15. **Distance undershoot vs architecture MVP** — 150 m / 90 s is far below documented 0.5 mi / 2 min draft minimums; expect more junk trips if (1) is fixed without raising thresholds.

---

## Path verdict by stage

| Stage | Status |
|---|---|
| App bootstrap → controller | **Real** |
| Permissions UX | **Real** (battery/motion partial/stub) |
| Background tasks / FGS config | **Real wiring**, needs native binary + OEM soak |
| Samples → persistence | **Real** (AsyncStorage, not SQLite) |
| Trip start/stop | **Partial / fragile** (buffer-wide close, weak start) |
| Route points | **Partial** (downsampled preview only) |
| Distance | **Real Haversine** (honest, coarse) |
| Geocoding | **Missing** |
| Review | **Real** for pending auto trips |
| Proof | **Real readiness rules**; auto trips usually incomplete on places |

---

## Bottom line

There is a **genuine** Expo-based capture pipeline (`createTrackingController`, TaskManager task `milerecover-tracking`, Haversine `maybeCloseTripFromSamples`, Review/Proof). It is **not** the documented Native Tracking Engine, **not** geocoded, **not** OEM-aware, and has **logic bugs** (buffer merge, headless emit, cosmetic state machine) that make “tracking works” an overclaim until fixed and proven on physical Android/iOS devices.
