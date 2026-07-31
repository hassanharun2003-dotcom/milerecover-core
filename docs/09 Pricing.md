# MileRecover Pricing

**Status:** Locked — launch pricing (DEC-018)  
**Last Updated:** July 2026  
**Owner:** Product / Finance

**Authority:** [Product DNA.md](./Product%20DNA.md) §13 · [Decision Log.md](./Decision%20Log.md) DEC-013, DEC-018–DEC-019

---

## Pricing Philosophy

MileRecover pricing reflects **value of protection and defensible proof**, not volume of miles logged.

Users pay for **confidence, completeness, calm, and defensible records** — not GPS alone. We do not monetize by encouraging users to claim more deductions.

Aligns with: **Accuracy over features**, **Trust over automation**, DEC-009 (estimated-value language only)

---

## Launch Pricing Summary (DEC-018)

| Product | Price | Billing |
|---|---|---|
| **Free** | $0 | — |
| **MileRecover Plus** | $6.99 | Monthly |
| **MileRecover Plus** | $49.99 | Annual |
| **MileRecover Pro** | $10.99 | Monthly |
| **MileRecover Pro** | $79.99 | Annual |
| **Mileage Rescue** | $14.99 | One-time |
| **Full-Year Rescue** | $14.99 → **$29.99** | One-time |
| **Founding Member Pro** | $59.99 | Annual (eligible users only, DEC-019) |

Annual savings vs monthly: Plus ~40%; Pro ~39%.

---

## Free

**Price:** $0

### Intended user
New users evaluating protection quality; light drivers; anyone building a review habit before upgrading.

### Features
| Feature | Included |
|---|---|
| Unlimited manual trip entry | ✓ |
| Automatic trip capture | Up to **40 trips per month** |
| Vehicles | **One** vehicle |
| Classification | Basic business / personal |
| Missing-trip scan | **One per month** |
| Monthly mileage summary | ✓ |
| Basic CSV export | ✓ |
| Tracking-health status | ✓ |
| No-driving-day prompts | ✓ |
| Competitor-import preview | **7 days** of import review |
| Personalization / onboarding | ✓ |
| Offline capture and review | ✓ |

### Limits
- Auto-captured trips above 40/month require Plus or manual entry
- No PDF export, Proof Score, calendar matching, or unlimited recovery scans
- Competitor import beyond 7-day preview requires Plus

### Upgrade reason
User exceeds 40 auto trips/month, needs unlimited tracking, recovery tools, Proof Score, PDF export, or multiple vehicles.

### Cancellation behavior
N/A — always available.

### Data access after cancellation
N/A. Full access to stored records while on Free.

### Export access
**Basic CSV export** of confirmed trips always available. Users retain access to their stored records.

### Renewal terms
N/A.

### Trust protections
- Gap visibility, tracking health, and rejection never paywalled
- Pending ≠ confirmed in exports
- No guaranteed tax outcomes
- No silent trip creation

---

## MileRecover Plus

**Price:** $6.99/month · **$49.99/year**

### Intended user
Regular work drivers — delivery and rideshare, realtors, contractors, healthcare mobile workers, sales reps, employees receiving reimbursement, business owners with steady driving volume.

### Features
Everything required for daily protection and period proof:

| Feature | Included |
|---|---|
| Unlimited automatic trip tracking | ✓ |
| Missing-trip detection and confirmation | ✓ |
| AI-assisted classification suggestions | ✓ (user confirms) |
| Protection Health | ✓ |
| Smart start/end correction suggestions | ✓ (user confirms) |
| Calendar matching | ✓ |
| Multiple vehicles | ✓ |
| Multiple work types | ✓ |
| Proof Score | ✓ |
| PDF export | ✓ |
| CSV export | ✓ |
| Odometer reminders | ✓ |
| Standard email support | ✓ |
| Competitor-history import | ✓ |
| Weekly review digest | ✓ |
| No-driving-day confirmation | ✓ |
| Bounded Recovery Engine (launch scope) | ✓ |

### Limits
- No multiple businesses, clients/projects, custom reimbursement rates, or employee reimbursement templates (Pro)
- No Evidence-backed Proof Package, receipt matching, quarterly summaries, or priority human support (Pro)
- Historical reconstruction beyond launch Recovery scope (Pro / Rescue)

