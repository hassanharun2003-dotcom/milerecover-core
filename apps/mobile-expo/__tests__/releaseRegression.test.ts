import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildMileageReportData,
  canCaptureAutomaticTrip,
  createEmptyOnboardingState,
  createFreeEntitlement,
  createManualTripRecord,
  describeAutomaticAllowance,
  MAX_TRIP_DISTANCE_MILES,
  nextIncompleteEssentialStep,
  resolveReportPeriod,
  validateManualTripInput,
  type ManualTripInput,
  type PermissionSnapshot,
  type TripRecord,
} from '@milerecover/domain';
import { loadProductUiState } from '../src/product/persistence';
import { selectHomePeriodSummary, selectProtectionView } from '../src/product/presentation';
import { createInitialProductUiState, ONBOARDING_STEP_ORDER } from '../src/product/types';
import { resetAppExperience, LOCAL_EXPERIENCE_STORAGE_KEYS } from '../src/services/dataPrivacy';
import { checkThemeContrast } from '../src/testing/visualEvidence';
import {
  renderMainTabs,
  renderStackScreen,
  renderTab,
} from '../src/testing/ScreenTestHarness';
import { resolveLaunchState } from '../src/startup/launchState';
import { createInitialAppState } from '../src/store/types';

const grantedPermissions: PermissionSnapshot = {
  location: 'granted',
  backgroundLocation: 'granted',
  motion: 'granted',
  batteryOptimizationRestricted: false,
};

function manualInput(extra: Partial<ManualTripInput> = {}): ManualTripInput {
  return {
    startAt: Date.now() - 60_000,
    endAt: Date.now(),
    distanceMiles: 12,
    purpose: 'Client visit',
    evidenceMethod: 'user_estimate',
    confirmAsWork: true,
    ...extra,
  };
}

function workTrip(id: string, distanceMiles: number, startAt = Date.now() - 60_000): TripRecord {
  return {
    ...createManualTripRecord(manualInput({ id, distanceMiles, startAt, endAt: startAt + 30_000 })),
    id,
    source: 'manual',
    status: 'confirmed',
    classification: 'business',
  };
}

function autoTrip(id: number, startAt = Date.now() - id * 1_000): TripRecord {
  return {
    ...workTrip(`auto-${id}`, 1, startAt),
    source: 'auto_detected',
  };
}

