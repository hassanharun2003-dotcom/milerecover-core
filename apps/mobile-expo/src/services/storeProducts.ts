/**
 * Store product ID contracts for Google Play Billing / StoreKit.
 * Never invent prices or entitlement from these IDs alone — purchases must
 * be verified by the store (or an approved entitlement backend).
 *
 * Configure matching products in Play Console / App Store Connect before
 * enabling a live PurchasePort. See docs/STORE_BILLING_SETUP.md.
 */

export type StoreProductKind =
  | 'plus_monthly'
  | 'plus_annual'
  | 'pro_monthly'
  | 'pro_annual'
  | 'rescue_90'
  | 'rescue_year';

export interface StoreProductContract {
  kind: StoreProductKind;
  /** Google Play product / subscription ID */
  androidProductId: string;
  /** App Store product ID */
  iosProductId: string;
  planId: 'plus' | 'pro' | 'rescue';
  period?: 'monthly' | 'annual';
  /** Introductory 7-day Plus trial is configured on the store product, not in-app. */
  introductoryTrialDays?: number;
  oneTime: boolean;
}

export const STORE_PRODUCTS: StoreProductContract[] = [
  {
    kind: 'plus_monthly',
    androidProductId: 'milerecover_plus_monthly',
    iosProductId: 'com.milerecover.app.plus.monthly',
    planId: 'plus',
    period: 'monthly',
    introductoryTrialDays: 7,
    oneTime: false,
  },
  {
    kind: 'plus_annual',
    androidProductId: 'milerecover_plus_annual',
    iosProductId: 'com.milerecover.app.plus.annual',
    planId: 'plus',
    period: 'annual',
    introductoryTrialDays: 7,
    oneTime: false,
  },
  {
    kind: 'pro_monthly',
    androidProductId: 'milerecover_pro_monthly',
    iosProductId: 'com.milerecover.app.pro.monthly',
    planId: 'pro',
    period: 'monthly',
    oneTime: false,
  },
  {
    kind: 'pro_annual',
    androidProductId: 'milerecover_pro_annual',
    iosProductId: 'com.milerecover.app.pro.annual',
    planId: 'pro',
    period: 'annual',
    oneTime: false,
  },
  {
    kind: 'rescue_90',
    androidProductId: 'milerecover_rescue_90',
    iosProductId: 'com.milerecover.app.rescue.90',
    planId: 'rescue',
    oneTime: true,
  },
  {
    kind: 'rescue_year',
    androidProductId: 'milerecover_rescue_year',
    iosProductId: 'com.milerecover.app.rescue.year',
    planId: 'rescue',
    oneTime: true,
  },
];

export function storeProductFor(
  kind: StoreProductKind,
): StoreProductContract | undefined {
  return STORE_PRODUCTS.find((product) => product.kind === kind);
}
