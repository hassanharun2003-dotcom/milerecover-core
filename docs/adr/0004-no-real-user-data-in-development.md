# ADR-0004 — No real user data in development

**Status:** Accepted  
**Date:** 2026-07-31  
**Owners:** Engineering, Security, QA

## Decision scope

Development, testing, fixtures, CI, and prototype data handling.

## Context

MileRecover processes precise location and financial-evidence records. Using real customer commutes, calendar entries, or imports in Git or shared fixtures creates privacy, compliance, and trust risk.

## Decision

1. **Synthetic data only** in development, automated tests, golden files, and ordinary fixtures.

2. **Prohibited in Git and default fixtures:**
   - Exact real routes or customer coordinates
   - Home or workplace addresses of team or customers
   - Raw calendar title/body from real accounts
   - Real client or business names from users
   - Real imported competitor/customer CSV files (unless under authorized internal validation protocol with access controls)
   - Authentication tokens, receipts, billing payloads
   - Unsanitized beta/production diagnostic bundles

3. **Sanitized production diagnostics** may be used for support reproduction only through a **controlled, approved** process — never as default test fixtures.

4. CI sensitive-file check scans **filenames only** — does not replace secret scanning or human review.

5. Engineers and Cursor agents must not commit `.env`, keystores, local databases, or export PDFs containing real trips.

## Alternatives considered

| Option | Outcome |
|---|---|
| Anonymized production subset in dev | Rejected — re-identification and policy risk |
| Real drives in private branches | Rejected — leak risk |

## Consequences

- **Positive:** Safer collaboration; clearer QA fixtures
- **Negative:** Upfront investment in synthetic route generators
- **Follow-up:** [Synthetic Test Data Policy.md](../Synthetic%20Test%20Data%20Policy.md)

## Validation evidence

`check:sensitive-files` in CI; PR template confirmations.

## Security / privacy impact

Primary privacy control for pre-launch engineering.

## Offline impact

Synthetic fixtures must support offline test scenarios.

## Migration or rollback

Policy exceptions require Security + Engineering approval and documented protocol.

## Related product decisions

DEC-006 (no sale of location data), Trust Rules E-series

## Related documents

- [Synthetic Test Data Policy.md](../Synthetic%20Test%20Data%20Policy.md)
- [SECURITY.md](../../SECURITY.md)
