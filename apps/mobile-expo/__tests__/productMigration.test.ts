import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearProductUiState,
  loadProductUiState,
  saveProductUiState,
} from '../src/product/persistence';
import {
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  createInitialProductUiState,
} from '../src/product/types';

describe('Product UI migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns fresh truthful defaults when nothing is stored', async () => {
    const state = await loadProductUiState();
    expect(state.schemaVersion).toBe(2);
    expect(state.demoModeEnabled).toBe(false);
    expect(state.selectedPlan).toBe('free');
    expect(state.preferredName).toBeNull();
    expect(state.vehicles).toEqual([]);
    expect(state.pendingPostOnboardingRoute).toBeNull();
  });

  it('migrates v1 storage into v2 without inventing Plus or mileage', async () => {
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
    expect(state.schemaVersion).toBe(2);
    expect(state.onboardingStep).toBe('primary_goal');
    expect(state.primaryGoal).toBe('protect_future');
    expect(state.drivingType).toBe('employee');
    expect(state.preferredName).toBe('Hassan');
    expect(state.manualTrips).toHaveLength(1);
    // Live migration must not keep fake Plus or seeded Primary vehicle
    expect(state.selectedPlan).toBe('free');
    expect(state.demoModeEnabled).toBe(false);
    expect(state.demoScenario).toBe('new_user');
    expect(state.vehicles).toEqual([]);

    const v1 = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY_V1);
    const v2 = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY);
    expect(v1).toBeNull();
    expect(v2).toBeTruthy();
  });

  it('preserves genuine preferred name and manual trips across save/load', async () => {
    const next = {
      ...createInitialProductUiState(),
      preferredName: 'Sam',
      primaryGoal: 'prepare_report' as const,
      drivingType: 'gig' as const,
      protectionSetupState: 'educated' as const,
      manualTrips: [
        { id: 'manual-1', date: '2026-08-01', distanceMiles: 9.5, purpose: 'Delivery', createdAt: 100 },
      ],
    };
    await saveProductUiState(next);
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBe('Sam');
    expect(loaded.primaryGoal).toBe('prepare_report');
    expect(loaded.drivingType).toBe('gig');
    expect(loaded.manualTrips[0]?.purpose).toBe('Delivery');
    expect(loaded.selectedPlan).toBe('free');
  });

  it('clears product UI state for preview reset', async () => {
    await saveProductUiState({
      ...createInitialProductUiState(),
      preferredName: 'Temp',
    });
    await clearProductUiState();
    const loaded = await loadProductUiState();
    expect(loaded.preferredName).toBeNull();
  });
});
