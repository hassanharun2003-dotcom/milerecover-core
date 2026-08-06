# MileRecover 0.2.11 — design lock + launch candidate

## Identity

- versionName: `0.2.11`
- runtimeVersion / channel: `0.2.11` / `preview-foundation-0.2.11`
- package: `com.milerecover.app`
- signing: same preview keystore, v1+v2+v3, proper DN (foundation preserved)

## Material production UI changes (mounted navigator screens)

| Screen | Component | Change |
|---|---|---|
| Welcome | `OnboardingFlow` | Real logo + benefit rows with Ionicons + supporting copy; Automatic tracking |
| Purpose | `OnboardingFlow` | Compact selected cards + icons + Personal label |
| Profile | `ProfileScreen` | Compact settings rows; Switch to MileRecover |
| Vehicles | `VehicleSetupScreen` | Search + popular chips + compact results |
| Add drive | `ManualTripScreen` | Tighter density; branded discard dialog; dirty-state fix |
| Protection | `ProtectionAlertScreen` | Compact rows + per-issue Fix |
| Missing drives | `MissingDrivesIntroScreen` | CarRouteHero + trust copy |
| Proof | `ProofScreen` | Period chrome + zero metrics (not empty-only cut) |
| Import | `BringExistingMileageScreen` | Switch to MileRecover + competitor format tags |

## Product functionality

- Competitor CSV detection (MileIQ / Everlance / Driversnote / TripLog / Stride / generic)
- Import preview summary: found / ready / duplicates / need attention
- Satisfaction-gated store review prompt (`expo-store-review`) on positive moments only
- Historical rate notes preserved from exports when present

## Still external (cannot invent)

- Google OAuth client IDs + SHA-1/256 of preview signing cert in Google Cloud
- Google Maps API key for full native maps (truthful Route unavailable fallback remains)
- RevenueCat / Play Billing live products

## Acceptance

Physical Samsung / emulator screenshots must be compared to `docs/design/reference-crops/`.
Typecheck/unit tests alone are not acceptance.
