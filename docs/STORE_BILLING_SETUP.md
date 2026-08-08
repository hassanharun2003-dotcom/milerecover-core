# MileRecover store billing setup

## Architecture decision

**Direct Google Play Billing + StoreKit 2**, with a secure entitlement verifier backend as the authority for paid access.

Screens talk only to the `PurchasePort` interface (`apps/mobile-expo/src/services/purchases.ts`). Product IDs live in `apps/mobile-expo/src/services/storeProducts.ts`. Until store products and verification are configured, `getPurchasePort()` returns `StoreUnavailablePurchasePort` so the app **never invents Plus/Pro/trial entitlement**.

RevenueCat (or similar) may later implement the same `PurchasePort` without changing UI screens. Store receipts remain authoritative either way. Never embed store secrets in the client.

## Products to create

| Kind | Android ID | iOS ID | Type |
|------|------------|--------|------|
| Plus monthly | `milerecover_plus_monthly` | `com.milerecover.app.plus.monthly` | Auto-renewable (7-day intro trial for eligible users) |
| Plus annual | `milerecover_plus_annual` | `com.milerecover.app.plus.annual` | Auto-renewable (7-day intro trial for eligible users) |
| Pro monthly | `milerecover_pro_monthly` | `com.milerecover.app.pro.monthly` | Auto-renewable |
| Pro annual | `milerecover_pro_annual` | `com.milerecover.app.pro.annual` | Auto-renewable |
| 90-Day Rescue | `milerecover_rescue_90` | `com.milerecover.app.rescue.90` | One-time |
| Full-Year Rescue | `milerecover_rescue_year` | `com.milerecover.app.rescue.year` | One-time |

Package / bundle: `com.milerecover.app`

## Trial rules

- Users start on Free.
- Offer the 7-day Plus trial only after a value trigger (first confirmed work drive, first report preview, first recovery candidate, enable automatic protection, Plus-only capability, or import ready for protection).
- Enrollment requires the **native** Play / App Store confirmation sheet.
- Eligibility comes from the stores — do not infer from local storage alone.
- Do not silently start a trial on install or onboarding completion.

## Sandbox test guide

1. Create sandbox / license testers in Play Console and App Store Connect.
2. Install a build signed for those environments (preview APK / TestFlight).
3. Trigger a value event (save a work drive).
4. Start trial → confirm native sheet → entitlement becomes `trialActive` only after verification.
5. Cancel in store settings → app shows active-until date while `cancelledButActiveUntilPeriodEnd`.
6. After expiration → Free with all user-owned records preserved.
7. Restore purchases → refreshes from store/backend.

## External blockers until live commerce works

1. Play Console subscription products + base plans + offer for 7-day intro.
2. App Store Connect auto-renewable subscriptions + introductory offer.
3. One-time Rescue IAPs.
4. Entitlement verification backend / webhook (or RevenueCat project with server keys **not** in the client).
5. Production signing + store listing privacy / Data Safety forms.
