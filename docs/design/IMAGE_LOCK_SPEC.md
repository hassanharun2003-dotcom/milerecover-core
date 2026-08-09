# IMAGE LOCK SPEC — MileRecover collage blueprint

**Source:** Attached MileRecover UI collage (authoritative).  
**Crop directory:** `docs/design/reference-crops/`  
**Marketing panel:** ignored (not an application screen).  
**Target viewport:** 390 × 844 logical points (phone frame), rendered at 2× → 780 × 1688 px.  
**Safe area:** top inset 47 pt (status), bottom inset 34 pt (home indicator). Content uses remaining area.  
**Page background:** `#FFFFFF` (primary). Soft surfaces `#F5F5F5` / `#F7F9FC`.  
**Brand green (hero / primary):** `#0B4D3C` deep / `#0F6B46` primary. Mint status: `#E8F4EE`.

> Note: The collage binary was not persisted onto this agent VM filesystem. Reference crops were generated from the vision extraction of the attached collage into measurable geometry recorded here. Crops are the working lock until the original PNG can be re-attached.

---

## Shared token table (implementation values)

| Token | Value | Usage |
|---|---|---|
| `color.canvas` | `#FFFFFF` | App screen background |
| `color.canvasMuted` | `#F7F9FC` | Subtle page fill when needed |
| `color.surface` | `#FFFFFF` | Cards on muted canvas |
| `color.surfaceMuted` | `#F5F5F5` | Secondary chips / inactive segments |
| `color.surfaceMint` | `#E8F4EE` | Status / readiness panels |
| `color.primary` | `#0F6B46` | Buttons, active tabs, selected borders |
| `color.primaryDeep` | `#073D2C` | Hero cards, dark emphasis |
| `color.onPrimary` | `#FFFFFF` | Text/icons on green |
| `color.textPrimary` | `#0F172A` | Titles |
| `color.textSecondary` | `#475569` | Body / meta |
| `color.textTertiary` | `#64748B` | Captions |
| `color.border` | `#E2E8F0` | Hairline borders |
| `color.borderSelected` | `#0F6B46` | Selected choice cards |
| `space.pageX` | `20` | Horizontal page padding |
| `space.section` | `16` | Between major sections |
| `space.cardPad` | `16` | Card internal padding |
| `space.stackSm` | `8` | Tight stacks |
| `space.stackMd` | `12` | Default stack |
| `radius.card` | `16` | Standard cards |
| `radius.hero` | `20` | Hero cards |
| `radius.control` | `12` | Inputs / segments |
| `radius.button` | `14` | Primary/secondary buttons |
| `radius.pill` | `999` | Chips / badges |
| `radius.iconCircle` | `999` | Benefit / status icons |
| `border.width` | `1` | Default |
| `border.widthSelected` | `2` | Selected cards |
| `shadow.card` | `0 1 2 rgba(15,23,42,0.06)` | Soft elevation only when needed |
| `type.display` | 28 / 700 / 34 | Welcome brand title |
| `type.title` | 24 / 700 / 30 | Screen titles |
| `type.titleSm` | 20 / 700 / 26 | Section titles |
| `type.body` | 16 / 400 / 22 | Body |
| `type.bodyStrong` | 16 / 600 / 22 | Emphasis body |
| `type.meta` | 13 / 500 / 18 | Secondary labels |
| `type.caption` | 12 / 500 / 16 | Captions / tabs |
| `type.heroValue` | 28 / 700 / 34 | Protected $ value |
| `type.metricValue` | 16 / 700 / 20 | Metric tile values |
| `control.buttonH` | `52` | Primary/secondary button height |
| `control.segmentH` | `40` | Segmented control height |
| `control.fieldH` | `52` | Form field height |
| `control.tabBarH` | `56` | Tab bar content height (+ safe bottom) |
| `icon.circle` | `40` | Icon circle container |
| `icon.glyph` | `20` | Glyph inside circle |
| `icon.tab` | `24` | Tab icons |
| `icon.row` | `20` | Settings row icons |

Font: system SF/Roboto equivalent sans — **Inter is forbidden**; use Expo default / platform UI sans already in app (`System` via RN), or existing design-system face if non-default. Prefer `Platform.select` default UI font; do not introduce Inter/Roboto/Arial stacks as brand.

---

## 01 — Welcome

**File:** `reference-crops/01-welcome.png`

| Region | Spec |
|---|---|
| Background | `#FFFFFF` full bleed |
| Top | Skip text button, top-right, meta 13/500, secondary |
| Center stack | Logo shield 72×72 → title “Welcome to MileRecover” display 28/700 primary green → 24pt gap |
| Benefits | 3 rows; each: icon circle 40, glyph 20, label body 16/500; row gap 16 |
| Benefit copy | Recover forgotten miles · Tax & employer ready · Automatic tracking |
| Pagination | 4 dots, center, above CTA; active = primary |
| CTA | Primary “Get started →”, height 52, radius 14, pageX 20, bottom safe+16 |
| Fixed vs scroll | Content centered/scroll if needed; CTA fixed bottom |
| Empty/loading/error | N/A |

