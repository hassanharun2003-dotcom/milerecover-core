export type OnboardingStepId =
  /** Final product lock — five customer-facing stages */
  | 'welcome'
  | 'purpose'
  | 'locale_setup'
  | 'protect_drives'
  | 'ready'
  /** Legacy step ids — remapped by mobile onboarding */
  | 'your_work'
  | 'personalize'
  | 'account'
  | 'country'
  | 'primary_goal'
  | 'pain_points'
  | 'driving_pattern'
  | 'preferred_name'
  | 'vehicle_setup'
  | 'familiar_places'
  | 'protection_education'
  | 'permissions_education';

export type MileageGoal =
  | 'employee_reimbursement'
  | 'gig_delivery'
  | 'self_employed_business'
  | 'mixed';

export type PainPoint =
  | 'forget_to_track'
  | 'tracker_misses'
  | 'need_cleaner_reports'
  | 'older_mileage'
  | 'battery_worry'
  | 'separate_work_personal';

export type DrivingPattern =
  | 'regular_locations'
  | 'different_places'
  | 'delivery_rideshare'
  | 'client_visits'
  | 'not_sure';

export type NextActionId =
  | 'start_protection'
  | 'add_first_drive'
  | 'import_mileage'
  | 'add_workplace'
  | 'begin_rescue';

/**
 * Bump when essential onboarding screens/questions change and stale installs must re-enter.
 * v10: Welcome → Account(auth) → Purpose → Region → Protection → Ready.
 */
export const CURRENT_ONBOARDING_VERSION = 10;

export interface VersionedOnboardingState {
  schemaVersion: 4;
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  primaryGoal: MileageGoal | null;
  selectedPainPoints: PainPoint[];
  drivingPattern: DrivingPattern | null;
  preferredName: string | null;
  vehicleSetupState: 'skipped' | 'added' | 'multi' | 'not_started';
  familiarPlacesSetupState: 'skipped' | 'added' | 'not_started';
  protectionEducationAcknowledged: boolean;
  permissionsEducationAcknowledged: boolean;
  /** Optional account step acknowledged (signed in or skipped). */
  accountStepAcknowledged?: boolean;
  /** Country/units step acknowledged. */
  countryStepAcknowledged?: boolean;
  nextActionSelected: NextActionId | null;
  /** Timestamp when the current onboarding version was completed. */
  completedAt: number | null;
  /** Which CURRENT_ONBOARDING_VERSION was completed. Null = never / stale. */
  completedOnboardingVersion: number | null;
  lastUpdatedAt: number;
}

export function createEmptyOnboardingState(now = Date.now()): VersionedOnboardingState {
  return {
    schemaVersion: 4,
    currentStep: 'welcome',
    completedSteps: [],
    primaryGoal: null,
    selectedPainPoints: [],
    drivingPattern: null,
    preferredName: null,
    vehicleSetupState: 'not_started',
    familiarPlacesSetupState: 'not_started',
    protectionEducationAcknowledged: false,
    permissionsEducationAcknowledged: false,
    accountStepAcknowledged: false,
    countryStepAcknowledged: false,
    nextActionSelected: null,
    completedAt: null,
    completedOnboardingVersion: null,
    lastUpdatedAt: now,
  };
}

export function inferDrivingPatternFromGoal(goal: MileageGoal | null): DrivingPattern {
  switch (goal) {
    case 'gig_delivery':
      return 'delivery_rideshare';
    case 'employee_reimbursement':
      return 'regular_locations';
    case 'self_employed_business':
      return 'client_visits';
    case 'mixed':
      return 'different_places';
    default:
      return 'not_sure';
  }
}

/**
 * Home is unlocked only after the user finishes the current onboarding version.
 * Requires purpose, region acknowledgement, next action, and an explicit completion stamp.
 * Never infer COMPLETED from unrelated profile fields alone.
 */
export function isOnboardingMinimumComplete(state: VersionedOnboardingState): boolean {
  return (
    state.primaryGoal != null &&
    state.countryStepAcknowledged === true &&
    state.nextActionSelected != null &&
    state.completedAt != null &&
    state.completedOnboardingVersion === CURRENT_ONBOARDING_VERSION
  );
}

/** True when the user may enter the main app on this build. */
export function isOnboardingCurrentComplete(state: VersionedOnboardingState): boolean {
  return isOnboardingMinimumComplete(state);
}

