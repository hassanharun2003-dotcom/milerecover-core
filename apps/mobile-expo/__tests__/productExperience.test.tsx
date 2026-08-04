import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
import { PLAN_FIXTURES, RESCUE_OPTIONS } from '../src/fixtures/subscription';
import {
  ONBOARDING_STEP_ORDER,
  createInitialProductUiState,
} from '../src/product/types';
import { selectProductExperience } from '../src/product/selectors';
import { greetingForName, nextActionForGoal, voiceForDrivingType } from '../src/product/copy';
import { createInitialAppState } from '../src/store/types';
import { ROOT_TAB_ROUTE_NAMES, ROOT_STACK_ROUTE_NAMES, SUPPORTING_STACK_ROUTES } from '../src/navigation/types';
import { createManualTripRecord, mapLegacyGoal, mapLegacyPattern } from '@milerecover/domain';

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
  });

  it('keeps Manual Trip off tabs', () => {
    expect(ROOT_TAB_ROUTE_NAMES).not.toContain('ManualTrip');
    expect(ROOT_STACK_ROUTE_NAMES).toContain('ManualTrip');
  });

  it('registers supporting stack routes', () => {
    expect(SUPPORTING_STACK_ROUTES).toContain('BringExistingMileage');
    expect(SUPPORTING_STACK_ROUTES).toContain('PlanSelection');
  });

  it('defines the full first-launch onboarding path', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'account',
      'country',
      'permissions_education',
      'preferred_name',
      'primary_goal',
      'pain_points',
      'vehicle_setup',
      'protection_education',
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

  it('maps home primary CTA by demo scenario only when demo mode is on', () => {
    const app = createInitialAppState();
    const recovery = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'recovery_available' },
      grantedPermissions,
    );
    expect(recovery.scenario.primaryAction).toBe('Review drive');

    const limited = selectProductExperience(
      app,
      { ...createInitialProductUiState(), demoModeEnabled: true, demoScenario: 'protection_limited' },
      grantedPermissions,
    );
    expect(limited.scenario.primaryAction).toBe('Fix protection');
  });

  it('keeps demo mileage fixtures isolated from live mode', () => {
    expect(DEMO_SCENARIOS.fully_protected.weekSummary.milesProtected).toBe(87.6);
    const live = selectProductExperience(
      createInitialAppState(),
      createInitialProductUiState(),
      deniedPermissions,
      false,
    );
    expect(live.liveMode).toBe(true);
    expect(live.scenario.weekSummary.milesProtected).toBe(0);
    expect(JSON.stringify(live.scenario)).not.toContain('87.6');
    expect(JSON.stringify(live.scenario)).not.toContain('Airport pickup');
  });

  it('computes Home totals from real confirmed trips', () => {
    const trip = createManualTripRecord({
      startAt: Date.now() - 3600000,
      endAt: Date.now(),
      distanceMiles: 12.5,
      purpose: 'Client',
      evidenceMethod: 'odometer',
      confirmAsWork: true,
    });
    const app = { ...createInitialAppState(), trips: [trip], reviewItems: [] };
    const exp = selectProductExperience(
      app,
      { ...createInitialProductUiState(), protectionSetupState: 'configured' },
      deniedPermissions,
      false,
    );
    expect(exp.scenario.weekSummary.milesProtected).toBe(12.5);
    expect(exp.confirmedTrips).toHaveLength(1);
    expect(exp.scenario.homeTitle).not.toMatch(/covered today/i);
  });
});

describe('Onboarding personalization', () => {
  it('adapts next action by primary goal', () => {
    expect(nextActionForGoal('employee_reimbursement').title).toMatch(/turn on watching|turn on protection/i);
    expect(nextActionForGoal('mixed').title).toMatch(/bring what you already have|file or source/i);
  });

  it('adapts voice by driving pattern', () => {
    expect(voiceForDrivingType('regular_locations').reportNoun).toMatch(/reimbursement/i);
    expect(voiceForDrivingType('delivery_rideshare').reportNoun).toMatch(/earnings/i);
  });

  it('greets by preferred name sparingly', () => {
    expect(greetingForName('Hassan', 9)).toBe('Good morning, Hassan.');
    expect(greetingForName(null, 9)).toBeNull();
  });

  it('migrates legacy onboarding fields', () => {
    expect(mapLegacyGoal('Employee reimbursement')).toBe('employee_reimbursement');
    expect(mapLegacyGoal('Bring history')).toBe('mixed');
    expect(mapLegacyPattern('Gig / independent')).toBe('delivery_rideshare');
  });
});

describe('Onboarding honesty', () => {
  it('educates before permission prompts and stays honest on watching screens', () => {
    const fs = require('fs');
    const path = require('path');
    const onboarding = fs.readFileSync(
      path.join(__dirname, '../src/screens/onboarding/OnboardingFlow.tsx'),
      'utf8',
    );
    expect(onboarding).toMatch(/How location helps/);
    expect(onboarding).toMatch(/Allow location while using the app/);
    expect(onboarding).toMatch(/Skip for now/);
    expect(onboarding).not.toMatch(/status=\"ready\"/);
    expect(ONBOARDING_STEP_ORDER).toContain('permissions_education');
    expect(ONBOARDING_STEP_ORDER).toContain('account');
    const tracking = fs.readFileSync(
      path.join(__dirname, '../src/screens/flows/SupportingScreens.tsx'),
      'utf8',
    );
    expect(tracking).toMatch(
      /Automatic protection|Manual trip|Watching is off|Watching needs Plus|Not yet|Partially/i,
    );
  });
});

describe('Fresh install identity', () => {
  it('never invents profile identity in initial state', () => {
    const initial = createInitialProductUiState();
    expect(initial.preferredName).toBeNull();
    expect(initial.selectedPlan).toBe('free');
    expect(initial.vehicles).toEqual([]);
    expect(initial.demoModeEnabled).toBe(false);
  });
});
