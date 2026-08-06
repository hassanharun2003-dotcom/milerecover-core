import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createEmptyOnboardingState,
  createFreeEntitlement,
  CURRENT_ONBOARDING_VERSION,
  invalidateStaleOnboardingCompletion,
  isOnboardingMinimumComplete,
  isOnboardingVersionStale,
  mapLegacyGoal,
  mapLegacyPattern,
  migrateLocaleProfile,
  migrateVehicleIdentity,
  nextIncompleteEssentialStep,
  rateForTimestamp,
  type VersionedOnboardingState,
} from '@milerecover/domain';
import {
  allowInternalPreviewTools,
  createInitialProductUiState,
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEYS,
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
  const year = typeof v.year === 'string' ? v.year : '';
  const make = typeof v.make === 'string' ? v.make : '';
  const model = typeof v.model === 'string' ? v.model : '';
  if (!nickname && !year && !make && !model) return null;
  if (nickname === 'Primary vehicle' && !make && !model) return null;
  const now = Date.now();
  const migrated = migrateVehicleIdentity({
    id: typeof v.id === 'string' ? v.id : `vehicle-${now}`,
    nickname,
    year,
    make,
    model,
    plate: typeof v.plate === 'string' ? v.plate : '',
    isPrimary: v.isPrimary !== false,
    nicknameUserSet: v.nicknameUserSet === true,
  });
  return {
    ...migrated,
    plate: migrated.plate ?? '',
    isPrimary: migrated.isPrimary !== false,
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

function normalizeOnboarding(raw: Partial<VersionedOnboardingState> | undefined, now: number): VersionedOnboardingState {
  const base = createEmptyOnboardingState(now);
  if (!raw) return base;
  let next: VersionedOnboardingState = {
    ...base,
    ...raw,
    schemaVersion: 4,
    selectedPainPoints: Array.isArray(raw.selectedPainPoints) ? raw.selectedPainPoints : [],
    completedOnboardingVersion:
      typeof raw.completedOnboardingVersion === 'number' ? raw.completedOnboardingVersion : null,
    completedAt: typeof raw.completedAt === 'number' ? raw.completedAt : null,
    lastUpdatedAt: now,
  };

  // Legacy boolean-only, older version stamps, or corrupt completion stamps
  // (completedAt set without required answers) → invalidate completion, keep answers.
  const stamped = next.completedAt != null || next.completedOnboardingVersion != null;
  if (
    isOnboardingVersionStale(next) ||
    (next.completedAt != null && next.completedOnboardingVersion == null) ||
    (next.completedAt != null && next.completedOnboardingVersion !== CURRENT_ONBOARDING_VERSION) ||
    (stamped && !isOnboardingMinimumComplete(next))
  ) {
    next = invalidateStaleOnboardingCompletion(next, now);
  }
  if (!isOnboardingMinimumComplete(next)) {
    next.currentStep = nextIncompleteEssentialStep(next) ?? 'welcome';
  }
  return next;
}

function buildOnboardingFromLegacy(parsed: Record<string, unknown>, now: number): VersionedOnboardingState {
  if (parsed.onboarding && typeof parsed.onboarding === 'object') {
    return normalizeOnboarding(parsed.onboarding as Partial<VersionedOnboardingState>, now);
  }
  const base = createEmptyOnboardingState(now);
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
    completedOnboardingVersion: null,
    lastUpdatedAt: now,
  };

  // Legacy onboardingComplete boolean alone must NOT grant current-version completion.
  // Preserve answers and place the user on the first unfinished essential step.
  draft.currentStep = nextIncompleteEssentialStep(draft) ?? 'welcome';
  void isOnboardingMinimumComplete;
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
    demoScenario:
      parsed.demoModeEnabled === true
        ? ((parsed.demoScenario as ProductUiState['demoScenario']) ?? 'new_user')
        : 'new_user',
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
    reviewDecisions:
      typeof parsed.reviewDecisions === 'object' && parsed.reviewDecisions
        ? (parsed.reviewDecisions as ProductUiState['reviewDecisions'])
        : {},
    reviewedHistory: Array.isArray(parsed.reviewedHistory) ? (parsed.reviewedHistory as string[]) : [],
    reviewHistoryEntries: Array.isArray(parsed.reviewHistoryEntries)
      ? (parsed.reviewHistoryEntries as ProductUiState['reviewHistoryEntries'])
      : [],
    vehicles: Array.isArray(parsed.vehicles)
      ? (parsed.vehicles.map(normalizeVehicle).filter(Boolean) as VehicleDraft[])
      : [],
    workLocations: Array.isArray(parsed.workLocations)
      ? (parsed.workLocations.map(normalizeWorkPlace).filter(Boolean) as WorkLocationDraft[])
      : [],
    importPhase: (parsed.importPhase as ProductUiState['importPhase']) ?? 'idle',
    importFileLabel: typeof parsed.importFileLabel === 'string' ? parsed.importFileLabel : null,
    importCsvText: typeof parsed.importCsvText === 'string' ? parsed.importCsvText : null,
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
    notificationPreferences: {
      ...base.notificationPreferences,
      ...(typeof parsed.notificationPreferences === 'object' && parsed.notificationPreferences
        ? (parsed.notificationPreferences as ProductUiState['notificationPreferences'])
        : {}),
    },
    firstConfirmedWorkDriveAt:
      typeof parsed.firstConfirmedWorkDriveAt === 'number' ? parsed.firstConfirmedWorkDriveAt : null,
    firstReportPreviewAt:
      typeof parsed.firstReportPreviewAt === 'number' ? parsed.firstReportPreviewAt : null,
    firstRecoverySeenAt:
      typeof parsed.firstRecoverySeenAt === 'number' ? parsed.firstRecoverySeenAt : null,
    firstExportAt: typeof parsed.firstExportAt === 'number' ? parsed.firstExportAt : null,
    firstMissingTripSeenAt:
      typeof parsed.firstMissingTripSeenAt === 'number' ? parsed.firstMissingTripSeenAt : null,
    firstRecoveredDriveAt:
      typeof parsed.firstRecoveredDriveAt === 'number' ? parsed.firstRecoveredDriveAt : null,
    celebratedFirstDriveAt:
      typeof parsed.celebratedFirstDriveAt === 'number' ? parsed.celebratedFirstDriveAt : null,
    celebratedFirstReportAt:
      typeof parsed.celebratedFirstReportAt === 'number' ? parsed.celebratedFirstReportAt : null,
    celebratedFirstRecoveryAt:
      typeof parsed.celebratedFirstRecoveryAt === 'number' ? parsed.celebratedFirstRecoveryAt : null,
    finishSetupDismissedAt:
      typeof parsed.finishSetupDismissedAt === 'number' ? parsed.finishSetupDismissedAt : null,
    localeProfile: migrateLocaleProfile(parsed.localeProfile, now),
    reimbursementCentsPerMile:
      typeof parsed.reimbursementCentsPerMile === 'number'
        ? parsed.reimbursementCentsPerMile
        : rateForTimestamp(migrateLocaleProfile(parsed.localeProfile, now).rates, now)?.centsPerMile ??
          null,
  };
  merged.missingScanPeriodKey =
    typeof parsed.missingScanPeriodKey === 'string' ? parsed.missingScanPeriodKey : null;
  merged.missingScansUsedThisPeriod =
    typeof parsed.missingScansUsedThisPeriod === 'number' ? parsed.missingScansUsedThisPeriod : 0;
  merged.importPreviewStartedAt =
    typeof parsed.importPreviewStartedAt === 'number' ? parsed.importPreviewStartedAt : null;

  // Preserve store-verified (or cached) entitlements across restart.
  // Only wipe invented paid access that was not store/demo verified.
  if (!merged.demoModeEnabled) {
    const ent = merged.entitlement;
    const keep =
      ent &&
      (ent.source === 'store' || ent.source === 'cache') &&
      ent.storeVerified &&
      ent.planId !== 'free';
    if (!keep && ent?.source !== 'demo') {
      // Keep Free; do not invent Plus from local UI selection alone.
      if (!ent?.storeVerified || ent.planId === 'free') {
        merged.entitlement = createFreeEntitlement(now);
        merged.selectedPlan = 'free';
      }
    }
  }
  return merged;
}

