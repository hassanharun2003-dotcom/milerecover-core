import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  createFreeEntitlement,
  type EntitlementSnapshot,
  type PlanId,
} from '@milerecover/domain';
import {
  STORE_UNAVAILABLE_MESSAGE,
  type PurchasePeriod,
  type PurchasePort,
  type PurchaseProduct,
  type PurchaseResult,
  resolvePlusProductId,
  resolveProProductId,
} from './purchases';
import { storeProductFor } from './storeProducts';

/**
 * RevenueCat-backed PurchasePort.
 * Activates only when a public SDK key is present in config/env.
 * Preview builds without a key keep the unavailable port (no fake entitlements).
 *
 * Handles: monthly/annual Plus & Pro, one-time rescue, restore, upgrade/downgrade
 * via store subscription groups, already-subscribed, cancel/expire via customer info,
 * offline/pending as failure reasons — never grants Plus from local toggles alone.
 */

type RcExtra = {
  revenueCatAppleApiKey?: string;
  revenueCatGoogleApiKey?: string;
  enableStorePurchases?: boolean;
};

function appVariant(): string {
  return (
    process.env.APP_VARIANT ||
    (Constants.expoConfig?.extra as { appVariant?: string } | undefined)?.appVariant ||
    'development'
  );
}

function rcKeys(): { apple?: string; google?: string; forceEnable: boolean; variant: string } {
  const extra = (Constants.expoConfig?.extra ?? {}) as RcExtra;
  return {
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? extra.revenueCatAppleApiKey,
    google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? extra.revenueCatGoogleApiKey,
    forceEnable: Boolean(extra.enableStorePurchases) || process.env.EXPO_PUBLIC_ENABLE_STORE_PURCHASES === '1',
    variant: appVariant(),
  };
}

/**
 * Production: platform SDK key alone enables live purchases.
 * Preview/dev: require explicit enableStorePurchases (or EXPO_PUBLIC_ENABLE_STORE_PURCHASES=1)
 * so internal APKs stay purchase-safe until products are ready.
 */
export function isRevenueCatConfigured(): boolean {
  const keys = rcKeys();
  const platformKey = Platform.OS === 'ios' ? keys.apple : keys.google;
  if (!platformKey) return false;
  if (keys.variant === 'production') return true;
  return keys.forceEnable;
}

export function isPreviewBillingBuild(): boolean {
  const keys = rcKeys();
  const platformKey = Platform.OS === 'ios' ? keys.apple : keys.google;
  if (keys.variant === 'production') return false;
  return !keys.forceEnable || !platformKey;
}

function mapEntitlement(info: {
  entitlements?: { active?: Record<string, { productIdentifier?: string; expirationDate?: string | null }> };
}): EntitlementSnapshot {
  const active = info.entitlements?.active ?? {};
  const plus = active.plus ?? active.Plus;
  const pro = active.pro ?? active.Pro;
  const now = Date.now();
  if (pro) {
    return {
      ...createFreeEntitlement(now),
      planId: 'pro' as PlanId,
      status: 'proActive',
      storeVerified: true,
      trialEligible: false,
      source: 'store',
      productId: pro.productIdentifier ?? null,
      renewsAt: pro.expirationDate ? Date.parse(pro.expirationDate) : null,
      lastVerifiedAt: now,
    };
  }
  if (plus) {
    return {
      ...createFreeEntitlement(now),
      planId: 'plus' as PlanId,
      status: 'plusActive',
      storeVerified: true,
      trialEligible: false,
      source: 'store',
      productId: plus.productIdentifier ?? null,
      renewsAt: plus.expirationDate ? Date.parse(plus.expirationDate) : null,
      lastVerifiedAt: now,
    };
  }
  return createFreeEntitlement(now);
}

function mapError(error: unknown): PurchaseResult {
  const code = String((error as { code?: string })?.code ?? '');
  const message = String((error as { message?: string })?.message ?? '');
  if (/cancel/i.test(code) || /cancel/i.test(message)) {
    return { ok: false, reason: 'cancelled', message: 'Purchase cancelled.' };
  }
  if (/network|offline/i.test(code) || /network|offline/i.test(message)) {
    return { ok: false, reason: 'failed', message: 'You’re offline. Try again when you have a connection.' };
  }
  if (/pending/i.test(code) || /pending/i.test(message)) {
    return { ok: false, reason: 'pending', message: 'Purchase is pending store confirmation.' };
  }
  if (/already|subscribed/i.test(message)) {
    return { ok: false, reason: 'not_eligible', message: 'You’re already subscribed on this store account.' };
  }
  return {
    ok: false,
    reason: 'failed',
    message: 'We couldn’t complete that purchase. Please try again.',
  };
}

