import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearProductUiState,
  loadProductUiState,
  saveProductUiState,
} from '../src/product/persistence';
import {
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  PRODUCT_UI_STORAGE_KEY_V2,
  createInitialProductUiState,
} from '../src/product/types';

describe('Product UI migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns fresh truthful defaults when nothing is stored', async () => {
    const state = await loadProductUiState();
    expect(state.schemaVersion).toBe(3);
    expect(state.demoModeEnabled).toBe(false);
    expect(state.selectedPlan).toBe('free');
    expect(state.preferredName).toBeNull();
    expect(state.vehicles).toEqual([]);
  });

  it('migrates v1 storage into v3 without inventing Plus or mileage', async () => {
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
    expect(state.schemaVersion).toBe(3);
    expect(state.primaryGoal).toBe('protect_future');
    expect(state.drivingType).toBe('employee');
    expect(state.preferredName).toBe('Hassan');
    expect(state.manualTrips).toHaveLength(1);
    expect(state.selectedPlan).toBe('free');
    expect(state.demoModeEnabled).toBe(false);
    expect(state.vehicles).toEqual([]);
    expect(await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY_V1)).toBeNull();
    expect(await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY)).toBeTruthy();
  });

  it('migrates v2 into v3 and strips Alex Johnson fixture identity', async () => {
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

  it('preserves genuine preferred name across save/load', async () => {
    const next = {
      ...createInitialProductUiState(),
      preferredName: 'Sam',
      primaryGoal: 'prepare_report' as const,
      drivingType: 'gig' as const,
    };
    await saveProductUiState(next);
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBe('Sam');
    expect(loaded.primaryGoal).toBe('prepare_report');
  });

  it('clears product UI state for preview reset', async () => {
    await saveProductUiState({ ...createInitialProductUiState(), preferredName: 'Temp' });
    await clearProductUiState();
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBeNull();
  });
});