/** Small launch-critical stamp — must not race with the large product-ui blob. */
export const ONBOARDING_COMPLETION_KEY = '@milerecover/onboarding-complete/v1';

export type OnboardingCompletionStamp = {
  completedAt: number;
  completedOnboardingVersion: number;
  primaryGoal: NonNullable<VersionedOnboardingState['primaryGoal']>;
  nextActionSelected: NonNullable<VersionedOnboardingState['nextActionSelected']>;
  countryStepAcknowledged: true;
  accountStepAcknowledged: true;
  protectionEducationAcknowledged: true;
  permissionsEducationAcknowledged: true;
};

function applyCompletionStamp(
  state: ProductUiState,
  stamp: OnboardingCompletionStamp,
): ProductUiState {
  const onboarding: VersionedOnboardingState = {
    ...state.onboarding,
    primaryGoal: stamp.primaryGoal,
    nextActionSelected: stamp.nextActionSelected,
    countryStepAcknowledged: true,
    accountStepAcknowledged: true,
    protectionEducationAcknowledged: true,
    permissionsEducationAcknowledged: true,
    completedAt: stamp.completedAt,
    completedOnboardingVersion: stamp.completedOnboardingVersion,
    currentStep: 'ready',
  };
  return {
    ...state,
    onboarding,
    onboardingStep: 'ready',
    primaryGoal: stamp.primaryGoal,
    onboardingNeed: stamp.primaryGoal,
  };
}

