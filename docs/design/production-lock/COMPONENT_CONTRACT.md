# Component contract — Production Lock v1.0

Figma Components page · **57** component nodes · **9** component sets (+ standalone components).

Baseline device: 390×844. Reuse these — do not invent one-off controls for production screens.

## Component sets

### Button
- **Purpose:** Primary / secondary / text actions.
- **Variants:** Primary|Secondary|Text × Default|Pressed|Disabled (Selected on Secondary).
- **Size:** Height **48**, radius **16**, type/Button 16 Semi Bold.
- **Reuse:** All CTAs (Get started, Save, Fix, Upgrade, etc.).
- **A11y:** Min 44×44 hit area; disabled must not rely on color alone.

### BottomNav
- **Purpose:** App chrome tabs.
- **Variants:** Selected=Home|Review|Proof|Profile.
- **Size:** Width 390 · height **72**.
- **Reuse:** All authenticated main screens.
- **A11y:** Labels always visible (not icon-only).

### Classifier
- **Purpose:** Work / Personal / Not sure.
- **Variants:** Selected=Work|Personal|Unsure.
- **Size:** ~242×44 (compact row).
- **Reuse:** Review cards, Review detail, Add Drive, Missing candidates.
- **Interaction:** Inline — do not force Edit to classify.

### PlanCard
- **Purpose:** Plan comparison tiles.
- **Variants:** Free / Plus / Pro · Default|Selected.
- **Size:** ~280×113+.
- **Reuse:** Plans compare. **Plus is recommended** primary upgrade.

### Toggle
- **Purpose:** Boolean settings.
- **Variants:** On|Off · 52×32.
- **Reuse:** Notifications master + category rows.

### Checkbox / Radio
- **Purpose:** Multi / single select in forms and explainers.
- **Reuse:** Permission lists, import resolve, purpose-like selections when not using purpose cards.

### SegmentedControl
- **Purpose:** Proof period.
- **Variants:** Month|Quarter|Year|YTD.
- **Reuse:** Proof only. Selected label must match period context (Month ≠ YTD copy).

### CountrySelector
- **Purpose:** US / CA / GB / AU with flag + rate.
- **Variants:** Selected per country.
- **Reuse:** Onboarding Region, Profile region change.

## Standalone components

| Component | Purpose | Size (approx) | Reuse |
|---|---|---|---|
| MetricCard | Home/Proof metric | ~95×80 | Home, Proof |
| StatusCard | Tracking readiness blurb | ~171×75 | Home |
| DriveCard | Trip summary + classifier | ~342×144 | Review list |
| SettingsRow | Profile grouped row | ~342×67 | Profile |
| Input | Labeled field | ~342×72 | Add Drive, Vehicles |
| Banner | Attention strip | ~342×44 | Home needs attention |
| Toast | Transient confirm | compact | Saves / imports |
| Progress | Scanning steps | width fill · 32h | Missing scan |
| EmptyState | Calm empty | content | Review/Proof empty |
| Dialog | Modal confirm | ~320×211 | Dirty back, discard |
| BottomSheet | Sheets (export, free limit) | 390× variable · top r24 | Export, limits |
| PermissionExplainer | Why we ask block | ~342×122 | Permission education |
| ImportCard | Import path choice | ~342×73 | Switch intro |
| VehicleRow | Vehicle list row | ~342×68 | Vehicles |
| ExportRow | CSV/PDF choice | ~342×72 | Export sheet |
| ReviewPrompt | Store review pre-prompt | ~342×336 | Positive milestones only |

## Interaction states (all interactive)

Default · Pressed/Selected · Disabled · Focus (inputs) · Error (validation text below field).

## Spacing inside components

Prefer spacing scale 8/12/16 inside cards; 24 page gutter outside.
