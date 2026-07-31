# MileRecover Data Model

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Engineering  
**Companion:** [Database.md](./Database.md) (storage and sync implementation)

---

## Purpose

This document defines MileRecover's **conceptual data model** — entities, relationships, lifecycles, ownership, mutability, and trust rules.

It is not a schema. No SQL. Implementation mapping lives in [Database.md](./Database.md).

Philosophy: **Never invent mileage**, **offline first**, **trust over automation**.

---

## Model Overview

```
User
 ├── Subscription
 ├── Business (profile)
 ├── Vehicle(s)                    [H2+ primary use; MVP: implicit single vehicle]
 ├── Device(s)
 │
 ├── Trip ─────────────────────┐
 │    ├── Classification       │
 │    ├── Place (start/end)      │
 │    ├── Evidence item(s)     │
 │    ├── Odometer reading(s)  │
 │    └── Raw tracking event(s)│
 │                             │
 ├── Recovery suggestion        │
 ├── Report (export)            │
 └── Audit event (all mutations)┘
```

---

## Entity Definitions

### User

**Description:** Account holder — self-employed professional using MileRecover.

| Attribute | Notes |
|---|---|
| Ownership | User owns all child entities |
| Lifecycle | `active` → `deletion_pending` → `purged` (30-day window) |
| Mutability | Profile editable; id immutable |
| MVP | Required for Sprint 3 auth; Sprint 1 uses implicit local user |

**Trust rules:**
- Deletion cascades per [Security.md](./Security.md)
- Export and delete rights ([04 Trust Rules.md](../docs/04%20Trust%20Rules.md) C1)

**Relationships:** 1:N Trip, Vehicle, Device, Report, Recovery suggestion

---

### Business

**Description:** User's business context for classification and export — not a separate legal entity system.

| Attribute | Notes |
|---|---|
| Fields (conceptual) | Name, industry template, default purpose patterns |
| Lifecycle | Created with account; archived if user deletes |
| Mutability | User-editable |
| MVP | Optional in MVP; single implicit business per user |

**Trust rules:**
- Business name appears on exports; never auto-generated from AI alone
- Industry templates suggest purposes only ([AI Architecture.md](./AI%20Architecture.md))

**Relationships:** N:1 User; referenced by Classification and Report

---

### Vehicle

**Description:** A vehicle used for business travel. MVP assumes **one implicit vehicle**; entity defined for H2 multi-vehicle.

| Attribute | Notes |
|---|---|
| Fields | Label, odometer baseline (optional) |
| Lifecycle | `active` → `archived` |
| Mutability | User-editable |
| MVP | Not user-facing in Sprint 1–3; trips omit vehicle_id or use default |

**Trust rules:**
- Mileage attributed to one vehicle per trip in multi-vehicle mode (H2)
- No automatic vehicle inference from Bluetooth in MVP

**Relationships:** N:1 User; 1:N Trip, Odometer reading

---

### Trip

**Description:** A single travel session — the core mileage record.

| Attribute | Notes |
|---|---|
| Source | `auto_detected`, `manual`, `recovered`, `imported` |
| Status | `draft` → `pending` → `confirmed` \| `personal` \| `rejected` |
| Distance | From GPS path, odometer, or manual attestation |
| Proof Score | 0–100, computed; stored with factor breakdown |

**Lifecycle:**

```
[Engine] → draft (auto)     ─┐
[User manual entry] → pending ─┤→ user review → confirmed | personal | rejected
[Recovery accept] → pending  ─┘
```

**Mutability:**
- User may edit while not exported-with-lock (edits recalculate Proof Score)
- Rejected trips soft-deleted; restorable 30 days
- `confirmed` trips append Audit event on edit

**Trust rules (binding):**
- **A1:** Must link to Raw tracking events (auto) OR user attestation (manual) OR accepted Recovery suggestion with evidence
- **A3:** Rejected cannot reappear without restore
- **A4:** Distance integrity sources only
- **A5:** Business classification requires user confirmation or opt-in auto-rule
- **B4:** Pending excluded from confirmed business totals

**Relationships:** N:1 User; 1:N Raw tracking event, Evidence item; 1:1 Classification (current); N:1 Place (start), Place (end)

