# MileRecover Typography

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design

---

## Typography Philosophy

MileRecover displays **evidence**: miles, dates, scores, distances. Typography must prioritize **legibility and numeric clarity** over expressive type.

Numbers are first-class citizens. **Every work mile accounted for** must read clearly at a glance.

---

## Font Stack

### iOS
- **Primary:** SF Pro (system)
- **Monospace:** SF Mono (export previews, trip IDs)

### Android
- **Primary:** Roboto (system) / Google Sans where applicable
- **Monospace:** Roboto Mono

### Future Web (CPA Portal)
- **Primary:** Inter (if not system)
- Load only weights in use

**No custom licensed fonts in MVP** — system fonts reduce bundle size and feel native.

---

## Type Scale

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `display-lg` | 34px | 700 | 41px | Period mile total |
| `display-sm` | 28px | 600 | 34px | Section headers |
| `heading-lg` | 22px | 600 | 28px | Screen titles |
| `heading-md` | 17px | 600 | 22px | Card titles |
| `heading-sm` | 15px | 600 | 20px | Subsections |
| `body-lg` | 17px | 400 | 24px | Primary body |
| `body-md` | 15px | 400 | 22px | Secondary body |
| `body-sm` | 13px | 400 | 18px | Captions, metadata |
| `label-md` | 13px | 500 | 18px | Buttons, chips |
| `label-sm` | 11px | 500 | 14px | Badges, timestamps |
| `mono-md` | 13px | 400 | 18px | IDs, export preview |

All sizes support Dynamic Type / font scaling to 200% without truncation of critical data.

---

## Numeric Typography

### Tabular Figures
**Required** for:
- Mile totals
- Distances
- Proof Scores
- Currency
- Date columns in export preview

Enable `font-variant-numeric: tabular-nums` (web) / equivalent platform APIs.

### Mile Display Format
- **Summary:** `12,847.3 mi`
- **Detail:** `12.34 mi`
- **Export:** Full precision per IRS doc rules

### Proof Score Display
- Format: `84` with `/100` in `body-sm` secondary
- Never decimal scores in UI (internal precision ok)

---

## Hierarchy Examples

### Period Summary Header
```
display-lg + tabular     "4,281.6 mi"
body-sm secondary        "Confirmed business · March 2026"
label-md proof-600       "Proof Score: 82"
```

### Trip Card
```
heading-md               "Client showing — Oak Street"
body-sm secondary        "Mar 12 · 14.2 mi · Auto-detected"
label-sm review-600      "Pending review"
```

---

## Weight Usage

| Weight | Use |
|---|---|
| 400 | Body text, descriptions |
| 500 | Labels, buttons, chips |
| 600 | Headings, emphasis |
| 700 | Large numeric displays only |

Avoid 300 (light) — poor outdoor legibility.

---

## Letter Spacing

- Default tracking for body
- `+0.5px` on `label-sm` uppercase badges (sparingly)
- No uppercase for sentences — badges only

---

## Paragraph & Line Length

- Max line length: 65 characters for explanatory text
- Legal/permission copy: `body-md`, left-aligned, generous line height

---

## Localization Readiness

- Type scale accommodates +30% length for DE/ES strings
- RTL layout support planned H2
- Avoid hardcoded string widths

---

## Related Documents

- [Design System.md](./Design%20System.md)
- [Spacing.md](./Spacing.md)
- [Design Bible.md](./Design%20Bible.md)
