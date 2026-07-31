# MileRecover Android Material References

**Status:** Reference — aligned with DEC-007  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering / Design

**Not Google endorsement.** Material Design 3 guidance applied with MileRecover token overrides.

Companion: [Apple HIG References.md](./Apple%20HIG%20References.md) · [Product DNA.md](../docs/Product%20DNA.md)

Philosophy: **Battery friendly**, **Trust over automation**, **Offline first**

---

## Purpose

MileRecover Android must feel native and comply with Material Design 3 and Android platform policies — especially **foreground services**, **background location**, **battery optimization**, and **subscription transparency**.

---

## Material Design 3 Application

| MD3 concept | MileRecover use |
|---|---|
| Dynamic color | Optional; MRDS tokens take precedence ([Color System.md](./Color%20System.md)) |
| Navigation bar | Bottom nav: **Home · Review · Proof · Profile** (DEC-007) |
| Top app bar | Period title + sync indicator + tracking health chip |
| Sheets | Trip detail actions, Proof Score breakdown, export preview |
| Snackbar | Undo confirm/reject ([Motion.md](./Motion.md)) |
| FAB | **Not used** for "log trip" — avoids accidental taps; primary actions in Review |

Reference: [Material Design 3](https://m3.material.io/)

> **Superseded:** Prior draft listed five destinations (Home, Review, Trips, Export, Settings). Four-destination bottom nav is locked.

---

## Navigation Patterns

### Bottom navigation (DEC-007)

Exactly **four destinations** — matches iOS tab parity:

| Destination | Icon (Material) | Root content |
|---|---|---|
| Home | `home` | Protection status, tracking health |
| Review | `fact_check` | Queue + trip history |
| Proof | `verified_user` | Score, reports, export |
| Profile | `account_circle` | Account, settings, subscription |

- **Back gesture** supported; predictive back (Android 14+)
- **Edge-to-edge** with proper insets ([Spacing.md](./Spacing.md))
- Back from nested screens returns within tab stack; back from tab root does not exit app unexpectedly
- **No navigation drawer** for primary flows
- Trip history accessed via Review — not a fifth tab

### Android back behavior
- System back from Trip Detail → Review history
- System back from Profile sub-screen → Profile root
- System back from onboarding → previous step or confirm exit
- Export preview back → Proof export hub (preserve draft)
- Do not trap user in paywall — always offer dismiss to Free experience

---

## Location & Privacy (Critical)

### Permissions
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION` — separate prompt Android 10+; mandatory for full background tracking
- `ACTIVITY_RECOGNITION` — drive detection ([Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md))

### Permission education (before OS prompts)

> MileRecover records driving routes to build defensible mileage records for work. Background location detects trips when the app is closed. **You review every trip before it counts.** We never invent mileage. We do not sell your location data.

Education screen required before background location request (aligned with iOS, DEC-008).

See [Background Location Research.md](../research/Background%20Location%20Research.md).

---

## Foreground Service

Android requires a **persistent notification** during active tracking.

| Element | Guideline |
|---|---|
| Channel | `tracking` — user-adjustable importance |
| Title | "MileRecover — tracking active" |
| Text | "Tap to review trips" — not alarming |
| Actions | Pause tracking, Open app |
| Icon | Brand mark, monochrome |

**Never** disguise tracking notification as another app category.

Service type: `location` (Android 14+ declaration required).

Foreground service visibility is a **trust feature** — users always know when protection is active.

---

## Battery and OEM Restrictions

Samsung, Xiaomi, and others kill background apps aggressively.

**In-app guidance (Profile → Tracking):**
- Detect restricted background activity
- Show OEM-specific whitelist instructions
- Degrade to manual + honest "Protection limited" banner — **never fake tracking**
- Pattern-aware alert escalation (DEC-011) when protection likely interrupted

Reference: [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)

---

## Large Touch Targets

- Minimum **48×48 dp** for all primary actions (Review confirm/reject, export generate)
- Review swipe actions include visible button alternatives for accessibility
- Bottom nav items meet Material touch target guidance
- Destructive actions separated from primary taps (delete trip in overflow + confirm)

See [Spacing.md](./Spacing.md) · [Interaction Rules.md](./Interaction%20Rules.md)

---

## TalkBack Accessibility

- Trip cards: read distance, date, Proof Score, source, classification state
- Review actions: button alternatives to swipe — "Confirm business", "Mark personal", "Reject"
- Dynamic font scaling to 200%
- Export preview: announce confirmed count, excluded pending, noted gaps
- Tracking health banner: actionable "Open tracking settings" link

Reference: [Accessibility — Material Design](https://m3.material.io/foundations/accessibility)

---

## Notification Channels

| Channel | Purpose | Default importance |
|---|---|---|
| `tracking_health` | Protection interrupted, permission loss | High when escalated (DEC-011) |
| `review` | Pending trips needing action | Default — weekly digest preferred |
| `sync` | Sync completion / conflict | Low |
| `account` | Subscription renewal reminder (7-day) | Default |

- User controls per channel in Profile → Notifications
- Quiet hours respected (DEC-008 onboarding work style; default TBD Product DNA §18)
- No engagement bait; no generic daily reminders
- Critical tracking-health warnings preserved even when review notifications muted

---

## Destructive Confirmations

- **Trip delete:** Material alert dialog; show date/distance; confirm destructive
- **Account delete:** Two-step with export reminder
- **Reject trip:** Undo snackbar 4 seconds
- No bulk "accept all pending" without summary modal

---

## Subscription Clarity (DEC-014, DEC-013)

- Play Billing: show price, period, renewal terms before purchase
- Founding-member annual: transparent; no fake countdown
- Restore purchases in Profile → Subscription
- Manage subscription links to Play Store
- Free tier demonstrable in review build
- Gap visibility and tracking health never paywalled

Reference: [Google Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738)

---

## Platform Version Targets (Proposed)

| Target | Version |
|---|---|
| Minimum SDK | Android 8.0 (API 26) — evaluate API 28+ |
| Target SDK | Latest GA |
| Kotlin | 1.9+ |

Align with [Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md) reference device (Pixel 7, Android 14).

---

## Parity with iOS

| Feature | iOS | Android |
|---|---|---|
| Primary tabs | 4 | 4 |
| Review swipe | Swipe row | Swipe + buttons |
| Haptics | UIKit | Vibrator API |
| Maps | MapKit | Google Maps |
| Tracking engine | Swift | Kotlin |
| Offline export | On-device PDF | On-device PDF |

Feature parity; platform-native interaction patterns.

---

## Play Store Requirements

- Data safety form: location collected, not sold (DEC-006)
- Background location declaration video + justification
- Foreground service permissions declared
- Demo account for review with sample trips
- Screenshots reflect four-tab navigation

---

## Related Documents

- [Apple HIG References.md](./Apple%20HIG%20References.md)
- [Design Bible.md](./Design%20Bible.md)
- [Product DNA.md](../docs/Product%20DNA.md)
- [Background Location Research.md](../research/Background%20Location%20Research.md)
- [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