See [Proof Score.md](./Proof%20Score.md), [Data Model lifecycle diagram in Database.md](./Database.md).

---

### Raw tracking event

**Description:** Immutable sensor evidence — atomic location/motion sample or bounded batch.

| Attribute | Notes |
|---|---|
| Fields | Coordinates, accuracy, speed, heading, motion type, recorded_at, batch_id |
| Lifecycle | `captured` → `linked` (to trip) → `purged` (retention) |
| Mutability | **Immutable after write** — corrections via new events, never edit |
| Storage | Encrypted at rest; native write path ([DEC-002](../docs/Decision%20Log.md)) |

**Trust rules:**
- Never deleted while linked to non-rejected trip within retention window
- Gaps in batches produce `gap` flag on trip — not interpolated mileage
- Not exposed in consumer export (trip-level summary only); available in audit package (Pro+)

**Relationships:** N:1 Trip (nullable until session finalized); N:1 engine Session

**Note:** [Database.md](./Database.md) table `location_samples` implements this entity.

---

### Place

**Description:** Resolved or user-entered location for trip start/end.

| Attribute | Notes |
|---|---|
| Fields | Address text, coordinates (optional), geocode source, label |
| Lifecycle | Created with trip; deduplicated by hash where possible |
| Mutability | User may edit on trip; edit creates Audit event |

**Trust rules:**
- Geocoded places are approximate — distance from GPS path, not geocode straight-line, for auto trips
- AI may suggest label; user confirms ([04 Trust Rules.md](../docs/04%20Trust%20Rules.md) D3)

**Relationships:** Referenced by Trip (start/end)

---

### Classification

**Description:** Business vs personal determination for a trip.

| Attribute | Notes |
|---|---|
| Value | `business`, `personal`, `unclassified` |
| Attestation | `user_confirmed`, `auto_rule`, `pending` |
| Purpose | Business purpose text (required for business export) |

**Lifecycle:** Created at trip draft; updated on user review; locked at export snapshot (historical export retains values at export time).

**Mutability:** User always overrides. Auto-rule requires documented opt-in ([Interaction Rules.md](../design/Interaction%20Rules.md)).

**Trust rules:**
- **A5:** Export business miles require attestation
- Personal trips remain in log but excluded from business totals

**Relationships:** 1:1 Trip (current classification); history in Audit event

---

### Recovery suggestion

**Description:** Proposed entry from gap analysis, calendar, import, or odometer — **not a trip**.

| Attribute | Notes |
|---|---|
| Type | `gap_only`, `calendar`, `import`, `odometer` |
| Status | `pending` → `accepted` \| `dismissed` |
| Payload | Evidence references only — no exportable distance until accepted |

**Lifecycle:**
```
Generated → pending → [user accept] → creates Trip (source: recovered)
                   → [user dismiss] → archived
```

**Mutability:** Immutable after dismiss; accept creates Trip via explicit action ([DEC-004](../docs/Decision%20Log.md)).

**Trust rules:**
- **A2:** No silent gap fill
- **Never invent mileage:** calendar/import alone insufficient
- Accepted trips start with lower Proof Score base ([Recovery Engine.md](./Recovery%20Engine.md))

**Relationships:** N:1 User; accept creates 1 Trip

---

### Evidence item

**Description:** Supporting artifact linked to a trip or suggestion.

| Attribute | Notes |
|---|---|
| Types | `odometer_photo`, `receipt`, `import_row`, `calendar_event_ref`, `note` |
| Storage | Local file or structured ref; cloud sync optional |

**Lifecycle:** `attached` → `linked` → deleted with parent or retention purge

**Mutability:** User may detach before export; attachment increases Proof Score

**Trust rules:**
- OCR output is draft until user confirms
- Evidence alone does not create trip — user action required

**Relationships:** N:1 Trip or Recovery suggestion

---

### Odometer reading

**Description:** Start/end odometer values for distance verification.

| Attribute | Notes |
|---|---|
| Fields | Value, photo ref (optional), captured_at, user_confirmed |
| Lifecycle | `draft` → `confirmed` |
| Mutability | User-editable until confirmed |

**Trust rules:**
- Computed delta replaces GPS distance in export when confirmed
- Photo increases Proof Score; photo without confirm = draft only

