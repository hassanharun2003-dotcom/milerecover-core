import {
  CURRENT_ONBOARDING_VERSION,
  createEmptyOnboardingState,
  isOnboardingMinimumComplete,
  nextIncompleteEssentialStep,
  invalidateStaleOnboardingCompletion,
} from '@milerecover/domain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveLaunchState } from '../src/startup/launchState';
import { loadProductUiState } from '../src/product/persistence';
import { PRODUCT_UI_STORAGE_KEY_V1 } from '../src/product/types';
import { LOCAL_EXPERIENCE_STORAGE_KEYS } from '../src/services/dataPrivacy';

describe('Onboarding canonical state machine', () => {
  it('fresh empty store resumes at Welcome and does not grant Home', () => {
    const empty = createEmptyOnboardingState();
    expect(empty.currentStep).toBe('welcome');
    expect(nextIncompleteEssentialStep(empty)).toBe('welcome');
    expect(isOnboardingMinimumComplete(empty)).toBe(false);
    const launch = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: empty,
      tripCount: 0,
    });
    expect(launch.kind).toBe('firstLaunch');
    expect(launch.showOnboarding).toBe(true);
    expect(launch.allowHome).toBe(false);
  });

  it('after welcome without account acknowledgement resumes at account', () => {
    const state = {
      ...createEmptyOnboardingState(),
      completedSteps: ['welcome' as const],
      currentStep: 'account' as const,
      accountStepAcknowledged: false,
    };
    expect(nextIncompleteEssentialStep(state)).toBe('account');
  });

  it('incomplete purpose resumes at purpose, not Ready', () => {
    const state = {
      ...createEmptyOnboardingState(),
      completedSteps: ['welcome' as const, 'account' as const],
      currentStep: 'purpose' as const,
      accountStepAcknowledged: true,
    };
    expect(nextIncompleteEssentialStep(state)).toBe('purpose');
  });

  it('region incomplete after purpose resumes at locale_setup', () => {
    const state = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'employee_reimbursement' as const,
      countryStepAcknowledged: false,
    };
    expect(nextIncompleteEssentialStep(state)).toBe('locale_setup');
  });

  it('protection incomplete resumes at protect_drives', () => {
    const state = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'employee_reimbursement' as const,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: false,
      permissionsEducationAcknowledged: false,
    };
    expect(nextIncompleteEssentialStep(state)).toBe('protect_drives');
  });

  it('never infers COMPLETED from profile fields alone', () => {
    const fake = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'mixed' as const,
      preferredName: 'Hassan',
      countryStepAcknowledged: true,
      // missing completion stamp + next action
    };
    expect(isOnboardingMinimumComplete(fake)).toBe(false);
    const launch = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: fake,
      tripCount: 12,
    });
    expect(launch.allowHome).toBe(false);
    expect(launch.showOnboarding).toBe(true);
  });

  it('malformed completion stamp fails safely to onboarding, not Home', () => {
    const corrupt = {
      ...createEmptyOnboardingState(),
      completedAt: Date.now(),
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      primaryGoal: null,
      nextActionSelected: null,
    };
    const launch = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: corrupt,
      tripCount: 0,
    });
    expect(launch.kind).toBe('migrationRequired');
    expect(launch.allowHome).toBe(false);
    expect(launch.showOnboarding).toBe(true);
  });

  it('validated completion opens Home and update migration preserves it', () => {
    const complete = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'employee_reimbursement' as const,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
      nextActionSelected: 'add_first_drive' as const,
      completedAt: Date.now(),
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    };
    expect(isOnboardingMinimumComplete(complete)).toBe(true);
    const launch = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: complete,
      tripCount: 4,
    });
    expect(launch.kind).toBe('returningUser');
    expect(launch.allowHome).toBe(true);
    expect(launch.showOnboarding).toBe(false);
  });

  it('legacy migration never fabricates Ready/COMPLETED', async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      PRODUCT_UI_STORAGE_KEY_V1,
      JSON.stringify({
        primaryGoal: 'employee_reimbursement',
        preferredName: 'Legacy',
        selectedPlan: 'plus',
      }),
    );
    const migrated = await loadProductUiState();
    expect(migrated.onboarding.completedAt).toBeNull();
    expect(migrated.onboarding.completedOnboardingVersion).toBeNull();
    expect(migrated.onboarding.currentStep).not.toBe('ready');
    expect(isOnboardingMinimumComplete(migrated.onboarding)).toBe(false);
  });

  it('stale version invalidation preserves answers and resumes safely', () => {
    const stale = {
      ...createEmptyOnboardingState(),
      primaryGoal: 'gig_delivery' as const,
      countryStepAcknowledged: true,
      completedAt: 1,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION - 1,
      nextActionSelected: 'add_first_drive' as const,
    };
    const next = invalidateStaleOnboardingCompletion(stale, 2);
    expect(next.completedAt).toBeNull();
    expect(next.primaryGoal).toBe('gig_delivery');
    expect(next.currentStep).not.toBe('welcome');
    expect(isOnboardingMinimumComplete(next)).toBe(false);
  });

  it('QA wipe key list includes onboarding and tracking stores', () => {
    expect(LOCAL_EXPERIENCE_STORAGE_KEYS.some((k) => k.includes('product-ui'))).toBe(true);
    expect(LOCAL_EXPERIENCE_STORAGE_KEYS.some((k) => k.includes('tracking'))).toBe(true);
  });
});