export async function saveOnboardingCompletionStamp(
  onboarding: VersionedOnboardingState,
): Promise<void> {
  if (!isOnboardingMinimumComplete(onboarding)) return;
  if (onboarding.primaryGoal == null || onboarding.nextActionSelected == null) return;
  if (onboarding.completedAt == null || onboarding.completedOnboardingVersion == null) return;
  const stamp: OnboardingCompletionStamp = {
    completedAt: onboarding.completedAt,
    completedOnboardingVersion: onboarding.completedOnboardingVersion,
    primaryGoal: onboarding.primaryGoal,
    nextActionSelected: onboarding.nextActionSelected,
    countryStepAcknowledged: true,
    accountStepAcknowledged: true,
    protectionEducationAcknowledged: true,
    permissionsEducationAcknowledged: true,
  };
  await AsyncStorage.setItem(ONBOARDING_COMPLETION_KEY, JSON.stringify(stamp));
}

export async function loadOnboardingCompletionStamp(): Promise<OnboardingCompletionStamp | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_COMPLETION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingCompletionStamp>;
    if (parsed.completedOnboardingVersion !== CURRENT_ONBOARDING_VERSION) return null;
    if (typeof parsed.completedAt !== 'number') return null;
    if (!parsed.primaryGoal || !parsed.nextActionSelected) return null;
    return {
      completedAt: parsed.completedAt,
      completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      primaryGoal: parsed.primaryGoal,
      nextActionSelected: parsed.nextActionSelected,
      countryStepAcknowledged: true,
      accountStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
    };
  } catch {
    return null;
  }
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
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      let migrated = migrateRaw(parsed);
      const stamp = await loadOnboardingCompletionStamp();
      if (stamp && !isOnboardingMinimumComplete(migrated.onboarding)) {
        migrated = applyCompletionStamp(migrated, stamp);
      }
      await AsyncStorage.setItem(PRODUCT_UI_STORAGE_KEY, JSON.stringify(migrated));
      if (key !== PRODUCT_UI_STORAGE_KEY) {
        await AsyncStorage.removeItem(key);
      }
      return migrated;
    }
    // No product blob — still honor a valid completion stamp (rare recovery path).
    const stamp = await loadOnboardingCompletionStamp();
    if (stamp) {
      return applyCompletionStamp(createInitialProductUiState(), stamp);
    }
  } catch {
    // fall through
  }
  return createInitialProductUiState();
}

export async function saveProductUiState(state: ProductUiState): Promise<void> {
  const { showDevTools: _showDevTools, ...persisted } = state;
  void _showDevTools;
  await AsyncStorage.setItem(PRODUCT_UI_STORAGE_KEY, JSON.stringify(persisted));
}

/**
 * Serialize product-ui writes so rapid onboarding taps cannot let an older
 * in-flight AsyncStorage.setItem finish after a newer one (stale disk state).
 * Always persists the latest enqueued snapshot (latest-wins).
 */
let productWriteChain: Promise<void> = Promise.resolve();
let productWriteLatest: ProductUiState | null = null;

/** Enqueue a durable save of the latest product UI state. Safe to call rapidly. */
export function enqueueProductUiSave(state: ProductUiState): Promise<void> {
  productWriteLatest = state;
  productWriteChain = productWriteChain
    .then(async () => {
      // Drain until no newer snapshot arrived while awaiting setItem.
      while (productWriteLatest) {
        const snapshot = productWriteLatest;
        productWriteLatest = null;
        await saveProductUiState(snapshot);
      }
    })
    .catch(() => {
      // Keep the chain alive after a failed write so later saves still run.
    });
  return productWriteChain;
}

/** Await all pending product-ui writes (call after onboarding completion). */
export function flushProductUiSaves(): Promise<void> {
  return productWriteChain;
}

export async function clearProductUiState(): Promise<void> {
  await flushProductUiSaves();
  productWriteLatest = null;
  await AsyncStorage.multiRemove([...PRODUCT_UI_STORAGE_KEYS, ONBOARDING_COMPLETION_KEY]);
}
