export type PlanId = 'free' | 'plus' | 'pro';

export type EntitlementStatus =
  | 'free'
  | 'trialEligible'
  | 'trialPendingPurchase'
  | 'trialActive'
  | 'plusActive'
  | 'proActive'
  | 'gracePeriod'
  | 'billingRetry'
  | 'expired'
  | 'cancelledButActiveUntilPeriodEnd'
  | 'revoked'
  | 'unknown';

export type TrialOfferTrigger =
  | 'first_confirmed_work_drive'
  | 'first_report_preview'
  | 'first_recovery_candidate'
  | 'first_exported_report'
  | 'five_confirmed_work_drives'
  | 'first_possible_missing_trip'
  | 'enable_automatic_protection'
  | 'plus_only_capability'
  | 'import_ready_for_protection';

export interface EntitlementSnapshot {
  status: EntitlementStatus;
  planId: PlanId;
  /** Store-derived only — never grant from UI alone */
  storeVerified: boolean;
  trialEligible: boolean;
  trialEndsAt: number | null;
  renewsAt: number | null;
  monthlyPriceLocalized: string | null;
  annualPriceLocalized: string | null;
  productId: string | null;
  lastVerifiedAt: number | null;
  source: 'store' | 'cache' | 'default' | 'demo';
}

/** Locked Free automatic capture allowance per calendar month. */
export const FREE_AUTOMATIC_TRIP_LIMIT = 40;
/** Locked Free missing-trip scans per calendar month. */
export const FREE_MISSING_SCAN_LIMIT = 1;

export interface CapabilitySet {
  /**
   * Whether automatic capture may run at all for this plan.
   * Free: true (subject to FREE_AUTOMATIC_TRIP_LIMIT).
   * Plus/Pro/trial: true when store-verified (or demo).
   */
  canUseAutomaticCapture: boolean;
  /** null = unlimited (Plus/Pro). Free = 40/calendar month. */
  automaticTripLimit: number | null;
  canUseGapDetection: boolean;
  /** null = unlimited recurring scans (Plus+). Free = 1/calendar month. */
  missingScanLimit: number | null;
  canUseStandardPdf: boolean;
  canUseAdvancedReports: boolean;
  canUseAdvancedRecovery: boolean;
  canAddVehicle: boolean;
  canAddWorkplace: boolean;
  canUseCustomReimbursement: boolean;
  canUseProfessionalShare: boolean;
  csvExportEnabled: boolean;
  pdfExportEnabled: boolean;
  maxVehicles: number;
  maxWorkplaces: number;
}

export function createFreeEntitlement(now = Date.now()): EntitlementSnapshot {
  return {
    status: 'free',
    planId: 'free',
    storeVerified: true,
    trialEligible: true,
    trialEndsAt: null,
    renewsAt: null,
    monthlyPriceLocalized: null,
    annualPriceLocalized: null,
    productId: null,
    lastVerifiedAt: now,
    source: 'default',
  };
}

