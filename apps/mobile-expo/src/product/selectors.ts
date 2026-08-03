import { prioritizeReviewItems, type PermissionSnapshot, type ReviewItem, type TripRecord } from '@milerecover/domain';
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
}

function confirmedDrives(appState: MileRecoverAppState, product: ProductUiState): TripRecord[] {
  return appState.trips.filter((t) => t.status === 'confirmed' && t.classification === 'business');
}

function liveReviewItems(appState: MileRecoverAppState): ReviewItem[] {
  return appState.reviewItems;
}

function buildLiveScenario(
  appState: MileRecoverAppState,
  product: ProductUiState,
  permissions: PermissionSnapshot,
): ScenarioPresentation {
  const voice = voiceForDrivingType(product.drivingType);
  const pending = liveReviewItems(appState).filter((item) => !product.reviewDecisions[item.id]);
  const confirmed = confirmedDrives(appState, product);
  const manualMiles = product.manualTrips.reduce((sum, t) => sum + t.distanceMiles, 0);
  const confirmedMiles =
    confirmed.reduce((sum, t) => sum + t.distanceMiles, 0) + manualMiles;
  const trackingEngineReady = false; // not shipped this milestone
  const locationOk = permissions.location === 'granted';
  const backgroundOk = permissions.backgroundLocation === 'granted';
  // Only surface a live “needs attention” health problem when capture can actually run.
  const protectionLimited =
    product.protectionSetupState === 'limited' ||
    (trackingEngineReady &&
      product.protectionSetupState === 'configured' &&
      (!locationOk || !backgroundOk));
  const protectionConfigured =
    product.protectionSetupState === 'configured' ||
    product.protectionSetupState === 'healthy' ||
    product.protectionSetupState === 'limited';

  let homeTitle: string;
  let homeDetail: string;
  let homeState: ScenarioPresentation['homeState'] = 'healthy';
  let primaryAction: string | null = null;
  let primaryActionRoute: ScenarioPresentation['primaryActionRoute'];
  let proofReady = false;
  let proofBlockReason: string | null = null;

  if (!protectionConfigured || product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated') {
    homeTitle = 'Finish setting up protection';
    homeDetail = trackingEngineReady
      ? 'One step remains before MileRecover can watch future drives.'
      : 'Learn what protection needs—then enable access when tracking is available. We never claim coverage we can’t provide.';
    primaryAction = 'Continue setup';
    primaryActionRoute = 'ProtectionAlert';
    homeState = 'protection_limited';
    proofBlockReason = 'Add or confirm work drives before a report can be ready.';
  } else if (protectionLimited) {
    homeTitle = 'Protection needs attention';
    homeDetail = 'Background access is off, so a drive could be missed. What’s already saved stays put.';
    primaryAction = 'Fix protection';
    primaryActionRoute = 'ProtectionAlert';
    homeState = 'protection_limited';
    proofBlockReason = pending.length
      ? 'Review open items, then fix protection when you can.'
      : 'Fix protection so new drives stay covered.';
  } else if (pending.length > 0) {
    homeTitle = pending.length === 1 ? 'One drive needs you' : `${pending.length} drives need you`;
    homeDetail = 'About ten seconds to confirm each one.';
    primaryAction = 'Review drive';
    primaryActionRoute = 'Review';
    homeState = 'recovery_available';
    proofBlockReason = 'Review one item before sharing.';
  } else if (confirmed.length === 0 && product.manualTrips.length === 0) {
    homeTitle = 'You’re ready for your first work drive';
    homeDetail = trackingEngineReady
      ? 'MileRecover will keep the record once tracking begins.'
      : `When automatic capture arrives, your ${voice.workNoun} drives will be watched. Until then, add drives you remember—we never invent miles.`;
    primaryAction = null;
    homeState = 'healthy';
    proofBlockReason = 'No confirmed drives yet.';
  } else {
    homeTitle = 'You’re covered today';
    homeDetail =
      confirmed.length + product.manualTrips.length === 1
        ? 'Your latest work drive was saved.'
        : `${confirmed.length + product.manualTrips.length} confirmed work drives are on record.`;
    primaryAction = null;
    homeState = 'healthy';
    proofReady = pending.length === 0 && confirmedMiles > 0;
    proofBlockReason = proofReady ? null : 'Confirm work drives before sharing.';
  }

  if (pending.length === 0 && confirmedMiles > 0) {
    proofReady = true;
    proofBlockReason = null;
  }

  const activity =
    confirmed.length > 0
      ? confirmed.slice(0, 3).map((t) => ({
          id: t.id,
          kind: 'drive_recorded' as const,
          title: 'Saved a drive',
          subtitle: `${t.distanceMiles.toFixed(1)} mi`,
          timestamp: t.endAt ?? t.startAt,
        }))
      : product.manualTrips.slice(0, 3).map((t) => ({
          id: t.id,
          kind: 'drive_recorded' as const,
          title: 'Saved a drive',
          subtitle: `${t.purpose} · ${t.distanceMiles.toFixed(1)} mi`,
          timestamp: t.createdAt,
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
      recoveredMiles: 0,
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
): ProductExperience {
  const liveMode = !product.demoModeEnabled;
  const scenario = liveMode
    ? buildLiveScenario(appState, product, permissions)
    : DEMO_SCENARIOS[product.demoScenario] ?? DEMO_SCENARIOS.new_user;

  const baseItems = liveMode
    ? liveReviewItems(appState)
    : appState.reviewItems.length > 0
      ? appState.reviewItems
      : scenario.reviewItems;

  const activeReviewItems = prioritizeReviewItems(
    baseItems.filter((item) => !product.reviewDecisions[item.id]),
  );

  return {
    scenario: liveMode
      ? { ...scenario, reviewItems: activeReviewItems }
      : scenario,
    activeReviewItems,
    pendingReviewCount: activeReviewItems.length,
    reviewedCount: product.reviewedHistory.length,
    liveMode,
    secondaryAction: secondaryHomeActionForGoal(product.primaryGoal),
    voice: voiceForDrivingType(product.drivingType),
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