**Relationships:** N:1 Trip or Vehicle; may link Evidence item (photo)

---

### Report

**Description:** Generated export artifact (PDF, CSV, JSON).

| Attribute | Notes |
|---|---|
| Fields | Period, format, trip snapshot ids, generation metadata, sync_status |
| Lifecycle | `generated` → `shared` → retained per policy |
| Mutability | **Immutable** after generation — new export = new Report |

**Trust rules:**
- **B3:** Includes source, Proof Score, gaps, AI flags
- **B4:** Pending trips excluded by default
- Snapshot preserves values at generation time

**Relationships:** N:1 User; references N Trips (snapshot)

---

### Subscription

**Description:** User's plan state for feature gating.

| Attribute | Notes |
|---|---|
| Tiers | `free`, `pro`, `pro_plus` ([09 Pricing.md](../docs/09%20Pricing.md)) |
| Lifecycle | Managed via RevenueCat; `active`, `expired`, `grace` |
| Mutability | Server-managed; client cache read-only |

**Trust rules:**
- Honesty features (gap visibility, confidence) never paywalled ([09 Pricing.md](../docs/09%20Pricing.md))
- Export scope gated; not trip capture integrity

**Relationships:** 1:1 User

---

### Audit event

**Description:** Append-only log of mutations for trust and support.

| Attribute | Notes |
|---|---|
| Fields | entity_type, entity_id, action, actor, metadata, timestamp |
| Lifecycle | Append-only; retained 7 years default |
| Mutability | **Immutable** |

**Actions (examples):** `trip.confirmed`, `trip.rejected`, `trip.edited`, `classification.changed`, `export.generated`, `recovery.accepted`, `sync.conflict_resolved`

**Trust rules:**
- Required for all trip status transitions
- AI interactions logged separately ([AI Architecture.md](./AI%20Architecture.md))

**Relationships:** N:1 User; references any entity

**Note:** [Database.md](./Database.md) table `audit_log` implements this entity.

---

## Entity Summary Table

| Entity | Owner | Mutable? | Export-facing? | MVP |
|---|---|---|---|---|
| User | Self | Profile yes | Name on report | Sprint 3 |
| Business | User | Yes | Yes | Optional |
| Vehicle | User | Yes | H2 | Implicit |
| Trip | User | Yes (with audit) | Yes | Sprint 1 (draft) |
| Raw tracking event | System | **No** | Metadata only | Sprint 1 |
| Place | User/System | Yes | Yes | Sprint 2 |
| Classification | User | Yes | Yes | Sprint 2 |
| Recovery suggestion | System | Dismiss only | No | H1 |
| Evidence item | User | Attach/detach | Optional Pro+ | H1 |
| Odometer reading | User | Until confirmed | Yes | Sprint 2 manual |
| Report | System | **No** (immutable) | Yes | Sprint 3 |
| Subscription | System | Server | No | Sprint 3 |
| Audit event | System | **No** | Pro+ audit pack | Sprint 2 |

---

## Trust Rules Cross-Reference

| Rule | Entities affected |
|---|---|
| A1 No phantom trips | Trip, Raw tracking event |
| A2 No silent gap fill | Recovery suggestion, Trip |
| A4 Distance integrity | Trip, Odometer reading |
| A5 Classification attestation | Classification, Trip |
| B3 Export honesty | Report, Trip snapshot |
| D1 AI cannot create trips | Recovery suggestion, Trip, Classification |

Full rules: [04 Trust Rules.md](../docs/04%20Trust%20Rules.md).

---

## Sync and Ownership

| Location | Authoritative for |
|---|---|
| Device SQLite | Capture, review, export generation (offline) |
| Cloud PostgreSQL | Backup, multi-device merge, subscription |

Conflict rules: [Offline First.md](./Offline%20First.md), [Database.md](./Database.md).

Client-generated UUIDs for Trip and events — never server-assigned for capture path.

---

## Related Documents

- [Database.md](./Database.md)
- [Tracking State Machine.md](./Tracking%20State%20Machine.md)
- [Recovery Engine.md](./Recovery%20Engine.md)
- [Proof Score.md](./Proof%20Score.md)
- [Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md)
