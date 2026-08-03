import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allowInternalPreviewTools,
  createInitialProductUiState,
  mapLegacyNeedToGoal,
  mapLegacyOnboardingStep,
  mapLegacyUsageToDrivingType,
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  type ProductUiState,
} from './types';

function migrateRaw(parsed: Record<string, unknown>): ProductUiState {
  const base = createInitialProductUiState();
  const merged = { ...base, ...parsed } as ProductUiState;

  merged.schemaVersion = 2;
  merged.onboardingStep = mapLegacyOnboardingStep(
    (parsed.onboardingStep as string) ?? merged.onboardingStep,
  );
  merged.primaryGoal =
    (parsed.primaryGoal as ProductUiState['primaryGoal']) ??
    mapLegacyNeedToGoal((parsed.onboardingNeed as string) ?? null);
  merged.drivingType =
    (parsed.drivingType as ProductUiState['drivingType']) ??
    mapLegacyUsageToDrivingType((parsed.onboardingUsage as string) ?? null);
  merged.preferredName =
    typeof parsed.preferredName === 'string' ? parsed.preferredName : null;
  merged.protectionSetupState =
    (parsed.protectionSetupState as ProductUiState['protectionSetupState']) ?? 'not_started';
  merged.demoModeEnabled = parsed.demoModeEnabled === true;
  // Never inherit invented demo scenario into live mode
  if (!merged.demoModeEnabled) {
    merged.demoScenario = 'new_user';
  }
  // Strip fixture vehicles that were seeded as "Primary vehicle" with no user action
  if (!Array.isArray(merged.vehicles)) {
    merged.vehicles = [];
  }
  if (
    !merged.demoModeEnabled &&
    merged.vehicles.length === 1 &&
    merged.vehicles[0]?.id === 'vehicle-1' &&
    merged.vehicles[0]?.label === 'Primary vehicle'
  ) {
    merged.vehicles = [];
  }
  // Entitlement stays free unless demo mode is explicitly on (no fake Plus in production)
  if (parsed.selectedPlan !== 'plus' && parsed.selectedPlan !== 'pro' && parsed.selectedPlan !== 'free') {
    merged.selectedPlan = 'free';
  }
  if (!merged.demoModeEnabled) {
    merged.selectedPlan = 'free';
  }
  // One-shot route should not survive cold start / OTA reload
  merged.pendingPostOnboardingRoute = null;
  merged.showDevTools = allowInternalPreviewTools();
  return merged;
}

export async function loadProductUiState(): Promise<ProductUiState> {
  try {
    const rawV2 = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY);
    if (rawV2) {
      return migrateRaw(JSON.parse(rawV2) as Record<string, unknown>);
    }
    const rawV1 = await AsyncStorage.getItem(PRODUCT_UI_STORAGE_KEY_V1);
    if (rawV1) {
      const migrated = migrateRaw(JSON.parse(rawV1) as Record<string, unknown>);
      await saveProductUiState(migrated);
      await AsyncStorage.removeItem(PRODUCT_UI_STORAGE_KEY_V1);
      return migrated;
    }
    return createInitialProductUiState();
  } catch {
    return createInitialProductUiState();
  }
}

export async function saveProductUiState(state: ProductUiState): Promise<void> {
  const { showDevTools: _dev, ...persistable } = state;
  await AsyncStorage.setItem(PRODUCT_UI_STORAGE_KEY, JSON.stringify(persistable));
}

export async function clearProductUiState(): Promise<void> {
  await AsyncStorage.multiRemove([PRODUCT_UI_STORAGE_KEY, PRODUCT_UI_STORAGE_KEY_V1]);
}
