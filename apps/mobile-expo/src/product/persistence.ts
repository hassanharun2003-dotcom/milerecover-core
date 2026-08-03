import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEmptyOnboardingState,
  createFreeEntitlement,
  inferNextAction,
  isOnboardingMinimumComplete,
  mapLegacyGoal,
  mapLegacyPattern,
  type VersionedOnboardingState,
} from '@milerecover/domain';
import {
  allowInternalPreviewTools,
  createInitialProductUiState,
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V1,
  PRODUCT_UI_STORAGE_KEY_V2,
  PRODUCT_UI_STORAGE_KEY_V3,
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
    year: typeof v.year === 'string' ? v.year : '',
    make: typeof v.make === 'string' ? v.make : '',
    model: typeof v.model === 'string' ? v.model : '',
    plate: typeof v.plate === 'string' ? v.plate : '',
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
    kind:
      w.kind === 'home' || w.kind === 'workplace' || w.kind === 'client' || w.kind === 'other'
        ? w.kind
        : 'other',
    createdAt: typeof w.createdAt === 'number' ? w.createdAt : now,
    updatedAt: typeof w.updatedAt === 'number' ? w.updatedAt : now,
  };
}

function buildOnboardingFromLegacy(parsed: Record<string, unknown>, now: number): VersionedOnboardingState {
  const base = createEmptyOnboardingState(now);
  if (parsed.onboarding && typeof parsed.onboarding === 'object') {
    const o = parsed.onboarding as Partial<VersionedOnboardingState>;
    return {
      ...base,
      ...o,
      schemaVersion: 4,
      selectedPainPoints: Array.isArray(o.selectedPainPoints) ? o.selectedPainPoints : [],
      lastUpdatedAt: now,
    };
  }
  const primaryGoal =
    mapLegacyGoal((parsed.primaryGoal as string) ?? (parsed.onboardingNeed as string) ?? null) ??
    mapLegacyGoal(parsed.drivingType as string);
  const drivingPattern =
    mapLegacyPattern((parsed.drivingType as string) ?? (parsed.onboardingUsage as string) ?? null) ??
    mapLegacyPattern(parsed.primaryGoal as string);
  const preferredName =
    typeof parsed.preferredName === 'string' && parsed.preferredName.trim()
      ? parsed.preferredName.trim()
      : null;
  if (preferredName && /alex\s*johnson/i.test(preferredName)) {
    // stripped below
  }
  const protectionAck =
    parsed.protectionSetupState === 'educated' ||
    parsed.protectionSetupState === 'configured' ||
    parsed.protectionSetupState === 'healthy' ||
    parsed.protectionSetupState === 'limited';
  const vehicles = Array.isArray(parsed.vehicles) ? parsed.vehicles : [];
  const places = Array.isArray(parsed.workLocations) ? parsed.workLocations : [];
  const pain =
    Array.isArray(parsed.selectedPainPoints) && parsed.selectedPainPoints.length
      ? (parsed.selectedPainPoints as VersionedOnboardingState['selectedPainPoints'])
      : primaryGoal
        ? (['forget_to_track'] as VersionedOnboardingState['selectedPainPoints'])
        : [];

  const draft: VersionedOnboardingState = {
    ...base,
    primaryGoal,
    drivingPattern,
    preferredName: preferredName && !/alex\s*johnson/i.test(preferredName) ? preferredName : null,
    selectedPainPoints: pain,
    vehicleSetupState: vehicles.length ? 'added' : 'not_started',
    familiarPlacesSetupState: places.length ? 'added' : 'not_started',
    protectionEducationAcknowledged: Boolean(protectionAck),
    permissionsEducationAcknowledged: Boolean(protectionAck),
    nextActionSelected: null,
    completedAt: null,
    lastUpdatedAt: now,
  };
  if (
    draft.primaryGoal &&
    draft.selectedPainPoints.length &&
    draft.drivingPattern &&
    draft.protectionEducationAcknowledged
  ) {
    draft.nextActionSelected = inferNextAction(draft);
    // Do not auto-complete — incomplete migrated users must finish setup
    if (parsed.onboardingComplete === true || parsed.schemaVersion === 3) {
      // Only mark complete if all minimum fields truly present
      draft.completedAt = isOnboardingMinimumComplete({
        ...draft,
        completedAt: now,
      })
        ? now
        : null;
    }
  }
  draft.currentStep =
    draft.completedAt != null
      ? 'ready'
      : draft.primaryGoal == null
        ? 'primary_goal'
        : draft.selectedPainPoints.length === 0
          ? 'pain_points'
          : draft.drivingPattern == null
            ? 'driving_pattern'
            : !draft.protectionEducationAcknowledged
              ? 'protection_education'
              : 'ready';
  return draft;
}

