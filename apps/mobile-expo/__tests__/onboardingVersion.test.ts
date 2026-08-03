import {
  CURRENT_ONBOARDING_VERSION,
  createEmptyOnboardingState,
  invalidateStaleOnboardingCompletion,
  isOnboardingMinimumComplete,
  isOnboardingVersionStale,
} from '@milerecover/domain';
import { createInitialProductUiState, ONBOARDING_STEP_ORDER } from '../src/product/types';
import { createInitialAppState } from '../src/store/types';

describe('Authoritative onboarding versioning', () => {
  it('uses four essential screens', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual(['welcome', 'primary_goal', 'pain_points', 'ready']);
  });

  it('clean install is incomplete and starts at welcome', () => {
    const state = createInitialProductUiState();
    expect(isOnboardingMinimumComplete(state.onboarding)).toBe(false);
    expect(state.onboarding.currentStep).toBe('welcome');
    expect(state.onboarding.completedOnboardingVersion).toBeNull();
  });

  it('boolean-only legacy completion is stale and does not enter Home', () => {
    const legacy = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'employee_reimbursement' as const,
      selectedPainPoints: ['need_cleaner_reports' as const],
      nextActionSelected: 'add_first_drive' as const,
      completedAt: 123,
      completedOnboardingVersion: null,
    };
    expect(isOnboardingVersionStale(legacy)).toBe(true);
    expect(isOnboardingMinimumComplete(legacy)).toBe(false);
    const next = invalidateStaleOnboardingCompletion(legacy);
    expect(next.primaryGoal).toBe('employee_reimbursement');
    expect(next.selectedPainPoints).toEqual(['need_cleaner_reports']);
    expect(next.completedAt).toBeNull();
  });

  it('older version completion is stale', () => {
    const older = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'gig_delivery' as const,
      selectedPainPoints: ['forget_to_track' as const],
      nextActionSelected: 'start_protection' as const,
      completedAt: 1,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION - 1,
    };
    expect(isOnboardingVersionStale(older)).toBe(true);
    expect(isOnboardingMinimumComplete(older)).toBe(false);
  });

  it('current completed version is Home-ready', () => {
    const current = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'mixed' as const,
      selectedPainPoints: ['older_mileage' as const],
      nextActionSelected: 'begin_rescue' as const,
      completedAt: 1,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    };
    expect(isOnboardingMinimumComplete(current)).toBe(true);
  });

  it('initial app state invents no profile or miles', () => {
    const product = createInitialProductUiState();
    const app = createInitialAppState();
    expect(product.preferredName).toBeNull();
    expect(product.vehicles).toEqual([]);
    expect(app.trips).toEqual([]);
  });
});
