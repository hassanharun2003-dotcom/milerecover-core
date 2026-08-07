/**
 * Canonical presentation selectors — screens must not recompute business values independently.
 */
import {
  buildMileageReportData,
  canCaptureAutomaticTrip,
  capabilitiesForEntitlement,
  describeAutomaticAllowance,
  estimatedValueCents,
  formatCurrencyCents,
  formatDistance,
  rateForTimestamp,
  resolveProtectionStatus,
  resolveReportPeriod,
  resolveTripEstimatedValue,
  sumEstimatedValueCents,
  type EntitlementSnapshot,
  type LocaleProfile,
  type PermissionSnapshot,
  type ProtectionStatusView,
  type ReportPeriodKind,
  type TripRecord,
} from '@milerecover/domain';
import type { ProductUiState } from './types';
import { selectProductExperience } from './selectors';
import type { MileRecoverAppState } from '../store/types';

export function selectAllowance(app: MileRecoverAppState, product: ProductUiState) {
  return describeAutomaticAllowance(product.entitlement, app.trips);
}

export function selectCanCaptureAutomatic(
  app: MileRecoverAppState,
  product: ProductUiState,
  now = Date.now(),
) {
  const caps = capabilitiesForEntitlement(product.entitlement);
  return (
    caps.canUseAutomaticCapture &&
    canCaptureAutomaticTrip(product.entitlement, app.trips, now)
  );
}

export function selectProtectionView(input: {
  app: MileRecoverAppState;
  product: ProductUiState;
  permissions: PermissionSnapshot;
  automaticCaptureAvailable: boolean;
  pendingReviewCount: number;
  offline?: boolean;
}): ProtectionStatusView {
  const caps = capabilitiesForEntitlement(input.product.entitlement);
  const setupIncomplete =
    input.product.protectionSetupState === 'not_started' ||
    input.product.protectionSetupState === 'educated';
  const allowanceOk = canCaptureAutomaticTrip(input.product.entitlement, input.app.trips);
  return resolveProtectionStatus({
    permissions: input.permissions,
    trackingEnabled: input.product.trackingEnabled,
    canUseAutomaticCapture: caps.canUseAutomaticCapture && input.automaticCaptureAvailable,
    trackingEngineState: input.app.trackingEngineState,
    lastConfirmedCaptureAt: input.app.lastConfirmedCaptureAt,
    lastSyncAt: input.app.lastSyncAt,
    pendingReviewCount: input.pendingReviewCount,
    setupIncomplete,
    offline: input.offline === true,
    automaticAllowanceExhausted: caps.canUseAutomaticCapture && !allowanceOk,
  });
}

export function selectPendingReviewCount(
  app: MileRecoverAppState,
  product: ProductUiState,
  permissions: PermissionSnapshot,
  automaticCaptureAvailable: boolean,
): number {
  return selectProductExperience(app, product, permissions, automaticCaptureAvailable).activeReviewItems
    .length;
}

/** Home period summary aligned to the same reporting period as Proof (default: this week). */
export function selectHomePeriodSummary(input: {
  trips: TripRecord[];
  locale: LocaleProfile;
  preferredName: string | null;
  primaryGoal: ProductUiState['primaryGoal'];
  periodKind?: ReportPeriodKind;
}) {
  const period = resolveReportPeriod(input.periodKind ?? 'this_week');
  const report = buildMileageReportData({
    trips: input.trips,
    period,
    userName: input.preferredName,
    mileageUseType: null,
    primaryGoal: input.primaryGoal,
    localeProfile: input.locale,
  });
  const confirmedWork = input.trips.filter(
    (trip) =>
      trip.status === 'confirmed' &&
      trip.classification === 'business' &&
      trip.startAt >= period.startAt &&
      trip.startAt <= period.endAt,
  );
  const recoveredMiles = confirmedWork
    .filter((trip) => trip.source === 'recovered')
    .reduce((sum, trip) => sum + trip.distanceMiles, 0);
  const snapshotTotal = sumEstimatedValueCents(confirmedWork, input.locale);
  const currentRate = rateForTimestamp(input.locale.rates, Date.now());
  const rateUsable = currentRate != null && !input.locale.activeRateNeedsReview;
  const estimated =
    snapshotTotal ??
    (rateUsable && currentRate
      ? estimatedValueCents(report.totalMiles, currentRate.centsPerMile)
      : null);
  const missingHistorical = confirmedWork.some(
    (trip) => resolveTripEstimatedValue(trip, input.locale).missingHistoricalRate,
  );

  return {
    periodLabel: period.label,
    periodKind: period.kind,
    workMiles: report.totalMiles,
    workDistanceLabel: formatDistance(
      report.totalMiles,
      input.locale.distanceUnit,
      input.locale.localeTag,
      1,
    ),
    recoveredMiles,
    recoveredDistanceLabel: formatDistance(
      recoveredMiles,
      input.locale.distanceUnit,
      input.locale.localeTag,
      1,
    ),
    estimatedValueCents: estimated,
    estimatedValueLabel:
      estimated != null
        ? formatCurrencyCents(estimated, input.locale.currencyCode, input.locale.localeTag)
        : missingHistorical || input.locale.activeRateNeedsReview
          ? 'Review rate'
          : '—',
    tripCount: report.tripCount,
    missingHistoricalRate: missingHistorical,
  };
}

export function selectEntitlementPlanLabel(entitlement: EntitlementSnapshot): string {
  if (entitlement.planId === 'free') return 'Free';
  if (entitlement.status === 'trialActive') return `${entitlement.planId.toUpperCase()} trial`;
  return entitlement.planId.toUpperCase();
}
