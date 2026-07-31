# Prototype Governance

**Status:** Phase 0  
**Last Updated:** July 2026  
**Owner:** Engineering / Architecture

Governance for disposable validation prototypes defined in [Technical Implementation Plan.md](./Technical%20Implementation%20Plan.md) §25 and ADR-0003.

---

## Lifecycle

1. **Prototype proposed** — issue or brief with TIP letter (A–J)
2. **Question and success criteria approved** — Engineering lead (+ Security if data-sensitive)
3. **Privacy constraints approved** — synthetic data only unless authorized protocol
4. **Minimal implementation** — in `prototypes/<name>/` only
5. **Results captured** — report, metrics, logs (no raw coordinates in shared logs)
6. **Decision made** — pass, fail, or accepted risk
7. **Code discarded, archived, or promoted** — default: **discard**
8. **ADR or plan updated** — if architecture locks
9. **Follow-up work authorized** — production phase may begin

---

## Naming

Directory names match validation domain: `ios-tracking`, `android-tracking`, etc.  
Brief README must reference TIP prototype letter.

---

## Owners

| Prototype | Primary owner |
|---|---|
| A, C, I | Mobile / iOS |
| B, C, I | Mobile / Android |
| D, E | Mobile + Backend |
| F | Backend + Mobile |
| G, H | Mobile |
| J | Mobile + Product |

---

## Evidence requirements

- Written report with success/failure criteria outcome
- Device matrix used
- Battery or performance numbers where relevant (Prototype I)
- No silent promotion to production

---

## Promotion criteria

Promotion requires **all**:

- Exit criteria met or risk explicitly accepted
- ADR if library/vendor/architecture locked
- Code rewritten or reviewed — not copy-paste from throwaway prototype
- Boundary check passes
- Synthetic data policy upheld

---

## Allowed shortcuts (prototypes only)

- Hard-coded config
- Throwaway UI
- Single-device scope
- Manual steps

---

## Never allowed (even in prototypes)

- Real user secrets or credentials
- Unauthorized real user location data
- Silent auto-creation of mileage records
- Bypassing user confirmation for recovery → trip

---

## Related documents

- [../prototypes/README.md](../prototypes/README.md)
- [Phase 0 Checklist.md](./Phase%200%20Checklist.md)
- [../docs/adr/0003-prototype-before-production.md](../docs/adr/0003-prototype-before-production.md)