export class RevenueCatPurchasePort implements PurchasePort {
  private configured = false;

  private async ensureConfigured(): Promise<boolean> {
    if (!isRevenueCatConfigured()) return false;
    if (this.configured) return true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require('react-native-purchases').default as {
        configure: (opts: { apiKey: string; appUserID?: string | null }) => void;
        setLogLevel?: (level: unknown) => void;
      };
      const keys = rcKeys();
      const apiKey = Platform.OS === 'ios' ? keys.apple : keys.google;
      if (!apiKey) return false;
      Purchases.configure({ apiKey });
      this.configured = true;
      return true;
    } catch {
      return false;
    }
  }

  async getProducts(): Promise<PurchaseProduct[]> {
    if (!(await this.ensureConfigured())) return [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require('react-native-purchases').default as {
        getOfferings: () => Promise<{
          current?: {
            availablePackages?: Array<{
              product: { identifier: string; title: string; priceString: string };
              packageType?: string;
            }>;
          };
        }>;
      };
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      return packages.map((pkg) => {
        const id = pkg.product.identifier;
        const isAnnual = /annual|year/i.test(id) || pkg.packageType === 'ANNUAL';
        const isPro = /pro/i.test(id);
        const isRescue = /rescue/i.test(id);
        return {
          id,
          planId: isRescue ? 'rescue' : isPro ? 'pro' : 'plus',
          title: pkg.product.title,
          priceLocalized: pkg.product.priceString,
          period: isRescue ? undefined : isAnnual ? 'annual' : 'monthly',
          oneTime: isRescue,
        } as PurchaseProduct;
      });
    } catch {
      return [];
    }
  }

  private async purchaseProductId(productId: string): Promise<PurchaseResult> {
    if (!(await this.ensureConfigured())) {
      return { ok: false, reason: 'store_unavailable', message: STORE_UNAVAILABLE_MESSAGE };
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require('react-native-purchases').default as {
        purchaseProduct: (id: string) => Promise<{ customerInfo: Parameters<typeof mapEntitlement>[0] }>;
      };
      const { customerInfo } = await Purchases.purchaseProduct(productId);
      return { ok: true, entitlement: mapEntitlement(customerInfo), productId };
    } catch (error) {
      return mapError(error);
    }
  }

  async purchasePlusTrial(period: PurchasePeriod): Promise<PurchaseResult> {
    return this.purchasePlus(period);
  }

  async purchasePlus(period: PurchasePeriod): Promise<PurchaseResult> {
    return this.purchaseProductId(resolvePlusProductId(period));
  }

  async purchasePro(period: PurchasePeriod): Promise<PurchaseResult> {
    return this.purchaseProductId(resolveProProductId(period));
  }

  async purchaseRescue(id: string): Promise<PurchaseResult> {
    const contract = storeProductFor(id === 'rescue_year' ? 'rescue_year' : 'rescue_90');
    const productId =
      Platform.OS === 'ios' ? contract?.iosProductId ?? id : contract?.androidProductId ?? id;
    return this.purchaseProductId(productId);
  }

  async restore(): Promise<PurchaseResult> {
    if (!(await this.ensureConfigured())) {
      return { ok: false, reason: 'store_unavailable', message: STORE_UNAVAILABLE_MESSAGE };
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require('react-native-purchases').default as {
        restorePurchases: () => Promise<Parameters<typeof mapEntitlement>[0]>;
      };
      const info = await Purchases.restorePurchases();
      const entitlement = mapEntitlement(info);
      if (entitlement.planId === 'free') {
        return {
          ok: false,
          reason: 'failed',
          message: 'No active purchases found for this store account.',
        };
      }
      return { ok: true, entitlement };
    } catch (error) {
      return mapError(error);
    }
  }

  async refreshEntitlement(): Promise<EntitlementSnapshot> {
    if (!(await this.ensureConfigured())) return createFreeEntitlement();
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Purchases = require('react-native-purchases').default as {
        getCustomerInfo: () => Promise<Parameters<typeof mapEntitlement>[0]>;
      };
      return mapEntitlement(await Purchases.getCustomerInfo());
    } catch {
      return createFreeEntitlement();
    }
  }
}
