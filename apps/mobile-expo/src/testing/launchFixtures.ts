/**
 * Deterministic launch fixtures for product QA.
 * Each fixture describes a cold-start product + app presentation state.
 */
import {
  createEmptyOnboardingState,
  createFreeEntitlement,
  CURRENT_ONBOARDING_VERSION,
  type PermissionSnapshot,
  type VersionedOnboardingState,
} from '@milerecover/domain';
import { createInitialProductUiState, type ProductUiState } from '../product/types';

export type LaunchFixtureId =
  | 'brand_new_install'
  | 'onboarding_welcome'
  | 'onboarding_purpose'
  | 'onboarding_locale_setup'
  | 'onboarding_protect_drives'
  | 'onboarding_ready'
  | 'manual_mode'
  | 'permission_partial'
  | 'permission_granted_no_drive'
  | 'tracking_verified'
  | 'protection_degraded'
  | 'no_trips'
  | 'pending_review_trips'
  | 'confirmed_trips'
  | 'recovered_trip'
  | 'free_limit_close'
  | 'free_limit_reached'
  | 'report_ready'
  | 'report_blocked'
  | 'offline'
  | 'loading'
  | 'recoverable_error'
  | 'light_mode';

export type LaunchFixture = {
  id: LaunchFixtureId;
  label: string;
  theme: 'light' | 'system';
  product: Partial<ProductUiState>;
  /** Expected customer-visible protection title fragment when applicable. */
  expectProtection?: RegExp;
  /** Expected primary route after launch. */
  expectRoute: 'onboarding' | 'home' | 'loading' | 'error';
  notes?: string;
};

const granted: PermissionSnapshot = {
  location: 'granted',
  backgroundLocation: 'granted',
  motion: 'not_applicable',
  batteryOptimizationRestricted: false,
};

function completedOnboarding(partial: Partial<VersionedOnboardingState> = {}): VersionedOnboardingState {
  const now = Date.now();
  return {
    ...createEmptyOnboardingState(now),
    currentStep: 'ready',
    primaryGoal: 'employee_reimbursement',
    drivingPattern: 'regular_locations',
    selectedPainPoints: ['forget_to_track'],
    protectionEducationAcknowledged: true,
    permissionsEducationAcknowledged: true,
    countryStepAcknowledged: true,
    nextActionSelected: 'add_first_drive',
    completedAt: now,
    completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
    lastUpdatedAt: now,
    ...partial,
  };
}

function baseProduct(extra: Partial<ProductUiState> = {}): Partial<ProductUiState> {
  const onboarding = completedOnboarding();
  return {
    ...createInitialProductUiState(),
    onboarding,
    onboardingStep: onboarding.currentStep,
    primaryGoal: onboarding.primaryGoal,
    preferredName: 'Sam',
    protectionSetupState: 'configured',
    trackingEnabled: true,
    demoModeEnabled: false,
    entitlement: createFreeEntitlement(),
    selectedPlan: 'free',
    ...extra,
  };
}

