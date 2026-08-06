import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_ONBOARDING_VERSION, isOnboardingMinimumComplete } from '@milerecover/domain';
import {
  ONBOARDING_COMPLETION_KEY,
  loadProductUiState,
  saveOnboardingCompletionStamp,
  saveProductUiState,
} from '../src/product/persistence';
import { createInitialProductUiState } from '../src/product/types';

describe('onboarding completion stamp', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores Home unlock when product-ui blob is stale but stamp is valid', async () => {
    const now = Date.now();
    const completeOnboarding = {
      ...createInitialProductUiState().onboarding,
      primaryGoal: 'employee_reimbursement' as const,
      countryStepAcknowledged: true,
      accountStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
      nextActionSelected: 'add_first_drive' as const,
      completedAt: now,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      currentStep: 'ready' as const,
    };
    expect(isOnboardingMinimumComplete(completeOnboarding)).toBe(true);
    await saveOnboardingCompletionStamp(completeOnboarding);

    // Stale/raced product blob as seen on device (stuck at account).
    await saveProductUiState({
      ...createInitialProductUiState(),
      onboarding: {
        ...createInitialProductUiState().onboarding,
        currentStep: 'account',
        completedSteps: ['welcome'],
      },
    });

    const loaded = await loadProductUiState();
    expect(isOnboardingMinimumComplete(loaded.onboarding)).toBe(true);
    expect(loaded.onboarding.primaryGoal).toBe('employee_reimbursement');
    expect(await AsyncStorage.getItem(ONBOARDING_COMPLETION_KEY)).toBeTruthy();
  });
});
