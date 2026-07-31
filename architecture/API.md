# MileRecover API Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Backend Engineering

---

## Overview

MileRecover API provides **authenticated sync, user management, bounded AI assist, and recovery suggestions**. It is REST-first with JSON payloads; binary uploads via pre-signed URLs.

**Never invent mileage:** Trip creation endpoints validate evidence requirements server-side.

---

## Base URL

```
Production:  https://api.milerecover.com/v1
Staging:     https://api.staging.milerecover.com/v1
```

---

## Authentication

```
Authorization: Bearer <access_token>
X-Device-Id: <device_uuid>
X-App-Version: 1.0.0
X-Platform: ios | android
```

Token refresh: `POST /auth/refresh`

---

## Core Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Email registration |
| POST | `/auth/login` | Login |
| POST | `/auth/oauth/apple` | Apple Sign In |
| POST | `/auth/oauth/google` | Google Sign In |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/logout` | Invalidate refresh |

### Sync

| Method | Path | Description |
|---|---|---|
| POST | `/sync/push` | Batch mutation upload |
| GET | `/sync/pull?cursor=` | Delta download |
| GET | `/sync/status` | Queue health |

**Push payload:**
```json
{
  "mutations": [
    {
      "id": "client-mutation-uuid",
      "entity": "trip",
      "operation": "create|update|delete",
      "data": { ... },
      "client_version": 1,
      "client_updated_at": "2026-03-15T10:00:00Z"
    }
  ]
}
```

**Pull response:**
```json
{
  "cursor": "new-cursor",
  "changes": [ ... ],
  "server_time": "..."
}
```

### Trips (Direct — optional, sync preferred)

| Method | Path | Description |
|---|---|---|
| GET | `/trips?from=&to=&status=` | List (backup/debug) |
| GET | `/trips/{id}` | Detail |
| POST | `/trips/validate` | Pre-flight Trust Rules check |

### Recovery

| Method | Path | Description |
|---|---|---|
| GET | `/recovery/suggestions` | Pending suggestions |
| POST | `/recovery/suggestions/{id}/accept` | Create trip from suggestion |
| POST | `/recovery/suggestions/{id}/dismiss` | Archive suggestion |

### AI (Assist Only)

| Method | Path | Description |
|---|---|---|
| POST | `/ai/purpose/suggest` | Purpose text suggestion |
| POST | `/ai/ocr/odometer` | OCR fallback (image via presigned URL) |

**Purpose suggest request:**
```json
{
  "trip_id": "...",
  "destination_name": "123 Main St",
  "destination_type": "residential",
  "historical_context": true
}
```

**Response:**
```json
{
  "suggestion": "Client property showing",
  "confidence": 0.78,
  "model_version": "purpose-v1",
  "disclaimer": "Suggestion only — confirm before export"
}
```

### Export

| Method | Path | Description |
|---|---|---|
| POST | `/exports` | Server-side export (H2) |
| GET | `/exports/{id}` | Download link |

MVP: client-side export primary.

### User

| Method | Path | Description |
|---|---|---|
| GET | `/user/me` | Profile + subscription |
| PATCH | `/user/me` | Settings |
| POST | `/user/data-export` | GDPR export |
| DELETE | `/user/me` | Account deletion |

### Subscriptions

| Method | Path | Description |
|---|---|---|
| POST | `/subscriptions/verify` | App Store / Play receipt validation |
| GET | `/subscriptions/status` | Current tier |

---

## Error Format

```json
{
  "error": {
    "code": "TRUST_RULE_VIOLATION",
    "message": "Auto trip requires location_batch_ids",
    "details": { "rule": "A1" }
  }
}
```

### Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `TRUST_RULE_VIOLATION` | 422 | Server rejected trip |
| `SYNC_CONFLICT` | 409 | Version conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `SUBSCRIPTION_REQUIRED` | 402 | Feature gated |

---

## Rate Limits

| Tier | Limit |
|---|---|
| Authenticated | 100 req/min |
| AI endpoints | 20 req/min |
| Sync push | 10 req/min |

---

## Versioning

- URL path versioning (`/v1`)
- Breaking changes → `/v2` with 6-month deprecation
- `X-Schema-Version` header for sync payload evolution

---

## Webhooks (H2)

| Event | Use |
|---|---|
| `export.completed` | Email delivery |
| `subscription.updated` | RevenueCat sync |

---

## OpenAPI

Full OpenAPI 3.1 spec to be generated at implementation time in `/api/openapi.yaml`.

---

## Related Documents

- [Backend.md](./Backend.md)
- [Security.md](./Security.md)
- [Offline First.md](./Offline%20First.md)
- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
