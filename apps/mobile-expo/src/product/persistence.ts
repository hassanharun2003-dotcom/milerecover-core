import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allowInternalPreviewTools,
  createInitialProductUiState,
  mapLegacyNeedToGoal,
  mapLegacyOnboardingStep,
  mapLegacyUsageToDrivingType,
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  PRODUCT_UI_STORAGE_KEY_V2,
  type ProductUiState,
  type VehicleDraft,
  type WorkLocationDraft,
} from './types';

function normalizeVehicle(raw: unknown): VehicleDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const nickname =
    (typeof v.nickname === 'string' && v.nickname) ||
    (typeof v.label === 'string' && v.label) ||
    '';
  if (!nickname || nickname === 'Primary vehicle') return null;
  const now = Date.now();
  return {
    id: typeof v.id === 'string' ? v.id : `vehicle-${now}`,
    nickname,
    make: typeof v.make === 'string' ? v.make : '',
    model: typeof v.model === 'string' ? v.model : '',
    isPrimary: v.isPrimary !== false,
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : now,
    updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : now,
  };
}

function normalizeWorkPlace(raw: unknown): WorkLocationDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  const label = typeof w.label === 'string' ? w.label : '';
  if (!label) return null;
  const now = Date.now();
  return {
    id: typeof w.id === 'string' ? w.id : `work-${now}`,
    label,
    address: typeof w.address === 'string' ? w.address : '',
    notes: typeof w.notes === 'string' ? w.notes : '',
    createdAt: typeof w.createdAt === 'number' ? w.createdAt : now,
    updatedAt: typeof w.updatedAt === 'number' ? w.updatedAt : now,
  };
}

function migrateRaw(parsed: Record<string, unknown>): ProductUiState {
  const base = createInitialProductUiState();
  const merged = { ...base, ...parsed } as ProductUiState;
  merged.schemaVersion = 3;
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
    typeof parsed.preferredName === 'string' && parsed.preferredName.trim()
      ? parsed.preferredName.trim()
      : null;
  merged.protectionSetupState =
    (parsed.protectionSetupState as ProductUiState['protectionSetupState']) ?? 'not_started';
  merged.demoModeEnabled = parsed.demoModeEnabled === true;
  if (!merged.demoModeEnabled) {
    merged.demoScenario = 'new_user';
    merged.selectedPlan = 'free';
  }
  const vehicles = Array.isArray(parsed.vehicles)
    ? parsed.vehicles.map(normalizeVehicle).filter((v): v is VehicleDraft => v != null)
    : [];
  merged.vehicles = vehicles;
  merged.workLocations = Array.isArray(parsed.workLocations)
    ? parsed.workLocations.map(normalizeWorkPlace).filter((w): w is WorkLocationDraft => w != null)
    : [];
  merged.reviewHistoryEntries = Array.isArray(parsed.reviewHistoryEntries)
    ? (parsed.reviewHistoryEntries as ProductUiState['reviewHistoryEntries'])
    : [];
  merged.importBatches = Array.isArray(parsed.importBatches)
    ? (parsed.importBatches as ProductUiState['importBatches'])
    : [];
  merged.importCsvText = typeof parsed.importCsvText === 'string' ? parsed.importCsvText : null;
  merged.manualTrips = Array.isArray(parsed.manualTrips)
    ? (parsed.manualTrips as ProductUiState['manualTrips'])
    : [];
  merged.manualTripsMigrated = parsed.manualTripsMigrated === true;
  merged.pendingPostOnboardingRoute = null;
  merged.showDevTools = allowInternalPreviewTools();
  // Never keep fixture identity
  if (merged.preferredName && /alex\s*johnson/i.test(merged.preferredName)) {
    merged.preferredName = null;
  }
  return merged;
}

export async function loadProductUiState(): Promise<ProductUiState> {
  try {
    for (const key of [PRODUCT_UI_STORAGE_KEY, PRODUCT_UI_STORAGE_KEY_V2, PRODUCT_UI_STORAGE_KEY_V1]) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const migrated = migrateRaw(JSON.parse(raw) as Record<string, unknown>);
      await saveProductUiState(migrated);
      if (key !== PRODUCT_UI_STORAGE_KEY) {
        await AsyncStorage.removeItem(key);
      }
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
  await AsyncStorage.multiRemove([
    PRODUCT_UI_STORAGE_KEY,
    PRODUCT_UI_STORAGE_KEY_V2,
    PRODUCT_UI_STORAGE_KEY_V1,
  ]);
}
