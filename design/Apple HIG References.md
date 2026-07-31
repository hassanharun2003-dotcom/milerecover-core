# MileRecover Apple HIG References

**Status:** Reference — aligned with DEC-007  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering / Design

**Not Apple endorsement.** This document maps Apple Human Interface Guidelines and platform policies to MileRecover decisions. MileRecover is an independent product.

Philosophy alignment: **Battery friendly**, **Trust over automation**, **Offline first**

---

## Purpose

MileRecover iOS must feel native and comply with Apple platform requirements — especially for **background location**, **battery**, **privacy**, and **subscription transparency**.

Companion: [Product DNA.md](../docs/Product%20DNA.md) · [Experience Bible.md](./Experience%20Bible.md)

---

## Core HIG Principles Applied

| Apple Principle | MileRecover Application |
|---|---|
| **Clarity** | Tabular mileage figures; obvious pending vs confirmed states |
| **Deference** | Evidence over chrome; maps subordinate to trip data |
| **Depth** | Layered detail: Home → Review trip → Proof breakdown |
| **Trust** | Permission education before OS prompt; no dark patterns |

Reference: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## Navigation Patterns

### Primary structure (DEC-007)

**Tab bar — exactly four tabs:**

| Tab | SF Symbol (draft) | Root stack |
|---|---|---|
| Home | `house` | Protection status, tracking health |
| Review | `checklist` | Queue + trip history |
| Proof | `shield.lefthalf.filled` | Score, reports, export |
| Profile | `person.circle` | Account, tracking, subscription |

- **Navigation stack** for drill-down (Trip Detail, Export preview, Profile sub-screens)
- **Sheets** for confirm actions, Proof Score breakdown, export preview, permission education
- **No fifth tab** for Trips, Export, Reports, or Settings — those live under Review, Proof, and Profile

> **Superseded:** Prior draft listed five tabs (Home, Review, Trips, Export, Settings). Four-tab structure is locked.

### Tab bar behavior
- Tab bar visible on root of each tab; hidden on full-screen flows (onboarding, export preview) per HIG
- Re-tap active tab scrolls to top / resets stack to root (standard iOS pattern)
- Badge on Review tab for pending count only — not gamified streaks
- VoiceOver: tab order Home → Review → Proof → Profile; announce pending badge count on Review

### Avoid
- Hamburger menu for primary navigation
- Multi-step wizards without progress indicator
- Modal stacks >2 deep
- More than four tab-bar items

---

## Safe Areas & Layout

- Respect safe area insets on all devices (notch, Dynamic Island, home indicator)
- Tab bar uses standard UITabBar height; content inset below
- Full-bleed maps only in Trip Detail — summary screens use readable margins
- Dynamic Island / status bar: tracking indicator when engine active (non-alarming copy)
- Split View / iPad: consider sidebar adaptation H2; MVP iPhone-first with four-tab parity

