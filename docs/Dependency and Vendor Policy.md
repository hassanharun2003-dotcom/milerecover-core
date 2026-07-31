# Dependency and Vendor Policy

**Status:** Phase 0 — active when dependencies are introduced  
**Last Updated:** July 2026  
**Owner:** Engineering / Security

Phase 0 has **no production dependencies installed**. This policy applies when packages are added.

---

## Policy

No dependency is added merely for convenience. Each dependency must pass evaluation and PR review.

---

## Required evaluation

| Criterion | Question |
|---|---|
| Maintenance | Is the project actively maintained? Last release? Issue responsiveness? |
| Security | Known CVE history? Security advisories process? |
| License | Compatible with commercial mobile app and backend? |
| Bundle / runtime impact | Mobile size, startup, memory, backend cold start |
| Platform support | iOS, Android, Node versions we target |
| Exit strategy | Can we remove or replace it in <2 sprints? |
| Offline behavior | Does it break offline-first paths? |
| Data handling | What data leaves the device or enters logs? |
| Vendor lock-in | Proprietary formats, hosted-only features? |
| Testing burden | Can we mock it in CI? |

---

## Rules

- Pin exact versions or use lockfile discipline once installation begins.
- Renovation/update automation — select in a future ADR.
- **No abandoned native tracking packages** for core capture.
- **No SDK may receive exact coordinates** unless required for maps/display and approved.
- **No analytics SDK receives raw location data.**
- **No AI SDK in the mobile capture path.**
- Native and server SDKs require **privacy review** before merge.
- Vendor trials (maps, crash, analytics, entitlements) **do not imply architecture approval** — prototype + ADR required to lock.

---

## Vendor evaluation template

Copy for PR or ADR appendix:

```markdown
### Vendor: [name]
**Category:** maps | crash | analytics | entitlements | other
**Phase / prototype:** e.g. Prototype F

| Criterion | Assessment |
|---|---|
| Maintenance | |
| Security | |
| License | |
| Offline | |
| Data sent | |
| Lock-in risk | |
| Cost model | |
| Decision | trial | reject | accept with ADR |
```

---

## Prohibited without ADR

- Replacing native tracking with JS-only location libraries
- Server-required capture
- Microservice split at launch
- Web billing SDK (launch uses App Store / Google Play only)

---

## Related documents

- [Engineering Principles.md](./Engineering%20Principles.md)
- [Synthetic Test Data Policy.md](./Synthetic%20Test%20Data%20Policy.md)
- [Technical Implementation Plan.md](../planning/Technical%20Implementation%20Plan.md) §3
