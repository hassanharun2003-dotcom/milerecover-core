# Package 3 — Domain State Definitions

Implemented in `packages/domain/src/`.

## Recovery candidate (`RecoveryCandidateState`)

| State | Meaning |
|-------|---------|
| `detected` | Engine flagged a gap; not yet shown to user |
| `inferred` | Model proposed times/distance from evidence |
| `unresolved` | Presented; awaiting user action |
| `user_confirmed` | User accepted as a trip |
| `user_corrected` | User accepted with edits |
| `rejected` | User dismissed ("Not this time") |
| — | Terminal states do not transition further |

Low-confidence confirm blocked until review (`applyRecoveryTransition`).

## Trip record (`TripRecordStatus` × `TripClassification`)

| Status | Business meaning |
|--------|------------------|
| `draft` | Auto capture in progress |
| `pending` | Needs review/classification |
| `confirmed` | Business mileage confirmed |
| `personal` | Personal mileage |
| `rejected` | Not a trip / dismissed |

## Protection Health (`ProtectionHealthLevel`)

| Level | User label |
|-------|------------|
| `protected` | Protection active |
| `attention` | Needs attention |
| `at_risk` | At risk |
| `limited` | Limited protection |

Formula: `architecture/Package 3 Protection Health.md`

## Review items (`ReviewItemKind`)

Priority order: `possible_missing_trip` > `conflicted_trip` > `low_confidence_trip` > `classification_needed`

## Proof completeness

| Value | When |
|-------|------|
| `complete` | No open review; data fresh |
| `needs_review` | Unresolved review count > 0 |
| `insufficient_data` | Stale snapshot |
