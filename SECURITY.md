# Security Policy

**Status:** Phase 0 — internal engineering policy  
**Last Updated:** July 2026

---

## Reporting a Vulnerability

MileRecover is pre-launch. When a supported reporting channel is published, use it for security issues.

**Until then:** Contact the founding team through your internal security escalation path. Do **not** post private vulnerability details in public GitHub issues, pull requests, or discussion threads.

For incident response after launch, see [architecture/Incident Response Runbook.md](architecture/Incident%20Response%20Runbook.md).

---

## Scope

This repository contains product documentation, architecture, planning, and Phase 0 engineering foundations. It must **never** contain:

- Secrets, API keys, tokens, or credentials
- Real user routes or exact GPS coordinates
- Raw calendar content, client names, or user notes
- Real imported customer files
- Unsanitized diagnostic packages from beta or production
- Account or billing data

---

## Secret Handling

- Never commit `.env`, keystores, certificates, provisioning profiles, or private keys
- Use `.env.example` as documentation only — no real values
- Server secrets belong in a managed secrets store in future deployment phases — not Git
- Mobile-embedded keys are **not** confidential; do not rely on them for sensitive data protection
- CI must not print suspected secret contents

---

## Development Data Policy

Development and testing use **synthetic data only**. See [docs/Synthetic Test Data Policy.md](docs/Synthetic%20Test%20Data%20Policy.md).

Prohibited in Git and ordinary fixtures:

- Home addresses or real workplaces
- Real customer locations or private commutes
- Copied calendar events from personal or customer accounts
- Competitor export files unless under an authorized internal validation protocol

Sanitized production diagnostics are a **controlled support artifact**, not development fixture data.

---

## Local Database and Exports

- Local SQLite files must not be committed
- Generated PDF/CSV exports with real user data must not be committed
- Golden export fixtures must use synthetic trips only and be reviewed per synthetic data policy

---

## Dependencies

When dependencies are added (post–Phase 0):

- Record justification per [docs/Dependency and Vendor Policy.md](docs/Dependency%20and%20Vendor%20Policy.md)
- Run dependency scanning in CI when enabled
- Report known vulnerable dependencies before merge

Phase 0 has **no production dependencies installed**.

---

## Responsible Disclosure

A public security contact will be published before external beta. Until then, treat all security reports as confidential within the founding team.

We will not promise bounty rewards beyond approved policy.

---

## Related Documents

- [architecture/Security.md](architecture/Security.md)
- [docs/04 Trust Rules.md](docs/04%20Trust%20Rules.md)
- [docs/Engineering Principles.md](docs/Engineering Principles.md)
- [docs/Synthetic Test Data Policy.md](docs/Synthetic%20Test%20Data%20Policy.md)

---

*Do not weaken trust to ship faster.*
