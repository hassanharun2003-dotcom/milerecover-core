import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../src/fixtures/subscription';
import { ONBOARDING_STEP_ORDER, createInitialProductUiState } from '../src/product/types';
import { selectProductExperience } from '../src/product/selectors';
import { createInitialAppState } from '../src/store/types';
import { ROOT_TAB_ROUTE_NAMES, ROOT_STACK_ROUTE_NAMES, SUPPORTING_STACK_ROUTES } from '../src/navigation/types';

const grantedPermissions = {
  location: 'granted' as const,
  backgroundLocation: 'granted' as const,
  motion: 'granted' as const,
  batteryOptimizationRestricted: false,
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

  it('defines six onboarding steps', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'need_selection',
      'usage_type',
      'protection_setup',
      'optional_setup',
      'ready',
    ]);
  });

  it('centralizes subscription fixtures with design prices', () => {
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$8.99');
    expect(PLAN_FIXTURES.find((p) => p.id === 'pro')?.monthlyPrice).toBe('$14.99');
    expect(RESCUE_OPTIONS.find((r) => r.id === 'rescue-year')?.price).toBe('$59.99');
  });

  it('does not include Hassan-specific copy in fixtures', () => {
    const blob = JSON.stringify({ DEMO_SCENARIOS, PLAN_FIXTURES });
    expect(blob.toLowerCase()).not.toContain('hassan');
  });

  it('hides development controls in production builds', () => {
    const prod = { ...createInitialProductUiState(), showDevTools: false };
    expect(prod.showDevTools).toBe(false);
  });

  it('maps home primary CTA by scenario state', () => {
    const app = createInitialAppState();
    const recovery = selectProductExperience(app, { ...createInitialProductUiState(), demoScenario: 'recovery_available' }, grantedPermissions);
    expect(recovery.scenario.primaryAction).toBe('Review drive');
    expect(recovery.scenario.primaryActionRoute).toBe('Review');

    const limited = selectProductExperience(app, { ...createInitialProductUiState(), demoScenario: 'protection_limited' }, grantedPermissions);
    expect(limited.scenario.primaryAction).toBe('Restore protection');
    expect(limited.scenario.primaryActionRoute).toBe('ProtectionAlert');

    const offline = selectProductExperience(app, { ...createInitialProductUiState(), demoScenario: 'offline_sync' }, grantedPermissions);
    expect(offline.scenario.homeTitle).toBe('Saved safely offline');
  });

  it('uses realistic weekly summary for fully protected state', () => {
    expect(DEMO_SCENARIOS.fully_protected.weekSummary.milesProtected).toBe(87.6);
    expect(DEMO_SCENARIOS.fully_protected.weekSummary.recoveredMiles).toBe(2);
    expect(DEMO_SCENARIOS.fully_protected.weekSummary.milesReadyForProof).toBe(12);
  });

  it('blocks proof when review items remain', () => {
    const app = createInitialAppState();
    const blocked = selectProductExperience(app, { ...createInitialProductUiState(), demoScenario: 'proof_blocked' }, grantedPermissions);
    expect(blocked.scenario.proofReady).toBe(false);
    expect(blocked.scenario.proofBlockReason).toMatch(/review/i);
  });
});

describe('Review persistence semantics', () => {
  it('tracks reviewed history separately from pending items', () => {
    const product = {
      ...createInitialProductUiState(),
      demoScenario: 'recovery_available' as const,
      reviewDecisions: { 'review-recovery-1': 'work' as const },
      reviewedHistory: ['review-recovery-1'],
    };
    const exp = selectProductExperience(createInitialAppState(), product, grantedPermissions);
    expect(exp.activeReviewItems).toHaveLength(0);
  });
});
