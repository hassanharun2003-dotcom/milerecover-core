# MileRecover Tracking Technology Research

**Status:** Research  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering

---

## Research Objective

Evaluate location tracking approaches for **accuracy**, **battery impact**, and **defensibility** to inform the Native Tracking Engine.

Philosophy: **Battery friendly**, **Accuracy over features**, **Never invent mileage**

---

## Location API Comparison

### iOS Core Location

| API | Battery | Accuracy | Background | Use in MileRecover |
|---|---|---|---|---|
| Significant Location Changes | Excellent | ~500m+ | ✓ | Idle monitoring |
| Visit Monitoring | Excellent | Place-level | ✓ | Stop detection |
| Region Monitoring | Good | Geofence | ✓ | Work location H2 |
| Standard Location (variable) | Poor–Good | 5–100m | ✓ (Always) | Active recording |
| Motion Activity (CMMotion) | Excellent | N/A | ✓ | Drive detection gate |

### Android Fused Location Provider

| Priority | Battery | Accuracy | Use |
|---|---|---|---|
| PRIORITY_BALANCED_POWER | Good | ~100m | Idle |
| PRIORITY_HIGH_ACCURACY | Poor | ~5–20m | Active recording |
| Activity Recognition | Excellent | N/A | Drive gate |

---

## Drive Detection Approaches (Literature & Industry)

### 1. Speed Threshold
- Simple: speed >10 mph for N seconds
- **Pros:** Low compute
- **Cons:** False positives (transit, passenger)

### 2. Motion Activity + Speed
- Combine automotive activity with speed
- **Pros:** Better precision, still efficient
- **Cons:** Activity API lag (~30s)
- **MileRecover choice:** Primary approach

### 3. Continuous High-Accuracy GPS
- Always BestForNavigation
- **Pros:** Maximum accuracy
- **Cons:** Unacceptable battery — rejected

### 4. Map Matching / Snap to Road
- Post-process GPS to road network
- **Pros:** Cleaner distances
- **Cons:** Can "invent" path on GPS gaps — **deferred post-MVP**
- If added: never apply to gaps >500m without flag

### 5. Bluetooth Car Connection
- Detect vehicle BT pairing
- **Pros:** Strong drive start signal
- **Cons:** Not universal; optional H2

---

## Distance Calculation Methods

| Method | Accuracy | Defensibility |
|---|---|---|
| Raw Haversine sum | Good | High — transparent |
| Kalman filtered | Better | Medium — must document |
| Map-matched | Best on gaps | Lower on gaps — risky |
| Odometer | User-dependent | Highest when photographed |

**MileRecover MVP:** Filtered Haversine with spike removal. Odometer override always wins.

---

## False Positive Sources

| Source | Mitigation |
|---|---|
| GPS drift while parked | Stationary timeout before start |
| Passenger in moving car | Motion activity + optional BT H2 |
| Short trips (<0.5 mi) | Minimum distance threshold |
| Cycling fast | Speed + activity mismatch flag |
| Airplane/train | Speed >90mph sustained reject |

---

## False Negative Sources

| Source | Mitigation |
|---|---|
| Tunnel gaps | Continue trip with gap flag |
| Engine disabled | Manual entry prompt |
| Low Power Mode | Reduced mode + user notify |
| Permission When In Use only | Foreground capture + SLC |

**Tradeoff:** MileRecover accepts higher false negative rate vs false positive (**trust over automation**).

---

## Battery Benchmark Targets (Industry Reference)

| App type | Typical daily GPS battery |
|---|---|
| Aggressive trackers | 8–15% |
| Optimized trackers | 3–6% |
| MileRecover target | <4% iOS, <5% Android |

**Measurement plan:** Xcode Energy Gauge, Android Battery Historian, 8-hour drive day simulation.

---

## Offline Tracking

All processing on-device. No server required for detection.

Location batches buffered in SQLite with backpressure (max 7 days local buffer before oldest purge with user warning).

---

## Privacy-Preserving Techniques

- Reduce precision in non-recording states
- Purge raw samples per retention policy
- On-device activity ML (no cloud for detection)

---

## Open Research Items

- [ ] Benchmark MileIQ/Everlance battery on reference devices (controlled test)
- [ ] Evaluate Mapbox map matching for v2 (with gap flags)
- [ ] Bluetooth trigger feasibility study
- [ ] Kalman filter implementation vs raw — accuracy delta

---

## Related Documents

- [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
- [Background Location Research.md](./Background%20Location%20Research.md)
- [Proof Score.md](../architecture/Proof%20Score.md)
