# MileRecover User Pain Points

**Status:** Research  
**Last Updated:** July 2026  
**Owner:** Product / UX

---

## Purpose

Document validated user pain points that MileRecover exists to solve. Each pain point maps to philosophy and planned product response.

---

## Pain Point Index

| ID | Pain Point | Severity | MileRecover Response |
|---|---|---|---|
| PP1 | Forgotten trips | High | Native tracking + recovery |
| PP2 | Phantom trips | Critical | Conservative detection, reject flow |
| PP3 | Audit fear | High | Proof Score + honest exports |
| PP4 | Battery drain | High | Battery friendly engine |
| PP5 | Offline failure | Medium-High | Offline first architecture |
| PP6 | CPA rejection | High | Export quality, source metadata |
| PP7 | Personal/business blur | Medium | Split trips, review queue |
| PP8 | Incomplete historical records | High | Recovery Engine (no invention) |
| PP9 | AI distrust | Medium | AI assist labeling |
| PP10 | Permission confusion | Medium | Transparent permission UX |

---

## PP1: Forgotten Trips

**Description:** Users forget to log trips manually or disable tracking and lose weeks of data.

**User voice:** *"I know I drove more than this shows."*

**Root cause:** Tracking disabled, app not opened, manual process abandoned.

**Response:**
- Reliable background tracking
- Gap visibility — **every work mile accounted for** means showing what's missing
- Recovery suggestions from calendar/odometer/import

**Not:** Estimating missing miles from averages.

---

## PP2: Phantom Trips

**Description:** Apps log trips that didn't happen or misattribute movement.

**User voice:** *"It logged my dog walk as a business trip."*

**Root cause:** Over-aggressive auto-detection, GPS drift, passenger in car.

**Response:**
- Higher detection threshold (**trust over automation**)
- Easy reject in detail view
- Phantom trip rate as key metric

---

## PP3: Audit Fear

**Description:** Users fear IRS scrutiny and don't trust their own logs.

**User voice:** *"What if I get audited and this doesn't hold up?"*

**Root cause:** No confidence framework; apps optimize volume.

**Response:**
- Proof Score with breakdown
- Export metadata with sources
- Copy and UX that reduce anxiety (see User Psychology)

---

## PP4: Battery Drain

**Description:** Continuous GPS kills battery; users uninstall or disable.

**User voice:** *"My phone was dead by noon."*

**Response:**
- Adaptive sampling in Native Tracking Engine
- Battery impact in settings
- Pause/resume without guilt UX

---

## PP5: Offline Failure

**Description:** Apps lose data or block features without connectivity.

**User voice:** *"Construction sites have no signal — app was useless."*

**Response:**
- Local-first SQLite
- Full review and export offline
- Sync status transparency

---

## PP6: CPA Rejection

**Description:** Exported logs require heavy CPA correction.

**User voice:** *"My accountant made me redo the whole thing."*

**Response:**
- CPA-validated export formats (beta panel)
- Exclude pending trips by default
- Source and Proof Score in metadata

---

## PP7: Personal/Business Blur

**Description:** Mixed-purpose trips and irregular schedules cause classification fatigue.

**User voice:** *"I stopped classifying — too many trips."*

**Response:**
- Fast swipe review
- Trip splitting
- Batch confirm only above score threshold

---

## PP8: Incomplete Historical Records

**Description:** Users arrive at tax season with partial year data.

**User voice:** *"I need to reconstruct January through March."*

**Response:**
- Recovery Engine with explicit user acceptance
- Competitor import
- Odometer period reconstruction
- **Never invent mileage**

---

## PP9: AI Distrust

**Description:** Users uncomfortable with AI labeling business purpose or creating entries.

**User voice:** *"I don't want an app guessing my clients."*

**Response:**
- AI labeled as suggestion only
- User edit required for export
- Opt-out of AI features

---

## PP10: Permission Confusion

**Description:** Users don't understand Always vs When In Use location permissions.

**User voice:** *"Why does it need to always track me?"*

**Response:**
- Pre-permission education screen
- Degradation preview
- Apple HIG aligned copy

---

## Pain Point Priority (MVP)

1. PP2 Phantom trips
2. PP3 Audit fear
3. PP4 Battery drain
4. PP5 Offline failure
5. PP1 Forgotten trips

---

## Validation Plan

- [ ] 20 user interviews (beta recruitment)
- [ ] Pain point ranking survey
- [ ] CPA export rework baseline study

See [../planning/Beta Testing.md](../planning/Beta%20Testing.md).

---

## Related Documents

- [../docs/05 User Personas.md](../docs/05%20User%20Personas.md)
- [../docs/06 User Psychology.md](../docs/06%20User%20Psychology.md)
- [Competitor Reviews.md](./Competitor%20Reviews.md)
