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

  it('defines the image-lock first-launch onboarding path with account', () => {
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'account',
      'purpose',
      'locale_setup',
      'protect_drives',
      'ready',
    ]);
  });

  it('centralizes subscription fixtures with design prices', () => {
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$9.99');
    expect(PLAN_FIXTURES.find((p) => p.id === 'pro')?.monthlyPrice).toBe('$19.99');
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
    expect(nextActionForGoal('employee_reimbursement').title).toMatch(/turn on drive protection|turn on protection/i);
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
  it('educates before permission prompts and stays honest on protection screens', () => {
    const fs = require('fs');
    const path = require('path');
    const onboarding = fs.readFileSync(
      path.join(__dirname, '../src/screens/onboarding/OnboardingFlow.tsx'),
      'utf8',
    );
    expect(onboarding).toMatch(/Drive normally|Protect your drives|Keep your drives protected|Protect future drives/);
    expect(onboarding).toMatch(/Set up tracking|Allow when prompted|Turn on drive protection|Enable drive protection|Set up protection/);
    expect(onboarding).toMatch(/I.ll add drives manually|Not now|Skip for now|Set up later/);
    expect(onboarding).not.toMatch(/Your drives are protected/);
    expect(onboarding).not.toMatch(/On or ready to confirm/);
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'account',
      'purpose',
      'locale_setup',
      'protect_drives',
      'ready',
    ]);
    expect(onboarding).toMatch(/Continue with Google|Continue without an account/);
    const tracking = fs.readFileSync(
      path.join(__dirname, '../src/screens/flows/SupportingScreens.tsx'),
      'utf8',
    );
    expect(tracking).toMatch(/Automatic protection|Manual trip|Not yet|Partially|How you track/i);
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
