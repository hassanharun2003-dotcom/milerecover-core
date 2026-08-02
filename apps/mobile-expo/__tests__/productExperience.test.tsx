import React from 'react';
import { ONBOARDING_STEP_ORDER } from '../src/product/types';
import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
import { PLAN_FIXTURES } from '../src/fixtures/subscription';
import { selectProductExperience } from '../src/product/selectors';
import { createInitialAppState } from '../src/store/types';
import { createInitialProductUiState } from '../src/product/types';
import { ROOT_TAB_ROUTE_NAMES, ROOT_STACK_ROUTE_NAMES, SUPPORTING_STACK_ROUTES } from '../src/navigation/types';

describe('Locked product experience', () => {
  it('keeps four bottom tabs', () => {
    expect(ROOT_TAB_ROUTE_NAMES).toEqual(['Home', 'Review', 'Proof', 'Profile']);
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
    expect(ONBOARDING_STEP_ORDER).toHaveLength(6);
  });

  it('provides demo scenarios for product states', () => {
    expect(DEMO_SCENARIOS.recovery_available.homeState).toBe('recovery_available');
    expect(DEMO_SCENARIOS.proof_ready.proofReady).toBe(true);
  });

  it('centralizes subscription fixtures', () => {
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$8.99');
  });

  it('selects product experience from scenario', () => {
    const app = createInitialAppState();
    const product = { ...createInitialProductUiState(), demoScenario: 'fully_protected' as const };
    const exp = selectProductExperience(app, product, {
      location: 'granted',
      backgroundLocation: 'granted',
      motion: 'granted',
      batteryOptimizationRestricted: false,
    });
    expect(exp.scenario.homeTitle).toBe('Protected');
  });

  it('maps home copy for protected and recovery states', () => {
    const app = createInitialAppState();
    const protectedExp = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoScenario: 'fully_protected' },
      {
        location: 'granted',
        backgroundLocation: 'granted',
        motion: 'granted',
        batteryOptimizationRestricted: false,
      },
    );
    expect(protectedExp.scenario.homeTitle).toBe('Protected');

    const recoveryExp = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoScenario: 'recovery_available' },
      {
        location: 'granted',
        backgroundLocation: 'granted',
        motion: 'granted',
        batteryOptimizationRestricted: false,
      },
    );
    expect(recoveryExp.scenario.homeTitle).toBe('One drive may be missing');
    expect(recoveryExp.scenario.reviewItems.length).toBeGreaterThan(0);
  });
});
