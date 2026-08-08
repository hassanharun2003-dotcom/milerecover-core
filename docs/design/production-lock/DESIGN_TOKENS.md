# Design tokens — Production Lock v1.0

Source: Figma `5y8p0axQChkYVBcM7tgHDj` · Foundations + Implementation Specs.  
Runtime alignment: `packages/config/src/tokens.ts`.

## Device / layout

| Token | Value |
|---|---|
| Device baseline | **390 × 844** logical points |
| Horizontal page padding (gutter) | **24** |
| Content start below status/safe area | **~54** |
| Bottom navigation height | **72** (labels always visible) |
| Min touch target | **44 × 44** |
| Primary button height | **48** |
| Input / field height | **48** |
| Segmented control height | **40** |
| Icon circle (purpose/benefit) | **40** |
| System icon glyph | **20–24** |
| Illustration heroes | **120–160** |
| Empty-state art | **72–120** |
| Tablet max content width | **480** centered (same composition) |

## Colors (Figma Color collection — Light)

| Variable | Hex | Notes |
|---|---|---|
| `color/primary-dark` | `#0B3D2E` | Deep brand |
| `color/primary` | `#1F8A5B` | Figma brand green |
| `color/mint-50` | `#F3FAF6` | Soft mint |
| `color/mint-100` | `#E5F5EC` | Selected / icon wells |
| `color/mint-200` | `#CDE9D9` | Soft borders |
| `color/text-primary` | `#15202B` | Body/headings |
| `color/text-secondary` | `#5B6670` | Supporting |
| `color/text-tertiary` | `#8B949E` | Captions |
| `color/border` | `#E2E6EA` | Dividers / strokes |
| `color/surface` | `#FFFFFF` | Cards / sheets |
| `color/background` | `#FAFAF8` | App canvas |
| `color/success` | `#1F8A5B` | Same as Figma primary |
| `color/warning` | `#D97706` | Attention |
| `color/error` | `#DC2626` | Errors |
| `color/white` | `#FFFFFF` | On-primary text |

### Intentional runtime accessibility adjustment

| Role | Figma | Shipped (`packages/config`) | Why |
|---|---|---|---|
| Primary / success | `#1F8A5B` | **`#1C8054`** | White label on primary must meet WCAG AA (≥4.5:1) without redesigning the brand |

Do **not** “fix” shipped primary back to `#1F8A5B` without a contrast re-check.

## Typography (Inter)

| Style | Size | Weight | Line height |
|---|---|---|---|
| Display | 34 | Bold | 42 |
| H1 | 28 | Bold | 34 |
| H2 | 22 | Semi Bold | 28 |
| H3 | 18 | Semi Bold | 24 |
| Body Large | 17 | Regular | 26 |
| Body | 15 | Regular | 22 |
| Body Small | 13 | Regular | 18 |
| Label | 13 | Medium | 16 |
| Button | 16 | Semi Bold | 20 |
| Caption | 12 | Regular | 16 |

RN may map Inter → system stack where Inter is unavailable; keep sizes/weights.

## Spacing scale

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`

## Radii

| Token | Value | Use |
|---|---|---|
| `radius/12` | 12 | Icon wells |
| `radius/16` | 16 | Buttons, default cards |
| `radius/20` | 20 | Large cards / sheets content |
| `radius/24` | 24 | Sheet top corners |
| `radius/full` | 999 | Chips, toggles, pills |
| Inputs | 14–16 | Fields |

## Shadows

| Style | Spec |
|---|---|
| `shadow/card` | y:4 · blur:16 · color `rgba(20,31,41,0.08)` |
| `shadow/floating` | y:8 · blur:24 · spread:-2 · color `rgba(20,31,41,0.14)` |

Use card shadow for list cards; floating only for sheets/dialogs.

## Borders

Default stroke: `color/border` `#E2E6EA` · weight **1**  
Selected option: primary stroke **1.5** on mint-50 fill.

## Rate / locale presentation

| Country | Rate presentation |
|---|---|
| United States | `$0.70 / mile` |
| Canada | `C$0.72 / km` |
| United Kingdom | `£0.45 / mile` |
| Australia | `A$0.88 / km` |

Never display “70 cents”. Rates are editable estimates — **not tax advice**.

## Keyboard / scroll (spec)

- Focused inputs stay visible above keyboard.
- Primary CTA docks above keyboard while editing.
- Screens scroll vertically when content exceeds safe height.
- Sticky bottom CTA / tab bar as designed.
