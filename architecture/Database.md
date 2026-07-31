# MileRecover Database Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Engineering

---

## Overview

MileRecover uses a **local-first SQLite database** on mobile and **PostgreSQL** in the cloud, synchronized via delta sync with deterministic conflict resolution.

**Offline first:** Local DB is authoritative during capture; cloud is backup, compute, and multi-device sync.

---

## Local Database (Mobile)

**Engine:** SQLite via WatermelonDB (planned)

### Core Tables

#### `trips`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Client-generated |
| status | enum | draft, pending, confirmed, personal, rejected |
| source | enum | auto, manual, recovered, imported |
| start_at | datetime | |
| end_at | datetime | |
| distance_meters | decimal | |
| distance_source | enum | gps, odometer, manual |
| purpose | text | nullable until business confirm |
| proof_score | int | 0–100 |
| proof_factors | json | breakdown |
| detection_confidence | float | auto trips only |
| flags | json | gap, teleport, incomplete, ai_assisted |
| user_confirmed_at | datetime | |
| created_at | datetime | |
| updated_at | datetime | |
| synced_at | datetime | nullable |
| _status | sync | created, updated, deleted |

#### `location_samples`
| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| trip_id | UUID | FK nullable until assigned |
| batch_id | UUID | groups samples into detection session |
| lat | decimal | encrypted at rest |
| lng | decimal | |
| accuracy_m | float | |
| speed_mps | float | |
| recorded_at | datetime | |
| deleted_at | datetime | retention purge |

#### `recovery_suggestions`
| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| gap_period_start | date | |
| gap_period_end | date | |
| suggestion_type | enum | calendar, import, odometer, gap_only |
| payload | json | evidence refs, no trip data |
| status | enum | pending, accepted, dismissed |
| created_at | datetime | |

#### `audit_log` (append-only)
| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| entity_type | text | trip, suggestion, export |
| entity_id | UUID | |
| action | text | confirm, reject, edit, sync |
| metadata | json | |
| created_at | datetime | |

#### `sync_metadata`
| Column | Type | Notes |
|---|---|---|
| last_sync_cursor | text | |
| device_id | UUID | |
| schema_version | int | |

---

## Cloud Database (PostgreSQL)

Mirrors trip entities with additional:

#### `users`
- id, email, auth_provider, subscription_tier, created_at

#### `devices`
- id, user_id, platform, app_version, last_seen

#### `trips` (server)
- Same core fields + `user_id`, `device_id`, `server_version`
- PostGIS `path` column (optional simplified linestring)
- Raw samples in separate `location_samples` partition by user_id

#### `recovery_suggestions`
- Server-computed suggestions (H1)

#### `ai_interactions`
- Audit trail per AI Architecture

#### `exports`
- export_id, user_id, period, format, s3_key, created_at

---

## Indexing Strategy

**Local:**
- `trips(status, start_at)` — review queue
- `trips(start_at)` — period queries
- `location_samples(batch_id, recorded_at)`

**Server:**
- `trips(user_id, start_at DESC)`
- `location_samples(user_id, trip_id)` partitioned
- GIST index on `path` for spatial queries (H2)

---

## Sync Strategy

### Mutation Log
Client pushes ordered mutations:
```json
{ "op": "update", "entity": "trip", "id": "...", "fields": {...}, "client_version": 3 }
```

### Conflict Resolution

| Scenario | Rule |
|---|---|
| Same trip edited on two devices | Latest `updated_at` wins; loser gets conflict notification |
| Trip deleted on A, edited on B | Delete wins if deleted_at > edit |
| Confirm on A, reject on B | User conflict UI — **trust over automation** |
| Server rejects invalid trip | Client quarantines, user notified |

### Sync Cadence
- Background: every 15 min when online + on app foreground
- Manual: pull-to-refresh
- Large backfill: chunked by month

---

## Migrations

- Schema version in `sync_metadata`
- WatermelonDB migrations on client
- Flyway/Liquibase on server
- Backward compatible one version minimum

---

## Retention & Deletion

| Data | Default Retention |
|---|---|
| Trips | Until user deletes |
| Location samples | 90 days post-trip |
| Audit log | 7 years (configurable) |
| AI interactions | 1 year |
| Deleted user | 30-day soft delete → hard purge |

GDPR/CCPA delete: cascade all user partitions.

---

## Encryption

- Local: SQLCipher or field-level AES for lat/lng
- Server: RDS encryption at rest, TLS in transit
- Keys: device keystore + server KMS

See [Security.md](./Security.md).

---

## Related Documents

- [Offline First.md](./Offline%20First.md)
- [API.md](./API.md)
- [Backend.md](./Backend.md)
