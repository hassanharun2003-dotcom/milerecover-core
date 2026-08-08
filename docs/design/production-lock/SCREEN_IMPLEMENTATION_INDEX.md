# Screen implementation index — Production Lock v1.0

Figma file key: `5y8p0axQChkYVBcM7tgHDj`  
Baseline: **390 × 844** · PNG refs: `docs/design/production-lock/screens/`

App mapping: primary product is `apps/mobile-expo` (Expo). Exact RN file names may vary; preserve routes/behaviors.

---

## Onboarding — page `02 — Onboarding`

| Frame | Node ID | Route | Purpose | Primary | Secondary | Artwork | Permissions / entitlement | Empty / error | Nav next |
|---|---|---|---|---|---|---|---|---|---|
| Onboarding / Welcome | `6:17` | `/onboarding/welcome` | First impression | Get started | Sign in (must not compete) | Artwork/Welcome `6:19` | OAuth optional (hide Google if unavailable) | — | Purpose |
| Onboarding / Purpose | `6:41` | `/onboarding/purpose` | Mileage purpose | Continue | — | Artwork/Purpose `28:2` | — | Selected option state | Region |
| Onboarding / Region & Rate | `6:60` | `/onboarding/region` | Country + rate | Continue | Change country | CountrySelector | — | — | Tracking |
| Onboarding / Country selector | `13:10` | `/onboarding/region/countries` | Pick US/CA/GB/AU | Select country | Back | Flags | — | — | Region |
| Onboarding / How Tracking Works | `6:75` | `/onboarding/tracking` | Tracking education | Set up tracking | — | Artwork/TrackingCar `6:76` | — | — | Permission |
| Onboarding / Permission Education | `6:98` | `/onboarding/permissions` | Explain location | Allow when prompted | Set up later | Artwork/Permission `28:19` | Location explain only; no notif | — | Ready / Home |
| Onboarding / Ready | `6:120` | `/onboarding/ready` | Success | Go to Home | — | Artwork/ReadySuccess `16:12` | **NO notification prompt** | — | Home |

**Components:** Button, CountrySelector, PermissionExplainer, option rows.  
**Dynamic data:** selected purpose, country, rate string `$0.70 / mile` (locale-specific).

---

## Home — page `03 — Home`

| Frame | Node ID | Route | Purpose | Primary | Secondary | Components | Dynamic | Permissions | PNG |
|---|---|---|---|---|---|---|---|---|---|
| Home / First-use | `6:130` | `/home` | Zero state | Add your first drive | Check for missed drives | MetricCard×3, StatusCard, BottomNav | 0 metrics | Tracking readiness | `home-first-use.png` |
| Home / Active | `6:170` | `/home` | Populated value | Review drives | Check for missed drives | Value hero, metrics, BottomNav | protected $, miles, drives | — | `home-populated.png` |
| Home / Needs attention | `6:211` | `/home` | Tracking issue | Fix tracking | Review drives | Banner + metrics | issue copy | battery/location | `home-needs-attention.png` |

**Rule:** exactly one dominant primary CTA — never duplicate Add Drive.

---

## Review — page `04 — Review`

| Frame | Node ID | Route | Primary | Components | Empty/error | PNG |
|---|---|---|---|---|---|---|
| Review / Empty | `6:248` | `/review` | — | EmptyState, BottomNav | Caught up | `review-empty.png` |
| Review / With drives | `6:258` | `/review` | Work/Personal/Not sure | DriveCard, Classifier | Queue counts | `review-populated.png` |
| Review / Detail | `6:294` | `/review/:id` | Classify | route meta, Classifier | — | `review-detail.png` |
| Review / Batch classification | `6:319` | `/review/batch` | Confirm classifications | group rows | — | `review-batch.png` |

**Dynamic:** date, route, distance, duration, estimated value, classification state.

---

## Proof — page `05 — Proof`

