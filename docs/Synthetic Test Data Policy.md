# Synthetic Test Data Policy

**Status:** Phase 0 — mandatory for all engineering and QA  
**Last Updated:** July 2026  
**Owner:** Engineering / QA / Security

---

## Policy

All development, automated testing, golden files, and default fixtures use **synthetic data only**.

See ADR-0004.

---

## Allowed

- Generated routes with fictional place names (e.g. "Sample Office A", "Synthetic Client Site")
- Randomized UUIDs and device IDs
- Fabricated business, client, and vehicle names clearly marked synthetic
- Privacy-safe timestamps (fixed epochs or obvious fake dates)
- Hand-authored CSV rows matching competitor **format** without real user content
- Route simulations with coarse grid coordinates not mapping to real addresses

---

## Prohibited

- Home addresses or real workplaces (team or customer)
- Real customer GPS traces or private commutes
- Copied calendar events from personal or customer accounts
- Real client or business names from users
- Real imported competitor files in Git (unless authorized internal validation protocol)
- Production or beta diagnostic bundles in fixtures without sanitization approval
- Authentication tokens, receipts, or billing payloads

---

## Golden files

- Stored under `tooling/fixtures/` or `packages/testing/` when introduced
- Must pass human review for accidental PII
- Version-controlled with hash noted in test docs
- Employee reimbursement and PDF golden outputs use synthetic trips only (Prototype H)

---

## Route simulation principles

- Use simplified polylines — not map-matched real roads tied to identifiable homes
- Prefer grid or obviously fake coordinates (e.g. ocean, null island offset patterns labeled synthetic)
- Document generator script in fixture README

---

## Beta diagnostics

Beta user diagnostics are **not** ordinary fixtures. Sanitized reproduction artifacts require:

1. User consent or internal tester authorization
2. Security review
3. Storage outside public Git (secure internal store)
4. Retention limit and deletion date

---

## Retention and deletion

- Local synthetic DBs: delete when task completes
- Temporary import copies: delete within validation session
- Approved internal validation files: delete per protocol schedule

---

## Related documents

- [SECURITY.md](../SECURITY.md)
- [adr/0004-no-real-user-data-in-development.md](./adr/0004-no-real-user-data-in-development.md)
- [Prototype Governance.md](../planning/Prototype%20Governance.md)
