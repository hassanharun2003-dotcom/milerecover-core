# Mobbin pattern research — MileRecover ultimate UX

**Date:** 2026-08-04  
**Access:** Mobbin marketing/explore surface is publicly reachable; deep pattern library requires signup/paid access. Explore timed out in this environment. Research below combines Mobbin’s public taxonomy with established fintech/productivity mobile UX principles. No screens were copied.

## Access limitation

- `https://mobbin.com/` loaded: pattern categories include Subscription & Paywall, Onboarding, Account Setup, Settings, Home, Progress Indicator, Empty/Success flows.
- Authenticated Mobbin screenshot library was **not** available without login. No paywall bypass attempted.
- Internal evidence screenshots from Mobbin were therefore **not** captured. Implementation proceeds from documented principles.

## Pattern categories reviewed (public Mobbin taxonomy + industry)

| Category | Apps / domains referenced in principle | Extracted principle for MileRecover |
|---|---|---|
| Fintech onboarding | Coinbase, Wise, banking KYC | 3–4 stages max; progress as meaningful segments; delay account creation |
| Permission education | Maps, fitness, banking location | Explain benefit → ask → verify; never re-ask satisfied permissions |
| Status dashboards | Insurance, health rings, portfolio | One status sentence + one action; value summary above the fold |
| Subscription paywalls | Spotify, Notion, Headspace | Recommended plan highlighted; Free as reassurance row; legal footer compact |
| Report creation | Expense / tax apps | Outcome-first title; readiness checklist; export after readiness |
| Activity review | Banking pending transactions | Explicit approve/reject; undo; evidence “why” |
| Settings architecture | iOS Settings, Linear, Stripe | Short summary groups; detail screens for long copy |
| Empty / success | Productivity apps | Short heading + two actions; reduce oversized illustration |
| Import flows | Finance CSV import | Preview → confirm → exceptions; never silent overwrite |

## Reusable principles (applied)

1. **Hierarchy:** Greeting/status → value → next action → recent → secondary.
2. **Progressive disclosure:** Advanced fields behind “More details” / “Add details”.
3. **Card density:** Prefer compact rows over stacked hero panels.
4. **CTA hierarchy:** One primary per viewport; paid upsell contextual, never duplicated.
5. **Status communication:** Icon + one sentence + one repair action.
6. **Sales psychology:** Value proof from *real* user data only; recommended plan badge; Free remains dignified.
7. **Paywall composition:** Header → personalized subtitle → value proof → billing toggle → recommended + secondary → Free row → Rescue link → legal.
8. **Trust:** Honest permission states; never claim protection when inactive; diagnostics hidden.
9. **Empty states:** Celebrate completion; offer two productive next steps.
10. **Advanced controls:** Battery, thresholds, diagnostics stay out of primary paths.

## Anti-patterns to avoid (observed in current MileRecover MVP)

- Leading Home with “not dependable” / multiple See plans.
- Ten tiny onboarding dots.
- Technical RevenueCat / OTA / runtime copy on customer screens.
- Equal-height Free card competing with Plus/Pro.
- Generic “Missing details” without a Fix CTA.
- Repeated legal disclaimers on every screen.
