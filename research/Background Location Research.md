# MileRecover Background Location Research

**Status:** Research  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering / Product

---

## Research Objective

Document platform policies, user expectations, and technical constraints for background location—critical for MileRecover's **battery friendly**, **offline first** tracking.

---

## Why Background Location Is Essential

Self-employed users don't open mileage apps before driving. Without background capture, **every work mile accounted for** fails at the first forgotten trip.

However, background location is the #1 user concern and App Store scrutiny area.

---

## iOS Background Location

### Requirements (2026 policy context)
- `NSLocationAlwaysAndWhenInUseUsageDescription` required
- `UIBackgroundModes: location` in Info.plist
- App Store review: background location must be core feature
- iOS 13+: "Allow Once" option — cannot rely on Always from first prompt on newer behaviors
- Periodic re-prompting if user selects When In Use

### Best Practices (Apple)
1. Request When In Use first, then upgrade to Always with rationale screen
2. Use significant location changes when not actively driving
3. `pausesLocationUpdatesAutomatically = true` when appropriate
4. Show indicator when tracking active (iOS 11+ blue bar / status)

### iOS User Psychology
Users fear "always watching." MileRecover must explain:
- What is recorded (driving routes only during detection)
- What is NOT recorded (no selling data, no always-on high accuracy)
- User review before business totals

Reference: [../design/Apple HIG References.md](../design/Apple%20HIG%20References.md)

---

## Android Background Location

### Requirements
- `ACCESS_FINE_LOCATION` + `ACCESS_BACKGROUND_LOCATION` (Android 10+)
- Background location is separate permission prompt (Android 11+)
- **Foreground service mandatory** for continuous background location
- Persistent notification required while tracking

### User Impact
Android users more accustomed to persistent notifications from navigation/mileage apps. MileRecover notification must be:
- Informative, not alarming
- Actionable (pause tracking)
- Low priority channel option

### Manufacturer Restrictions
Samsung, Xiaomi, Huawei aggressive battery killers.

**Mitigation:**
- User education for battery optimization whitelist
- Detect restricted mode → banner with OEM-specific instructions
- Graceful degradation to manual mode

---

## Permission Funnel Strategy

```
Onboarding screen (philosophy + why background)
        ↓
Request When In Use (iOS) / Fine Location (Android)
        ↓
Demo value: "Let's detect your first trip"
        ↓
After first successful trip detected:
Request Always / Background
        ↓
If denied: Manual + SLC mode (honest degradation)
```

**Never:** Block app usage entirely on permission denial.

---

## Degradation Matrix

| Permission Level | iOS Capability | Android Capability |
|---|---|---|
| Always / Background | Full NTE | Full NTE + foreground service |
| When In Use | Foreground + SLC gaps | Foreground only when app open |
| Denied | Manual entry only | Manual entry only |

Degradation state shown persistently in TrackingStatusBar.

---

## App Store Review Preparation

### Apple
- Video demo of background tracking utility
- Clear Info.plist strings
- No location used for ads/tracking (ATT)
- Privacy nutrition labels accurate

### Google Play
- Location permission declaration form
- Foreground service type: `location`
- Prominent disclosure before permission request

---

## Battery Optimization Research Findings

| Technique | Battery savings | Accuracy cost |
|---|---|---|
| SLC instead of constant GPS (idle) | 60–80% | Low when not driving |
| Motion activity gating | 40–60% | Medium (start delay) |
| Reduce sample rate at stops | 20–30% | Low |
| Geofence home (pause) | 30–50% overnight | None |

**Combined target:** <4% daily battery on typical realtor driving day (~50 mi).

---

## Legal & Privacy Notes

- Location is sensitive personal data under GDPR/CCPA
- Explicit consent required
- Data minimization: don't collect when tracking paused
- User deletion must purge location samples

See [../architecture/Security.md](../architecture/Security.md).

---

## Competitor Permission UX Notes

| App | Approach | User reaction |
|---|---|---|
| MileIQ | Immediate Always ask | Mixed; high uninstall at prompt |
| TripLog | Explain then ask | Better retention in reviews |
| Apple Maps | Contextual | Gold standard |

**MileRecover:** TripLog honesty + Apple contextual timing.

---

## Open Research Items

- [ ] Test permission funnel A/B in beta
- [ ] OEM battery killer documentation library
- [ ] iOS 18+ location permission changes monitor
- [ ] Foreground service notification copy testing

---

## Related Documents

- [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
- [Tracking Research.md](./Tracking%20Research.md)
- [../design/Apple HIG References.md](../design/Apple%20HIG%20References.md)
- [../research/User Pain Points.md](./User%20Pain%20Points.md)
