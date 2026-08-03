import {
  calculateProtectionHealth,
  type PermissionSnapshot,
  type ProtectionHealthResult,
} from '@milerecover/domain';
import type { MileRecoverAppState } from '../store/types';

export interface HomeViewModel {
  protection: ProtectionHealthResult;
  todaySummary: string;
  periodProtectedMiles: number;
  pendingReviewCount: number;
  showAlert: boolean;
  alertMessage: string | null;
  dataState: 'empty' | 'ready' | 'stale' | 'error';
}

export function selectHomeViewModel(
  state: MileRecoverAppState,
  permissions: PermissionSnapshot,
  now: number = Date.now()
): HomeViewModel {
  const protection = calculateProtectionHealth({
    permissions,
    trackingEngineState: state.trackingEngineState,
    lastConfirmedCaptureAt: state.lastConfirmedCaptureAt,
    lastSyncAt: state.lastSyncAt,
    now,
    pendingReviewCount: state.reviewItems.length,
  });

  const confirmedMiles = state.periodConfirmedBusinessMiles;
  const hasTripsToday = state.tripsTodayCount > 0;

  let todaySummary = 'No drives recorded today yet.';
  if (hasTripsToday) {
    todaySummary = `${state.tripsTodayCount} drive(s) captured today — review when ready.`;
  } else if (protection.level === 'protected') {
    todaySummary = 'Drive normally — we will surface trips in Review.';
  }

  const dataState = state.loadError
    ? 'error'
    : state.hydrated
      ? state.dataStale
        ? 'stale'
        : 'ready'
      : 'empty';

  const showAlert =
    protection.primaryAction !== 'none' ||
    dataState === 'error' ||
    dataState === 'stale';

  let alertMessage: string | null = null;
  if (dataState === 'error') alertMessage = state.loadError;
  else if (dataState === 'stale') alertMessage = 'Your mileage data may be out of date.';
  else if (protection.primaryAction === 'fix_permissions') alertMessage = protection.userDetail;
  else if (protection.primaryAction === 'review_trips') {
    alertMessage = `${state.reviewItems.length} item(s) need review.`;
  }

  return {
    protection,
    todaySummary,
    periodProtectedMiles: confirmedMiles,
    pendingReviewCount: state.reviewItems.length,
    showAlert,
    alertMessage,
    dataState,
  };
}
