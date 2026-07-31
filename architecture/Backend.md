# MileRecover Backend Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Backend Engineering

---

## Overview

The MileRecover backend provides **sync, backup, recovery compute, AI assist, and export enhancement**—not primary trip capture. Mobile local DB remains capture source of truth.

Philosophy: **Offline first**, **Never invent mileage**, **AI assists but never replaces evidence**

---

## Service Architecture

```
                    ┌─────────────┐
                    │   CDN/WAF   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │ (Auth, RL)  │
                    └──────┬──────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ Sync Service│  │ User Service│  │ Export Svc  │
  └──────┬──────┘  └─────────────┘  └─────────────┘
         │
  ┌──────▼──────┐  ┌─────────────┐  ┌─────────────┐
  │ Trip Service│  │ Recovery    │  │ AI Service  │
  │ (validate)  │  │ Engine      │  │ (suggest)   │
  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
         └────────────────┼────────────────┘
                          ▼
                 ┌─────────────────┐
                 │ PostgreSQL      │
                 │ + PostGIS       │
                 └─────────────────┘
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
          ┌───────────┐     ┌───────────┐
          │ Redis     │     │ S3        │
          │ (jobs)    │     │ (files)   │
          └───────────┘     └───────────┘
```

---

## Core Services

### API Gateway
- JWT validation
- Rate limiting per user/device
- Request logging (no raw GPS in logs)
- TLS termination

### Sync Service
- Bidirectional delta sync
- Vector clocks or updated_at + device_id conflict detection
- Idempotent mutation application
- See [Offline First.md](./Offline%20First.md)

### Trip Service
- Validates incoming trips against Trust Rules
- **Rejects** trips with source=ai_only
- Stores evidence references (location batch IDs)
- Immutable audit log append

### Recovery Engine (Server)
- Computes suggestions from calendar, imports, gaps
- Outputs `recovery_suggestions` — never auto-promotes to trips
- See [Recovery Engine.md](./Recovery%20Engine.md)

### AI Service
- Purpose classification suggestions
- Anomaly detection
- Cannot POST trips directly — only suggestions table
- See [AI Architecture.md](./AI%20Architecture.md)

### Export Service
- Optional server-side PDF generation (H2)
- MVP: client-side export primary
- Archives exports in S3 with retention policy

### User Service
- Auth (email, Apple, Google)
- Subscription state
- Device registry
- Data deletion orchestration

---

## Data Validation (Server-Side)

Every trip sync mutation validated:

```yaml
required_for_auto_trip:
  - location_batch_ids (min 2 points)
  - computed_distance_meters
  - detection_confidence
  - device_id
  - client_created_at

required_for_manual_trip:
  - user_attestation: true
  - distance_source: odometer | manual | gps_path

rejected:
  - source: ai_generated
  - distance_without_evidence
```

---

## Event Processing

| Event | Handler |
|---|---|
| `trip.synced` | Proof score recalc if factors changed |
| `trip.confirmed` | Update period aggregates |
| `suggestion.generated` | Push notification (if enabled) |
| `user.deleted` | Async purge job |

Queue: Redis + worker processes (or SQS equivalent)

---

## Multi-Tenancy

- Single database, `user_id` row-level isolation
- No cross-user queries
- CPA portal (H2): read-only scoped tokens

---

## Infrastructure (Proposed)

| Component | Provider options |
|---|---|
| Compute | AWS ECS/Fargate or Fly.io |
| Database | AWS RDS PostgreSQL |
| Storage | S3 |
| Secrets | AWS Secrets Manager |
| Monitoring | Datadog or Grafana Cloud |

Region: `us-east-1` primary (US tax product)

---

## Scalability Targets (Year 1)

| Metric | Target |
|---|---|
| Registered users | 100K |
| Daily sync requests | 500K |
| Avg sync payload | <100KB |
| p99 API latency | <500ms |

---

## Related Documents

- [API.md](./API.md)
- [Database.md](./Database.md)
- [Security.md](./Security.md)
- [System Architecture.md](./System%20Architecture.md)
