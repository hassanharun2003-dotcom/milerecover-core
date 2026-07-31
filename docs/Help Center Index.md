# MileRecover Help Center Index

**Status:** Draft — Pre-launch content plan  
**Last Updated:** July 2026  
**Owner:** Product / Support  
**Target:** 10+ articles before public launch ([Launch Plan.md](../planning/Launch%20Plan.md))

---

## Help Center Philosophy

Support content reinforces **trust over automation** — explain how MileRecover works honestly, including limitations.

Tone: Calm, professional, no "maximize your deduction" language. Align with [Manifesto.md](./Manifesto.md).

---

## Article Catalog

| # | Slug | Title | Status | Primary doc reference |
|---|---|---|---|---|
| 1 | `what-is-milerecover` | What is MileRecover? | Draft outline | [Manifesto.md](./Manifesto.md) |
| 2 | `how-tracking-works` | How automatic tracking works | Draft outline | [Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md) |
| 3 | `location-permissions` | Location permissions explained | Draft outline | [Background Location Research.md](../research/Background%20Location%20Research.md) |
| 4 | `battery-and-tracking` | Battery use and tracking | Draft outline | [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md) |
| 5 | `review-trips` | How to review and confirm trips | Draft outline | [Interaction Rules.md](../design/Interaction%20Rules.md) |
| 6 | `reject-phantom-trips` | Removing trips that didn't happen | Draft outline | [04 Trust Rules.md](./04%20Trust%20Rules.md) A3 |
| 7 | `proof-score` | Understanding your Proof Score | Draft outline | [Proof Score.md](../architecture/Proof%20Score.md) |
| 8 | `export-for-cpa` | Exporting for your CPA | Draft outline | [Export Formats.md](../architecture/Export%20Formats.md) |
| 9 | `offline-use` | Using MileRecover offline | Draft outline | [Offline First.md](../architecture/Offline%20First.md) |
| 10 | `gaps-unaccounted-days` | Unaccounted days and gaps | Draft outline | [Recovery Engine.md](../architecture/Recovery%20Engine.md) |
| 11 | `ai-suggestions` | AI purpose suggestions (H1) | Planned | [AI Architecture.md](../architecture/AI%20Architecture.md) |
| 12 | `subscription-billing` | Plans and billing | Draft outline | [09 Pricing.md](./09%20Pricing.md) |
| 13 | `delete-export-data` | Export or delete your data | Draft outline | [Privacy Policy.md](./Privacy%20Policy.md) |

---

## FAQ Quick Answers (Launch minimum)

### Why doesn't MileRecover log every trip automatically?
We prioritize **defensible** trips over volume. Low-confidence movement is not silently logged. You can add trips manually. **Never invent mileage.**

### Why do I see "unaccounted days"?
**Every work mile accounted for** means showing gaps honestly. We don't estimate missing days.

### Is my data sold?
No. See [Privacy Policy.md](./Privacy%20Policy.md) and DEC-006.

### Does MileRecover file my taxes?
No. We provide mileage logs. Consult a tax professional. [Export Disclaimer.md](./Export%20Disclaimer.md)

### Why was my trip marked "pending"?
**Trust over automation** — auto-detected trips require your review before counting as confirmed business miles (unless you opted into auto-confirm above your threshold).

---

## Article Template

```markdown
# [Title]

**Last updated:** YYYY-MM-DD

## Summary
One paragraph answer.

## Steps
1. ...

## Related
- Link to OS doc sections

## Still need help?
support@milerecover.com
```

---

## Localization

MVP: English (U.S.) only. Structure slugs for future ES localization.

---

## Related Documents

- [Launch Plan.md](../planning/Launch%20Plan.md)
- [06 User Psychology.md](./06%20User%20Psychology.md)
- [Beta Testing.md](../planning/Beta%20Testing.md)
