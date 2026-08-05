import { Platform } from 'react-native';
import {
  createFreeEntitlement,
  type EntitlementSnapshot,
  type PlanId,
} from '@milerecover/domain';
import { STORE_PRODUCTS, storeProductFor, type StoreProductKind } from './storeProducts';

/**
 * Billing architecture decision
 * ----------------------------
 * Direct Google Play Billing + StoreKit 2 with a secure entitlement verifier
 * is the target. Until store products and backend verification are configured,
 * `getPurchasePort()` returns StoreUnavailablePurchasePort so the UI stays
 * truthful: no fake Plus, no silent trial, no local paid toggle.
 *
 * Optional RevenueCat (or similar) may wrap the same PurchasePort contract
 * later without changing screens — never embed store secrets in the client.
 */

export type PurchasePeriod = 'monthly' | 'annual';

export interface PurchaseProduct {
  id: string;
  planId: Exclude<PlanId, 'free'> | 'rescue';
  title: string;
  priceLocalized: string;
  period?: PurchasePeriod;
  oneTime?: boolean;
  introductoryTrialDays?: number;
}

export type PurchaseFailureReason =
  | 'store_unavailable'
  | 'cancelled'
  | 'failed'
  | 'pending'
  | 'not_eligible';

export type PurchaseResult =
  | {
      ok: true;
      entitlement: EntitlementSnapshot;
      productId?: string;
    }
  | {
      ok: false;
      reason: PurchaseFailureReason;
      message: string;
    };

export interface PurchasePort {
  getProducts(): Promise<PurchaseProduct[]>;
  purchasePlusTrial(period: PurchasePeriod): Promise<PurchaseResult>;
  purchasePlus(period: PurchasePeriod): Promise<PurchaseResult>;
  purchasePro(period: PurchasePeriod): Promise<PurchaseResult>;
  purchaseRescue(id: string): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
  refreshEntitlement(): Promise<EntitlementSnapshot>;
}

export const STORE_UNAVAILABLE_MESSAGE =
  'Purchases aren’t available in this preview build. Your Free plan remains active.';

export const PREVIEW_BILLING_NOTICE = 'Purchases are disabled in this preview.';

function productKindForPlus(period: PurchasePeriod): StoreProductKind {
  return period === 'annual' ? 'plus_annual' : 'plus_monthly';
}

function productKindForPro(period: PurchasePeriod): StoreProductKind {
  return period === 'annual' ? 'pro_annual' : 'pro_monthly';
}

function platformProductId(kind: StoreProductKind): string {
  const contract = storeProductFor(kind);
  if (!contract) return kind;
  return Platform.OS === 'ios' ? contract.iosProductId : contract.androidProductId;
}

/** Catalog metadata for UI when the store has not returned localized prices yet. */
export function catalogProductIds(): string[] {
  return STORE_PRODUCTS.map((product) =>
    Platform.OS === 'ios' ? product.iosProductId : product.androidProductId,
  );
}

export class StoreUnavailablePurchasePort implements PurchasePort {
  async getProducts(): Promise<PurchaseProduct[]> {
    return [];
  }

  async purchasePlusTrial(_period: PurchasePeriod): Promise<PurchaseResult> {
    return this.unavailable();
  }

  async purchasePlus(_period: PurchasePeriod): Promise<PurchaseResult> {
    return this.unavailable();
  }

  async purchasePro(_period: PurchasePeriod): Promise<PurchaseResult> {
    return this.unavailable();
  }

  async purchaseRescue(_id: string): Promise<PurchaseResult> {
    return this.unavailable();
  }

  async restore(): Promise<PurchaseResult> {
    return {
      ok: false,
      reason: 'store_unavailable',
      message: STORE_UNAVAILABLE_MESSAGE,
    };
  }

  async refreshEntitlement(): Promise<EntitlementSnapshot> {
    return createFreeEntitlement();
  }

  private unavailable(): PurchaseResult {
    return {
      ok: false,
      reason: 'store_unavailable',
      message: STORE_UNAVAILABLE_MESSAGE,
    };
  }
}

const storeUnavailablePurchasePort = new StoreUnavailablePurchasePort();

/**
 * Production builds use RevenueCat when API keys + enableStorePurchases are set.
 * Until then, never grant paid entitlement from the client alone.
 */
let injectedPort: PurchasePort | null = null;

export function setPurchasePortForTests(port: PurchasePort | null): void {
  injectedPort = port;
}

export function getPurchasePort(): PurchasePort {
  if (injectedPort) return injectedPort;
  try {
    // Lazy require avoids circular init and keeps tests free of native Purchases.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isRevenueCatConfigured, RevenueCatPurchasePort } = require('./revenueCatPurchases') as {
      isRevenueCatConfigured: () => boolean;
      RevenueCatPurchasePort: new () => PurchasePort;
    };
    if (isRevenueCatConfigured()) return new RevenueCatPurchasePort();
  } catch {
    // Fall through to unavailable.
  }
  return storeUnavailablePurchasePort;
}

export function resolvePlusProductId(period: PurchasePeriod): string {
  return platformProductId(productKindForPlus(period));
}

export function resolveProProductId(period: PurchasePeriod): string {
  return platformProductId(productKindForPro(period));
}

export function trialRenewalCopy(price: string | null, endsAt: number | null): string {
  const amount = price ?? 'the plan price';
  if (!endsAt) {
    return `Then ${amount}/month unless cancelled. Cancel anytime in Google Play or App Store settings.`;
  }
  const date = new Date(endsAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Then ${amount}/month starting ${date}, unless cancelled. Cancel anytime in Google Play or App Store settings.`;
}