| Frame | Node ID | Route | Primary | Secondary | Entitlement | PNG |
|---|---|---|---|---|---|---|
| Proof / Empty | `6:505` | `/proof` | Add a drive | — | — | `proof-empty.png` |
| Proof / Populated | `6:506` | `/proof` | Preview report | Export | — | `proof-populated.png` |
| Proof / Issues | `6:507` | `/proof` | Fix items | — | export blocked until fixed | `proof-issues.png` |
| Proof / Report preview | `6:508` | `/proof/preview` | Export / share | Back | — | `report-preview.png` |
| Proof / Export sheet | `6:509` | `/proof/export` | CSV / PDF | Cancel | PDF may be Plus | `export.png` |

**Components:** SegmentedControl (Month/Quarter/Year/YTD), MetricCard, ExportRow, BottomSheet.  
**Rule:** period labels must match selection (Month must not say year-to-date).

---

## Add Drive — page `06 — Add Drive`

| Frame | Node ID | Route | Primary | Secondary | States | PNG |
|---|---|---|---|---|---|---|
| Add Drive / Manual | `6:953` | `/add-drive` | Save drive | More details | default essentials | `add-drive.png` |
| Add Drive / More details | `6:1442` | `/add-drive` | Save drive | collapse | time/vehicle/purpose/notes/parking/tolls | `add-drive-more-details.png` |
| Add Drive / Validation error | `6:1052` | `/add-drive` | Save drive (blocked) | — | field errors | `add-drive-validation.png` |
| Add Drive / Dirty back confirm | `31:109` | modal | Keep editing | Discard | dirty only | — |
| Add Drive / Keyboard focus | `31:116` | spec | — | — | CTA docks above keyboard | — |

---

## Missing Drives — page `07 — Missing Drives`