Reference: [Layout HIG](https://developer.apple.com/design/human-interface-guidelines/layout)

---

## Dynamic Type

- Support full Dynamic Type range on all primary flows (Home, Review, Proof, Profile)
- Mileage numbers use tabular figures at all sizes ([Typography.md](./Typography.md))
- Proof Score and estimated value labels must not truncate critical disclaimers at large sizes — wrap or stack
- Test at AX5 (accessibility size) minimum before release

Reference: [Typography HIG](https://developer.apple.com/design/human-interface-guidelines/typography)

---

## VoiceOver

| Element | Label pattern |
|---|---|
| Trip card | "[Date], [distance] miles, [pending/confirmed/personal], Proof Score [n], source [auto/manual]" |
| Review actions | "Confirm business", "Mark personal", "Reject trip" — never swipe-only |
| Tracking health | "Protection [active/paused/limited]. [Reason]. Fix in Profile." |
| Export preview | "Export includes [n] confirmed trips. [n] pending excluded. [n] unaccounted days noted." |
| Subscription row | "[Tier name], renews [date], [price]. Manage in App Store." |

- Group related metadata; avoid reading raw coordinates aloud
- Custom actions for confirm/reject where swipe is primary visual affordance

Reference: [Accessibility HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)

---

## Haptics

| Moment | Haptic |
|---|---|
| Confirm trip (business) | `.success` (light) |
| Reject trip | `.warning` (light) |
| Undo available | None — visual snackbar only |
| Tracking paused by user | `.soft` |
| Destructive delete confirm | `.rigid` on confirm only |
| Subscription purchase success | System default — no custom celebration |

Respect **Reduce Motion** — haptics optional when Reduce Motion enabled (user preference).

See [Motion.md](./Motion.md).

---

## Location & Privacy (Critical)

### App Store requirements
- `NSLocationWhenInUseUsageDescription` — clear, specific
- `NSLocationAlwaysAndWhenInUseUsageDescription` — required for background tracking
- `UIBackgroundModes`: `location`

### Permission education (before OS prompt)

Show MileRecover-owned screen **before** system dialog (DEC-008 onboarding, Trust Rules):

> MileRecover records your driving routes to create defensible mileage records for work. Background location lets us detect trips when the app isn't open. **You review every trip before it counts toward business totals.** We never invent mileage. We do not sell your location data.

Include: what works without Always; how to pause; link to Privacy Policy.

### Background location disclosure
- In-app: Profile → Tracking shows current permission level and impact on protection
- App Store Privacy Nutrition Labels: Location linked to user, not used for cross-app tracking
- No ATT prompt unless third-party analytics require IDFA (avoid if possible)

### Always vs When In Use
- **Default ask:** Always Allow — only after education screen
- **Degrade path:** When In Use only → manual + foreground capture; honest "Protection limited" UX — never fake full protection
- Re-prompt only after user education, not nagging

Reference: [Location Services Guidelines](https://developer.apple.com/documentation/corelocation/configuring_location_services)

---

## Background Location Best Practices

Aligned with **Battery friendly**:

| Practice | MileRecover Plan |
|---|---|
| Significant location changes when idle | ✓ Low-power monitoring |
| Visit monitoring | Optional for stop detection |
| High accuracy only during detected drives | ✓ Native Tracking Engine |
| `allowsBackgroundLocationUpdates` judiciously | ✓ Engine-managed |
| Pause automatically | ✓ User + battery heuristic |

Reference: [Energy Efficiency Guide — Location](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/EnergyGuide-iOS/LocationBestPractices.html)

---

## Modal Usage

| Use sheet/modal | Use push navigation |
|---|---|
| Trip confirm/reject summary | Trip Detail |
| Proof Score breakdown | Profile sub-settings |
| Export preview | Review trip history |
| Permission education | — |
| Destructive delete confirm | — |
| Founding member / subscription compare | Profile → Subscription |

Sheets are dismissible; destructive actions require explicit confirm button (not swipe-to-delete alone for trip deletion).

---

## Destructive Confirmation

- **Trip delete:** Alert with trip date/distance; "Delete" destructive style; soft-delete 30 days per Trust Rules
- **Account delete:** Two-step; export reminder first
- **Reject trip:** Available from detail view; swipe reject returns to queue with undo snackbar (4s)
- **Clear all pending:** Not offered — no bulk silent classification

---

## Subscription Clarity (DEC-014, DEC-013)

- Show tier name, price, billing period, and renewal date before purchase
- Founding-member offer: annual only; terms in plain language; **no fake countdown**
- Restore Purchases visible in Profile → Subscription
- Cancel directions: link to App Store subscription management — no dark retention flows
- Free tier capabilities visible without signing in to paid demo
- Do not paywall gap visibility or tracking health to demonstrate export

Reference: [App Store Review Guidelines — Subscriptions](https://developer.apple.com/app-store/review/guidelines/#subscriptions)

---

## SF Symbols Usage

| Concept | Symbol |
|---|---|
| Home / protection | `house` or `shield.checkered` |
| Review | `checklist` |
| Proof | `shield.lefthalf.filled` |
| Profile | `person.circle` |
| Confirmed | `checkmark.shield` |
| Pending | `clock.badge.questionmark` |
| Offline | `icloud.slash` |
| AI assist (H1+) | `sparkles` |
| Export | `square.and.arrow.up` |
| Gap | `calendar.badge.minus` |
| Tracking health | `antenna.radiowaves.left.and.right` |

Prefer SF Symbols over custom where semantic match exists.

---

## Notifications

Follow HIG notification best practices and [Product DNA §11](../docs/Product%20DNA.md#11-notification-dna) (DEC-011):

- Actionable where appropriate ("Review 3 trips" → Review tab)
- No sensitive location in notification body
- Thread by category: Review, Tracking health, Sync
- Pattern-aware escalation — not per-trip default
- Critical tracking-health when protection likely interrupted

---

## Widgets & Live Activities (Future)

### Lock Screen / Dynamic Island
- Tracking status: active/paused (non-alarming)
- Pending review count
- **Not:** live mile counter (gamification risk)

### Home Screen Widget
- Period confirmed miles + pending count
- Deep link to Review queue

---

## App Store Review Considerations

- Background location must be core feature (it is)
- Demo account for review with sample trips
- Export feature demonstrable on Free tier (within limits)
- No misleading tax advice in metadata — estimated value only (DEC-009)
- Four-tab navigation consistent with screenshots

---

## Platform Version Targets (Proposed)

| Target | Version |
|---|---|
| Minimum iOS | 16.0 |
| Target iOS | Latest GA |
| Swift | 5.9+ |
| Xcode | Latest stable |

---

## Related Documents

- [Android Material References.md](./Android%20Material%20References.md)
- [Design Bible.md](./Design%20Bible.md)
- [Product DNA.md](../docs/Product%20DNA.md)
- [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)
- [Background Location Research.md](../research/Background%20Location%20Research.md)
- [Interaction Rules.md](./Interaction%20Rules.md)
