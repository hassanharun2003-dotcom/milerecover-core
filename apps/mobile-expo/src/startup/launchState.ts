import {
  isOnboardingMinimumComplete,
  isOnboardingVersionStale,
  type AppStartupPhase,
  type VersionedOnboardingState,
} from '@milerecover/domain';

/**
 * Deterministic launch destinations for MileRecover.
 * Home is only reachable from `returningUser` after validated onboarding completion.
 */
export type LaunchKind =
  | 'booting'
  | 'firstLaunch'
  | 'onboardingInProgress'
  | 'returningUser'
  | 'migrationRequired'
  | 'storageRecovery';

export interface LaunchResolution {
  kind: LaunchKind;
  /** True when the main tab navigator may mount. */
  allowHome: boolean;
  /** True when OnboardingFlow should mount. */
  showOnboarding: boolean;
  reason: string;
}

export interface LaunchInputs {
  appHydrated: boolean;
  productHydrated: boolean;
  startupPhase: AppStartupPhase;
  onboarding: VersionedOnboardingState;
  /** Trip count is never used alone to grant Home. */
  tripCount: number;
}

/**
 * Detect a completion stamp that must not grant Home
 * (e.g. completedAt set without required answers, or stale version).
 */
export function hasCorruptOnboardingCompletion(onboarding: VersionedOnboardingState): boolean {
  const stamped =
    onboarding.completedAt != null || onboarding.completedOnboardingVersion != null;
  if (!stamped) return false;
  if (isOnboardingVersionStale(onboarding)) return true;
  if (!isOnboardingMinimumComplete(onboarding)) return true;
  return false;
}

export function resolveLaunchState(input: LaunchInputs): LaunchResolution {
  if (!input.appHydrated || !input.productHydrated || input.startupPhase === 'restoring') {
    return {
      kind: 'booting',
      allowHome: false,
      showOnboarding: false,
      reason: 'Waiting for persisted app and product state.',
    };
  }

  if (
    input.startupPhase === 'unavailable' ||
    input.startupPhase === 'migration-failed' ||
    input.startupPhase === 'safe-reset-required' ||
    input.startupPhase === 'corrupt-recovered'
  ) {
    return {
      kind: 'storageRecovery',
      allowHome: false,
      showOnboarding: false,
      reason: `Storage phase: ${input.startupPhase}`,
    };
  }

  if (hasCorruptOnboardingCompletion(input.onboarding)) {
    return {
      kind: 'migrationRequired',
      allowHome: false,
      showOnboarding: true,
      reason: 'Onboarding completion stamp is incomplete or stale; resume setup without granting Home.',
    };
  }

  if (isOnboardingMinimumComplete(input.onboarding)) {
    return {
      kind: 'returningUser',
      allowHome: true,
      showOnboarding: false,
      reason: 'Validated onboarding completion for current version.',
    };
  }

  const started =
    input.onboarding.primaryGoal != null ||
    input.onboarding.selectedPainPoints.length > 0 ||
    (input.onboarding.currentStep !== 'welcome' &&
      input.onboarding.currentStep !== 'your_work') ||
    input.onboarding.completedSteps.length > 0;

  // Trips alone never imply onboarding is done.
  if (started || input.tripCount > 0) {
    return {
      kind: 'onboardingInProgress',
      allowHome: false,
      showOnboarding: true,
      reason:
        input.tripCount > 0 && !started
          ? 'Saved drives exist but onboarding is incomplete; keep user in setup.'
          : 'Onboarding answers in progress.',
    };
  }

  return {
    kind: 'firstLaunch',
    allowHome: false,
    showOnboarding: true,
    reason: 'Empty storage — open Welcome.',
  };
}
