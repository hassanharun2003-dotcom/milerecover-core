import type { OnboardingProgress, ReviewItem, TripRecord, AppStartupPhase, RecoveryCandidate } from '@milerecover/domain';
import type { TrackingEngineState } from '@milerecover/domain';

export interface MileRecoverAppState {
  hydrated: boolean;
  startupPhase: AppStartupPhase;
  loadError: string | null;
  dataStale: boolean;
  onboardingComplete: boolean;
  onboarding: OnboardingProgress;
  trackingEngineState: TrackingEngineState;
  lastConfirmedCaptureAt: number | null;
  lastSyncAt: number | null;
  trips: TripRecord[];
  recoveryCandidates: RecoveryCandidate[];
  reviewItems: ReviewItem[];
  tripsTodayCount: number;
  periodConfirmedBusinessMiles: number;
  reportingPeriod: { id: string; label: string; startAt: number; endAt: number };
  mileageRate: { id: string; label: string; centsPerMile: number } | null;
}

export function createInitialAppState(now: number = Date.now()): MileRecoverAppState {
  const year = new Date(now).getFullYear();
  return {
    hydrated: false,
    startupPhase: 'restoring',
    loadError: null,
    dataStale: false,
    onboardingComplete: false,
    onboarding: {
      currentStep: 'welcome',
      completedSteps: [],
      skippedMotion: false,
    },
    trackingEngineState: 'idle',
    lastConfirmedCaptureAt: null,
    lastSyncAt: null,
    trips: [],
    recoveryCandidates: [],
    reviewItems: [],
    tripsTodayCount: 0,
    periodConfirmedBusinessMiles: 0,
    reportingPeriod: {
      id: 'this_month',
      label: 'This month',
      startAt: new Date(year, new Date(now).getMonth(), 1).getTime(),
      endAt: now,
    },
    mileageRate: null,
  };
}
