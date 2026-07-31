# MileRecover Privacy Policy

**Status:** Draft — Legal review required before publication  
**Last Updated:** July 2026  
**Effective date:** TBD at launch  
**Owner:** Legal / Founding Team

---

## Summary

MileRecover collects location and trip data **only** to help you account for business mileage you can trust. We **do not sell** your location data. You control your records.

This draft aligns with [Company Constitution.md](./Company%20Constitution.md), [04 Trust Rules.md](./04%20Trust%20Rules.md), and DEC-006 in [Decision Log.md](./Decision%20Log.md).

---

## Information We Collect

### Location and motion data
- GPS coordinates, speed, accuracy, and timestamps during active tracking
- Motion activity signals (e.g., driving vs walking) for battery-efficient detection
- Collected only when tracking is enabled per [Native Tracking Engine.md](../architecture/Native%20Tracking%20Engine.md)

### Trip and mileage records
- Trip dates, distances, destinations, business purpose (user-entered or confirmed)
- Proof Score metadata, classification, and audit history
- Odometer photos you choose to attach

### Account information
- Email, name (optional), authentication identifiers (Apple/Google)
- Subscription status via RevenueCat

### Device information
- Device ID, platform, app version (for sync and support)
- Crash diagnostics without raw GPS (see [Security.md](../architecture/Security.md))

---

## How We Use Information

| Use | Purpose |
|---|---|
| Trip detection and storage | **Every work mile accounted for** — your mileage log |
| Sync across devices | Backup and multi-device access (**offline first** locally) |
| Proof Score | Defensibility indicators — not tax advice |
| AI suggestions (opt-in features) | **Assist only** — you confirm before export |
| Support | Respond to your requests |
| Legal compliance | Tax/export obligations, valid legal process |

We do **not** use your data for advertising or sell it to data brokers.

---

## What We Do Not Do

- Sell, license, or share location trails with third parties for marketing ([Anti-Principles.md](./Anti-Principles.md))
- Create trips without sensor or user evidence (**never invent mileage**)
- Share business purpose or client location details with advertisers
- Use AI to auto-log mileage without your confirmation

---

## Data Storage and Security

- Encryption in transit (TLS 1.3) and at rest
- Local device storage is primary during capture; cloud sync is backup
- Raw location samples subject to retention policy (default 90 days post-trip)
- Details: [Security.md](../architecture/Security.md)

---

## Your Rights and Choices

- **Access:** Export your data (JSON/CSV) from the app
- **Delete:** Delete account; 30-day recovery window then purge
- **Control:** Pause tracking, reject trips, set automation level
- **Permissions:** Revoke location access; app degrades honestly to manual entry

CCPA/GDPR rights honored at launch. Contact: privacy@milerecover.com (placeholder).

---

## Third-Party Services

| Service | Purpose | Data shared |
|---|---|---|
| Apple / Google Sign-In | Authentication | Auth tokens only |
| RevenueCat | Subscriptions | Purchase receipts |
| Cloud hosting (AWS) | Sync and backup | Encrypted trip data |
| Maps (Apple/Google/Mapbox) | Map display | Coordinates as required by provider |
| AI provider (H1+) | Purpose suggestions | Trip context only; no raw GPS trails |

Each provider used at minimum necessary scope.

---

## Children's Privacy

MileRecover is not directed at users under 18.

---

## Changes

We will notify users of material privacy changes via in-app notice and updated effective date.

---

## Contact

privacy@milerecover.com (placeholder until launch)

---

## Related Documents

- [Terms of Service.md](./Terms%20of%20Service.md)
- [Export Disclaimer.md](./Export%20Disclaimer.md)
- [Company Constitution.md](./Company%20Constitution.md)
