# FIGMA IMPLEMENTATION MAP — MileRecover

**Figma file:** MileRecover — Production Design Lock  
**File URL:** *none — Figma write unavailable*  
**Canonical source:** `docs/design/canonical/MileRecover-LOCKED-DESIGN.png` (PENDING_BINARY)  
**Bridge purpose:** Map every Figma frame → production route / RN screen for later Cursor implementation.

> All `figmaNodeId` values are `null` until the official Figma MCP has write access and frames are created.

---

## Legend

| Field | Meaning |
|---|---|
| `origin` | `ORIGINAL` = visible on approved board; `DERIVED` = completed from locked system only |
| `DERIVED_FROM_LOCKED_SYSTEM` | Must be `true` for derived frames |
| `ORIGINAL_REFERENCE` | Only for direct crops from the canonical PNG |

---

## A. Original frames (from approved board)

| Figma frame name | figmaNodeId | origin | production route | RN screen / component | reusable Figma components | required dynamic data | external services | empty/populated |
|---|---|---|---|---|---|---|---|---|
| `ORIGINAL / Welcome` | null | ORIGINAL | `Onboarding/Welcome` | `OnboardingFlow` Welcome step | logo, BenefitRow, PrimaryButton | none (static copy) | none | N/A |
| `ORIGINAL / Purpose` | null | ORIGINAL | `Onboarding/Purpose` | Purpose step | Card, Selector, PrimaryButton | selected reason | none | selection state |
| `ORIGINAL / Region & Rate` | null | ORIGINAL | `Onboarding/RegionRate` | Region/Rate step | CountryRow, CountryFlag, Card, PrimaryButton | country ISO, rate label | rate tables / locale | N/A |
| `ORIGINAL / Home` | null | ORIGINAL | `Home` | `HomeScreen` populated exemplar | HeroCard, MetricTile, StatusRow, PrimaryButton, SecondaryButton, BottomNavigation | greeting name, protected $, miles, drives, month value, review count | tracking health | **Populated exemplar** (sample values in board are examples only) |
| `ORIGINAL / Review` | null | ORIGINAL | `Review` | `ReviewScreen` needs-review exemplar | TripCard, SegmentedControl, BottomNavigation | trip list, distance, time, est. value | maps (evidence) | **Populated exemplar** |
| `ORIGINAL / Proof` | null | ORIGINAL | `Proof` | `ProofScreen` month exemplar | ReportSummary, PrimaryButton, SecondaryButton, BottomNavigation | period metrics, chart series | export | **Populated exemplar** |
| `ORIGINAL / Add Drive` | null | ORIGINAL | `AddDrive` | Add Drive manual entry | SegmentedControl, Input, PrimaryButton | date, start/end, distance, work/personal | none | form empty vs filled |
| `ORIGINAL / Protection Center` | null | ORIGINAL | `ProtectionCenter` | Protection healthy exemplar | StatusRow, PrimaryButton, HeroCard | checklist statuses | OS permissions / battery / motion | **Healthy exemplar** |
| `ORIGINAL / Go Pro` | null | ORIGINAL | `GoPro` | Subscription monthly exemplar | PaywallCard, SegmentedControl, PrimaryButton | plan price, billing period | RevenueCat / Play Billing | Monthly exemplar |
| `ORIGINAL / Profile` | null | ORIGINAL | `Profile` | `ProfileScreen` | SettingsRow, BottomNavigation | name, employment, location, version | none | N/A |
| `ORIGINAL / Missing Drives` | null | ORIGINAL | `MissingDrives` | Missing drives intro | EmptyState / illustration, PrimaryButton, BenefitRow | none before scan | location history scan | Intro / pre-scan |

---

## B. Derived frames (locked system only)

All rows below: `DERIVED_FROM_LOCKED_SYSTEM=true`.

