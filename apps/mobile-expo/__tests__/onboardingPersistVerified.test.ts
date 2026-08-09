import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_ONBOARDING_VERSION, isOnboardingMinimumComplete } from '@milerecover/domain';
import {
  ONBOARDING_COMPLETION_KEY,
  loadProductUiState,
  persistVerifiedOnboardingCompletion,
  readProductUiState,
  saveProductUiState,
} from '../src/product/persistence';
import { PRODUCT_UI_STORAGE_KEY, createInitialProductUiState } from '../src/product/types';

function completeState(now = Date.now()) {
  const base = createInitialProductUiState();
  return {
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
}

describe('verified onboarding persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('writes stamp + blob and survives reload', async () => {
    const state = completeState();
    await persistVerifiedOnboardingCompletion(state);
    expect(await AsyncStorage.getItem(ONBOARDING_COMPLETION_KEY)).toBeTruthy();
    const loaded = await loadProductUiState();
    expect(isOnboardingMinimumComplete(loaded.onboarding)).toBe(true);
  });

  it('readProductUiState does not clobber a newer blob written during load', async () => {
    const stale = {
      ...createInitialProductUiState(),
      onboarding: {
        ...createInitialProductUiState().onboarding,
        currentStep: 'account' as const,
        completedSteps: ['welcome'] as const,
      },
    };
    await saveProductUiState(stale);

    // Simulate an in-flight reader that has already read stale JSON, while a
    // newer write lands. readProductUiState itself must not rewrite storage
    // when source is already v4 and no stamp merge is needed.
    const first = await readProductUiState();
    expect(first.needsPersist).toBe(false);

    const newer = completeState();
    await saveProductUiState(newer);

    // A cancelled hydrate must not call save — verify disk still has completion.
    const raw = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY);
    expect(raw).toContain('employee_reimbursement');
    const loaded = await loadProductUiState();
    expect(isOnboardingMinimumComplete(loaded.onboarding)).toBe(true);
  });

  it('rejects incomplete snapshots instead of silently skipping the stamp', async () => {
    await expect(persistVerifiedOnboardingCompletion(createInitialProductUiState())).rejects.toThrow(
      /ONBOARDING_INCOMPLETE/,
    );
    expect(await AsyncStorage.getItem(ONBOARDING_COMPLETION_KEY)).toBeNull();
  });
});
