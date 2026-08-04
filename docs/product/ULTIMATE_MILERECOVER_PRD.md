# Ultimate MileRecover PRD — UX rebuild v8

**Promise:** Protect every legitimate work mile, recover the ones you missed, and prove them clearly.

**Loop:** Protect → Detect gaps → Resolve → Proof → Recover older mileage.

## Non-negotiables

- Four tabs: Home, Review, Proof, Profile
- Calm green-and-white; local-first; no invented mileage
- Manual miles always work; Free remains useful indefinitely
- No swipe-only classification; user confirms uncertain work miles
- No customer-facing RevenueCat / OTA / runtime / commit / package diagnostics
- Mileage country ≠ store subscription currency

## Onboarding — 4 stages

| Stage | Content |
|---|---|
| 1 Your work | Optional name, primary goal, suggested country (editable) |
| 2 Protect | Three principles + Set up drive protection; contextual permissions |
| 3 Personalize | Optional vehicle, pattern, familiar place; all skippable |
| 4 Ready | Actual setup summary + one personalized next CTA |

Auth: no full stage when unavailable; small inline message; never block Home.

## Home

1. Greeting + compact protection status (one sentence, one action)
2. This-period summary (distance, value if rate, recovered, needs review)
3. One next-best action (priority: review → fix protection → report blockers → setup → recover → preview → add drive)
4. Recent ≤3 + View all
5. Add drive
6. Contextual upgrade only when relevant — never multiple See plans

Protection labels: Protected / Setup incomplete / Needs attention / Paused / Manual mode.

## Review

Preserve Work / Personal / Not sure / Edit / Undo. Show why suggested. Empty: “You’re caught up” + Add known drive / Check for missed drives.

## Proof

Adaptive title by goal. Layers: summary → readiness checklist with exact Fix CTA → export (Preview/PDF/CSV/Share). No “What’s free” lecture every period. Disclaimers once at bottom of preview.

## Profile — 5 groups

Your setup · Mileage settings · Drive protection · Reports and data · Plan and support.

## Familiar places

Search/current location → Home/Work/Client/Other → optional label → Save. Rules: usually personal / usually work / always ask — never auto-classify without visible confirmed rule.

## International + rates

US mi/USD · CA km/CAD · GB mi/GBP · AU km/AUD · Other custom. Trip rate snapshots. Country/unit change marks active rate for review. Store subscription prices from RevenueCat only.

## Paywall

Header “Protect every work drive” · personalized subtitle · real-data value proof · Monthly/Annual · Plus recommended · Pro · Free reassurance row · Rescue separate route · one preview purchases banner · no technical copy.

## Updates + diagnostics

Compact update banner. About: version/notes/check/support/privacy/terms. Diagnostics behind 7 taps on version. No OTA marker on Home.

## Analytics (privacy-safe)

See event list in task brief — wire without trip content/addresses/notes.
