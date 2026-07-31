# MileRecover Proof Score

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product / Data / Engineering

---

## Mission

Proof Score quantifies **how defensible a trip or period would be under scrutiny**—turning MileRecover philosophy into a measurable, user-visible signal.

It is not a credit score. It is not a deduction optimizer. It answers: *"If asked, how well can I explain this mile?"*

**Trust over automation:** Low scores trigger review, not silent exclusion.

---

## Score Range

| Range | Label | Meaning |
|---|---|---|
| 85–100 | Strong | High confidence; GPS + confirmation + purpose |
| 70–84 | Good | Acceptable with minor gaps |
| 50–69 | Review recommended | Missing factors; verify before export |
| 0–49 | Weak | Significant evidence gaps |

Period score: weighted average of confirmed business trips by distance.

---

## Scoring Model (v1 — Rule-Based)

### Trip-Level Factors

| Factor | Weight | Criteria |
|---|---|---|
| **GPS continuity** | 30% | Sample rate, gap flags, path coherence |
| **User confirmation** | 25% | Explicit confirm vs auto-rule confirm |
| **Purpose documented** | 20% | Business purpose text present |
| **Distance integrity** | 15% | GPS computed vs odometer match, no spikes |
| **Source trust** | 10% | Auto > manual > recovered > imported |

### Calculation (Conceptual)

```
base = Σ(factor_weight × factor_score)

modifiers:
  - incomplete trip flag: -20
  - user edited distance: -5 (unless odometer)
  - AI-only purpose (no user edit): -10
  - recovery source: -10 to -20 (see Recovery Engine)
  - overlap warning acknowledged: -5

final = clamp(base + modifiers, 0, 100)
```

### v2 (H1): ML calibration from user confirm/reject patterns — still explainable factors.

---

## Factor Details

### GPS Continuity (0–100)
- Sample every <30s during recording: 100
- Gaps >2 min flagged: -10 per gap
- Accuracy median <50m: full weight
- Teleport detected: cap at 40

### User Confirmation (0–100)
- Manual confirm tap: 100
- Auto-confirm rule (user opted in, score was >85 at detection): 80
- Pending: 0 (not in export totals)

### Purpose Documented (0–100)
- User-written purpose: 100
- User-edited AI suggestion: 90
- AI accepted unchanged: 70
- Empty: 0

### Distance Integrity (0–100)
- GPS path computed: 85 base
- Odometer verified: 100
- Manual entry with attestation: 75
- >10% user edit from GPS: 60

### Source Trust (0–100)
| Source | Score |
|---|---|
| auto_detected | 90 |
| manual | 85 |
| odometer | 100 |
| recovered | 60 |
| imported | 65 |

---

## Period Proof Score

```
period_score = Σ(trip_score × trip_distance) / Σ(trip_distance)
  for confirmed business trips only
```

Displayed on Home with breakdown link.

Export includes period score + trip-level scores in metadata appendix (CPA optional).

---

## User-Facing Breakdown

Trip detail → Proof Score tap → Sheet:

```
Proof Score: 78 (Good)

GPS continuity      ████████░░  82
User confirmation   ██████████  100
Purpose documented  ██████░░░░  60  ← Add purpose to improve
Distance integrity  ████████░░  85
Source              █████████░  90

Suggestions:
• Add business purpose (+12 potential)
```

Suggestions are educational, not coercive.

---

## Export Behavior

| Score | Export |
|---|---|
| Any confirmed trip | Included if user confirms export |
| <70 | Advisory banner, not blocked |
| Pending trips | Excluded default; optional appendix |

**Accuracy over features:** We don't hide weak trips — we label them.

---

## Anti-Gaming

Proof Score cannot be artificially inflated:
- Purpose must be user-attested (not empty string)
- Odometer requires photo hash or manual double-entry
- Confirm-all batch limited by threshold

---

## Metrics

- Correlation: score vs user edit rate
- Correlation: score vs CPA rejection (beta panel)
- Calibration drift monitoring quarterly

Target: ≥85% of score≥70 trips accepted without edit.

---

## Related Documents

- [Recovery Engine.md](./Recovery%20Engine.md)
- [Native Tracking Engine.md](./Native%20Tracking%20Engine.md)
- [../docs/10 Success Metrics.md](../docs/10%20Success%20Metrics.md)
- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
