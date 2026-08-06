import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_ONBOARDING_VERSION, isOnboardingMinimumComplete } from '@milerecover/domain';
import {
  enqueueProductUiSave,
  flushProductUiSaves,
  loadProductUiState,
} from '../src/product/persistence';
import { createInitialProductUiState } from '../src/product/types';

describe('product UI save queue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('latest-wins when many rapid saves race', async () => {
    const base = createInitialProductUiState();
    const mid = {
      ...base,
      onboarding: {
        ...base.onboarding,
        currentStep: 'account' as const,
        completedSteps: ['welcome'] as const,
      },
    };
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
        completedAt: 1_700_000_000_000,
        completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
        currentStep: 'ready' as const,
      },
    };

    // Fire overlapping writes without awaiting each one.
    void enqueueProductUiSave(base);
    void enqueueProductUiSave(mid as typeof base);
    void enqueueProductUiSave(complete);
    await flushProductUiSaves();

    const loaded = await loadProductUiState();
    expect(isOnboardingMinimumComplete(loaded.onboarding)).toBe(true);
    expect(loaded.onboarding.primaryGoal).toBe('employee_reimbursement');
    expect(loaded.onboarding.currentStep).toBe('ready');
  });
});
