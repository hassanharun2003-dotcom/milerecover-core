# MileRecover Company Constitution

**Status:** Foundational — Governing Document  
**Last Updated:** July 2026  
**Owner:** Founding Team  
**Supersedes:** Nothing. Complements [03 Core Principles.md](./03%20Core%20Principles.md) and [04 Trust Rules.md](./04%20Trust%20Rules.md).

---

## Preamble

This Constitution defines why MileRecover exists, what we owe users, and how we make decisions when speed, revenue, and principles collide.

It is binding on product, engineering, design, marketing, support, and partnerships. Application code is not governed here — behavior is.

---

## Article I — Why MileRecover Exists

MileRecover exists because millions of self-employed professionals lose legitimate tax deductions every year — not because they did not drive, but because they cannot **prove** they drove.

Existing mileage tools optimize for trips logged. MileRecover optimizes for **miles defended**.

We build an audit-ready mileage recovery platform where:

- **Every work mile accounted for** means completeness of legitimate travel, not completeness of GPS noise.
- Gaps are visible, recovery is honest, and exports stand up to scrutiny.

See [00 Vision.md](./00%20Vision.md) and [01 Mission.md](./01%20Mission.md).

---

## Article II — Non-Negotiable Product Principles

These seven principles are constraints, not marketing. Full definitions: [03 Core Principles.md](./03%20Core%20Principles.md).

| # | Principle | Constitutional summary |
|---|---|---|
| 1 | Every work mile accounted for | Show coverage and gaps; never fake completeness |
| 2 | Never invent mileage | No trip without sensor or user evidence |
| 3 | Trust over automation | Automation proposes; user disposes |
| 4 | Accuracy over features | Ship proof before parity |
| 5 | Battery friendly | Tracking that drains batteries gets disabled |
| 6 | Offline first | Capture and review work without network |
| 7 | AI assists but never replaces evidence | Models suggest; sensors and users decide |

**Principle hierarchy when in conflict:** Never invent mileage → AI boundaries → Trust over automation → Accuracy over features → Every work mile accounted for → Battery friendly → Offline first.

---

## Article III — Customer Rights

Every MileRecover user has the right to:

### Transparency
- See how each trip was captured (source, confidence, signals used)
- See Proof Score breakdown before export ([Proof Score.md](../architecture/Proof%20Score.md))
- Know when AI contributed to a suggestion — never hidden
- See unaccounted days without implied mileage

### Control
- Confirm, edit, split, merge, reclassify, or delete any trip
- Reject auto-detected trips permanently unless explicitly restored
- Set automation level, including Conservative (default)
- Pause tracking without losing existing records
- Export all data and delete account ([04 Trust Rules.md](./04%20Trust%20Rules.md) C1)

### Honesty
- Totals that separate confirmed business, pending, personal, and gaps
- Exports that disclose source, gaps, and AI involvement
- Permission requests with clear rationale and degradation preview
- No marketing claims the product cannot substantiate

### Privacy
- Location data used only for stated mileage functionality
- No sale of location or trip data to third parties
- Encryption in transit and at rest ([Security.md](../architecture/Security.md))

These rights are product requirements, not legal boilerplate alone.

---

## Article IV — Trust and Privacy Commitments

### Mileage records
- A trip enters official business totals only after user confirmation or documented opt-in auto-confirm rules ([04 Trust Rules.md](./04%20Trust%20Rules.md) A5).
- Rejected trips do not reappear silently.
- Recovery and import create **suggestions** first — not exportable trips until accepted ([Recovery Engine.md](../architecture/Recovery%20Engine.md)).

### Location data
- Collected at minimum frequency required for stated accuracy tier.
- Raw samples subject to retention policy; purge on user deletion.
- No location in marketing analytics or ad targeting.
- Telemetry excludes raw coordinates ([Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)).

### Automation
- Conservative mode is the default for new users.
- No silent creation of trips below confidence threshold.
- No "accept all" without summary of count and miles.

---

## Article V — Rules for AI

AI at MileRecover is **assistive infrastructure**, not an authoritative logger.

| Rule | Requirement |
|---|---|
| AI-1 | AI SHALL NOT be the sole source of trip existence |
| AI-2 | AI classifications and purposes SHALL require user confirmation for export |
| AI-3 | AI outputs SHALL be labeled in UI and audit metadata |
| AI-4 | AI failure SHALL NOT block core tracking or manual entry |
| AI-5 | AI SHALL NOT control tracking state transitions ([Tracking State Machine.md](../architecture/Tracking%20State%20Machine.md)) |
| AI-6 | AI SHALL NOT interpolate mileage across undocumented gaps |

Full specification: [AI Architecture.md](../architecture/AI%20Architecture.md).

---

## Article VI — Decision-Making Hierarchy

When documents, teams, or incentives conflict, resolve in this order:

1. **This Constitution** — customer rights and non-negotiables
2. [03 Core Principles.md](./03%20Core%20Principles.md)
3. [04 Trust Rules.md](./04%20Trust%20Rules.md)
4. [Anti-Principles.md](./Anti-Principles.md)
5. [Interaction Rules.md](../design/Interaction%20Rules.md)
6. Architecture specifications ([System Architecture.md](../architecture/System%20Architecture.md))
7. [Decision Log.md](./Decision%20Log.md) — recorded technical and product decisions
8. Roadmap and sprint plans

Revenue, growth targets, and competitor parity **do not** override items 1–4.

Major decisions are recorded in [Decision Log.md](./Decision%20Log.md). Amendments to this Constitution require founding team unanimous consent.

---

## Article VII — What Success Means

Success is not maximum miles logged. Success is:

### User success
- Users export logs their CPA accepts without rework ([10 Success Metrics.md](./10%20Success%20Metrics.md))
- Users describe MileRecover as trustworthy — not magic
- Defensible Miles Confirmed grows because users **confirm real trips**, not because detection inflates

### Product success
- Phantom trip rate <3% at scale
- Offline capture with zero data loss
- Battery impact within documented targets
- Proof Score correlates with user confidence and CPA acceptance

### Company success
- MileRecover synonymous with **audit-ready mileage**
- No Critical Trust Rule violations in production
- Sustainable business without data sales, dark patterns, or inflated marketing

### What success is not
- Highest trip count in category
- Maximum estimated tax savings marketed to users
- Highest auto-log rate without review

---

## Article VIII — Amendment and Review

- **Review cadence:** Quarterly against shipped product behavior
- **Per-release:** Trust Rules sign-off required
- **Living documents:** Constitution changes are rare; Decision Log captures day-to-day choices

---

## Related Documents

- [Manifesto.md](./Manifesto.md) — customer-facing expression of this Constitution
- [Anti-Principles.md](./Anti-Principles.md) — what we refuse to become
- [Decision Log.md](./Decision%20Log.md)
- [03 Core Principles.md](./03%20Core%20Principles.md)
- [04 Trust Rules.md](./04%20Trust%20Rules.md)