### Upgrade reason
User needs multiple businesses, employer sharing, reimbursement templates, Proof Package, receipt matching, quarterly summaries, historical reconstruction tools, or priority support.

### Cancellation behavior
Cancel via App Store / Google Play. Effective at period end. Export reminder in Profile before lapse.

### Data access after cancellation
**All stored records remain accessible.** User can view, edit, and delete trips. Reverts to **Free** feature limits for new activity (40 auto trips/month, one vehicle, basic CSV only).

### Export access
PDF and CSV exports available while subscribed. After downgrade, **basic CSV export** remains on Free for confirmed records.

### Renewal terms
Auto-renew unless cancelled. Price and period shown before purchase. Restore purchases required.

### Trust protections
- AI suggestions labeled; never auto-confirmed
- Recovery suggestions require per-item user acceptance (DEC-004, DEC-021)
- Honesty features never removed on downgrade

---

## MileRecover Pro

**Price:** $10.99/month · **$79.99/year**

### Intended user
Individual professionals with complex work structure — multiple businesses, client billing, employee reimbursement submission, or advanced proof needs. **Not** a team or fleet product.

### Features
Everything in **Plus**, plus:

| Feature | Included |
|---|---|
| Multiple businesses | ✓ |
| Clients and projects | ✓ |
| Custom reimbursement rates | ✓ |
| Accountant or employer sharing | ✓ |
| Evidence-backed Proof Package | ✓ |
| Receipt evidence matching | ✓ |
| Quarterly summaries | ✓ |
| Historical reconstruction tools | ✓ (bounded; user confirms all entries) |
| Employee reimbursement templates | ✓ ([Export Formats.md](../architecture/Export%20Formats.md) DEC-022) |
| Priority human support | ✓ |
| Advanced report customization | ✓ |

### Limits
- Individual professional scope — no fleet management, seat licensing, or employer admin portal at launch
- Advanced deferred recovery (email scanning, bank matching, delivery-platform integrations) post-launch

### Upgrade reason
N/A for most power users. **Mileage Rescue** or **Full-Year Rescue** for intensive one-time recovery sessions.

### Cancellation behavior
Same as Plus. Downgrade to Plus or Free at period end per user choice.

### Data access after cancellation
All stored records remain accessible. Pro-specific metadata (clients, custom rates) retained read-only or editable per product policy; exports revert to tier limits.

### Export access
Full Proof Package and employee reimbursement CSV while subscribed. Basic CSV on Free after downgrade.

### Renewal terms
Same transparency as Plus.

### Trust protections
- Proof Package includes evidence sources and gap disclosure — never implies audit guarantee
- Sharing to accountant/employer excludes personal routes unless user opts in
- Historical reconstruction never silent

---

## Mileage Rescue (one-time)

**Price:** $14.99 · **One-time purchase**

### Intended user
User with recent gaps (tracking outage, new install, missed review period) who wants guided recovery for up to three months without a long-term subscription upgrade.

### Features
| Feature | Included |
|---|---|
| Recovery review for up to **three recent months** | ✓ |
| Gap detection between captured drives | ✓ |
| Calendar events without matching drives | ✓ |
| Known work-location transitions | ✓ |
| Competitor-import gap analysis | ✓ |
| Late-start / early-stop correction suggestions | ✓ |
| No-driving-day confirmation workflow | ✓ |
| Evidence and confidence explanations | ✓ |
| User-confirmed reconstructed trips only | ✓ |

### Limits
- Scope capped at three recent months per purchase
- Does not replace Plus/Pro ongoing tracking or export entitlements
- No silent trip creation
- Does not include bank, email, or delivery-platform recovery (deferred)

### Upgrade reason
User may subscribe to Plus/Pro for ongoing protection after rescue.

### Cancellation behavior
N/A — one-time. Refund per platform policy.

### Data access after cancellation
N/A. Recovered trips user confirmed remain in their account.

### Export access
Export recovered period while user has export tier entitlements (Plus PDF/CSV or Free basic CSV).

### Renewal terms
None.

### Trust protections
Every recovered entry requires explicit user confirmation with visible evidence basis.

---

## Full-Year Rescue (one-time)

