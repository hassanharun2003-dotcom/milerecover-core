# MileRecover Trust Rules

**Status:** Foundational — Binding  
**Last Updated:** July 2026  
**Owner:** Founding Team / Legal Review Pending

---

## Purpose

Trust Rules translate MileRecover's philosophy into **enforceable product behavior**. They define what the product may, must, and must never do regarding user data, mileage records, and AI involvement.

These rules apply to all surfaces: mobile app, backend, exports, marketing, and support.

---

## Foundational Commitment

> MileRecover earns trust by being honest about what it knows, what it doesn't know, and what it guessed.

**Trust over automation.** **Never invent mileage.** **AI assists but never replaces evidence.**

---

## Category A: Mileage Integrity

### A1 — No Phantom Trips
The system SHALL NOT create a trip record without at least one of:
- GPS/sensor evidence meeting minimum confidence threshold
- User manual entry with required fields (start, end, date, purpose attestation)
- Imported evidence from approved source (odometer photo, third-party log) with user confirmation

### A2 — No Silent Gap Fill
The system SHALL NOT populate missing days or distances without explicit user action on each suggested entry.

### A3 — Rejection Is Permanent Unless Restored
User-rejected trips SHALL NOT reappear in the log unless the user explicitly restores them.

### A4 — Distance Integrity
Reported distances SHALL derive from:
- Recorded GPS path (computed per documented algorithm), OR
- User-entered odometer readings (start/end), OR
- User-entered manual distance with attestation flag

Rounding SHALL NOT increase distance in export formats.

### A5 — Classification Requires Attestation
Business classification in official exports SHALL require either:
- User confirmation, OR
- Rule-based auto-classification with documented rules AND user opt-in to auto-confirm above threshold

---

## Category B: Transparency

### B1 — Confidence Visibility
Every auto-detected trip SHALL display a confidence indicator and link to Proof Score factors.

### B2 — AI Disclosure
Any AI-influenced classification, summary, or suggestion SHALL be labeled as such in the UI and in audit metadata.

### B3 — Export Honesty
Exports SHALL include:
- Trip source (auto-detected, manual, recovered, imported)
- Proof Score at time of export
- Whether AI assisted classification
- Gaps explicitly marked as unaccounted

### B4 — No Misleading Totals
Dashboard totals SHALL distinguish:
- Confirmed business miles
- Pending review miles
- Personal miles (if shown)
- Unaccounted period time

---

## Category C: User Control

### C1 — Delete and Export Rights
Users SHALL be able to export and delete their data at any time. Deletion SHALL propagate per documented retention policy.

### C2 — Automation Dial
Users SHALL control automation level: conservative (default), balanced, custom. Conservative mode SHALL require review for all auto-detected trips.

### C3 — Override Always Available
Users SHALL be able to edit, reclassify, split, merge, or delete any trip regardless of source.

### C4 — Permission Honesty
The app SHALL explain why each permission is requested and what degrades if declined. No permission SHALL be required beyond what is needed for declared functionality.

---

## Category D: AI Boundaries

### D1 — AI Cannot Create Exportable Trips Alone
LLM or ML models SHALL NOT be the sole source of trip existence. AI may suggest; user or sensor must confirm.

### D2 — AI Reasoning Is Retained
AI classification suggestions SHALL store model version, input features, and output for audit—not displayed to IRS, but available to user.

### D3 — No Generative Business Purposes
The system SHALL NOT invent business purpose narratives. AI may suggest based on user history; user must confirm or edit.

### D4 — Fallback on AI Failure
If AI services are unavailable (offline, outage), core tracking and manual workflows SHALL continue unaffected.

---

## Category E: Data & Privacy

### E1 — Local-First Capture
Trip capture SHALL write to local storage before cloud sync. Network failure SHALL NOT block capture.

### E2 — Minimum Necessary Collection
Location data SHALL be collected at minimum frequency required for stated accuracy tier. **Battery friendly** collection is mandatory.

### E3 — Encryption
Location and trip data SHALL be encrypted at rest (device and server) and in transit.

### E4 — No Data Sale
MileRecover SHALL NOT sell user location or trip data to third parties.

---

## Category F: Marketing & Communications

### F1 — No Inflated Claims
Marketing SHALL NOT claim automation rates, accuracy percentages, or audit outcomes without current substantiation.

### F2 — No "Maximize Your Deduction"
Messaging SHALL focus on **accounting for legitimate miles**, not maximizing deductions.

### F3 — Competitor Honesty
Comparisons SHALL be factual and verifiable.

---

## Violation Response

| Severity | Example | Response |
|---|---|---|
| Critical | Phantom trip in export | Hotfix, user notification, incident review |
| High | AI-created trip without confirmation | Disable feature, patch, postmortem |
| Medium | Missing confidence indicator | Sprint fix |
| Low | Copy inconsistency | Content fix |

---

## Review Cadence

- **Per feature:** Trust Rules checklist in PRD
- **Quarterly:** Full rules audit against shipped behavior
- **Per release:** QA sign-off on Categories A, B, D

---

## Related Documents

- [03 Core Principles.md](./03%20Core%20Principles.md)
- [../architecture/Security.md](../architecture/Security.md)
- [../architecture/AI Architecture.md](../architecture/AI%20Architecture.md)
- [../design/Interaction Rules.md](../design/Interaction%20Rules.md)