| Frame | Node ID | Route | Primary | Secondary | Entitlement | PNG |
|---|---|---|---|---|---|---|
| Missing Drives / Intro | `6:1091` | `/missing` | Check for missed drives | — | Free: limited scans | `missing-intro.png` |
| Missing Drives / Scanning | `6:1130` | `/missing/scan` | — | — | — | `missing-scanning.png` |
| Missing Drives / Results | `6:1146` | `/missing/results` | Save classified | Work/Personal/**Not a drive** | confirm before add | `missing-results.png` |
| Missing Drives / No results | `6:1183` | `/missing/empty` | Back to home | Scan again | — | `missing-no-results.png` |
| Missing Drives / Recovery confirmation | `6:1192` | `/missing/success` | Done | — | review-prompt eligible | `missing-success.png` |
| Missing Drives / Free-limit reached | `6:1203` | sheet | Upgrade for more recovery | Add drive manually / Not now | Free limit | `missing-free-limit.png` |

**Artwork:** Car route `6:1093` · NoMissing `16:52`.

---

## Protection Center — page `08 — Protection Center`

| Frame | Node ID | Route | Primary | Secondary | PNG |
|---|---|---|---|---|---|
| Protection / Healthy | `6:814` | `/protection` | Run diagnostics | row detail | `protection-healthy.png` |
| Protection / Attention | `6:858` | `/protection` | Fix tracking issues | Fix per row | `protection-attention.png` |
| Protection / Permission missing | `6:904` | `/protection` | Open settings | Fix rows | `protection-permission.png` |

**Rows:** Location, Background, Battery, Motion, Notifications, **Local data** (not an error).  
**Rule:** green check only when verified healthy.

---

## Profile — page `09 — Profile & Settings`

| Frame | Node ID | Route | Notes | PNG |
|---|---|---|---|---|
| Profile / Main | `6:333` | `/profile` | Grouped SettingsRow; Switch to MileRecover | `profile.png` |
| Profile / Account | `20:2` | `/profile/account` | Sign-in / sign out | — |
| Profile / Help & support | `20:18` | `/profile/help` | Support | — |
| Profile / Privacy | `20:34` | `/profile/privacy` | Privacy copy | — |
| Profile / Terms | `20:48` | `/profile/terms` | Terms | — |
| Profile / About | `20:62` | `/profile/about` | Design Lock version label in Figma | — |

---

## Import — page `10 — Import & Switching`

| Frame | Node ID | Route | Primary | Secondary | PNG |
|---|---|---|---|---|---|
| Import / Switch to MileRecover | `6:417` | `/import` | Choose mileage file | Add manually | `switch-to-milerecover.png` |
| Import / Detect format | `6:430` | `/import/detect` | Continue | — | — |
| Import / Preview | `6:436` | `/import/preview` | Confirm import | — | `import-preview.png` |
| Import / Resolve issues | `14:2` | `/import/resolve` | Fix and continue | Skip remaining | — |
| Import / Confirm | `14:20` | `/import/confirm` | Import N trips | Back | — |
| Import / Success | `6:456` | `/import/success` | Review imported | — | — |
| Import / Unsupported / Corrupt / Partial | `6:461` / `14:35` / `14:47` | error paths | Choose another / Add manually | — | — |

**Rule:** competitor names only after detection.

---

## Vehicles & Work — page `11 — Vehicles & Work Info`

| Frame | Node ID | Route | Primary | PNG |
|---|---|---|---|---|
| Vehicles / List | `6:1270` | `/vehicles` | Add vehicle | `vehicles.png` |
| Vehicles / Add | `6:1277` | `/vehicles/add` | Save vehicle (search + popular chips) | — |
| Vehicles / Edit default | `15:2` | `/vehicles/:id` | Save changes | — |
| Vehicles / Free limit | `29:39` | paywall/sheet | See Plus | — |
| Vehicles / After expiry | `29:46` | info | See Plus / Not now — history visible | — |
| Work Info / Primary use | `6:1304` | `/profile/work` | Select purpose | — |
| Work Info / Frequent drives | `15:34` | `/profile/places` | Add place | — |

---

## Notifications — page `12 — Notifications`

| Frame | Node ID | Route | Primary | PNG |
|---|---|---|---|---|
| Notifications / Settings | `6:1318` | `/notifications` | Allow notifications (master) + category toggles | `notifications.png` |

Categories: review ready, missed drives, tracking attention, weekly summary, report reminders, trial ending, billing issues.  
Lock-screen privacy note required. No early OS prompt in onboarding.

---

## Plans & trial — page `13 — Plans & Subscription`

| Frame | Node ID | Route | Primary | Secondary | PNG |
|---|---|---|---|---|---|
| Plans / Compare | `6:1217` | `/plans` | Continue with Plus | Restore | `plans.png` |
| Plans / Trial invitation | `6:1256` | `/plans/trial` | Start free 7-day trial | Not now | — |
| Plans / Limit reached | `6:1263` | sheet | See upgrade | Add manually | — |
| Plans / Trial active/ending/expired | `6:1493` / `6:1498` / `6:1505` | `/plans` | See Plus / Keep Plus | Not now | `trial-expired.png` |
| Plans / Billing / Purchase failed / Restore | `6:1510` / `15:147` / `15:161` | `/plans` | Update / Try again / Restore | Not now / Free | — |
| Plans / Contextual paywall — Missing recovery | `31:121` | contextual | Start trial / Continue with Plus | Add manually / Not now | `contextual-paywall.png` |

---

## Edge phone contexts — page `14 — States & Edge Cases`

Reusable cards (300×) remain; full phone contexts include `30:2`…`30:250` series (Offline, Permission Missing, Background, Battery, Notifications Blocked, Import Unsupported/Partial, Missing Limit, Auto Limit, Report Incomplete, Subscription Unavailable, Purchase Failed, Trial Expired, Tracking Paused, Delayed Sync) plus Review Prompt `6:1410`.

---

## Implementation Specs / Lock

| Frame | Node ID |
|---|---|
| Implementation Specs Board | `6:1418` |
| Additional measurable specs | `16:2` |
| WORKFLOW PROTOTYPE MAP | `31:22` |
| MASTER IMPLEMENTATION INDEX | `31:40` |
| DEVELOPER HANDOFF SUMMARY | `31:67` |
| MILE RECOVER — DESIGN LOCK v1.0 | `31:3` (page `31:2`) |