function migrateRaw(parsed: Record<string, unknown>): ProductUiState {
  const base = createInitialProductUiState();
  const now = Date.now();
  const onboarding = buildOnboardingFromLegacy(parsed, now);
  const merged: ProductUiState = {
    ...base,
    ...parsed,
    schemaVersion: 4,
    onboarding,
    onboardingStep: onboarding.currentStep,
    preferredName: onboarding.preferredName,
    primaryGoal: onboarding.primaryGoal,
    drivingType: onboarding.drivingPattern,
    selectedPainPoints: onboarding.selectedPainPoints,
    protectionSetupState:
      (parsed.protectionSetupState as ProductUiState['protectionSetupState']) ?? 'not_started',
    demoModeEnabled: parsed.demoModeEnabled === true,
    demoScenario: parsed.demoModeEnabled === true ? ((parsed.demoScenario as ProductUiState['demoScenario']) ?? 'new_user') : 'new_user',
    selectedPlan: 'free',
    entitlement:
      parsed.demoModeEnabled === true && parsed.entitlement
        ? (parsed.entitlement as ProductUiState['entitlement'])
        : createFreeEntitlement(now),
    paywallCaps: {
      lastFullScreenAt: null,
      dismissedInSession: false,
      lastTrialOfferAt: null,
      trialOfferDismissedSession: false,
      ...(typeof parsed.paywallCaps === 'object' && parsed.paywallCaps ? parsed.paywallCaps : {}),
    },
    vehicles: Array.isArray(parsed.vehicles)
      ? parsed.vehicles.map(normalizeVehicle).filter((v): v is VehicleDraft => v != null)
      : [],
    workLocations: Array.isArray(parsed.workLocations)
      ? parsed.workLocations.map(normalizeWorkPlace).filter((w): w is WorkLocationDraft => w != null)
      : [],
    reviewHistoryEntries: Array.isArray(parsed.reviewHistoryEntries)
      ? (parsed.reviewHistoryEntries as ProductUiState['reviewHistoryEntries'])
      : [],
    importBatches: Array.isArray(parsed.importBatches)
      ? (parsed.importBatches as ProductUiState['importBatches'])
      : [],
    manualTrips: Array.isArray(parsed.manualTrips)
      ? (parsed.manualTrips as ProductUiState['manualTrips'])
      : [],
    manualTripsMigrated: parsed.manualTripsMigrated === true,
    pendingPostOnboardingRoute: null,
    showDevTools: allowInternalPreviewTools(),
    trackingEnabled: parsed.trackingEnabled === true,
    firstConfirmedWorkDriveAt:
      typeof parsed.firstConfirmedWorkDriveAt === 'number' ? parsed.firstConfirmedWorkDriveAt : null,
    firstReportPreviewAt:
      typeof parsed.firstReportPreviewAt === 'number' ? parsed.firstReportPreviewAt : null,
    firstRecoverySeenAt:
      typeof parsed.firstRecoverySeenAt === 'number' ? parsed.firstRecoverySeenAt : null,
  };
  if (!merged.demoModeEnabled) {
    merged.entitlement = createFreeEntitlement(now);
    merged.selectedPlan = 'free';
  }
  return merged;
}

export async function loadProductUiState(): Promise<ProductUiState> {
  try {
    for (const key of [
      PRODUCT_UI_STORAGE_KEY,
      PRODUCT_UI_STORAGE_KEY_V3,
      PRODUCT_UI_STORAGE_KEY_V2,
      PRODUCT_UI_STORAGE_KEY_V1,
    ]) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const migrated = migrateRaw(JSON.parse(raw) as Record<string, unknown>);
      await saveProductUiState(migrated);
      if (key !== PRODUCT_UI_STORAGE_KEY) await AsyncStorage.removeItem(key);
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
    PRODUCT_UI_STORAGE_KEY_V3,
    PRODUCT_UI_STORAGE_KEY_V2,
    PRODUCT_UI_STORAGE_KEY_V1,
  ]);
}