| Figma frame name | figmaNodeId | origin | production route | RN screen / component | reusable components | required dynamic data | external services | empty/populated |
|---|---|---|---|---|---|---|---|---|
| `DERIVED / Authentication` | null | DERIVED | `Auth` | Auth / Google sign-in surface | PrimaryButton, SecondaryButton, logo | auth availability | Google auth | signed-out |
| `DERIVED / Ready` | null | DERIVED | `Onboarding/Ready` | Ready / permissions bridge | PrimaryButton, BenefitRow, StatusRow | permission readiness | OS permissions | pre-home |
| `DERIVED / Home Empty` | null | DERIVED | `Home` | `HomeScreen` empty | EmptyState, **one** PrimaryButton, BottomNavigation | zero metrics | tracking | **Empty** — single primary CTA only (no competing Add CTAs) |
| `DERIVED / Home Populated` | null | DERIVED | `Home` | `HomeScreen` populated | HeroCard, MetricTile, StatusRow, PrimaryButton, BottomNavigation | live aggregates | tracking | **Populated** |
| `DERIVED / Home Permission Attention` | null | DERIVED | `Home` | Home + attention banner | StatusRow, SecondaryButton, BottomNavigation | which permission degraded | OS permissions | attention |
| `DERIVED / Review Empty` | null | DERIVED | `Review` | `ReviewScreen` empty | EmptyState, one PrimaryButton, BottomNavigation | zero queue | none | **Empty** |
| `DERIVED / Review Populated` | null | DERIVED | `Review` | `ReviewScreen` populated | TripCard, SegmentedControl, BottomNavigation | trips needing review | maps | **Populated** |
| `DERIVED / Proof Empty` | null | DERIVED | `Proof` | `ProofScreen` empty-period | ReportSummary (zeros), period tabs, BottomNavigation | period with no drives | export disabled/muted | **Empty** |
| `DERIVED / Proof Populated` | null | DERIVED | `Proof` | `ProofScreen` populated | ReportSummary, chart, export rows | period aggregates | export | **Populated** |
| `DERIVED / Drive Detail` | null | DERIVED | `DriveDetail` | Drive detail | TripCard map evidence, SegmentedControl, PrimaryButton | one drive record | maps | detail |
| `DERIVED / Vehicles` | null | DERIVED | `Vehicles` | Vehicles list | SettingsRow / Card, search, PrimaryButton | vehicle list | none | empty/populated |
| `DERIVED / Add Vehicle` | null | DERIVED | `AddVehicle` | Add vehicle form | Input, Selector, PrimaryButton | make/model/year | none | form |
| `DERIVED / Switch to MileRecover` | null | DERIVED | `SwitchToMileRecover` | Competitor switch guidance | BenefitRow, PrimaryButton, SecondaryButton | source app choice | import | guidance |
| `DERIVED / Import Preview` | null | DERIVED | `ImportPreview` | CSV import preview | Card, PrimaryButton | parsed rows summary | CSV parse | preview |
| `DERIVED / Import Results` | null | DERIVED | `ImportResults` | Import results | StatusRow, PrimaryButton | imported/skipped counts | none | results |
| `DERIVED / Notifications` | null | DERIVED | `Notifications` | Notification prefs / prompt | SettingsRow, PrimaryButton | permission state | OS notifications | on/off |
| `DERIVED / Protection Healthy` | null | DERIVED | `ProtectionCenter` | Protection all-good | StatusRow, PrimaryButton | all systems ok | diagnostics | healthy |
| `DERIVED / Protection Attention` | null | DERIVED | `ProtectionCenter` | Protection needs fix | StatusRow (warning), PrimaryButton per fix | failed checks | OS settings | attention |
| `DERIVED / Go Pro Monthly` | null | DERIVED | `GoPro` | Paywall monthly | PaywallCard, period toggle, PrimaryButton | monthly price | RevenueCat | monthly |
| `DERIVED / Go Pro Yearly` | null | DERIVED | `GoPro` | Paywall yearly | PaywallCard, period toggle, PrimaryButton | yearly price, save % | RevenueCat | yearly |
| `DERIVED / Compare Plans` | null | DERIVED | `ComparePlans` | FREE vs PRO comparison | Card, PrimaryButton | feature matrix | RevenueCat | compare |
| `DERIVED / Trial Ending` | null | DERIVED | `TrialEnding` | Trial ending notice | PaywallCard, PrimaryButton, SecondaryButton | days left | RevenueCat | trial |
| `DERIVED / Trial Expired` | null | DERIVED | `TrialExpired` | Trial expired — data still accessible | PaywallCard, contextual CTA | expired state | RevenueCat | expired (no hostage wall) |
| `DERIVED / Contextual Premium Paywall` | null | DERIVED | `PaywallContextual` | Sheet over premium action | BottomSheet, PaywallCard, PrimaryButton | which premium action | RevenueCat | contextual |
| `DERIVED / Offline` | null | DERIVED | `Offline` | Offline state | EmptyState, SecondaryButton | connectivity | none | offline |
| `DERIVED / Error` | null | DERIVED | `Error` | Recoverable error | EmptyState, PrimaryButton | error copy (non-technical) | none | error |
| `DERIVED / Loading` | null | DERIVED | `Loading` | Calm loading | logo / progress | none | none | loading |

---

## C. Component library (to create in Figma when write exists)

| Component | Created in Figma |
|---|---|
| logo | false |
| PrimaryButton | false |
| SecondaryButton | false |
| IconButton | false |
| HeroCard | false |
| Card | false |
| BenefitRow | false |
| MetricTile | false |
| StatusRow | false |
| SettingsRow | false |
| SegmentedControl | false |
| Input | false |
| Selector | false |
| TripCard | false |
| BottomNavigation | false |
| EmptyState | false |
| ReportSummary | false |
| PaywallCard | false |
| BottomSheet | false |
| CountryRow | false |
| CountryFlag | false |

---

## D. Subscription state model (design)

| Entitlement | Design principle |
|---|---|
| FREE | Full historical data access; limited premium actions |
| PRO TRIAL | Begins **only** after deliberate “Start Free 7-Day Trial” |
| PRO | Full premium |

After trial expiry: historical data remains accessible; premium actions open
**Contextual Premium Paywall** — not a whole-app hostage wall.

---

## E. Home CTA rule (locked)

Do **not** show both “Add your first drive” and “+ Add a drive” as competing CTAs.
Exactly **one** dominant primary action on Home (empty or populated).
