# MileRecover Design System

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design / Engineering

---

## Overview

The MileRecover Design System (MRDS) defines tokens, components, and patterns for consistent implementation across iOS and Android.

Built on philosophy: **Accuracy over features** — the system prioritizes clarity of data over decorative UI.

---

## System Layers

```
Tokens (color, type, spacing, motion)
        ↓
Primitives (buttons, inputs, badges)
        ↓
Components (trip card, proof meter, review swipe)
        ↓
Patterns (review queue, export flow, gap states)
        ↓
Screens (see Design Bible)
```

---

## Design Tokens

| Token Category | Document |
|---|---|
| Color | [Color System.md](./Color%20System.md) |
| Typography | [Typography.md](./Typography.md) |
| Spacing | [Spacing.md](./Spacing.md) |
| Motion | [Motion.md](./Motion.md) |

---

## Iconography

**Library:** SF Symbols (iOS) / Material Symbols (Android) with custom icons where needed

**Custom icons required:**
- Proof Score shield
- Trip source badges (auto, manual, recovered)
- Gap / unaccounted indicator
- Offline sync status
- AI assist sparkle (subtle, not dominant)

**Style:** 1.5px stroke, rounded caps, 24dp default grid

---

## Elevation & Surfaces

| Level | Use | iOS | Android |
|---|---|---|---|
| 0 | Background | systemBackground | surface |
| 1 | Cards | secondarySystemBackground | surfaceContainer |
| 2 | Modals | tertiarySystemBackground | surfaceContainerHigh |
| 3 | Sheets | — | surfaceContainerHighest |

No heavy shadows. Prefer border + subtle fill separation.

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Badges, chips |
| `radius-md` | 12px | Cards, inputs |
| `radius-lg` | 16px | Modals, sheets |
| `radius-full` | 9999px | Pills, avatars |

---

## Component States

All interactive components support:

- Default
- Pressed / Active
- Disabled
- Loading
- Error

Trip-specific states:
- **Pending review** — amber accent
- **Confirmed business** — green accent
- **Personal** — neutral
- **Rejected** — hidden from totals, accessible in history

See [Component Library.md](./Component%20Library.md).

---

## Data Display Rules

### Numbers
- Always tabular figures
- Miles: 1 decimal max in summary, 2 in detail/export
- Currency: standard locale formatting
- Dates: locale-aware, ISO in exports

### Maps
- Recorded path: solid brand line
- Suggested/recovery path: dashed, muted
- Never show a path without underlying GPS data

---

## Responsive & Device

- Phone-first (primary)
- Tablet: two-column review queue (future)
- Not targeting desktop app in MVP

---

## Dark Mode

Full dark mode support required at launch.

- OLED-friendly true blacks on Android optional tier
- Proof Score colors maintain contrast in both modes
- Maps: auto theme sync

---

## Implementation Notes (Future)

When development begins:
- Token source of truth: JSON → platform codegen
- Storybook / native component catalog
- Snapshot tests for critical components

**No application code in this phase.**

---

## Related Documents

- [Design Bible.md](./Design%20Bible.md)
- [Component Library.md](./Component%20Library.md)
- [../architecture/Frontend.md](../architecture/Frontend.md)
