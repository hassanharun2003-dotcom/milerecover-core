import {
  isConfirmedWorkTrip,
  prioritizeReviewItems,
  type PermissionSnapshot,
  type TripRecord,
} from '@milerecover/domain';
import { DEMO_SCENARIOS, type ScenarioPresentation } from '../fixtures/scenarios';
import type { MileRecoverAppState } from '../store/types';
import { secondaryHomeActionForGoal, voiceForDrivingType } from './copy';
import type { ProductUiState, ReviewDecision } from './types';

export interface ProductExperience {
  scenario: ScenarioPresentation;
  activeReviewItems: ReturnType<typeof prioritizeReviewItems>;
  pendingReviewCount: number;
  reviewedCount: number;
  liveMode: boolean;
  secondaryAction: ReturnType<typeof secondaryHomeActionForGoal>;
  voice: ReturnType<typeof voiceForDrivingType>;
  confirmedTrips: TripRecord[];
  latestConfirmed: TripRecord | null;
}

function buildLiveScenario(
  appState: MileRecoverAppState,
  product: ProductUiState,
  permissions: PermissionSnapshot,
  automaticCaptureAvailable: boolean,
): ScenarioPresentation {
  const voice = voiceForDrivingType(product.drivingType);
  const pending = prioritizeReviewItems(
    appState.reviewItems.filter((item) => !product.reviewDecisions[item.id]),
  );
  const confirmed = appState.trips.filter(isConfirmedWorkTrip);
  const confirmedMiles = confirmed.reduce((sum, t) => sum + t.distanceMiles, 0);
  const recoveredMiles = confirmed
    .filter((t) => t.source === 'recovered')
    .reduce((sum, t) => sum + t.distanceMiles, 0);
  const locationOk = permissions.location === 'granted';
  const backgroundOk = permissions.backgroundLocation === 'granted';
  const protectionConfigured =
    product.protectionSetupState === 'configured' ||
    product.protectionSetupState === 'healthy' ||
    product.protectionSetupState === 'limited';
  const protectionLimited =
    product.protectionSetupState === 'limited' ||
    (automaticCaptureAvailable &&
      product.protectionSetupState === 'configured' &&
      (!locationOk || !backgroundOk));

  let homeTitle: string;
  let homeDetail: string;
  let homeState: ScenarioPresentation['homeState'] = 'healthy';
  let primaryAction: string | null = null;
  let primaryActionRoute: ScenarioPresentation['primaryActionRoute'];
  let proofReady = false;
  let proofBlockReason: string | null = null;

  if (
    !protectionConfigured ||
    product.protectionSetupState === 'not_started' ||
    product.protectionSetupState === 'educated'
  ) {
    homeTitle = 'Finish setting up protection';
    homeDetail = automaticCaptureAvailable
      ? 'One step remains before MileRecover can watch future drives.'
      : 'Automatic capture is unavailable in this preview. You can still log drives, review uncertain miles, and build reports.';
    primaryAction = 'Continue setup';
    primaryActionRoute = 'ProtectionAlert';
    homeState = 'protection_limited';
    proofBlockReason = confirmed.length
      ? null
      : 'Add or confirm work drives before a report can be ready.';
  } else if (protectionLimited) {
    homeTitle = 'Protection needs attention';
    homeDetail = 'Background access is off, so a drive could be missed. What’s already saved stays put.';
    primaryAction = 'Fix protection';
    primaryActionRoute = 'ProtectionAlert';
    homeState = 'protection_limited';
    proofBlockReason = pending.length ? 'Review one item before sharing.' : null;
  } else if (pending.length > 0) {
    homeTitle = pending.length === 1 ? 'One drive needs you' : `${pending.length} drives need you`;
    homeDetail = 'About ten seconds to confirm each one.';
    primaryAction = 'Review drive';
    primaryActionRoute = 'Review';
    homeState = 'recovery_available';
    proofBlockReason = 'Review one item before sharing.';
  } else if (confirmed.length === 0) {
    homeTitle = automaticCaptureAvailable
      ? 'You’re ready for your first work drive'
      : 'Log your first work drive';
    homeDetail = automaticCaptureAvailable
      ? 'MileRecover will keep the record once tracking begins.'
      : `Manually logged ${voice.workNoun} drives are protected in your record. Automatic capture is not active.`;
    primaryAction = 'Add a drive';
    primaryActionRoute = 'ManualTrip' as ScenarioPresentation['primaryActionRoute'];
    homeState = 'healthy';
    proofBlockReason = 'No confirmed drives yet.';
  } else if (automaticCaptureAvailable && locationOk && backgroundOk) {
    homeTitle = 'You’re covered today';
    homeDetail = 'Your latest work drive was saved.';
    primaryAction = null;
    homeState = 'healthy';
    proofReady = pending.length === 0 && confirmedMiles > 0;
    proofBlockReason = proofReady ? null : 'Confirm work drives before sharing.';
  } else {
    homeTitle = 'Your record is up to date';
    homeDetail =
      confirmed.length === 1
        ? 'Your latest work drive was saved.'
        : `${confirmed.length} confirmed work drives are on record.`;
    primaryAction = null;
    homeState = 'healthy';
    proofReady = pending.length === 0 && confirmedMiles > 0;
    proofBlockReason = proofReady ? null : 'Confirm work drives before sharing.';
  }

  if (pending.length === 0 && confirmedMiles > 0) {
    proofReady = true;
    proofBlockReason = null;
  }

  const activity = confirmed.slice(0, 5).map((t) => ({
    id: t.id,
    kind: 'drive_recorded' as const,
    title: t.purpose ?? 'Saved a drive',
    subtitle: `${t.distanceMiles.toFixed(1)} mi · ${t.source}`,
    timestamp: t.endAt ?? t.startAt,
  }));

  return {
    id: 'new_user',
    label: 'Live',
    homeState,
    homeTitle,
    homeDetail,
    primaryAction,
    primaryActionRoute,
    weekSummary: {
      milesProtected: confirmedMiles,
      recoveredMiles,
      milesReadyForProof: proofReady ? confirmedMiles : 0,
    },
    activity,
    trips: confirmed,
    reviewItems: pending,
    proofReady,
    proofBlockReason,
    periodMiles: confirmedMiles,
    tripsToday: appState.tripsTodayCount,
  };
}