/** True when a prior completion exists but is older than CURRENT_ONBOARDING_VERSION. */
export function isOnboardingVersionStale(state: VersionedOnboardingState): boolean {
  if (state.completedAt == null && state.completedOnboardingVersion == null) {
    return false;
  }
  if (state.completedAt != null && state.completedOnboardingVersion == null) return true;
  if (
    state.completedOnboardingVersion != null &&
    state.completedOnboardingVersion < CURRENT_ONBOARDING_VERSION
  ) {
    return true;
  }
  return false;
}

/**
 * Invalidate outdated completion while preserving answers and records.
 * Returns a new state ready to resume essential onboarding.
 */
export function invalidateStaleOnboardingCompletion(
  state: VersionedOnboardingState,
  now = Date.now(),
): VersionedOnboardingState {
  const next: VersionedOnboardingState = {
    ...state,
    completedAt: null,
    completedOnboardingVersion: null,
    nextActionSelected: null,
    lastUpdatedAt: now,
  };
  const hasAnyEssentialAnswer =
    next.primaryGoal != null ||
    next.countryStepAcknowledged === true ||
    next.protectionEducationAcknowledged === true ||
    next.permissionsEducationAcknowledged === true ||
    next.nextActionSelected != null;
  if (!hasAnyEssentialAnswer) {
    next.currentStep = 'welcome';
    return next;
  }
  // Older completions already included country/units inside prior flows.
  if (next.primaryGoal != null) {
    next.countryStepAcknowledged = true;
  }
  next.currentStep = nextIncompleteEssentialStep(next) ?? 'welcome';
  return next;
}

/** Resume helper — place user on the first unfinished required answer or finish step. */
export function nextIncompleteEssentialStep(state: VersionedOnboardingState): OnboardingStepId | null {
  if (isOnboardingMinimumComplete(state)) {
    return null;
  }
  if (state.primaryGoal == null) {
    if (!state.completedSteps.includes('welcome')) return 'welcome';
    // Account must be acknowledged (sign-in OR continue without) before purpose.
    if (!state.accountStepAcknowledged) return 'account';
    return 'purpose';
  }
  if (!state.countryStepAcknowledged) {
    return 'locale_setup';
  }
  // Both education flags must be set (setup OR explicit manual skip) before Ready.
  if (!state.protectionEducationAcknowledged || !state.permissionsEducationAcknowledged) {
    return 'protect_drives';
  }
  if (state.nextActionSelected == null || state.completedAt == null) return 'ready';
  if (state.completedOnboardingVersion !== CURRENT_ONBOARDING_VERSION) return 'ready';
  return null;
}

export function nextIncompleteStep(state: VersionedOnboardingState): OnboardingStepId | null {
  return nextIncompleteEssentialStep(state);
}

export function mapLegacyGoal(goal: string | null | undefined): MileageGoal | null {
  if (!goal) return null;
  const g = goal.toLowerCase();
  if (g.includes('employee') || g.includes('reimburs') || g === 'employee') return 'employee_reimbursement';
  if (g.includes('gig') || g.includes('delivery') || g.includes('independent')) return 'gig_delivery';
  if (g.includes('small_business') || g.includes('business') || g.includes('self')) {
    return 'self_employed_business';
  }
  if (g.includes('mix') || g.includes('other')) return 'mixed';
  if (g.includes('protect') || g.includes('prepare') || g.includes('bring') || g.includes('find')) {
    return 'mixed';
  }
  return null;
}

export function mapLegacyPattern(usage: string | null | undefined): DrivingPattern | null {
  if (!usage) return null;
  const u = usage.toLowerCase();
  if (u.includes('gig') || u.includes('delivery')) return 'delivery_rideshare';
  if (u.includes('employee') || u.includes('regular')) return 'regular_locations';
  if (u.includes('client') || u.includes('small')) return 'client_visits';
  return 'not_sure';
}

export function inferNextAction(state: VersionedOnboardingState): NextActionId {
  if (state.selectedPainPoints.includes('older_mileage')) return 'begin_rescue';
  if (state.selectedPainPoints.includes('forget_to_track')) return 'start_protection';
  if (state.primaryGoal === 'gig_delivery') return 'start_protection';
  if (state.familiarPlacesSetupState === 'not_started' && state.drivingPattern === 'regular_locations') {
    return 'add_workplace';
  }
  return 'add_first_drive';
}
