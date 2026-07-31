# MileRecover Interaction Rules

**Status:** Foundational — Binding for Design & Product  
**Last Updated:** July 2026  
**Owner:** Design / Product

---

## Purpose

Interaction Rules define **how users act on mileage evidence**. They enforce MileRecover philosophy at the gesture and flow level.

---

## Global Rules

### G1 — Confirm Before Commit
No trip appears in **confirmed business totals** without explicit user confirmation or documented auto-confirm rule user opted into.

### G2 — Reversible Actions
All classification changes reversible for 30 days minimum. Delete requires confirmation + soft delete period.

### G3 — Offline Parity
Every create, edit, classify, reject action works offline. UI never blocks on network.

### G4 — AI Is Provisional
AI output always appears as suggestion UI pattern (chip/sheet), never as committed field.

### G5 — Honest Empty States
Empty states explain *why* (no trips yet, tracking off, gap period)—never fabricate placeholder trips.

---

## Review Queue Interactions

### Entry
- Pending trips surface within 24h of detection or on next app open
- Push notification: weekly digest default, not per-trip (configurable)

### Confirm Business
1. User taps/swipes confirm
2. Trip moves to confirmed state
3. Haptic success
4. Undo snackbar 4 seconds
5. Proof Score locked for export at confirmation time (new edits recalculate)

### Mark Personal
1. User marks personal
2. Excluded from business totals
3. Remains visible in all trips filter
4. Does not count as "unaccounted" — day is accounted

### Reject Trip
1. Available only in detail view (not swipe — too accidental)
2. Modal: "This trip didn't happen — remove from log?"
3. Trip archived, not deleted (recoverable 30 days)
4. **Never invent mileage** — no replacement trip suggested automatically

### Batch Confirm
1. Only trips with Proof Score ≥ user threshold (default 85)
2. Summary modal lists count + total miles before commit
3. No batch below threshold in Conservative mode

---

## Manual Entry Interactions

### Required Fields
- Date
- Distance (odometer delta OR manual with attestation)
- Classification (defaults pending until purpose added for business)

### Odometer Entry
- Photo optional but increases Proof Score
- User must confirm computed distance

### Validation
- Distance > 0 and < 500 miles per trip (flag, not block)
- Future dates blocked
- Overlapping trips: warn, allow with user acknowledgment

---

## Recovery Flow Interactions

### Suggestion Display
- Each suggestion is individual card
- Source shown (calendar, import, odometer gap)
- User must tap "Add to log" per suggestion
- Dismiss removes suggestion permanently

### No Bulk Accept Without Review
Maximum batch: 10 suggestions with single summary modal listing each.

---

## Export Interactions

### Pre-Export Gate
- Pending trips excluded by default (toggle to include as appendix)
- Gaps listed in confirmation sheet
- Weak Proof Score trips (<70) trigger advisory, not block

### Export Completion
- Share sheet (email, files, AirDrop)
- Copy: "Exported X confirmed business miles. Y trips pending. Z gaps."

---

## Settings Interactions

### Automation Level Change
- Immediate effect explained
- Does not retroactively confirm pending trips
- Downgrade to Conservative: pending trips return to queue

### Permission Degradation
- If location denied: manual entry promoted, honest banner
- Never fake auto trips when tracking off

### Data Deletion
- Two-step confirm
- 7-day recovery window (account level)
- Local wipe immediate option

---

## Error Interactions

| Error | Response |
|---|---|
| Sync failed | Non-blocking banner + retry |
| GPS unavailable | Log manual prompt, no silent failure |
| AI unavailable | Hide suggestions, core flow continues |
| Export failed | Retry + support link |

Never blame user. Never hide errors.

---

## Notification Rules

| Type | Default | Rationale |
|---|---|---|
| Weekly review digest | On | Habit without nag |
| Per-trip detected | Off | Battery/anxiety |
| Gap alert (monthly) | On | **Every work mile accounted for** |
| Tax season reminders | On (Jan–Mar) | Seasonal value |
| Marketing | Off | Trust |

---

## Accessibility Interactions

- All swipe actions have button alternatives
- VoiceOver: trip card reads score + state + source
- Focus order: summary → pending count → first pending trip

---

## Related Documents

- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
- [Component Library.md](./Component%20Library.md)
- [../docs/06 User Psychology.md](../docs/06%20User%20Psychology.md)
