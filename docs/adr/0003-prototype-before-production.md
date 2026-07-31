# ADR-0003 — Prototype before production commitment

**Status:** Accepted  
**Date:** 2026-07-31  
**Owners:** Engineering / Architecture

## Decision scope

When and how disposable validation prototypes (TIP §25 A–J) must precede production implementation.

## Context

Background tracking, encrypted local storage, sync conflicts, entitlements, imports, exports, battery impact, and recovery precision are high-risk. Committing to libraries or architectures without measured evidence risks trust violations and rework.

## Decision

1. **High-risk systems require a written prototype brief** in `prototypes/<name>/` before production code in `apps/` or `packages/`.

2. Each prototype must define: question, hypothesis, minimal scope, success/failure criteria, devices, data collected, privacy restrictions, expected artifact, disposition (discard / archive / promote).

3. **Prototype code is discarded by default.** Promotion into `apps/` or `packages/` requires:
   - Successful exit criteria met or accepted risk documented
   - ADR or TIP update if architecture changes
   - Engineering lead review
   - No automatic import from `prototypes/` in production packages

4. Prototypes **may** use shortcuts production cannot (throwaway apps, hard-coded config) but **never** real user secrets, real routes, or unauthorized customer data.

5. TIP prototypes A–J map to directories under `prototypes/`; they precede corresponding **production commitments**, not all repository documentation work.

## Alternatives considered

| Option | Outcome |
|---|---|
| Build production directly | Rejected — unacceptable tracking risk |
| Permanent prototype code in apps/ | Rejected — coupling and debt |

## Consequences

- **Positive:** Evidence before lock-in; faster fail on bad approaches
- **Negative:** Short-term duplication
- **Follow-up:** [Prototype Governance.md](../../planning/Prototype%20Governance.md)

## Validation evidence

Prototype reports become validation evidence for future ADRs.

## Security / privacy impact

Prototype data collection follows synthetic data policy.

## Offline impact

Prototypes A–D must demonstrate offline behavior where relevant.

## Migration or rollback

Promoted code requires new ADR; discarded code deleted or archived read-only.

## Related product decisions

DEC-002, DEC-003, DEC-027 (Bluetooth deferred pending prototype class evidence)

## Related documents

- [Technical Implementation Plan.md](../../planning/Technical%20Implementation%20Plan.md) §25
- [Prototype Governance.md](../../planning/Prototype%20Governance.md)
