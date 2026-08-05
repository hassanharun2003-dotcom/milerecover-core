import {
  CURRENT_ONBOARDING_VERSION,
  createEmptyOnboardingState,
  isOnboardingMinimumComplete,
  isOnboardingVersionStale,
  nextIncompleteStep,
} from '@milerecover/domain';
import { createInitialProductUiState, ONBOARDING_STEP_ORDER } from '../src/product/types';

describe('Authoritative onboarding versioning', () => {
  it('locks five-stage final onboarding at version 9', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'purpose',
      'locale_setup',
      'protect_drives',
      'ready',
    ]);
    expect(CURRENT_ONBOARDING_VERSION).toBe(9);
  });

  it('clean install is incomplete and starts at welcome', () => {
    const state = createInitialProductUiState();
    expect(isOnboardingMinimumComplete(state.onboarding)).toBe(false);
    expect(state.onboarding.currentStep).toBe('welcome');
    expect(nextIncompleteStep(createEmptyOnboardingState())).toBe('welcome');
  });

  it('marks older completed versions stale', () => {
    const stale = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'gig_delivery' as const,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
      nextActionSelected: 'start_protection' as const,
      completedAt: 99,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION - 1,
    };
    expect(isOnboardingVersionStale(stale)).toBe(true);
  });

  it('accepts a fully stamped current version', () => {
    const complete = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'employee_reimbursement' as const,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
      nextActionSelected: 'add_first_drive' as const,
      completedAt: 1,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    };
    expect(isOnboardingMinimumComplete(complete)).toBe(true);
    expect(isOnboardingVersionStale(complete)).toBe(false);
  });
});
