import { createFreeEntitlement, type EntitlementSnapshot, type PlanId } from '@milerecover/domain';

export type PurchasePeriod = 'monthly' | 'annual';

export interface PurchaseProduct {
  id: string;
  planId: Exclude<PlanId, 'free'> | 'rescue';
  title: string;
  priceLocalized: string;
  period?: PurchasePeriod;
}

export type PurchaseFailureReason = 'store_unavailable' | 'cancelled' | 'failed';

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

const STORE_UNAVAILABLE_MESSAGE =
  'Billing is not configured for this build. Your plan stays Free until a real store purchase is available.';

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
    return this.unavailable();
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

export function getPurchasePort(): PurchasePort {
  return storeUnavailablePurchasePort;
}

export function trialRenewalCopy(price: string | null, endsAt: number | null): string {
  const amount = price ?? 'the plan price';
  if (!endsAt) {
    return `Trial renews at ${amount} unless cancelled before renewal.`;
  }
  const date = new Date(endsAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Trial ends ${date}, then renews at ${amount} unless cancelled before renewal.`;
}
