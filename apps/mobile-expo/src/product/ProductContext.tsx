import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createEmptyOnboardingState,
  createFreeEntitlement,
  inferNextAction,
  isOnboardingMinimumComplete,
  type EntitlementSnapshot,
  type NextActionId,
  type PainPoint,
  type VersionedOnboardingState,
} from '@milerecover/domain';
import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';
import { clearProductUiState, loadProductUiState, saveProductUiState } from './persistence';
import {
  allowInternalPreviewTools,
  createInitialProductUiState,
  ONBOARDING_STEP_ORDER,
  type DrivingType,
  type ImportBatchSummary,
  type ImportFlowPhase,
  type PostOnboardingRoute,
  type PrimaryGoal,
  type ProductOnboardingStep,
  type ProductUiState,
  type ProtectionSetupState,
  type ReviewDecision,
  type ReviewHistoryEntry,
  type VehicleDraft,
  type WorkLocationDraft,
} from './types';

type OnboardingPatch = Partial<VersionedOnboardingState>;
type VehicleUpsert = {
  id: string;
  nickname?: string;
  year?: string;
  make?: string;
  model?: string;
  plate?: string;
  isPrimary?: boolean;
  createdAt?: number;
  updatedAt?: number;
};
type WorkLocationUpsert = {
  id: string;
  label?: string;
  address?: string;
  notes?: string;
  kind?: WorkLocationDraft['kind'];
  createdAt?: number;
  updatedAt?: number;
};

