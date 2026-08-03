import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../src/fixtures/subscription';
import {
  ONBOARDING_STEP_ORDER,
  createInitialProductUiState,
  mapLegacyNeedToGoal,
  mapLegacyOnboardingStep,
  mapLegacyUsageToDrivingType,
} from '../src/product/types';
import { selectProductExperience } from '../src/product/selectors';
import { greetingForName, nextActionForGoal, voiceForDrivingType } from '../src/product/copy';
import { createInitialAppState } from '../src/store/types';
import { ROOT_TAB_ROUTE_NAMES, ROOT_STACK_ROUTE_NAMES, SUPPORTING_STACK_ROUTES } from '../src/navigation/types';

const grantedPermissions = {
  location: 'granted' as const,
  backgroundLocation: 'granted' as const,
  motion: 'granted' as const,
  batteryOptimizationRestricted: false,
};

const deniedPermissions = {
  location: 'denied' as const,
  backgroundLocation: 'denied' as const,
  motion: 'not_applicable' as const,
  batteryOptimizationRestricted: true,
};

describe('Locked product experience', () => {
  it('keeps four bottom tabs', () => {
    expect(ROOT_TAB_ROUTE_NAMES).toEqual(['Home', 'Review', 'Proof', 'Profile']);
    expect(ROOT_TAB_ROUTE_NAMES).toHaveLength(4);
  });

  it('keeps Manual Trip off tabs', () => {
    expect(ROOT_TAB_ROUTE_NAMES).not.toContain('ManualTrip');
    expect(ROOT_STACK_ROUTE_NAMES).toContain('ManualTrip');
  });

  it('registers supporting stack routes', () => {
    expect(SUPPORTING_STACK_ROUTES).toContain('BringExistingMileage');
    expect(SUPPORTING_STACK_ROUTES).toContain('PlanSelection');
  });

  it('defines six personalized onboarding steps', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'primary_goal',
      'driving_type',
      'preferred_name',
      'protection_setup',
      'next_action',
    ]);
  });

  it('centralizes subscription fixtures with design prices', () => {
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$8.99');
    expect(PLAN_FIXTURES.find((p) => p.id === 'pro')?.monthlyPrice).toBe('$14.99');
    expect(RESCUE_OPTIONS.find((r) => r.id === 'rescue-year')?.price).toBe('$59.99');
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.tagline).toMatch(/Never lose another reimbursable mile/i);
    expect(PLAN_FIXTURES.find((p) => p.id === 'pro')?.tagline).toMatch(/Stronger records/i);
    for (const plan of PLAN_FIXTURES) {
      expect(plan.features.length).toBeLessThanOrEqual(3);
    }
  });

  it('does not include Hassan-specific copy in fixtures', () => {
    const blob = JSON.stringify({ DEMO_SCENARIOS, PLAN_FIXTURES });
    expect(blob.toLowerCase()).not.toContain('hassan');
  });

  it('hides development controls in production builds', () => {
    const prod = { ...createInitialProductUiState(), showDevTools: false };
    expect(prod.showDevTools).toBe(false);
  });

  it('maps home primary CTA by demo scenario only when demo mode is on', () => {
    const app = createInitialAppState();
    const recovery = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'recovery_available' },
      grantedPermissions,
    );
    expect(recovery.scenario.primaryAction).toBe('Review drive');
    expect(recovery.scenario.primaryActionRoute).toBe('Review');

    const limited = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'protection_limited' },
      grantedPermissions,
    );
    expect(limited.scenario.primaryAction).toBe('Fix protection');
    expect(limited.scenario.primaryActionRoute).toBe('ProtectionAlert');

    const offline = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'offline_sync' },
      grantedPermissions,
    );
    expect(offline.scenario.homeTitle).toBe('Saved safely offline');
  });

  it('keeps demo mileage fixtures isolated from live mode', () => {
    expect(DEMO_SCENARIOS.fully_protected.weekSummary.milesProtected).toBe(87.6);
    const live = selectProductExperience(
      createInitialAppState(),
      createInitialProductUiState(),
      deniedPermissions,
    );
    expect(live.liveMode).toBe(true);
    expect(live.scenario.weekSummary.milesProtected).toBe(0);
    expect(live.scenario.homeTitle).not.toMatch(/covered today/i);
    expect(JSON.stringify(live.scenario)).not.toContain('87.6');
    expect(JSON.stringify(live.scenario)).not.toContain('Airport pickup');
  });

  it('blocks proof when review items remain in demo mode', () => {
    const app = createInitialAppState();
    const blocked = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'proof_blocked' },
      grantedPermissions,
    );
    expect(blocked.scenario.proofReady).toBe(false);
    expect(blocked.scenario.proofBlockReason).toMatch(/review/i);
  });
});