export function selectProductExperience(
  appState: MileRecoverAppState,
  product: ProductUiState,
  permissions: PermissionSnapshot,
  automaticCaptureAvailable = false,
): ProductExperience {
  const liveMode = !product.demoModeEnabled;
  const scenario = liveMode
    ? buildLiveScenario(appState, product, permissions, automaticCaptureAvailable)
    : DEMO_SCENARIOS[product.demoScenario] ?? DEMO_SCENARIOS.new_user;

  const baseItems = liveMode
    ? appState.reviewItems
    : appState.reviewItems.length > 0
      ? appState.reviewItems
      : scenario.reviewItems;

  const activeReviewItems = prioritizeReviewItems(
    baseItems.filter((item) => !product.reviewDecisions[item.id]),
  );
  const confirmedTrips = liveMode
    ? appState.trips.filter(isConfirmedWorkTrip)
    : scenario.trips.filter(isConfirmedWorkTrip);

  return {
    scenario: liveMode ? { ...scenario, reviewItems: activeReviewItems } : scenario,
    activeReviewItems,
    pendingReviewCount: activeReviewItems.length,
    reviewedCount: product.reviewedHistory.length,
    liveMode,
    secondaryAction: secondaryHomeActionForGoal(product.primaryGoal),
    voice: voiceForDrivingType(product.drivingType),
    confirmedTrips,
    latestConfirmed: confirmedTrips[0] ?? null,
  };
}

export function reviewDecisionLabel(decision: ReviewDecision): string {
  switch (decision) {
    case 'work':
      return 'Work';
    case 'personal':
      return 'Personal';
    case 'not_drive':
      return 'Not a drive';
    default:
      return 'Pending';
  }
}