export const LAUNCH_FIXTURES: LaunchFixture[] = [
  {
    id: 'brand_new_install',
    label: 'Brand-new installation',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: createEmptyOnboardingState(),
      onboardingStep: 'welcome',
      demoModeEnabled: false,
    },
    expectRoute: 'onboarding',
    notes: 'Truly empty local state must open Welcome',
  },
  {
    id: 'onboarding_welcome',
    label: 'Onboarding step 1 — Welcome',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: { ...createEmptyOnboardingState(), currentStep: 'welcome' },
      onboardingStep: 'welcome',
    },
    expectRoute: 'onboarding',
  },
  {
    id: 'onboarding_purpose',
    label: 'Onboarding — How you use mileage',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: { ...createEmptyOnboardingState(), currentStep: 'purpose' },
      onboardingStep: 'purpose',
    },
    expectRoute: 'onboarding',
  },
  {
    id: 'onboarding_locale_setup',
    label: 'Onboarding — Country, units, rate',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: {
        ...createEmptyOnboardingState(),
        currentStep: 'locale_setup',
        primaryGoal: 'employee_reimbursement',
        drivingPattern: 'regular_locations',
      },
      onboardingStep: 'locale_setup',
      primaryGoal: 'employee_reimbursement',
    },
    expectRoute: 'onboarding',
  },
  {
    id: 'onboarding_protect_drives',
    label: 'Onboarding — Drive protection',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: {
        ...createEmptyOnboardingState(),
        currentStep: 'protect_drives',
        primaryGoal: 'employee_reimbursement',
        countryStepAcknowledged: true,
      },
      onboardingStep: 'protect_drives',
      primaryGoal: 'employee_reimbursement',
    },
    expectRoute: 'onboarding',
  },
  {
    id: 'onboarding_ready',
    label: 'Onboarding — Ready',
    theme: 'light',
    product: {
      ...createInitialProductUiState(),
      onboarding: {
        ...createEmptyOnboardingState(),
        currentStep: 'ready',
        primaryGoal: 'employee_reimbursement',
        countryStepAcknowledged: true,
        protectionEducationAcknowledged: true,
        permissionsEducationAcknowledged: true,
        nextActionSelected: 'add_first_drive',
      },
      onboardingStep: 'ready',
      primaryGoal: 'employee_reimbursement',
    },
    expectRoute: 'onboarding',
  },
  {
    id: 'manual_mode',
    label: 'Manual mode',
    theme: 'light',
    product: baseProduct({
      trackingEnabled: false,
      protectionSetupState: 'not_started',
    }),
    expectProtection: /Manual mode/i,
    expectRoute: 'home',
  },
  {
    id: 'permission_partial',
    label: 'Permission partially granted',
    theme: 'light',
    product: baseProduct({
      protectionSetupState: 'configured',
      trackingEnabled: true,
    }),
    expectProtection: /Needs attention|Background|Location/i,
    expectRoute: 'home',
    notes: 'App permission snapshot injected separately in harness',
  },
  {
    id: 'permission_granted_no_drive',
    label: 'Permission granted — no successful tracked drive',
    theme: 'light',
    product: baseProduct({
      protectionSetupState: 'configured',
      trackingEnabled: true,
    }),
    expectProtection: /Configured|waiting for first drive/i,
    expectRoute: 'home',
  },
  {
    id: 'tracking_verified',
    label: 'Tracking verified by a successful drive',
    theme: 'light',
    product: baseProduct({
      protectionSetupState: 'healthy',
      trackingEnabled: true,
      firstConfirmedWorkDriveAt: Date.now() - 3_600_000,
    }),
    expectProtection: /protected/i,
    expectRoute: 'home',
  },
  {
    id: 'protection_degraded',
    label: 'Protection degraded',
    theme: 'light',
    product: baseProduct({
      protectionSetupState: 'limited',
      trackingEnabled: true,
    }),
    expectProtection: /Needs attention|Battery|Background/i,
    expectRoute: 'home',
  },
  {
    id: 'no_trips',
    label: 'No trips',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: false }),
    expectRoute: 'home',
  },
  {
    id: 'pending_review_trips',
    label: 'Pending-review trips',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'recovery_available' }),
    expectRoute: 'home',
  },
  {
    id: 'confirmed_trips',
    label: 'Confirmed trips',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'proof_ready' }),
    expectRoute: 'home',
  },
  {
    id: 'recovered_trip',
    label: 'Recovered trip',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'recovery_available' }),
    expectRoute: 'home',
  },
  {
    id: 'free_limit_close',
    label: 'Free automatic limit close',
    theme: 'light',
    product: baseProduct({
      entitlement: createFreeEntitlement(),
      demoModeEnabled: true,
      demoScenario: 'free_plan',
    }),
    expectRoute: 'home',
    notes: 'Inject ~38 auto trips via app state in e2e harness; product stays Free.',
  },
  {
    id: 'free_limit_reached',
    label: 'Free automatic limit reached',
    theme: 'light',
    product: baseProduct({
      entitlement: createFreeEntitlement(),
      demoModeEnabled: true,
      demoScenario: 'free_plan',
    }),
    expectProtection: /limit|Temporarily limited|paused|Manual/i,
    expectRoute: 'home',
    notes: 'Inject 40 auto trips via app state; domain must queue not discard.',
  },
  {
    id: 'report_ready',
    label: 'Report ready',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'proof_ready' }),
    expectRoute: 'home',
  },
  {
    id: 'report_blocked',
    label: 'Report blocked by missing information',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'proof_blocked' }),
    expectRoute: 'home',
  },
  {
    id: 'offline',
    label: 'Offline',
    theme: 'light',
    product: baseProduct({ demoModeEnabled: true, demoScenario: 'offline_sync' }),
    expectRoute: 'home',
  },
  {
    id: 'loading',
    label: 'Loading',
    theme: 'light',
    product: createInitialProductUiState(),
    expectRoute: 'loading',
  },
  {
    id: 'recoverable_error',
    label: 'Recoverable error',
    theme: 'light',
    product: createInitialProductUiState(),
    expectRoute: 'error',
  },
  {
    id: 'light_mode',
    label: 'Light mode',
    theme: 'light',
    product: baseProduct(),
    expectRoute: 'home',
  },
];

export function fixtureById(id: LaunchFixtureId): LaunchFixture {
  const found = LAUNCH_FIXTURES.find((f) => f.id === id);
  if (!found) throw new Error(`Unknown launch fixture: ${id}`);
  return found;
}

export const PERMISSION_FIXTURES = {
  granted,
  partialBackgroundDenied: {
    location: 'granted',
    backgroundLocation: 'denied',
    motion: 'not_applicable',
    batteryOptimizationRestricted: false,
  } satisfies PermissionSnapshot,
  batteryRestricted: {
    location: 'granted',
    backgroundLocation: 'granted',
    motion: 'not_applicable',
    batteryOptimizationRestricted: true,
  } satisfies PermissionSnapshot,
  notDetermined: {
    location: 'not_determined',
    backgroundLocation: 'not_determined',
    motion: 'not_applicable',
    batteryOptimizationRestricted: false,
  } satisfies PermissionSnapshot,
} as const;
