# MileRecover Integrations Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Product / Engineering

---

## Integration Philosophy

Integrations extend MileRecover's evidence ecosystem—they do not become alternate sources of **invented mileage**.

**Accuracy over features:** We integrate when data improves defensibility, not feature checklists.

---

## Integration Tiers

| Tier | Timeline | Criteria |
|---|---|---|
| **Tier 0 — Export** | MVP | CPA-ready files (no live integration) |
| **Tier 1 — Import** | H1 | Recover history from competitor exports |
| **Tier 2 — Accounting** | H2 | QuickBooks, Xero mileage export |
| **Tier 3 — Ecosystem** | H3 | Tax software, calendar, banking correlation |

---

## MVP: Export Integrations (Tier 0)

No live API connections. User-initiated share.

| Format | Use | Spec |
|---|---|---|
| PDF Mileage Log | IRS-ready user record | [IRS Research](../research/IRS%20Research.md) |
| CSV | CPA import | Standard columns documented |
| JSON | User data portability | Full trip + metadata |

**Share targets:** Email, Files, AirDrop, Drive (system share sheet)

---

## H1: Import Integrations

| Source | Method | Trust Treatment |
|---|---|---|
| MileIQ | CSV upload | Each row → suggestion, source: imported |
| TripLog | CSV upload | Same |
| Generic CSV | Template download | User maps columns |
| Apple Calendar | EventKit read | Suggestions only |
| Google Calendar | OAuth read | Suggestions only |

**Never auto-import without review batch.**

---

## H2: Accounting Integrations

### QuickBooks Online
- **Direction:** MileRecover → QBO (mileage expense entries)
- **Method:** Intuit OAuth 2.0, API v3
- **Data:** Confirmed business trips only, Proof Score ≥70 default filter
- **Mapping:** Trip → Mileage expense with date, miles, purpose

### Xero
- **Direction:** Export compatible manual journal / expense import format
- **Method:** OAuth 2.0 or file export (start with file)

### Integration Rules
- User confirms sync scope (date range, min score)
- No retroactive modification of QBO entries without confirmation
- Sync log auditable

---

## H2: CPA Portal

- Read-only web view (separate lightweight app or web)
- CPA invite link → scoped token
- View confirmed trips, Proof Scores, export download
- No edit access

---

## H3: Tax Software

| Partner | Integration | Notes |
|---|---|---|
| TurboTax | CSV import compatible | No official API |
| TaxAct | Export format alignment | Research needed |
| Drake / ProSeries | CPA-side import | B2B2C via Diane persona |

Priority: formats CPAs already accept.

---

## H3: Banking (Careful)

**Use case:** Correlate expense receipts with trips — NOT infer trips from transactions.

| Allowed | Forbidden |
|---|---|
| "You had a toll charge — attach to trip?" | "Bank shows travel — 50 mi logged" |
| Receipt OCR for business purpose | Transaction → mileage creation |

If pursued: manual linking UI only.

---

## Platform Integrations

| Platform | Purpose | MVP |
|---|---|---|
| Apple Sign In | Auth | ✓ |
| Google Sign In | Auth | ✓ |
| Apple Maps / MapKit | Map display | ✓ |
| Google Maps | Map display (Android) | ✓ |
| Mapbox | Optional unified maps | Evaluate |
| RevenueCat | Subscription management | ✓ |
| Stripe | Web payments (future) | H2 |
| Sentry | Crash reporting (no GPS) | ✓ |
| App Store / Play Store | Distribution | ✓ |

---

## Integration Security

- OAuth tokens encrypted at rest
- Minimum scope requests
- Revocation in Settings → Connected Accounts
- Third-party data never used for trip creation without user action

---

## Partner Evaluation Scorecard

| Criterion | Weight |
|---|---|
| Improves evidence quality | 30% |
| User-requested demand | 25% |
| Implementation complexity | 20% |
| Privacy/compliance risk | 15% |
| Revenue impact | 10% |

Reject integrations that score high on invention risk regardless of demand.

---

## Related Documents

- [Recovery Engine.md](./Recovery%20Engine.md)
- [API.md](./API.md)
- [../docs/08 Feature Roadmap.md](../docs/08%20Feature%20Roadmap.md)
- [../research/Mileage Apps Research.md](../research/Mileage%20Apps%20Research.md)
