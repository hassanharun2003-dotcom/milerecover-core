import { createEmptyOnboardingState, CURRENT_ONBOARDING_VERSION } from '@milerecover/domain';
import { hasCorruptOnboardingCompletion, resolveLaunchState } from '../src/startup/launchState';

const emptyOnboarding = () => createEmptyOnboardingState(1);

describe('Deterministic launch state machine', () => {
  it('stays booting until both stores hydrate', () => {
    const result = resolveLaunchState({
      appHydrated: false,
      productHydrated: true,
      startupPhase: 'restoring',
      onboarding: emptyOnboarding(),
      tripCount: 0,
    });
    expect(result.kind).toBe('booting');
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(false);
  });

  it('opens Welcome on true first launch / empty storage', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: emptyOnboarding(),
      tripCount: 0,
    });
    expect(result.kind).toBe('firstLaunch');
    expect(result.showOnboarding).toBe(true);
    expect(result.allowHome).toBe(false);
  });

  it('keeps incomplete onboarding in setup even when trips exist', () => {
    const onboarding = {
      ...emptyOnboarding(),
      currentStep: 'pain_points' as const,
      primaryGoal: 'employee_reimbursement' as const,
    };
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding,
      tripCount: 3,
    });
    expect(result.kind).toBe('onboardingInProgress');
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });

  it('opens Home only for validated completion', () => {
    const onboarding = {
      ...emptyOnboarding(),
      primaryGoal: 'mixed' as const,
      selectedPainPoints: ['older_mileage' as const],
      nextActionSelected: 'add_first_drive' as const,
      completedAt: 99,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    };
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding,
      tripCount: 0,
    });
    expect(result.kind).toBe('returningUser');
    expect(result.allowHome).toBe(true);
  });

  it('treats corrupt completion stamp as migration, not Home', () => {
    const onboarding = {
      ...emptyOnboarding(),
      completedAt: 50,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      primaryGoal: null,
      selectedPainPoints: [],
      nextActionSelected: null,
    };
    expect(hasCorruptOnboardingCompletion(onboarding)).toBe(true);
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding,
      tripCount: 2,
    });
    expect(result.kind).toBe('migrationRequired');
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });

  it('routes storage recovery phases without flashing Home', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'corrupt-recovered',
      onboarding: emptyOnboarding(),
      tripCount: 0,
    });
    expect(result.kind).toBe('storageRecovery');
    expect(result.allowHome).toBe(false);
  });

  it('never grants Home from trip data alone', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: emptyOnboarding(),
      tripCount: 12,
    });
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });
});
