# MileRecover Feature Roadmap

**Status:** Living Document  
**Last Updated:** July 2026  
**Owner:** Product

---

## Roadmap Philosophy

We ship in layers of **defensibility**, not feature parity.

Priority order:
1. Capture evidence reliably (**battery friendly**, **offline first**)
2. Let users verify (**trust over automation**)
3. Quantify confidence (**Proof Score**)
4. Recover gaps honestly (**never invent mileage**)
5. Assist with AI (**AI assists but never replaces evidence**)
6. Expand integrations and platform

**Accuracy over features** — if a feature can't meet Trust Rules, it waits.

---

## Horizon Overview

| Horizon | Timeline | Theme |
|---|---|---|
| **H0: MVP** | Months 0–3 | Core tracking + proof + export |
| **H1: Recovery** | Months 3–6 | Gap recovery + AI assist |
| **H2: Pro** | Months 6–12 | CPA tools + multi-vehicle |
| **H3: Platform** | Year 2+ | Integrations + team features |

See [../planning/MVP.md](../planning/MVP.md) and sprint plans.

---

## H0: MVP (Months 0–3)

### Tracking & Capture
- [ ] Native Tracking Engine v1 (iOS + Android)
- [ ] Conservative auto-detection mode
- [ ] Manual trip entry (odometer + address)
- [ ] Trip split and merge
- [ ] Business / personal classification
- [ ] Offline capture and local storage

### Review & Trust
- [ ] Review queue (pending trips)
- [ ] Confidence indicator per trip
- [ ] Proof Score v1 (rule-based)
- [ ] Trip detail: map, source, timestamps
- [ ] Reject / restore workflow

### Export & Reporting
- [ ] IRS-aligned mileage log PDF
- [ ] CSV export for CPAs
- [ ] Period summary (monthly, yearly)
- [ ] Gap visibility ("unaccounted days")

### Account & Settings
- [ ] Auth (email + Apple/Google)
- [ ] Automation level settings
- [ ] Permission management with degradation preview
- [ ] Data export and deletion

---

## H1: Recovery (Months 3–6)

### Recovery Engine
- [ ] Calendar-informed recovery *suggestions* (user confirms each)
- [ ] Odometer photo capture + OCR assist
- [ ] Historical import (CSV from competitors)
- [ ] Gap analysis dashboard
- [ ] Batch recovery review flow

### AI Assist (Bounded)
- [ ] Trip purpose suggestion (user confirms)
- [ ] Duplicate trip detection
- [ ] Anomaly flagging (unlikely distances)
- [ ] Weekly summary narrative (non-export metadata)

### Proof Score v2
- [ ] Multi-factor scoring model
- [ ] Period-level aggregate score
- [ ] Export confidence summary

### Platform
- [ ] Background sync improvements
- [ ] Push notifications (weekly digest, not nag)
- [ ] Android battery optimization guides

---

## H2: Pro (Months 6–12)

### Professional Tools
- [ ] CPA read-only portal (invite link)
- [ ] Multi-vehicle support
- [ ] Custom export templates
- [ ] QuickBooks / Xero mileage export
- [ ] Receipt attachment per trip

### Advanced Tracking
- [ ] Geofence work locations (auto-suggest business)
- [ ] Bluetooth car detection (optional)
- [ ] Passenger vs driver mode (future research)

### Subscription Features
- [ ] Unlimited history on paid tier
- [ ] Advanced Proof Score analytics
- [ ] Priority support

---

## H3: Platform (Year 2+)

### Team & Fleet (Light)
- [ ] Small team admin (≤10 vehicles)
- [ ] Employee reimbursement export
- [ ] Policy rules engine

### Integrations
- [ ] Tax software API partners
- [ ] Banking (expense correlation, not trip invention)
- [ ] Calendar deep integrations

### Intelligence
- [ ] Personalized automation thresholds (opt-in)
- [ ] Industry-specific purpose templates
- [ ] Audit simulation mode (educational)

---

## Explicitly Not on Roadmap

These conflict with Core Principles:

| Feature | Reason |
|---|---|
| Auto-backfill from bank transactions alone | **Never invent mileage** |
| "Maximize deduction" optimizer | Trust / ethics |
| Silent trip creation below threshold | **Trust over automation** |
| Social / leaderboard mileage | Wrong incentives |
| Selling anonymized location data | Trust Rules E4 |

---

## Release Criteria (All Horizons)

Before any feature ships:

- [ ] Trust Rules checklist passed
- [ ] Offline behavior documented and tested
- [ ] Battery impact measured on reference devices
- [ ] Proof Score impact assessed (if applicable)
- [ ] AI features: assist-only architecture verified

---

## Dependencies

```
Native Tracking Engine
        ↓
Proof Score v1 ← Review Queue
        ↓
Export Pipeline
        ↓
Recovery Engine → AI Assist (bounded)
        ↓
Integrations
```

---

## Related Documents

- [../planning/MVP.md](../planning/MVP.md)
- [../planning/Sprint 1.md](../planning/Sprint%201.md)
- [09 Pricing.md](./09%20Pricing.md)
- [10 Success Metrics.md](./10%20Success%20Metrics.md)