export function capabilitiesForEntitlement(entitlement: EntitlementSnapshot): CapabilitySet {
  const plusLike =
    entitlement.planId === 'plus' ||
    entitlement.planId === 'pro' ||
    entitlement.status === 'trialActive' ||
    entitlement.status === 'plusActive' ||
    entitlement.status === 'proActive' ||
    entitlement.status === 'gracePeriod' ||
    entitlement.status === 'cancelledButActiveUntilPeriodEnd';
  const proLike = entitlement.planId === 'pro' || entitlement.status === 'proActive';

  // Demo entitlements can preview paid UX but must be marked source:'demo'
  const paid = plusLike && (entitlement.storeVerified || entitlement.source === 'demo');
  const isFree = !paid;

  return {
    /**
     * Free includes automatic capture up to FREE_AUTOMATIC_TRIP_LIMIT/month.
     * Paid plans are unlimited. Unverified Plus cache does not unlock unlimited auto.
     */
    canUseAutomaticCapture: isFree || paid,
    automaticTripLimit: paid ? null : FREE_AUTOMATIC_TRIP_LIMIT,
    /** Basic gap recovery stays free — one scan/month on Free. */
    canUseGapDetection: true,
    missingScanLimit: paid ? null : FREE_MISSING_SCAN_LIMIT,
    canUseStandardPdf: paid,
    canUseAdvancedReports: proLike && (entitlement.storeVerified || entitlement.source === 'demo'),
    canUseAdvancedRecovery: proLike && (entitlement.storeVerified || entitlement.source === 'demo'),
    canAddVehicle: true,
    canAddWorkplace: true,
    canUseCustomReimbursement: proLike && (entitlement.storeVerified || entitlement.source === 'demo'),
    canUseProfessionalShare: proLike && (entitlement.storeVerified || entitlement.source === 'demo'),
    csvExportEnabled: true,
    pdfExportEnabled: paid,
    maxVehicles: paid ? 20 : 1,
    maxWorkplaces: paid ? 50 : 2,
  };
}

/** Free remains usable — never hide user-owned records. */
export function freePlanPreservesRecords(): true {
  return true;
}

export function shouldOfferTrial(
  entitlement: EntitlementSnapshot,
  trigger: TrialOfferTrigger,
  caps: { lastOfferAt: number | null; dismissedSession: boolean; now?: number },
): boolean {
  if (!entitlement.trialEligible) return false;
  if (entitlement.status !== 'free' && entitlement.status !== 'trialEligible') return false;
  if (caps.dismissedSession) return false;
  const now = caps.now ?? Date.now();
  if (caps.lastOfferAt != null && now - caps.lastOfferAt < 3 * 86400000) return false;
  void trigger;
  return true;
}

export function applyStorePurchaseResult(
  previous: EntitlementSnapshot,
  result: {
    ok: boolean;
    planId?: PlanId;
    trial?: boolean;
    trialEndsAt?: number | null;
    renewsAt?: number | null;
    productId?: string | null;
    monthlyPriceLocalized?: string | null;
  },
  now = Date.now(),
): EntitlementSnapshot {
  if (!result.ok || !result.planId || result.planId === 'free') {
    return { ...previous, status: 'free', planId: 'free', storeVerified: true, lastVerifiedAt: now, source: 'store' };
  }
  if (result.trial) {
    return {
      ...previous,
      status: 'trialActive',
      planId: result.planId,
      storeVerified: true,
      trialEligible: false,
      trialEndsAt: result.trialEndsAt ?? now + 7 * 86400000,
      renewsAt: result.renewsAt ?? result.trialEndsAt ?? now + 7 * 86400000,
      productId: result.productId ?? null,
      monthlyPriceLocalized: result.monthlyPriceLocalized ?? previous.monthlyPriceLocalized,
      lastVerifiedAt: now,
      source: 'store',
    };
  }
  return {
    ...previous,
    status: result.planId === 'pro' ? 'proActive' : 'plusActive',
    planId: result.planId,
    storeVerified: true,
    trialEligible: false,
    trialEndsAt: null,
    renewsAt: result.renewsAt ?? null,
    productId: result.productId ?? null,
    monthlyPriceLocalized: result.monthlyPriceLocalized ?? previous.monthlyPriceLocalized,
    lastVerifiedAt: now,
    source: 'store',
  };
}

export function expireTrialIfNeeded(
  entitlement: EntitlementSnapshot,
  now = Date.now(),
): EntitlementSnapshot {
  if (entitlement.status !== 'trialActive' || entitlement.trialEndsAt == null) return entitlement;
  if (now < entitlement.trialEndsAt) return entitlement;
  // Without store confirmation of renewal, fall back to Free — never invent paid renewal.
  return {
    ...createFreeEntitlement(now),
    trialEligible: false,
    status: 'expired',
    storeVerified: entitlement.storeVerified,
    source: entitlement.source === 'demo' ? 'demo' : 'store',
  };
}
