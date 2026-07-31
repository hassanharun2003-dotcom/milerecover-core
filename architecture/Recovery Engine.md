# MileRecover Recovery Engine

**Status:** Foundational — launch scope locked (DEC-021)  
**Last Updated:** July 2026  
**Owner:** Product / Engineering

**Authority:** [04 Trust Rules.md](../docs/04%20Trust%20Rules.md) · [Product DNA.md](../docs/Product%20DNA.md) · DEC-004, DEC-021, DEC-024

---

## Mission

The Recovery Engine is MileRecover's **primary differentiation** at launch. It helps users **account for work miles** they failed to capture — not fabricate miles they didn't drive.

**Never invent mileage.** Every recovery output is a **suggestion** requiring explicit user acceptance with visible evidence basis. AI may help interpret evidence but **may not create or approve mileage records**.

---

## Recovery vs. Invention

| Recovery (Allowed) | Invention (Forbidden) |
|---|---|
| Suggest trip from calendar event + user confirms | Auto-create trip from calendar alone |
| Flag gap: "No data Mar 3–5" | Fill gap with average daily miles |
| Import competitor CSV as draft suggestions | Modify imported distances upward |
| Late-start / early-stop edge repair suggestion | Silent distance adjustment |
| No-driving-day confirmation | Assume zero without user confirm |
| Known work-location transition hint | Pattern-based trip creation without confirm |
| Odometer delta user enters | OCR odometer without user confirm |

---

## Launch Recovery (DEC-021)

Recovery is **in scope at launch** — bounded, evidence-first, user-confirmed.

### Included at launch

| Capability | Description | User control |
|---|---|---|
| **Gap candidates** | Periods between captured drives with no accounted trips | Confirm no driving, add manual, or review suggestions |
| **Calendar matching** | Calendar events without matching drives (opt-in calendar access) | Per-suggestion accept/dismiss; user confirms distance |
| **Known-place transitions** | Work location transitions suggesting possible unlogged segment | Suggestion only; user confirms |
| **Competitor-import analysis** | Gap analysis on imported competitor history (Plus; Free 7-day preview) | Row-by-row review |
| **Edge repair** | Late-start and early-stop correction suggestions on captured trips | User accepts or dismisses each |
| **No-driving confirmation** | Expected work day with no detected driving (DEC-024) | Correct / I drove / Remind later |
| **Evidence display** | Source, confidence, and explanation on every suggestion | Visible before accept |
| **User-confirmed reconstruction** | Trip created only on explicit accept | DEC-004 |

### Launch pipeline

```
1. Gap Detector
   └── Gaps between drives; unaccounted days; calendar mismatches

2. Evidence Gatherer
   └── Calendar (opt-in), imports, known places, trip edge signals

3. Suggestion Generator
   └── RecoverySuggestion records (NOT trips)

4. User Review UI (Review tab)
   └── Accept → creates trip (source: recovered)
   └── Dismiss → archived
   └── No-driving confirm → day marked accounted (no trip)

5. Proof Score Assignment
   └── Recovered trips: lower base score; source labeled
```

### Tier access

| Capability | Free | Plus | Pro | Rescue IAP |
|---|---|---|---|---|
| Gap / no-driving prompts | ✓ | ✓ | ✓ | ✓ (scoped) |
| Missing-trip scan | 1/month | Unlimited | Unlimited | Enhanced in scope |
| Calendar matching | | ✓ | ✓ | ✓ in scope |
| Competitor import recovery | 7-day preview | ✓ | ✓ | ✓ in scope |
| Historical reconstruction tools | | | ✓ | Full-Year scope |

---

## Deferred Recovery (Post-Launch)

Not included at launch. May be evaluated after launch with same trust rules.

