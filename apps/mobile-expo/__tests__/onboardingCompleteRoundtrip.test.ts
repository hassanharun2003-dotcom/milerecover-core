import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_ONBOARDING_VERSION, isOnboardingMinimumComplete } from '@milerecover/domain';
import { loadProductUiState, saveProductUiState } from '../src/product/persistence';
import { createInitialProductUiState } from '../src/product/types';

describe('completed onboarding roundtrip', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('preserves v11 completion across save/load', async () => {
    const now = Date.now();
    const base = createInitialProductUiState();
    const complete = {
      ...base,
      primaryGoal: 'employee_reimbursement' as const,
      onboarding: {
        ...base.onboarding,
        primaryGoal: 'employee_reimbursement' as const,
        countryStepAcknowledged: true,
        accountStepAcknowledged: true,
        protectionEducationAcknowledged: true,
        permissionsEducationAcknowledged: true,
        nextActionSelected: 'add_first_drive' as const,
        completedAt: now,
        completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
        currentStep: 'ready' as const,
      },
    };
    expect(isOnboardingMinimumComplete(complete.onboarding)).toBe(true);
    await saveProductUiState(complete);
    const loaded = await loadProductUiState();
    expect(isOnboardingMinimumComplete(loaded.onboarding)).toBe(true);
    expect(loaded.onboarding.completedOnboardingVersion).toBe(CURRENT_ONBOARDING_VERSION);
    expect(loaded.onboarding.completedAt).toBe(now);
    expect(loaded.onboarding.nextActionSelected).toBe('add_first_drive');
    expect(loaded.onboarding.primaryGoal).toBe('employee_reimbursement');
    expect(loaded.onboarding.countryStepAcknowledged).toBe(true);
  });
});