describe('Continuous release regression matrix', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('1. opens Welcome for a fresh empty onboarding state after migration', async () => {
    const product = await loadProductUiState();
    const launch = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: product.onboarding,
      tripCount: 0,
    });

    expect(product.onboarding.currentStep).toBe('welcome');
    expect(launch.kind).toBe('firstLaunch');
    expect(launch.showOnboarding).toBe(true);
    expect(launch.allowHome).toBe(false);
  });

  it('2. waits for first capture before showing protected status', () => {
    const app = {
      ...createInitialAppState(),
      trackingEngineState: 'active' as const,
      lastConfirmedCaptureAt: null,
    };
    const product = {
      ...createInitialProductUiState(),
      trackingEnabled: true,
      protectionSetupState: 'configured' as const,
    };
    const waiting = selectProtectionView({
      app,
      product,
      permissions: grantedPermissions,
      automaticCaptureAvailable: true,
      pendingReviewCount: 0,
    });
    const protectedView = selectProtectionView({
      app: { ...app, lastConfirmedCaptureAt: Date.now() - 30_000 },
      product,
      permissions: grantedPermissions,
      automaticCaptureAvailable: true,
      pendingReviewCount: 0,
    });

    expect(waiting.status).toBe('configured_waiting');
    expect(waiting.title).not.toMatch(/protected/i);
    expect(protectedView.status).toBe('protected');
  });

  it('3. clears every local app experience key during reset', async () => {
    await Promise.all(
      LOCAL_EXPERIENCE_STORAGE_KEYS.map((key) => AsyncStorage.setItem(key, `value-for-${key}`)),
    );

    await resetAppExperience();

    await Promise.all(
      LOCAL_EXPERIENCE_STORAGE_KEYS.map(async (key) => {
        expect(await AsyncStorage.getItem(key)).toBeNull();
      }),
    );
  });

  it('4. rejects invalid manual trip distances', () => {
    expect(validateManualTripInput(manualInput({ distanceMiles: 0 }))).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'distanceMiles' })]),
    );
    expect(validateManualTripInput(manualInput({ distanceMiles: -1 }))).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'distanceMiles' })]),
    );
    expect(
      validateManualTripInput(manualInput({ distanceMiles: MAX_TRIP_DISTANCE_MILES + 1 })),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'distanceMiles' })]));
  });

  it('5. excludes personal trips from proof totals', () => {
    const now = Date.now();
    const period = resolveReportPeriod('this_week', now);
    const business = workTrip('work-1', 18, now - 60_000);
    const personal: TripRecord = {
      ...workTrip('personal-1', 50, now - 30_000),
      status: 'personal',
      classification: 'personal',
    };

    const report = buildMileageReportData({
      trips: [business, personal],
      period,
      userName: 'Sam',
    });

    expect(report.totalMiles).toBe(18);
    expect(report.tripCount).toBe(1);
    expect(report.lineItems.map((item) => item.id)).toEqual(['work-1']);
  });

  it('6. keeps Home and Proof totals aligned for the same period', () => {
    const now = Date.now();
    const product = createInitialProductUiState();
    const trips = [workTrip('work-1', 7, now - 60_000), workTrip('work-2', 8, now - 30_000)];
    const home = selectHomePeriodSummary({
      trips,
      locale: product.localeProfile,
      preferredName: product.preferredName,
      primaryGoal: product.primaryGoal,
      periodKind: 'this_week',
    });
    const proof = buildMileageReportData({
      trips,
      period: resolveReportPeriod('this_week', now),
      userName: product.preferredName,
      primaryGoal: product.primaryGoal,
      localeProfile: product.localeProfile,
    });

    expect(home.workMiles).toBe(proof.totalMiles);
    expect(home.tripCount).toBe(proof.tripCount);
  });

  it('7. pauses Free automatic capture at 40 trips without deleting trips', () => {
    const entitlement = createFreeEntitlement();
    const trips = Array.from({ length: 40 }, (_, index) => autoTrip(index + 1));
    const allowance = describeAutomaticAllowance(entitlement, trips);

    expect(canCaptureAutomaticTrip(entitlement, trips)).toBe(false);
    expect(allowance).toEqual({ used: 40, limit: 40, remaining: 0 });
    expect(trips).toHaveLength(40);
  });

  it('8. has no light or dark semantic contrast failures', () => {
    expect(checkThemeContrast('light')).toEqual([]);
    expect(checkThemeContrast('dark')).toEqual([]);
  });

  it('9. renders substantial copy for tabs and critical stack screens', async () => {
    const rendered = [
      ['MainTabs', (await renderMainTabs('new_user', { demoModeEnabled: false })).copy],
      ['Home', (await renderTab('new_user', 'Home', { demoModeEnabled: false })).copy],
      ['Review', (await renderTab('recovery_available', 'Review')).copy],
      ['Proof', (await renderTab('proof_ready', 'Proof')).copy],
      ['Profile', (await renderTab('new_user', 'Profile', { demoModeEnabled: false })).copy],
      ['ManualTrip', (await renderStackScreen('ManualTrip')).copy],
      ['ProtectionAlert', (await renderStackScreen('ProtectionAlert')).copy],
    ];

    for (const [name, copy] of rendered) {
      expect(name).toBeTruthy();
      expect(copy.replace(/\s+/g, ' ').trim().length).toBeGreaterThan(80);
    }
  });

  it('10. keeps onboarding step order complete and starts empty users at Welcome', () => {
    expect(ONBOARDING_STEP_ORDER).toHaveLength(5);
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'purpose',
      'locale_setup',
      'protect_drives',
      'ready',
    ]);
    expect(nextIncompleteEssentialStep(createEmptyOnboardingState())).toBe('welcome');
  });
});