**Price:** $29.99 · **One-time purchase**

### Intended user
Tax-season user needing structured recovery for **one selected tax year** (incomplete year, mid-year switch, long outage).

### Features
| Feature | Included |
|---|---|
| Recovery review for **one selected tax year** | ✓ |
| Full-year gap analysis | ✓ |
| All launch recovery capabilities within year scope | ✓ |
| Export assist with gap and recovery disclosure | ✓ |
| Batch suggestion review with per-item confirm/dismiss | ✓ |

### Limits
- One tax year per purchase
- No guaranteed completeness — gaps without evidence remain visible
- Deferred advanced sources (email, bank, platforms) not included

### Upgrade reason
Subscribe to Pro for ongoing multi-business proof and employer templates.

### Cancellation behavior
N/A — one-time.

### Data access / export / renewal
Same trust model as Mileage Rescue, scoped to one tax year.

### Trust protections
Same as Mileage Rescue. Never invent mileage.

---

## Founding Member Pro (DEC-019)

**Price:** **$59.99/year** · **MileRecover Pro** tier only

| Rule | Detail |
|---|---|
| **Eligibility** | Approved beta participants and early launch users only |
| **Renewal** | Renews at **$59.99/year** while subscription remains **continuously active** |
| **Transparency** | Terms visible before purchase; standard platform renewal disclosure |
| **No fake countdown** | DEC-014 |
| **No false scarcity** | Eligibility based on program membership, not artificial limits |
| **No hidden price increase** | While continuously subscribed, price stays $59.99/yr |
| **After cancel** | Re-subscription at **current public Pro price** ($10.99/mo or $79.99/yr) |
| **Tier** | Pro features only — not Plus |

---

## Competitive Price Positioning

| Product | Monthly (approx.) | MileRecover |
|---|---|---|
| MileIQ | ~$7–8 | Plus $6.99 — differentiate on protection + recovery |
| Everlance | ~$8–12 | Plus/Pro band; mileage depth vs suite clutter |
| Stride | Free | Free tier; Plus converts on proof + recovery |

Competitor prices are third-party research — not MileRecover pricing. See [07 Competitor Analysis.md](./07%20Competitor%20Analysis.md).

---

## Pricing Principles

1. **No paywall on honesty** — tracking health, gaps, no-driving prompts on Free  
2. **No incentive to inflate** — no per-mile pricing  
3. **Value before paywall** — meaningful Free tier with basic export  
4. **Estimated value only** — DEC-009, DEC-020  
5. **Essential data never hostage** — stored records and basic CSV after cancellation  
6. **Transparent renewal and cancellation** — platform-managed  
7. **Recovery is differentiation** — launch Recovery Engine bounded but real (DEC-021)

---

## Previous Pricing Concept (Historical — Superseded)

*Internal drafts superseded by DEC-018. Not active launch pricing.*

| Prior concept | Price | Status |
|---|---|---|
| Pro — "Account" | $7.99/mo · $69.99/yr | Superseded |
| Pro+ — "Defend" | $14.99/mo · $129.99/yr | Never launched |
| Founding member (draft) | $49/yr | Superseded by $59.99 Founding Member Pro |
| Mileage Rescue (draft) | TBD | Locked at $14.99 |
| Full-Year Rescue (draft) | TBD | Locked at $29.99 |

---

## Revenue Model Notes (Launch)

**Target conversion:** 8–12% free → paid within 90 days

**Validation:**
- [ ] Van Westendorp in beta
- [ ] Conversion by persona (including employee reimbursement)
- [ ] Rescue IAP attach rate at tax season

---

## What We Won't Do

- Surge pricing during tax season
- Guaranteed tax refund or savings claims
- Paywall on gap visibility or tracking health
- Holding user records hostage after cancellation
- Pro+ tier (historical concept only)
- Fleet / team pricing at launch

---

## Related Documents

- [Product DNA.md](./Product%20DNA.md) §13–§14
- [Decision Log.md](./Decision%20Log.md) DEC-018–DEC-024
- [MVP.md](../planning/MVP.md)
- [Launch Plan.md](../planning/Launch%20Plan.md)
- [Recovery Engine.md](../architecture/Recovery%20Engine.md)
