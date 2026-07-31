# MileRecover Security Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Engineering / Security

---

## Security Mission

MileRecover handles **precise location history** and **financial-evidence records**. Security failures destroy trust faster than any product bug.

Philosophy: **Trust over automation** extends to data handling — users control their evidence.

---

## Threat Model

### Assets
- GPS traces and trip records
- Odometer photos
- Business purpose notes (may reference clients)
- Auth credentials and subscription state
- AI interaction logs

### Threat Actors
- External attackers (API, credential stuffing)
- Malicious insiders (limited access design)
- Device theft/loss
- Third-party SDK supply chain
- Government/legal data requests

### Out of Scope (MVP)
- Nation-state adversaries
- CPA portal multi-tenant isolation (H2)

---

## Authentication

| Method | MVP | Notes |
|---|---|---|
| Email magic link / password | ✓ | bcrypt/argon2 |
| Sign in with Apple | ✓ | Required for iOS |
| Google Sign-In | ✓ | Android parity |
| MFA | H2 | TOTP |

**Tokens:**
- Access JWT: 15 min
- Refresh token: rotating, device-bound
- Stored: Keychain (iOS), EncryptedSharedPreferences (Android)

---

## Authorization

- Row-level: all queries scoped by `user_id`
- Device registration required for sync
- CPA read-only tokens (H2): scoped to single user export window

---

## Encryption

### In Transit
- TLS 1.3 minimum all API
- Certificate pinning in mobile app (production)

### At Rest

| Location | Method |
|---|---|
| Local SQLite | SQLCipher or field-level AES for coordinates |
| Server PostgreSQL | RDS AES-256 |
| S3 objects | SSE-S3 or SSE-KMS |
| Backups | Encrypted, separate KMS key |

### Key Management
- AWS KMS for server keys
- Device keys in Secure Enclave / StrongBox where available
- No keys in source control

---

## Location Data Privacy

Per Trust Rules E2 — **minimum necessary collection**

- Raw samples purged per retention policy
- Telemetry excludes coordinates
- No sale of location data (E4)
- Privacy policy plain language

### User Controls
- Export all data (JSON + CSV)
- Delete account + 30-day purge
- Pause tracking (stops collection immediately)

---

## API Security

- Rate limiting: 100 req/min user, 10 req/min auth
- Input validation on all trip mutations
- Server rejects `source: ai_generated` trips
- OWASP API Top 10 review per release
- WAF on public endpoints

---

## Mobile Security

- Jailbreak/root detection: warn, not block (avoid false positives)
- No sensitive data in logs
- Screenshot allowed (user's data)
- App Transport Security enforced (iOS)
- ProGuard/R8 obfuscation (Android)

---

## Third-Party SDK Policy

**Minimize SDKs.** Each requires:
- Security review
- Data flow documentation
- Privacy nutrition label update

Approved categories: maps, crash reporting (no PII), payments (Stripe)

---

## Incident Response

| Severity | Example | Response Time |
|---|---|---|
| P0 | Location data leak | 1 hour |
| P1 | Auth bypass | 4 hours |
| P2 | Single account compromise | 24 hours |

Runbook: contain → assess → notify (if required) → postmortem

---

## Compliance Roadmap

| Standard | Timeline |
|---|---|
| SOC 2 Type I | Year 1 post-launch |
| GDPR readiness | Launch |
| CCPA | Launch |
| HIPAA | Not targeted (not a BAA product) |

---

## Security Testing

- SAST in CI
- Dependency scanning (Dependabot)
- Annual penetration test pre-launch
- Bug bounty (H2)

---

## Related Documents

- [../docs/04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
- [AI Architecture.md](./AI%20Architecture.md)
- [Database.md](./Database.md)
- [API.md](./API.md)