| Capability | Reason deferred |
|---|---|
| **Broad email analysis** | Privacy scope; parsing complexity |
| **Bank-data matching** | Financial data sensitivity; compliance |
| **Delivery-platform integrations** | Partner APIs; platform-specific |
| **Universal receipt inbox** | Scope; not core launch wedge |
| **Full email scanning** | Privacy and accuracy risk |
| **Unlimited historical-source reconstruction** | Pro historical tools bounded at launch; expansion requires evidence audit |

Deferred capabilities still require **user confirmation** if ever shipped.

---

## No-Driving-Day Handling (DEC-024)

When the system expected possible work driving but detected none:

**Copy:** *"No driving detected on Tuesday. Is that correct?"*

| Option | System behavior |
|---|---|
| **Correct — I did not drive** | Day marked accounted; completeness improves; no trip created |
| **I drove for work** | Manual add or recovery suggestion flow |
| **Remind me later** | Day remains **unresolved**; re-surfaces in Review |

Unanswered days remain unresolved. **Never invent a trip.**

---

## Gap Detection

**Unaccounted day definition:**
- No confirmed, personal, OR rejected trip record
- Tracking was enabled >4 hours that day (or work pattern suggests possible driving)
- Not a user-confirmed "no driving day"

**Output:** `GapPeriod` with start/end — **no implied distance**.

UI copy: *"3 unaccounted days — review or confirm no driving"*

---

## Calendar-Informed Suggestions (Launch)

**Process:**
1. User opts in to calendar read (EventKit / Android Calendar) — Plus+
2. Engine finds events with location during gap periods or without matching drives
3. Suggestion: *"Client meeting at 123 Main — add trip?"*
4. Distance: **user must enter or confirm** — no auto distance in export from guess alone

Calendar alone cannot produce exportable trip without user acceptance.

---

## Import Recovery (Launch)

**Supported formats:**
- MileIQ CSV
- TripLog export
- Generic: date, start, end, distance, purpose

**Process:**
1. Parse → validation
2. Each row → draft suggestion (not trip)
3. User reviews (batch max 10 with summary modal)
4. Accepted → `source: imported`; metadata retained

Free: 7-day preview window. Plus+: full import recovery.

---

## Edge Repair (Launch)

**Late-start / early-stop correction:**
- Compare captured trip boundaries to evidence (calendar, known places, partial GPS)
- Suggest boundary adjustment with before/after preview
- User accept → audit event; reject → unchanged

Never silently adjust distance.

---

## Proof Score Impact

| Recovery Type | Base Score Modifier |
|---|---|
| Manual entry | Standard |
| Odometer confirmed | +15 base |
| Calendar suggestion accepted | −10 base |
| Import accepted | −5 base |
| Edge repair accepted | −5 base |
| Pattern hint (deferred H2+) | −20 base |

Recovered trips never score above 90 without GPS evidence.

---

## Server vs. Client

| Function | Location |
|---|---|
| Gap detection | Client (local DB) |
| Calendar parsing | Client preferred (privacy) |
| Import parsing | Client first, server validation |
| Known-place matching | Client |
| Heavy ML patterns | Deferred (H2+), opt-in |

---

## API Surface (Suggestions)

```
GET  /v1/recovery/suggestions
POST /v1/recovery/suggestions/{id}/accept → creates trip
POST /v1/recovery/suggestions/{id}/dismiss
POST /v1/recovery/no-driving/{date}/confirm
```

Accept payload requires user confirmation timestamp.

---

## Trust Rules Compliance

- A1: No phantom trips — suggestions ≠ trips
- A2: No silent gap fill
- D1: AI cannot create trips alone
- DEC-004: User confirmation for reconstructed trips
- DEC-021: Launch recovery bounded; no autonomous tax-record changes

---

## Related Documents

- [Proof Score.md](./Proof%20Score.md)
- [AI Architecture.md](./AI%20Architecture.md)
- [Export Formats.md](./Export%20Formats.md)
- [09 Pricing.md](../docs/09%20Pricing.md)
- [MVP.md](../planning/MVP.md)