---

## 02 — Purpose

**File:** `reference-crops/02-purpose.png`

| Region | Spec |
|---|---|
| Progress | Thin 4pt bar primary; “2 of 5” meta; back chevron |
| Title | “What's your main reason for tracking mileage?” title 24/700 |
| Subtitle | body secondary |
| Choices | 4 cards, height ~56–64, radius 16, border 1 `#E2E8F0`; selected border 2 primary + check |
| Labels | Employee reimbursement · Self-employed / Business · Delivery or gig work · Personal |
| CTA | Continue → fixed bottom |
| Variants | disabled Continue until selection |

---

## 03 — Region and rate

**File:** `reference-crops/03-region-rate.png`

| Region | Spec |
|---|---|
| Progress | “3 of 5” |
| Title | “Set your region and mileage rate.” |
| Country field | Label + row: flag + “United States” + chevron; fieldH 52, radius 12 |
| Rate row | “$0.70 per mile” + “Update rate” link primary |
| Info | Mint outlined panel with i icon + estimate honesty copy |
| CTA | Continue → |

---

## 04 — Home

**File:** `reference-crops/04-home.png`

| Region | Spec |
|---|---|
| Background | `#FFFFFF` |
| Header | Menu 24 left · MileRecover wordmark/logo center · bell 24 right; height ~48 |
| Greeting | “Good morning, …” titleSm 20/700 |
| Hero | Dark green `#073D2C`, radius 20, pad 20; “You've protected **$…** this year.” + shield art right |
| Metrics | **Three separate tiles** equal width, gap 8, radius 12, surface white/muted border; value + label |
| Status | Full-width mint panel, shield icon, “All systems normal…” |
| Next up | One compact card, title meta, row with chevron |
| Actions | Primary “+ Add a drive” h52; Secondary “Check for missed drives” outline |
| Tabs | Home active primary; 4 tabs Home/Review/Proof/Profile |
| Forbidden | Giant white “Protected” card; cramped single metric row; duplicate recovery prompts |
| Empty | Truthful empty metrics/zero; status may be setup-needed |
| Loading/error | Skeleton / ErrorState below header |

---

## 05 — Review

**File:** `reference-crops/05-review.png`

| Region | Spec |
|---|---|
| Title | “Review” |
| Segments | Needs review (n) / Done (n); h40 |
| Trip card | Date/time · ⋮ · origin/dest · map region ~120h · Distance/Time/Est · Work/Personal/Not sure segments |
| Done items | Retain trip context (not timestamp-only undo cards) |

---

## 06 — Proof

**File:** `reference-crops/06-proof.png`

| Region | Spec |
|---|---|
| Period segments | Month / Quarter / Year / YTD |
| Summary | Period label + 3 stats |
| Chart | Intentional bar visualization ~140h |
| Readiness | Mint panel |
| Actions | Fix items primary · Preview report secondary |
| Export | Compact CSV / PDF rows |

---

## 07 — Add drive

**File:** `reference-crops/07-add-drive.png`

| Region | Spec |
|---|---|
| Mode | Manual entry / From other app segments |
| Purpose | Work / Personal |
| Fields | Date · Start · End · Distance (fieldH 52) |
| CTA | Save drive |
| Footer | Privacy reassurance |

---

## 08 — Protection Center

**File:** `reference-crops/08-protection-center.png`

| Region | Spec |
|---|---|
| Background | Light `#FFFFFF` |
| Hero | Compact dark green protection hero |
| Diagnostics | 5 rows icons + status labels |
| CTA | Run diagnostics |

---

## 09 — Subscription

**File:** `reference-crops/09-subscription.png`

| Region | Spec |
|---|---|
| Title | Go Pro… |
| Billing toggle | Monthly / Yearly |
| Plan card | Dark green Pro + Most Popular |
| Features | Check list |
| CTA | Start Free 7-Day Trial |

---

## 10 — Profile

**File:** `reference-crops/10-profile.png`

| Region | Spec |
|---|---|
| Identity | Avatar circle · name · subtitle · settings gear |
| Groups | Compact icon rows with secondary labels + chevrons |
| Forbidden | Enormous blank settings cards |
| Tabs | Profile active |

---

## 11 — Missing drives

**File:** `reference-crops/11-missing-drives.png`

| Region | Spec |
|---|---|
| Illustration | Branded region ~180h |
| Title | Find the miles you missed |
| Trust | 3–4 check bullets |
| CTA | Run check now |
| Meta | Takes about 1 minute |

---

## Auth (Batch A — required by protocol; not a collage tile)

Insert after Welcome. Light background. Primary: Continue with Google. iOS: Continue with Apple when supported. Secondary quieter: Continue without an account. Truthful unavailable if providers unconfigured. No silent no-op buttons.

---

## Acceptance method

For each implemented screen: left = reference crop, right = actual Android screenshot, plus difference overlay. Pass only when silhouette, order, spacing rhythm, type hierarchy, and chrome match within visual tolerance (~±4 pt spacing, exact token colors).
