export type OnboardingStepId =
  | 'welcome'
  | 'primary_goal'
  | 'pain_points'
  | 'driving_pattern'
  | 'preferred_name'
  | 'vehicle_setup'
  | 'familiar_places'
  | 'protection_education'
  | 'permissions_education'
  | 'ready';

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
  nextActionSelected: NextActionId | null;
  completedAt: number | null;
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
    nextActionSelected: null,
    completedAt: null,
    lastUpdatedAt: now,
  };
}

/** Minimum required to enter the normal app. */
export function isOnboardingMinimumComplete(state: VersionedOnboardingState): boolean {
  return (
    state.primaryGoal != null &&
    state.selectedPainPoints.length > 0 &&
    state.drivingPattern != null &&
    state.protectionEducationAcknowledged &&
    state.nextActionSelected != null &&
    state.completedAt != null
  );
}

export function nextIncompleteStep(state: VersionedOnboardingState): OnboardingStepId | null {
  if (state.primaryGoal == null) return 'primary_goal';
  if (state.selectedPainPoints.length === 0) return 'pain_points';
  if (state.drivingPattern == null) return 'driving_pattern';
  if (!state.protectionEducationAcknowledged) return 'protection_education';
  if (!state.permissionsEducationAcknowledged) return 'permissions_education';
  if (state.nextActionSelected == null) return 'ready';
  if (state.completedAt == null) return 'ready';
  return null;
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
