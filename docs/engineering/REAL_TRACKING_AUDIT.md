# Real tracking audit — MileRecover 0.1.8

**Commit baseline:** product-lock + release-proof work on `cursor/final-product-lock-29cb`  
**Honesty rule:** Do not claim automatic mileage tracking works without physical-device proof.

## Production path (implemented)

```
App.tsx TrackingBootstrap
  → createTrackingController (apps/mobile-expo/src/services/trackingEngine.ts)
  → foreground Location.watchPositionAsync
  → TaskManager task `milerecover-tracking` + Location.startLocationUpdatesAsync (FGS on Android)
  → appendSamples → filterSample / isImpossibleJump / sampleIndicatesMovement
  → evaluateSampleBuffer (packages/domain/src/tracking/segmentation.ts)
  → onTripClosed → AppContext.upsertTrip
  → Review classification → Proof/report inclusion
```

### Fully implemented

| Area | Evidence |
|---|---|
| Foreground watch | `trackingEngine.ts` `watchPositionAsync` (5s / 25m, Balanced) |
| Background task registration | `TASK_NAME = milerecover-tracking`, `defineTask` + `startLocationUpdatesAsync` |
| Android FGS notification | `foregroundService.notificationTitle/Body/Color` |
| Sample persistence | `@milerecover/tracking/samples/v1` AsyncStorage |
| Machine persistence | `@milerecover/tracking/machine/v1` |
| Headless close queue | `@milerecover/tracking/pending-trips/v1` flushed on start |
| GPS quality | `gpsQuality.ts` impossible-jump + gap detection |
| Distance | Haversine path sum; jumps skipped; never interpolated |
| Trip close / discard | `evaluateSampleBuffer` close OR discard insufficient quiet buffers |
| Duplicate / overlap | `isDuplicateAutoTrip`, `overlapsExistingAutoTrip` |
| Primary vehicle assignment | `getPrimaryVehicleId` from App bootstrap |
| Async reverse geocode | `geocode.ts` — labels applied after emit; failure does not block trips |
| Entitlement gate | Free 40 auto/month via `canCaptureAutomaticTrip` before start |
| Config permissions | `app.config.ts` location + background + FGS permissions |

### Partially implemented

| Area | Status |
|---|---|
| Trip state machine | Wired and persisted; close path advances QUIET → EVIDENCE → RESET; not a second source of truth for distance |
| Battery OEM detection | Permission snapshot `batteryOptimizationRestricted` exists; deep OEM truth still device-dependent |
| Motion permission | Declared in snapshot types; not required for current GPS path |
| Map SDK | Pure RN `RouteMapPreview` only — no Google/Apple Maps module |
| iOS Always authorization UX | Background permission requested when enabling protection; real Always dialog needs device |

### Simulated / unavailable in Jest

| Area | Status |
|---|---|
| TaskManager | Jest mocks → `taskManagerAvailable: false` in unit tests |
| Real GPS | Not available in CI; requires physical device |
| Demo scenarios | Demo mode can load fixture trips — off by default for real installs |

### Requires native build

- Android APK with `expo-location` + TaskManager + FGS
- iOS binary with UIBackgroundModes `location` and Always permission strings
- Not Expo Go

### Requires credentials

- RevenueCat / store products for paid unlock validation
- Optional Google Maps / Apple Maps API keys **if** native MapView is added later

### Requires device testing

- Background while screen off
- Samsung battery unrestricted/optimized/restricted
- Force-close during drive + reboot recovery
- Midnight boundary
- Weak GPS / airplane mode
- Real distance reasonableness vs car odometer

## Exact trip-detection rules

From `DEFAULT_TRACKING_CONFIG`:

- `minTripDistanceMeters`: **150**
- `minTripDurationMs`: **90_000** (90s)
- `stopQuietMs`: **180_000** (3 min)
- `maxSpeedMps`: **50** (~112 mph) sample reject
- `maxAccuracyMeters`: **80**
- `movingSpeedMps`: **1.5**
- `movingDistanceMeters`: **20** (when speed null)
- Impossible jump ceiling: **55 m/s** (`isImpossibleJump`)
- Quiet + insufficient evidence → **discard** consumed window (no merge into later drive)

## Exact distance algorithm

1. Accept samples passing accuracy/speed filters  
2. Drop impossible jumps between consecutive accepted points  
3. Sum Haversine meters along remaining segments  
4. Convert to miles (`/ 1609.344`), round to 0.1  
5. Store `routePreview` via downsample (≤40 observed points) — **never invent midpoints**

## Persistence

| Key | Contents |
|---|---|
| `@milerecover/tracking/samples/v1` | Last ≤2000 accepted samples |
| `@milerecover/tracking/machine/v1` | Trip machine state string |
| `@milerecover/tracking/pending-trips/v1` | Trips closed while UI controller absent |
| App persistence repository | Final `TripRecord`s offline-first |

## Recovery after termination / reboot

1. On start: restore sample buffer + machine state  
2. Flush pending closed trips into AppContext  
3. Re-evaluate buffer for quiet close/discard  
4. Re-register background updates if allowed  

## Privacy / retention

- Samples and trips stored locally on device  
- Reverse geocode uses OS geocoder when network available; coordinates retained if labels fail  
- UI prefers coarse place labels (city/region) not street-level home exposure in broad surfaces  
- Delete local data clears product + app stores (see Privacy screen / dataPrivacy service)

## Android risks

- OEM battery killers (Samsung) pausing FGS  
- Background location “Allow all the time” denial → foreground-only  
- Notification dismissal user confusion  
- Doze / app standby delays sample cadence  

## iOS risks

- Always vs When In Use authorization  
- Background kill after prolonged suspension  
- `pausesUpdatesAutomatically` may pause in stationary traffic longer than expected  
- Precise Location off reduces accuracy → more low-confidence trips  

## Gaps closed in this release-proof pass

- Insufficient quiet buffers discarded  
- Missing speed no longer counts as movement by default  
- Headless trip queue  
- Primary vehicle on auto trips  
- Non-blocking reverse geocode enrichment  
- Stronger FGS / AutomotiveNavigation activity type  

## Still not claimable without device proof

Automatic background trip capture end-to-end on Android and iPhone.
