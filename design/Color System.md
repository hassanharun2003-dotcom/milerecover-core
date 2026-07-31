# MileRecover Color System

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design

---

## Color Philosophy

Color communicates **state and trust**, not brand vanity.

- Green = confirmed, defensible
- Amber = needs attention, not error
- Red = error or rejected (sparingly)
- Navy = trust anchor, primary brand

**Never use color alone** to indicate trip classification (pair with icon + label).

---

## Brand Palette

### Primary — Trust Navy
| Token | Light | Dark | Use |
|---|---|---|---|
| `brand-900` | #0A1628 | #E8EDF4 | Primary text on brand |
| `brand-700` | #1A3A5C | #B8C9DC | Headers, nav |
| `brand-500` | #2B5F8A | #6B9BC4 | Primary actions |
| `brand-100` | #E8F0F7 | #1A2A3D | Brand backgrounds |

### Accent — Proof Green
| Token | Light | Dark | Use |
|---|---|---|---|
| `proof-600` | #1B7D4E | #4ADE80 | Confirmed business |
| `proof-100` | #E6F5ED | #0D2818 | Success backgrounds |

### Warning — Review Amber
| Token | Light | Dark | Use |
|---|---|---|---|
| `review-600` | #B45309 | #FBBF24 | Pending review |
| `review-100` | #FEF3C7 | #422006 | Review backgrounds |

### Neutral
| Token | Light | Dark | Use |
|---|---|---|---|
| `neutral-900` | #111827 | #F9FAFB | Primary text |
| `neutral-600` | #4B5563 | #9CA3AF | Secondary text |
| `neutral-400` | #9CA3AF | #6B7280 | Placeholder |
| `neutral-200` | #E5E7EB | #374151 | Borders |
| `neutral-100` | #F3F4F6 | #1F2937 | Subtle backgrounds |
| `neutral-0` | #FFFFFF | #0A0A0A | Surface |

---

## Semantic Colors

| Token | Color | Use |
|---|---|---|
| `text-primary` | neutral-900 | Body text |
| `text-secondary` | neutral-600 | Captions, metadata |
| `text-inverse` | neutral-0 | On dark/brand buttons |
| `surface-primary` | neutral-0 | Main background |
| `surface-secondary` | neutral-100 | Cards |
| `border-default` | neutral-200 | Dividers, inputs |
| `action-primary` | brand-500 | Primary buttons |
| `action-destructive` | #DC2626 | Delete trip (confirm required) |
| `status-offline` | neutral-600 | Offline indicator |
| `status-syncing` | brand-500 | Sync in progress |
| `ai-assist` | #6366F1 | AI suggestion label (indigo) |

---

## Trip State Colors

| State | Background | Accent | Icon |
|---|---|---|---|
| Pending review | `review-100` | `review-600` | clock |
| Confirmed business | `proof-100` | `proof-600` | checkmark.shield |
| Personal | `neutral-100` | `neutral-600` | person |
| Rejected | — | hidden from list | xmark |
| Gap / Unaccounted | `neutral-100` | `neutral-400` dashed | calendar.badge.minus |

---

## Proof Score Gradient

Proof Score meter uses a constrained gradient—never red-to-green rainbow (implies moral judgment on miles).

| Score Range | Color | Label |
|---|---|---|
| 85–100 | proof-600 | Strong |
| 70–84 | brand-500 | Good |
| 50–69 | review-600 | Review recommended |
| 0–49 | neutral-600 | Weak — verify before export |

---

## Map Colors

| Element | Light | Dark |
|---|---|---|
| Recorded path | brand-500 | brand-500 |
| Start marker | proof-600 | proof-600 |
| End marker | brand-700 | brand-700 |
| Recovery suggestion | review-600 dashed | review-600 dashed |

---

## Accessibility

- All text/background pairs: **WCAG AA minimum** (4.5:1 body, 3:1 large)
- Proof Score colors tested with deuteranopia simulation
- High contrast mode: boost border weight, avoid subtle fills

---

## Do Not

- Use red for pending review (creates false urgency/error)
- Use green for auto-detected but unconfirmed trips
- Use gradient backgrounds on data-heavy screens
- Use brand color for personal trip state

---

## Related Documents

- [Design System.md](./Design%20System.md)
- [Typography.md](./Typography.md)
- [Component Library.md](./Component%20Library.md)
