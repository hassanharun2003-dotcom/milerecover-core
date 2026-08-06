# MileRecover — Privacy and Trust Decisions

Authoritative for the ultimate product foundation. Plain language for product and engineering.

## Non-negotiable rules

1. Location data is sensitive. Collect only what is required to protect, review, recover, and prove work miles.
2. No data selling.
3. No advertising SDKs.
4. No hidden continuous diagnostics.
5. Users can export their records.
6. Users can request deletion (local clear today; server deletion when a backend exists).
7. Original evidence and corrected values remain distinguishable.
8. Never silently rewrite a trip.
9. Never silently apply a new mileage rate to historical accepted values.
10. Never display false certainty.
11. Privacy copy must be plain language.
12. Logging must redact exact sensitive location where not required.
13. Analytics events must not include full addresses or route coordinates.

## Collection boundaries

| Data | Why | Not for |
|------|-----|---------|
| Foreground / background location (when watching is on) | Detect and protect drives | Ads, resale, profiling |
| Trip times, distance, labels, purpose, notes | Review, proof, reports | Invented mileage |
| Permission / battery health snapshots | Protection Center guidance | Continuous sensitive telemetry |
| Locale, units, currency, effective-dated rates | Display and estimated value | Legal advice |
| Import / recovery provenance | Trust and audit | Silent acceptance |

## Certainty language

- Use “estimated value” unless reimbursement is confirmed by the user.
- Uncertain, interrupted, imported, and recovered miles keep provenance labels.
- Protection status is never “Protected” merely because a permission dialog was shown.

## Rate history

- Canonical distance storage remains miles.
- Rates are effective-dated; trip estimates use the rate applicable at trip start.
- Changing today’s rate closes the previous open period and does not rewrite older accepted values.

## Analytics and logging

- Allowed: step names, feature gates, entitlement status, coarse error codes, protection status enums.
- Forbidden: full street addresses, raw lat/lng sequences, exact route polylines in analytics.
- Diagnostics history stores only meaningful interruptions, not continuous location streams.

## Exports and deletion

- CSV / PDF / report preview include only supported facts plus an honest disclaimer.
- Local export of user records is available from Profile / Privacy.
- Clearing local data removes device records; cloud deletion remains blocked until an auth backend is deployed.

## Deferred (honest)

- Deployed authentication and server-side deletion
- Live Google OAuth without EAS client IDs
- Live RevenueCat checkout without production keys
- Country-specific tax filing or compliance guarantees
