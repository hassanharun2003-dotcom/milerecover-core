# MileRecover Design Bible

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Design

---

## What This Document Is

The Design Bible is MileRecover's single source of truth for how the product **looks, feels, and behaves**. It translates philosophy into experience.

**Every work mile accounted for** is not just a tagline—it is the organizing principle of our interface.

---

## Design Mission

Create a product that feels like a **professional financial instrument**, not a consumer gimmick or tax hack.

Users should feel:
- **Calm** — audit anxiety reduced, not amplified
- **In control** — **trust over automation**
- **Respected** — never tricked into claiming more

---

## Brand Personality

| We Are | We Are Not |
|---|---|
| Precise | Flashy |
| Honest | Salesy |
| Professional | Gamified |
| Quietly confident | Loudly clever |
| Evidence-forward | Magic-forward |

**Tone of voice:** Clear, direct, accounting-adjacent. No exclamation marks in critical flows. No "cha-ching" metaphors.

---

## Philosophy → Experience Mapping

| Principle | Design Expression |
|---|---|
| Every work mile accounted for | Coverage indicators, gap visibility, period completeness |
| Never invent mileage | Empty states show gaps; no fake "estimated" totals |
| Trust over automation | Review-first UI; confirm before commit |
| Accuracy over features | Progressive disclosure; depth over breadth |
| Battery friendly | Transparent tracking status; no guilt for pausing |
| Offline first | Offline badge subtle; sync status non-blocking |
| AI assists but never replaces evidence | AI labels, suggestion chips, never auto-filled export fields |

---

## Visual Identity (Summary)

**Aesthetic:** Refined utility — think Linear meets Apple Wallet meets professional tax software.

- **Color:** Deep navy trust anchor, proof green for confirmed, amber for review (see Color System)
- **Typography:** SF Pro / Roboto system stack, tabular figures for numbers
- **Spacing:** Generous whitespace; density in data tables only
- **Motion:** Purposeful, restrained (see Motion)

Full specs: [Design System.md](./Design%20System.md)

---

## Information Architecture (App)

```
Home (Period Summary)
├── Review Queue          ← primary action surface
├── Trips (All)
│   └── Trip Detail
├── Recovery
│   └── Suggested Entries
├── Export
└── Settings
    ├── Tracking
    ├── Automation Level
    ├── Permissions
    └── Account
```

**Home is not a dashboard of miles.** Home is a **status of account completeness**.

---

## Key Screens (Conceptual)

### Home / Period Summary
- Confirmed business miles (large, tabular)
- Pending review count (actionable)
- Unaccounted days (honest gap indicator)
- Period Proof Score
- Primary CTA: "Review pending trips"

### Review Queue
- Card per trip: map thumbnail, distance, confidence, suggested class
- Swipe or tap: Confirm / Personal / Reject
- Batch mode for high-confidence trips

### Trip Detail
- Map with recorded path
- Source badge (Auto / Manual / Recovered)
- Proof Score breakdown
- Edit, split, add purpose
- AI suggestion (if any) clearly labeled

### Export
- Preview before generate
- Format selector (PDF, CSV)
- Confidence summary included
- Gaps explicitly noted in preview

---

## Accessibility

- WCAG 2.1 AA minimum
- Dynamic type support (iOS) / font scaling (Android)
- Color never sole indicator of state
- VoiceOver / TalkBack labels on all trip actions
- Reduce Motion respected

---

## Platform Conventions

- **iOS:** Follow Apple HIG for navigation, permissions, background location (see Apple HIG References)
- **Android:** Material 3 with MileRecover token overrides
- **Parity:** Feature parity; platform-native patterns where they differ

---

## Copy Guidelines

### Do
- "Confirm this trip"
- "3 days unaccounted in March"
- "Suggested by AI — tap to confirm"
- "Tracking paused to save battery"

### Don't
- "Claim your miles!"
- "You might be missing $2,400!"
- "Auto-logged ✓" without review context
- "AI detected" without evidence link

---

## Design Review Checklist

- [ ] Does this UI make invention impossible or unlikely?
- [ ] Is automation visibly provisional until confirmed?
- [ ] Do numbers use tabular figures?
- [ ] Does offline state degrade gracefully?
- [ ] Is AI labeled?
- [ ] Would Diane the CPA understand this screen?

---

## Related Documents

- [Design System.md](./Design%20System.md)
- [Interaction Rules.md](./Interaction%20Rules.md)
- [../docs/03 Core Principles.md](../docs/03%20Core%20Principles.md)
- [../docs/06 User Psychology.md](../docs/06%20User%20Psychology.md)
