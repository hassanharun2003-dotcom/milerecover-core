import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearProductUiState,
  loadProductUiState,
  saveProductUiState,
} from '../src/product/persistence';
import { isOnboardingMinimumComplete } from '@milerecover/domain';
import {
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  PRODUCT_UI_STORAGE_KEY_V2,
  PRODUCT_UI_STORAGE_KEY_V3,
  createInitialProductUiState,
} from '../src/product/types';

describe('Product UI migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns fresh truthful defaults when nothing is stored', async () => {
    const state = await loadProductUiState();
    expect(state.schemaVersion).toBe(4);
    expect(state.onboarding.schemaVersion).toBe(4);
    expect(state.demoModeEnabled).toBe(false);
    expect(state.selectedPlan).toBe('free');
    expect(state.preferredName).toBeNull();
    expect(state.vehicles).toEqual([]);
  });

  it('migrates v1 storage into v4 without inventing Plus or mileage', async () => {
    await AsyncStorage.setItem(
      PRODUCT_UI_STORAGE_KEY_V1,
      JSON.stringify({
        onboardingStep: 'need_selection',
        onboardingNeed: 'Protect future drives',
        onboardingUsage: 'Employee reimbursement',
        preferredName: 'Hassan',
        selectedPlan: 'plus',
        demoScenario: 'fully_protected',
        vehicles: [{ id: 'vehicle-1', label: 'Primary vehicle' }],
        manualTrips: [{ id: 'm1', date: 'Today', distanceMiles: 12, purpose: 'Client', createdAt: 1 }],
      }),
    );

    const state = await loadProductUiState();
    expect(state.schemaVersion).toBe(4);
    expect(state.onboarding.schemaVersion).toBe(4);
    expect(state.primaryGoal).toBe('mixed');
    expect(state.drivingType).toBe('regular_locations');
    expect(state.selectedPainPoints).toContain('forget_to_track');
    expect(state.preferredName).toBe('Hassan');
    expect(state.manualTrips).toHaveLength(1);
    expect(state.selectedPlan).toBe('free');
    expect(state.demoModeEnabled).toBe(false);
    expect(state.vehicles).toEqual([]);
    expect(await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY_V1)).toBeNull();
    expect(await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY)).toBeTruthy();
  });

  it('migrates v2 into v4 and strips Alex Johnson fixture identity', async () => {
    await AsyncStorage.setItem(
      PRODUCT_UI_STORAGE_KEY_V2,
      JSON.stringify({
        schemaVersion: 2,
        preferredName: 'Alex Johnson',
        selectedPlan: 'plus',
        demoModeEnabled: false,
        vehicles: [{ id: 'v1', nickname: 'Work car', make: 'Toyota', model: 'Corolla', isPrimary: true }],
      }),
    );
    const state = await loadProductUiState();
    expect(state.preferredName).toBeNull();
    expect(state.selectedPlan).toBe('free');
    expect(state.vehicles[0]?.nickname).toBe('Work car');
  });

  it('migrates incomplete v3 into Finish setup without erasing trips or inventing Plus', async () => {
    await AsyncStorage.setItem(
      PRODUCT_UI_STORAGE_KEY_V3,
      JSON.stringify({
        schemaVersion: 3,
        onboardingComplete: true,
        preferredName: 'Sam',
        primaryGoal: null,
        selectedPainPoints: [],
        drivingType: null,
        selectedPlan: 'plus',
        demoModeEnabled: false,
        manualTrips: [{ id: 'kept-1', date: '2026-01-01', distanceMiles: 11, purpose: 'Client', createdAt: 1 }],
        vehicles: [{ id: 'v3', nickname: 'Van', year: '2020', make: 'Ford', model: 'Transit', plate: '', isPrimary: true, createdAt: 1, updatedAt: 1 }],
      }),
    );
    const state = await loadProductUiState();
    expect(state.schemaVersion).toBe(4);
    expect(state.preferredName).toBe('Sam');
    expect(state.selectedPlan).toBe('free');
    expect(state.manualTrips).toHaveLength(1);
    expect(state.vehicles[0]?.nickname).toBe('Van');
    expect(state.notificationPreferences.enabled).toBe(true);
    expect(isOnboardingMinimumComplete(state.onboarding)).toBe(false);
  });

  it('preserves genuine preferred name across save/load', async () => {
    const next = {
      ...createInitialProductUiState(),
      preferredName: 'Sam',
      onboarding: {
        ...createInitialProductUiState().onboarding,
        preferredName: 'Sam',
        primaryGoal: 'self_employed_business',
        drivingPattern: 'delivery_rideshare',
      },
      primaryGoal: 'self_employed_business' as const,
      drivingType: 'delivery_rideshare' as const,
    };
    await saveProductUiState(next);
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBe('Sam');
    expect(loaded.primaryGoal).toBe('self_employed_business');
  });

  it('clears product UI state for preview reset', async () => {
    await saveProductUiState({ ...createInitialProductUiState(), preferredName: 'Temp' });
    await clearProductUiState();
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBeNull();
  });
});
