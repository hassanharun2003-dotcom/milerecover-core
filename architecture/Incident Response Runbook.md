# MileRecover Incident Response Runbook

**Status:** Draft — Pre-launch  
**Last Updated:** July 2026  
**Owner:** Engineering / Founding Team  
**Companion:** [Security.md](./Security.md)

---

## Purpose

Operational playbook when MileRecover experiences a security, privacy, or **Trust Rules** incident.

Philosophy incidents (e.g., phantom trips in export) are treated with the same urgency as traditional security breaches when user trust is at risk.

---

## Severity Definitions

| Level | Definition | Examples | Response target |
|---|---|---|---|
| **P0** | Active data leak, mass phantom export, or complete sync data loss | Location DB exposed; trips invented in export | 1 hour |
| **P1** | Auth bypass, single-user data exposure, Critical Trust Rule violation | JWT validation failure; AI created trip without evidence | 4 hours |
| **P2** | Limited account compromise, elevated phantom rate | Credential stuffing success; >10% false trips | 24 hours |
| **P3** | Non-exploitable bug, degraded sync, missing UI label | Sync delay; missing AI label | Next sprint |

Cross-reference [04 Trust Rules.md](../docs/04%20Trust%20Rules.md) violation table.

---

## Response Phases

### 1. Contain (0–60 min)

- [ ] Assign incident commander (IC)
- [ ] Open private incident channel
- [ ] Stop bleed: disable feature flag, pause rollout, block API endpoint if needed
- [ ] Preserve logs (no raw GPS in shared tickets)
- [ ] Document timeline start (UTC)

**Trust-specific containment:**
- Phantom trip bug → disable auto-promotion to export; force review mode globally if required
- AI violation → disable AI endpoints; core manual/offline flows continue ([AI Architecture.md](./AI%20Architecture.md))

### 2. Assess (1–4 hr)

- [ ] Scope: how many users, which platforms, which versions
- [ ] Data impact: were location/trip records exposed or corrupted?
- [ ] Trust impact: were false miles exported?
- [ ] Root cause hypothesis
- [ ] Legal/privacy counsel if P0/P1

### 3. Notify (as required)

| Audience | When | Channel |
|---|---|---|
| Affected users | P0/P1 with data impact | Email + in-app |
| All users | Critical Trust Rule fix deployed | Release notes |
| App Store | Background location regression | Review notes if needed |
| Regulators | If legally required | Counsel-led |

**User message principles:** Honest, specific, no minimization. Offer export/delete instructions.

### 4. Remediate

- [ ] Hotfix branch in application repo (not this OS repo)
- [ ] Trust Rules regression tests added
- [ ] Staged rollout: 5% → 25% → 100%
- [ ] Verify on reference devices ([Sprint 1 Technical Spec.md](../planning/Sprint%201%20Technical%20Spec.md))

### 5. Postmortem (within 5 business days)

Blameless document:

- Timeline
- Root cause
- User impact count
- Why Trust Rules failed to prevent (if applicable)
- Action items with owners
- Decision Log entry if architectural change ([Decision Log.md](../docs/Decision%20Log.md))

---

## Scenario Playbooks

### Phantom trips in export (P0/P1)

1. Disable affected export path or auto-confirm globally
2. Identify trips created without evidence (Trust Rule A1)
3. Notify users to re-review affected period
4. Offer support-assisted export regeneration
5. Postmortem: detection threshold, state machine, or validation gap

### Location data leak (P0)

1. Rotate keys, revoke tokens, block exfil path
2. Counsel for breach notification requirements
3. User notification per [Privacy Policy.md](../docs/Privacy%20Policy.md)
4. Third-party audit if required

### Sync data loss (P1)

1. Halt sync push/pull if corruption spreading
2. Restore from backups ([Database.md](./Database.md))
3. Local-first devices may retain truth — guide users to open app offline before sync
4. Conflict UI for affected accounts

### AI created trip without confirmation (P1)

1. Disable AI service writes immediately (should be impossible by architecture)
2. Quarantine affected trips server-side
3. User notification with restore/reject instructions
4. DEC review — [AI Architecture.md](./AI%20Architecture.md)

---

## Contacts (Placeholder)

| Role | Contact |
|---|---|
| Incident Commander | on-call rotation TBD |
| Engineering Lead | TBD |
| Legal | TBD |
| Founder escalation | TBD |

---

## Related Documents

- [Security.md](./Security.md)
- [04 Trust Rules.md](../docs/04%20Trust%20Rules.md)
- [Launch Plan.md](../planning/Launch%20Plan.md)
- [Anti-Principles.md](../docs/Anti-Principles.md)
