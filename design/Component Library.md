# MileRecover Component Library

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design / Engineering

---

## Overview

This catalog defines MileRecover's UI components. Each component maps to Trust Rules and Core Principles.

Implementation deferred until development phase.

---

## Primitives

### Button

| Variant | Use |
|---|---|
| Primary | Confirm trip, export, save |
| Secondary | Cancel, skip |
| Destructive | Delete trip (requires confirmation modal) |
| Ghost | Tertiary actions |
| Text link | Inline learn more |

**Rules:**
- Primary never says "Accept All" without summary modal
- Destructive always confirms

---

### Input

| Type | Use |
|---|---|
| Text | Purpose, notes |
| Number | Odometer, manual distance |
| Date/time | Manual trip entry |
| Address | Start/end with autocomplete |

**Rules:**
- Manual distance requires attestation checkbox
- AI-suggested purpose shown as chip, not pre-filled

---

### Badge

| Badge | Color | Meaning |
|---|---|---|
| `source-auto` | brand | GPS auto-detected |
| `source-manual` | neutral | User entered |
| `source-recovered` | review | Recovery suggestion accepted |
| `ai-assist` | indigo | AI contributed |
| `offline` | neutral | Captured offline |
| `pending` | review | Awaiting review |

---

## Composite Components

### TripCard

**Purpose:** Primary unit in review queue and trip list

**Anatomy:**
- Map thumbnail (optional offline placeholder)
- Title (destination or route summary)
- Metadata row: date · distance · source badge
- Proof Score mini indicator
- Classification chip (pending / business / personal)
- Swipe actions: Confirm · Personal · Reject

**States:** pending, confirmed, personal, rejected (hidden), offline-queued

---

### ProofScoreMeter

**Purpose:** Visualize defensibility 0–100

**Anatomy:**
- Arc or horizontal bar (user setting)
- Numeric score (tabular)
- Label: Strong / Good / Review recommended / Weak
- Tap → breakdown sheet

**Breakdown sheet factors:**
- GPS continuity
- User confirmation status
- Purpose documented
- Time/plausible distance
- Source type

Never show score without tap-to-explain.

---

### GapIndicator

**Purpose:** Show unaccounted time honestly (**never invent mileage**)

**Anatomy:**
- Calendar strip with dashed days
- Copy: "4 unaccounted days in March"
- CTA: "Review recovery options"

**Not:** implied miles for gap days

---

### ReviewSwipeRow

**Purpose:** Fast trust-preserving review

**Gestures:**
- Swipe right → Confirm business (haptic success)
- Swipe left → Mark personal
- Long press → Detail view
- Reject via detail only (prevent accidental)

---

### TrackingStatusBar

**Purpose:** Transparent engine state (**battery friendly**)

**States:**
| State | Display |
|---|---|
| Active | "Tracking · Tap for details" |
| Paused (battery) | "Paused to save battery" |
| Paused (user) | "Tracking off" |
| Permission limited | "Limited — tap to fix" |
| Offline | "Offline · Recording locally" |

No alarming red for normal paused states.

---

### ExportPreview

**Purpose:** Pre-export trust check

**Anatomy:**
- Document preview (PDF layout simplified)
- Summary: confirmed miles, pending excluded, gaps noted
- Proof Score period summary
- AI involvement footnote
- Generate button

---

### AISuggestionChip

**Purpose:** **AI assists but never replaces evidence**

**Anatomy:**
- Sparkle icon + "Suggested purpose"
- Suggested text in quotes
- Actions: Accept · Edit · Dismiss

**Rules:**
- Never auto-applied to export
- Dismiss persists for similar trips (learned preference, local)

---

### OdometerCapture

**Purpose:** Manual evidence entry

**Anatomy:**
- Camera viewfinder with guide overlay
- OCR result editable
- Start/end reading inputs
- Computed distance preview
- Attestation: "I confirm these readings"

---

### SyncIndicator

**Purpose:** **Offline first** sync visibility

**Anatomy:**
- Icon: cloud check / cloud arrow / cloud slash
- Non-blocking banner (not modal)
- Tap → sync details (last sync, pending count)

---

### AutomationDial

**Purpose:** User control (**trust over automation**)

**Levels:**
1. **Conservative** (default) — review all auto trips
2. **Balanced** — auto-confirm above Proof Score 85
3. **Custom** — granular rules

Each level shows plain-language explanation and example.

---

## Screen Templates

| Template | Key Components |
|---|---|
| Period Summary | ProofScoreMeter, GapIndicator, TrackingStatusBar |
| Review Queue | ReviewSwipeRow, TripCard |
| Trip Detail | Map, ProofScoreMeter, AISuggestionChip, Badge |
| Manual Entry | Input, OdometerCapture |
| Recovery | GapIndicator, TripCard (suggested) |
| Export | ExportPreview |
| Settings | AutomationDial, TrackingStatusBar |

---

## Component QA Checklist

- [ ] Offline state designed
- [ ] Accessibility labels defined
- [ ] Dark mode variants specified
- [ ] AI components labeled
- [ ] No component implies confirmed without user action

---

## Related Documents

- [Design System.md](./Design%20System.md)
- [Interaction Rules.md](./Interaction%20Rules.md)
- [../architecture/Frontend.md](../architecture/Frontend.md)