interface ProductContextValue {
  product: ProductUiState;
  hydrated: boolean;
  isSetupComplete: boolean;
  patchOnboarding: (partial: OnboardingPatch) => void;
  completeOnboardingMinimum: (nextAction?: NextActionId | null) => void;
  setOnboardingStep: (step: ProductOnboardingStep) => void;
  advanceOnboarding: () => void;
  backOnboarding: () => void;
  setPrimaryGoal: (goal: PrimaryGoal) => void;
  setSelectedPainPoints: (painPoints: PainPoint[]) => void;
  setDrivingType: (type: DrivingType) => void;
  setPreferredName: (name: string | null) => void;
  setProtectionSetupState: (state: ProtectionSetupState) => void;
  skipPreferredName: () => void;
  skipVehicleSetup: () => void;
  skipWorkPlaceSetup: () => void;
  resetOnboarding: (options?: { keepVehicles?: boolean }) => void;
  setDemoModeEnabled: (enabled: boolean) => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  setSelectedPlan: (plan: PlanTier) => boolean;
  setEntitlement: (snapshot: EntitlementSnapshot) => void;
  markTrialOfferShown: () => void;
  dismissTrialOfferSession: () => void;
  dismissPaywallSession: () => void;
  markPaywallShown: () => void;
  setTrackingEnabled: (enabled: boolean) => void;
  markFirstConfirmedWorkDrive: () => void;
  markFirstReportPreview: () => void;
  markFirstRecoverySeen: () => void;
  setPendingPostOnboardingRoute: (route: PostOnboardingRoute) => void;
  consumePendingPostOnboardingRoute: () => PostOnboardingRoute;
  completeProductOnboarding: (route?: PostOnboardingRoute) => void;
  setReviewDecision: (itemId: string, decision: ReviewDecision) => void;
  undoReviewDecision: (itemId: string) => void;
  pushReviewHistory: (entry: ReviewHistoryEntry) => void;
  markReviewHistoryUndone: (entryId: string) => void;
  upsertVehicle: (vehicle: VehicleUpsert) => void;
  upsertWorkLocation: (location: WorkLocationUpsert) => void;
  setNotificationPreferences: (partial: Partial<ProductUiState['notificationPreferences']>) => void;
  setImportPhase: (phase: ImportFlowPhase, fileLabel?: string | null, csvText?: string | null) => void;
  addImportBatch: (batch: ImportBatchSummary) => void;
  markManualTripsMigrated: () => void;
  resetProductData: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | null>(null);

function uniqueList<T extends string>(items: T[]): T[] {
  return [...new Set(items)];
}

function uniqueSteps(steps: ProductOnboardingStep[]): ProductOnboardingStep[] {
  return uniqueList(steps);
}

function mirrorOnboarding(product: ProductUiState, onboarding: VersionedOnboardingState): ProductUiState {
  return {
    ...product,
    onboarding,
    onboardingStep: onboarding.currentStep,
    preferredName: onboarding.preferredName,
    primaryGoal: onboarding.primaryGoal,
    drivingType: onboarding.drivingPattern,
    selectedPainPoints: onboarding.selectedPainPoints,
    onboardingNeed: onboarding.primaryGoal,
    onboardingUsage: onboarding.drivingPattern,
  };
}

function patchOnboardingState(product: ProductUiState, partial: OnboardingPatch, now = Date.now()): ProductUiState {
  const onboarding: VersionedOnboardingState = {
    ...product.onboarding,
    ...partial,
    schemaVersion: 4,
    completedSteps: uniqueSteps(
      (partial.completedSteps ?? product.onboarding.completedSteps) as ProductOnboardingStep[],
    ),
    selectedPainPoints: [...(partial.selectedPainPoints ?? product.onboarding.selectedPainPoints)],
    lastUpdatedAt: now,
  };
  return mirrorOnboarding(product, onboarding);
}

function moveToStep(product: ProductUiState, step: ProductOnboardingStep): ProductUiState {
  return patchOnboardingState(product, { currentStep: step });
}

function nextOrderStep(step: ProductOnboardingStep): ProductOnboardingStep {
  const idx = ONBOARDING_STEP_ORDER.indexOf(step);
  return ONBOARDING_STEP_ORDER[Math.min(Math.max(idx, 0) + 1, ONBOARDING_STEP_ORDER.length - 1)];
}

function previousOrderStep(step: ProductOnboardingStep): ProductOnboardingStep | null {
  const idx = ONBOARDING_STEP_ORDER.indexOf(step);
  if (idx <= 0) return null;
  return ONBOARDING_STEP_ORDER[idx - 1];
}

function nextActionForRoute(route: PostOnboardingRoute, product: ProductUiState): NextActionId {
  if (route === 'BringExistingMileage') return 'import_mileage';
  if (route === 'ManualTrip') return 'add_first_drive';
  if (route === 'MissingTripRecovery') return 'begin_rescue';
  if (route === 'ProtectionAlert' || route === 'TrackingActive') return 'start_protection';
  return inferNextAction(product.onboarding);
}

function demoEntitlementForPlan(plan: PlanTier, previous: EntitlementSnapshot): EntitlementSnapshot {
  if (plan === 'free') {
    return { ...createFreeEntitlement(), source: 'demo' };
  }
  return {
    ...previous,
    status: plan === 'pro' ? 'proActive' : 'plusActive',
    planId: plan,
    storeVerified: false,
    trialEligible: false,
    trialEndsAt: null,
    renewsAt: null,
    productId: `demo.${plan}`,
    lastVerifiedAt: Date.now(),
    source: 'demo',
  };
}

export function ProductProvider({
  children,
  initialState,
  skipHydration = false,
}: {
  children: React.ReactNode;
  initialState?: ProductUiState;
  skipHydration?: boolean;
}) {
  const [product, setProduct] = useState<ProductUiState>(
    () => initialState ?? createInitialProductUiState(),
  );
  const [hydrated, setHydrated] = useState(skipHydration);
  const hydratedRef = useRef(skipHydration);

  useEffect(() => {
    if (skipHydration) {
      hydratedRef.current = true;
      setHydrated(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const loaded = await loadProductUiState();
      if (cancelled) return;
      setProduct(loaded);
      hydratedRef.current = true;
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [skipHydration]);

  const persist = useCallback((updater: (prev: ProductUiState) => ProductUiState) => {
    setProduct((prev) => {
      const next = updater(prev);
      if (hydratedRef.current) void saveProductUiState(next);
      return next;
    });
  }, []);

  const value = useMemo<ProductContextValue>(
    () => ({
      product,
      hydrated,
      isSetupComplete: isOnboardingMinimumComplete(product.onboarding),
      patchOnboarding: (partial) => persist((prev) => patchOnboardingState(prev, partial)),
      completeOnboardingMinimum: (nextAction = null) =>
        persist((prev) => {
          const now = Date.now();
          const action = nextAction ?? inferNextAction(prev.onboarding);
          return patchOnboardingState(prev, {
            currentStep: 'ready',
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, prev.onboarding.currentStep, 'ready']),
            protectionEducationAcknowledged: true,
            nextActionSelected: action,
            completedAt: now,
          }, now);
        }),
      setOnboardingStep: (step) => persist((prev) => moveToStep(prev, step)),
      advanceOnboarding: () =>
        persist((prev) => {
          const current = prev.onboarding.currentStep;
          return patchOnboardingState(prev, {
            currentStep: nextOrderStep(current),
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, current]),
          });
        }),
      backOnboarding: () =>
        persist((prev) => {
          const previous = previousOrderStep(prev.onboarding.currentStep);
          return previous ? moveToStep(prev, previous) : prev;
        }),
      setPrimaryGoal: (goal) =>
        persist((prev) =>
          patchOnboardingState(prev, {
            primaryGoal: goal,
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'primary_goal']),
          }),
        ),
      setSelectedPainPoints: (painPoints) =>
        persist((prev) =>
          patchOnboardingState(prev, {
            selectedPainPoints: uniqueList(painPoints),
            completedSteps: painPoints.length
              ? uniqueSteps([...prev.onboarding.completedSteps, 'pain_points'])
              : prev.onboarding.completedSteps.filter((step) => step !== 'pain_points'),
          }),
        ),
      setDrivingType: (type) =>
        persist((prev) =>
          patchOnboardingState(prev, {
            drivingPattern: type,
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'driving_pattern']),
          }),
        ),
      setPreferredName: (name) =>
        persist((prev) =>
          patchOnboardingState(prev, {
            preferredName: name?.trim() ? name.trim() : null,
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'preferred_name']),
          }),
        ),
      setProtectionSetupState: (protectionSetupState) =>
        persist((prev) =>
          patchOnboardingState(
            { ...prev, protectionSetupState },
            {
              protectionEducationAcknowledged: protectionSetupState !== 'not_started',
              permissionsEducationAcknowledged:
                prev.onboarding.permissionsEducationAcknowledged ||
                protectionSetupState === 'configured' ||
                protectionSetupState === 'healthy',
              completedSteps:
                protectionSetupState === 'not_started'
                  ? prev.onboarding.completedSteps.filter((step) => step !== 'protection_education')
                  : uniqueSteps([...prev.onboarding.completedSteps, 'protection_education']),
            },
          ),
        ),
      skipPreferredName: () =>
        persist((prev) =>
          patchOnboardingState(
            { ...prev, onboardingSkippedOptional: true },
            {
              preferredName: null,
              currentStep: 'vehicle_setup',
              completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'preferred_name']),
            },
          ),
        ),
      skipVehicleSetup: () =>
        persist((prev) =>
          patchOnboardingState(prev, {
            vehicleSetupState: 'skipped',
            currentStep: 'familiar_places',
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'vehicle_setup']),
          }),
        ),
      skipWorkPlaceSetup: () =>
        persist((prev) =>
          patchOnboardingState(prev, {
            familiarPlacesSetupState: 'skipped',
            currentStep: 'protection_education',
            completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'familiar_places']),
          }),
        ),
      resetOnboarding: (options = {}) =>
        persist((prev) => {
          const onboarding = createEmptyOnboardingState();
          return {
            ...mirrorOnboarding(prev, onboarding),
            onboardingSkippedOptional: false,
            protectionSetupState: 'not_started',
            pendingPostOnboardingRoute: null,
            vehicles: options.keepVehicles === false ? [] : prev.vehicles,
            workLocations: prev.workLocations,
          };
        }),
      setDemoModeEnabled: (enabled) =>
        persist((prev) => {
          const nextEnabled = enabled && allowInternalPreviewTools();
          const nextPlan = nextEnabled ? prev.selectedPlan : 'free';
          const entitlement =
            !nextEnabled && prev.entitlement.source === 'demo'
              ? createFreeEntitlement()
              : prev.entitlement;
          return {
            ...prev,
            demoModeEnabled: nextEnabled,
            demoScenario: nextEnabled ? prev.demoScenario : 'new_user',
            selectedPlan: nextPlan,
            entitlement,
          };
        }),
      setDemoScenario: (scenario) =>
        persist((prev) => ({
          ...prev,
          demoModeEnabled: allowInternalPreviewTools(),
          demoScenario: scenario,
        })),
      setSelectedPlan: (plan) => {
        if (plan !== 'free' && !product.demoModeEnabled) return false;
        persist((prev) => ({
          ...prev,
          selectedPlan: plan,
          entitlement:
            prev.demoModeEnabled || prev.entitlement.source === 'demo'
              ? demoEntitlementForPlan(plan, prev.entitlement)
              : prev.entitlement,
        }));
        return true;
      },
      setEntitlement: (snapshot) =>
        persist((prev) => ({
          ...prev,
          entitlement: snapshot,
          selectedPlan: snapshot.source === 'demo' ? prev.selectedPlan : snapshot.planId,
        })),
      markTrialOfferShown: () =>
        persist((prev) => ({
          ...prev,
          paywallCaps: { ...prev.paywallCaps, lastTrialOfferAt: Date.now() },
        })),
      dismissTrialOfferSession: () =>
        persist((prev) => ({
          ...prev,
          paywallCaps: { ...prev.paywallCaps, trialOfferDismissedSession: true },
        })),
      dismissPaywallSession: () =>
        persist((prev) => ({
          ...prev,
          paywallCaps: { ...prev.paywallCaps, dismissedInSession: true },
        })),
      markPaywallShown: () =>
        persist((prev) => ({
          ...prev,
          paywallCaps: { ...prev.paywallCaps, lastFullScreenAt: Date.now(), dismissedInSession: false },
        })),
      setTrackingEnabled: (enabled) =>
        persist((prev) => ({
          ...prev,
          trackingEnabled: enabled,
        })),
      markFirstConfirmedWorkDrive: () =>
        persist((prev) => ({
          ...prev,
          firstConfirmedWorkDriveAt: prev.firstConfirmedWorkDriveAt ?? Date.now(),
        })),
      markFirstReportPreview: () =>
        persist((prev) => ({
          ...prev,
          firstReportPreviewAt: prev.firstReportPreviewAt ?? Date.now(),
        })),
      markFirstRecoverySeen: () =>
        persist((prev) => ({
          ...prev,
          firstRecoverySeenAt: prev.firstRecoverySeenAt ?? Date.now(),
        })),
      setPendingPostOnboardingRoute: (route) =>
        persist((prev) => ({ ...prev, pendingPostOnboardingRoute: route })),
      consumePendingPostOnboardingRoute: () => {
        const route = product.pendingPostOnboardingRoute;
        if (route) persist((prev) => ({ ...prev, pendingPostOnboardingRoute: null }));
        return route;
      },
      completeProductOnboarding: (route = null) =>
        persist((prev) => {
          const now = Date.now();
          const nextAction = nextActionForRoute(route, prev);
          const protection =
            prev.protectionSetupState === 'not_started' ? 'educated' : prev.protectionSetupState;
          return patchOnboardingState(
            {
              ...prev,
              protectionSetupState: protection,
              pendingPostOnboardingRoute: route,
            },
            {
              currentStep: 'ready',
              completedSteps: uniqueSteps([...prev.onboarding.completedSteps, prev.onboarding.currentStep, 'ready']),
              protectionEducationAcknowledged: true,
              nextActionSelected: nextAction,
              completedAt: now,
            },
            now,
          );
        }),
      setReviewDecision: (itemId, decision) =>
        persist((prev) => ({
          ...prev,
          reviewDecisions: { ...prev.reviewDecisions, [itemId]: decision },
          reviewedHistory: decision
            ? [...new Set([...prev.reviewedHistory, itemId])]
            : prev.reviewedHistory.filter((id) => id !== itemId),
        })),
      undoReviewDecision: (itemId) =>
        persist((prev) => {
          const next = { ...prev.reviewDecisions };
          delete next[itemId];
          return {
            ...prev,
            reviewDecisions: next,
            reviewedHistory: prev.reviewedHistory.filter((id) => id !== itemId),
          };
        }),
      pushReviewHistory: (entry) =>
        persist((prev) => ({
          ...prev,
          reviewHistoryEntries: [entry, ...prev.reviewHistoryEntries],
          reviewedHistory: [...new Set([entry.id, ...prev.reviewedHistory])],
          reviewDecisions: { ...prev.reviewDecisions, [entry.id]: entry.decision },
        })),
      markReviewHistoryUndone: (entryId) =>
        persist((prev) => ({
          ...prev,
          reviewHistoryEntries: prev.reviewHistoryEntries.map((entry) =>
            entry.id === entryId ? { ...entry, undoneAt: Date.now() } : entry,
          ),
          reviewedHistory: prev.reviewedHistory.filter((id) => id !== entryId),
          reviewDecisions: { ...prev.reviewDecisions, [entryId]: null },
        })),
      upsertVehicle: (vehicle) =>
        persist((prev) => {
          const now = Date.now();
          const nextVehicle: VehicleDraft = {
            ...vehicle,
            nickname: vehicle.nickname?.trim() || 'My vehicle',
            year: vehicle.year?.trim() ?? '',
            make: vehicle.make?.trim() ?? '',
            model: vehicle.model?.trim() ?? '',
            plate: vehicle.plate?.trim() ?? '',
            isPrimary: vehicle.isPrimary ?? prev.vehicles.length === 0,
            createdAt: vehicle.createdAt ?? now,
            updatedAt: now,
          };
          const exists = prev.vehicles.some((item) => item.id === nextVehicle.id);
          const vehicles = exists
            ? prev.vehicles.map((item) => (item.id === nextVehicle.id ? nextVehicle : item))
            : [...prev.vehicles, nextVehicle];
          const vehicleSetupState = vehicles.length > 1 ? 'multi' : 'added';
          return patchOnboardingState(
            { ...prev, vehicles },
            {
              vehicleSetupState,
              completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'vehicle_setup']),
            },
          );
        }),
      upsertWorkLocation: (location) =>
        persist((prev) => {
          const now = Date.now();
          const nextLocation: WorkLocationDraft = {
            ...location,
            label: location.label?.trim() || 'Work place',
            address: location.address?.trim() ?? '',
            notes: location.notes?.trim() ?? '',
            kind: location.kind ?? 'other',
            createdAt: location.createdAt ?? now,
            updatedAt: now,
          };
          const exists = prev.workLocations.some((item) => item.id === nextLocation.id);
          const workLocations = exists
            ? prev.workLocations.map((item) => (item.id === nextLocation.id ? nextLocation : item))
            : [...prev.workLocations, nextLocation];
          return patchOnboardingState(
            { ...prev, workLocations },
            {
              familiarPlacesSetupState: 'added',
              completedSteps: uniqueSteps([...prev.onboarding.completedSteps, 'familiar_places']),
            },
          );
        }),
      setNotificationPreferences: (partial) =>
        persist((prev) => ({
          ...prev,
          notificationPreferences: { ...prev.notificationPreferences, ...partial },
        })),
      setImportPhase: (phase, fileLabel, csvText) =>
        persist((prev) => ({
          ...prev,
          importPhase: phase,
          importFileLabel: fileLabel === undefined ? prev.importFileLabel : fileLabel,
          importCsvText: csvText === undefined ? prev.importCsvText : csvText,
        })),
      addImportBatch: (batch) =>
        persist((prev) => ({
          ...prev,
          importBatches: [batch, ...prev.importBatches],
          importPhase: 'success',
          importFileLabel: null,
          importCsvText: null,
        })),
      markManualTripsMigrated: () =>
        persist((prev) => ({ ...prev, manualTrips: [], manualTripsMigrated: true })),
      resetProductData: async () => {
        await clearProductUiState();
        const next = createInitialProductUiState();
        setProduct(next);
        if (hydratedRef.current) await saveProductUiState(next);
      },
    }),
    [product, hydrated, persist],
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProduct must be used within ProductProvider');
  return ctx;
}