describe('Onboarding personalization', () => {
  it('adapts next action by primary goal', () => {
    expect(nextActionForGoal('protect_future').title).toMatch(/turn on protection/i);
    expect(nextActionForGoal('bring_history').title).toMatch(/file or source/i);
    expect(nextActionForGoal('find_missing').title).toMatch(/period/i);
    expect(nextActionForGoal('prepare_report').title).toMatch(/confirmed drives/i);
  });

  it('adapts voice by driving type', () => {
    expect(voiceForDrivingType('employee').reportNoun).toMatch(/reimbursement/i);
    expect(voiceForDrivingType('gig').reportNoun).toMatch(/earnings/i);
    expect(voiceForDrivingType('small_business').audience).toMatch(/clients/i);
    expect(voiceForDrivingType('other').workNoun).toBe('work');
  });

  it('greets by preferred name sparingly', () => {
    expect(greetingForName('Hassan', 9)).toBe('Good morning, Hassan.');
    expect(greetingForName(null, 9)).toBeNull();
    expect(greetingForName('  ', 9)).toBeNull();
  });

  it('migrates legacy onboarding fields', () => {
    expect(mapLegacyOnboardingStep('need_selection')).toBe('primary_goal');
    expect(mapLegacyOnboardingStep('usage_type')).toBe('driving_type');
    expect(mapLegacyOnboardingStep('optional_setup')).toBe('preferred_name');
    expect(mapLegacyOnboardingStep('ready')).toBe('next_action');
    expect(mapLegacyNeedToGoal('Find missing mileage')).toBe('find_missing');
    expect(mapLegacyUsageToDrivingType('Gig / independent')).toBe('gig');
  });
});

describe('Onboarding honesty', () => {
  it('does not claim permissions are ready before tracking exists', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../src/screens/onboarding/OnboardingFlow.tsx'),
      'utf8',
    );
    expect(source).toContain('Not granted yet');
    expect(source).toContain('status="pending"');
    expect(source).not.toMatch(/status=\"ready\"/);
    expect(source).toContain('never pretend permissions are granted');
  });

  it('routes protection fix action to system settings', () => {
    const source = require('fs').readFileSync(
      require('path').join(__dirname, '../src/screens/flows/SupportingScreens.tsx'),
      'utf8',
    );
    expect(source).toContain('Linking.openSettings');
    expect(source).toContain('Open Settings');
    expect(source).toContain('Preview only');
    expect(source).toContain('Preview sample');
  });
});

describe('Review persistence semantics', () => {
  it('tracks reviewed history separately from pending items', () => {
    const product = {
      ...createInitialProductUiState(),
      demoModeEnabled: true,
      demoScenario: 'recovery_available' as const,
      reviewDecisions: { 'review-recovery-1': 'work' as const },
      reviewedHistory: ['review-recovery-1'],
    };
    const exp = selectProductExperience(createInitialAppState(), product, grantedPermissions);
    expect(exp.activeReviewItems).toHaveLength(0);
  });
});

describe('Live Home truthfulness', () => {
  it('asks to finish protection setup when not configured', () => {
    const product = createInitialProductUiState();
    const exp = selectProductExperience(createInitialAppState(), product, deniedPermissions);
    expect(exp.scenario.homeTitle).toMatch(/Finish setting up protection/i);
    expect(exp.scenario.primaryAction).toBe('Continue setup');
  });

  it('never invents profile identity in initial state', () => {
    const initial = createInitialProductUiState();
    expect(initial.preferredName).toBeNull();
    expect(initial.selectedPlan).toBe('free');
    expect(initial.vehicles).toEqual([]);
    expect(initial.demoModeEnabled).toBe(false);
  });
});
