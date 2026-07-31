# MileRecover Native Tracking Engine

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering

---

## Mission

The Native Tracking Engine (NTE) captures driving evidence with **battery friendly** efficiency and **accuracy over features**. It detects movement; it does not classify business purpose or confirm trips.

**Never invent mileage:** The engine creates draft trip candidates only when sensor evidence meets thresholds. No interpolation across large gaps.

---

## Design Goals

| Goal | Target |
|---|---|
| Battery impact | <4% iOS daily, <5% Android daily |
| Drive detection latency | Start within 60s of movement |
| False drive rate | <5% of detected sessions |
| Missed drive rate | <8% (conservative acceptable) |
| Offline operation | 100% — no network required |

**Trust over automation:** False positives are worse than missed trips (user can add manually).

---

## Platform Implementation

### iOS (Swift)
- `CLLocationManager` with adaptive accuracy
- `CLVisit` for stop detection
- `CMMotionActivity` for drive vs walk discrimination
- Background modes: `location`
- Region monitoring for home/work geofences (optional, H2)

### Android (Kotlin)
- Fused Location Provider
- Activity Recognition API
- Foreground service with persistent notification (required)
- WorkManager for batch uploads to local DB

### React Native Bridge
- Thin event emitter to JS layer
- Heavy processing on native threads
- Trip drafts written to SQLite via native path (avoid JS bridge for raw GPS)

---

## State Machine

```
IDLE
  │ motion + speed threshold
  ▼
DETECTING (collecting samples, not yet a trip)
  │ sustained movement 60s+
  ▼
RECORDING (active trip)
  │ stop detected 5min+ OR user manual stop
  ▼
FINALIZING (compute distance, confidence)
  │
  ▼
DRAFT_EMITTED → local DB (status: pending)
  │
  ▼
IDLE
```

User can pause engine → `PAUSED` state (no detection).

---

## Location Sampling Strategy

### Adaptive Accuracy

| State | iOS Accuracy | Android Priority | Frequency |
|---|---|---|---|
| Idle | Reduced / SLC* | BALANCED | ~15 min |
| Detecting | NearestTenMeters | HIGH | 30s |
| Recording | BestForNavigation** | HIGH | 10–15s |

*Significant Location Changes  
**Only while confirmed driving; downgrade at stops

### Battery Heuristics
- Pause high accuracy when device stationary >5 min
- Reduce sampling when battery <20% (user notified)
- Respect Low Power Mode (iOS): switch to manual-first mode banner

---

## Drive Detection Algorithm (Conceptual)

**Inputs:** location samples, motion activity, speed, time

**Scoring factors:**
1. Sustained speed >10 mph for 60+ seconds
2. Motion activity = automotive
3. Path continuity (no teleports)
4. Minimum distance >0.5 miles

**Output:** `TripCandidate` with:
- `location_batch_id`
- `start_time`, `end_time`
- `raw_points[]` (encrypted local)
- `computed_distance`
- `detection_confidence` (0–1)
- `flags[]` (gap, teleport, low_sample_rate)

Trips below confidence 0.4 are logged as `detection_events` for debugging, not user trips.

---

## Stop Detection

- Speed <5 mph for 5 minutes → end trip
- CLVisit arrival → end trip
- User manual stop → immediate finalize
- Engine off mid-drive → finalize partial with `incomplete` flag (lower Proof Score)

---

## Distance Calculation

- Primary: Haversine sum over filtered points
- Filter: remove accuracy >100m, obvious GPS spikes
- Snap-to-road: **not in MVP** (avoid inventing path geometry)
- User can override with odometer (replaces computed distance in export)

---

## Data Retention (On Device)

| Data | Retention |
|---|---|
| Raw location samples | 90 days default, configurable |
| Trip summaries | Until user deletes |
| Detection debug logs | 7 days |

Raw points linked to trips; purged when trip deleted.

---

## Permission Degradation

| Permission Level | Behavior |
|---|---|
| Always | Full background detection |
| While Using | Foreground + significant-change only |
| Denied | Engine off; manual entry promoted |

Never simulate trips when permission insufficient.

---

## Testing Matrix

| Scenario | Expected |
|---|---|
| Highway drive 30mi | Trip detected, confidence >0.8 |
| Parking lot wander | No trip or low confidence |
| Short hop 0.3mi | Below threshold, no trip |
| Airplane/train | Motion filter rejects |
| Tunnel gap | Trip continues, gap flag |
| Phone off mid-trip | Partial trip with incomplete flag |
| Offline 7 days | All trips local, sync later |

---

## Metrics (Telemetry)

- Detection rate, false positive rate (user reject)
- Sample rate achieved
- Battery mAh estimate per day
- Permission level distribution

No raw GPS in telemetry.

---

## Related Documents

- [Proof Score.md](./Proof%20Score.md)
- [Offline First.md](./Offline%20First.md)
- [../research/Tracking Research.md](../research/Tracking%20Research.md)
- [../research/Background Location Research.md](../research/Background%20Location%20Research.md)
- [../design/Apple HIG References.md](../design/Apple%20HIG%20References.md)
