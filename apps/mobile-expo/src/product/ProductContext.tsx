import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

interface ProductContextValue {
  product: ProductUiState;
  hydrated: boolean;
  setOnboardingStep: (step: ProductOnboardingStep) => void;
  advanceOnboarding: () => void;
  backOnboarding: () => void;
  setPrimaryGoal: (goal: PrimaryGoal) => void;
  setDrivingType: (type: DrivingType) => void;
  setPreferredName: (name: string | null) => void;
  setProtectionSetupState: (state: ProtectionSetupState) => void;
  skipPreferredName: () => void;
  skipVehicleSetup: () => void;
  skipWorkPlaceSetup: () => void;
  resetOnboarding: () => void;
  setDemoModeEnabled: (enabled: boolean) => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  setSelectedPlan: (plan: PlanTier) => boolean;
  setPendingPostOnboardingRoute: (route: PostOnboardingRoute) => void;
  consumePendingPostOnboardingRoute: () => PostOnboardingRoute;
  completeProductOnboarding: (route?: PostOnboardingRoute) => void;
  setReviewDecision: (itemId: string, decision: ReviewDecision) => void;
  undoReviewDecision: (itemId: string) => void;
  pushReviewHistory: (entry: ReviewHistoryEntry) => void;
  markReviewHistoryUndone: (entryId: string) => void;
  upsertVehicle: (vehicle: Omit<VehicleDraft, 'createdAt' | 'updatedAt'> & { createdAt?: number }) => void;
  upsertWorkLocation: (
    location: Omit<WorkLocationDraft, 'createdAt' | 'updatedAt'> & { createdAt?: number },
  ) => void;
  setImportPhase: (phase: ImportFlowPhase, fileLabel?: string | null, csvText?: string | null) => void;
  addImportBatch: (batch: ImportBatchSummary) => void;
  markManualTripsMigrated: () => void;
  resetProductData: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | null>(null);

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

  useEffect(() => {
    if (skipHydration) return;
    void (async () => {
      const loaded = await loadProductUiState();
      setProduct(loaded);
      setHydrated(true);
    })();
  }, [skipHydration]);

  const persist = useCallback(
    async (next: ProductUiState) => {
      setProduct(next);
      if (hydrated) await saveProductUiState(next);
    },
    [hydrated],
  );

  const value = useMemo<ProductContextValue>(
    () => ({
      product,
      hydrated,
      setOnboardingStep: (step) => void persist({ ...product, onboardingStep: step }),
      advanceOnboarding: () => {
        const idx = ONBOARDING_STEP_ORDER.indexOf(product.onboardingStep);
        const nextStep =
          ONBOARDING_STEP_ORDER[Math.min(idx + 1, ONBOARDING_STEP_ORDER.length - 1)];
        void persist({ ...product, onboardingStep: nextStep });
      },
      backOnboarding: () => {
        const idx = ONBOARDING_STEP_ORDER.indexOf(product.onboardingStep);
        if (idx <= 0) return;
        void persist({ ...product, onboardingStep: ONBOARDING_STEP_ORDER[idx - 1] });
      },
      setPrimaryGoal: (goal) =>
        void persist({ ...product, primaryGoal: goal, onboardingNeed: goal }),
      setDrivingType: (type) =>
        void persist({ ...product, drivingType: type, onboardingUsage: type }),
      setPreferredName: (name) =>
        void persist({
          ...product,
          preferredName: name?.trim() ? name.trim() : null,
        }),
      setProtectionSetupState: (protectionSetupState) =>
        void persist({ ...product, protectionSetupState }),
      skipPreferredName: () =>
        void persist({
          ...product,
          onboardingSkippedOptional: true,
          onboardingStep: 'vehicle_setup',
        }),
      skipVehicleSetup: () =>
        void persist({ ...product, onboardingStep: 'work_place_setup' }),
      skipWorkPlaceSetup: () =>
        void persist({ ...product, onboardingStep: 'protection_setup' }),
      resetOnboarding: () =>
        void persist({
          ...product,
          onboardingStep: 'welcome',
          onboardingSkippedOptional: false,
          protectionSetupState:
            product.protectionSetupState === 'healthy' || product.protectionSetupState === 'configured'
              ? product.protectionSetupState
              : 'not_started',
          pendingPostOnboardingRoute: null,
          demoModeEnabled: false,
        }),
      setDemoModeEnabled: (enabled) =>
        void persist({
          ...product,
          demoModeEnabled: enabled && allowInternalPreviewTools(),
          demoScenario: enabled ? product.demoScenario : 'new_user',
          selectedPlan: enabled ? product.selectedPlan : 'free',
        }),
      setDemoScenario: (scenario) =>
        void persist({
          ...product,
          demoModeEnabled: true,
          demoScenario: scenario,
        }),
      setSelectedPlan: (plan) => {
        if (plan !== 'free' && !product.demoModeEnabled) return false;
        void persist({ ...product, selectedPlan: plan });
        return true;
      },
      setPendingPostOnboardingRoute: (route) =>
        void persist({ ...product, pendingPostOnboardingRoute: route }),
      consumePendingPostOnboardingRoute: () => {
        const route = product.pendingPostOnboardingRoute;
        if (route) void persist({ ...product, pendingPostOnboardingRoute: null });
        return route;
      },
      completeProductOnboarding: (route = null) => {
        const protection =
          product.protectionSetupState === 'not_started'
            ? 'educated'
            : product.protectionSetupState;
        void persist({
          ...product,
          protectionSetupState: protection,
          pendingPostOnboardingRoute: route,
          onboardingStep: 'next_action',
        });
      },
      setReviewDecision: (itemId, decision) =>
        void persist({
          ...product,
          reviewDecisions: { ...product.reviewDecisions, [itemId]: decision },
          reviewedHistory: decision
            ? [...new Set([...product.reviewedHistory, itemId])]
            : product.reviewedHistory,
        }),
      undoReviewDecision: (itemId) => {
        const next = { ...product.reviewDecisions };
        delete next[itemId];
        void persist({
          ...product,
          reviewDecisions: next,
          reviewedHistory: product.reviewedHistory.filter((id) => id !== itemId),
        });
      },
      pushReviewHistory: (entry) =>
        void persist({
          ...product,
          reviewHistoryEntries: [entry, ...product.reviewHistoryEntries],
          reviewedHistory: [...new Set([entry.id, ...product.reviewedHistory])],
          reviewDecisions: { ...product.reviewDecisions, [entry.id]: entry.decision },
        }),
      markReviewHistoryUndone: (entryId) =>
        void persist({
          ...product,
          reviewHistoryEntries: product.reviewHistoryEntries.map((e) =>
            e.id === entryId ? { ...e, undoneAt: Date.now() } : e,
          ),
          reviewedHistory: product.reviewedHistory.filter((id) => id !== entryId),
          reviewDecisions: { ...product.reviewDecisions, [entryId]: null },
        }),
      upsertVehicle: (vehicle) => {
        const now = Date.now();
        const nextVehicle: VehicleDraft = {
          ...vehicle,
          make: vehicle.make ?? '',
          model: vehicle.model ?? '',
          isPrimary: vehicle.isPrimary ?? product.vehicles.length === 0,
          createdAt: vehicle.createdAt ?? now,
          updatedAt: now,
        };
        const exists = product.vehicles.some((v) => v.id === nextVehicle.id);
        const vehicles = exists
          ? product.vehicles.map((v) => (v.id === nextVehicle.id ? nextVehicle : v))
          : [...product.vehicles, nextVehicle];
        void persist({ ...product, vehicles });
      },
      upsertWorkLocation: (location) => {
        const now = Date.now();
        const nextLoc: WorkLocationDraft = {
          ...location,
          notes: location.notes ?? '',
          createdAt: location.createdAt ?? now,
          updatedAt: now,
        };
        const exists = product.workLocations.some((l) => l.id === nextLoc.id);
        const workLocations = exists
          ? product.workLocations.map((l) => (l.id === nextLoc.id ? nextLoc : l))
          : [...product.workLocations, nextLoc];
        void persist({ ...product, workLocations });
      },
      setImportPhase: (phase, fileLabel = null, csvText = null) =>
        void persist({
          ...product,
          importPhase: phase,
          importFileLabel: fileLabel ?? product.importFileLabel,
          importCsvText: csvText === undefined ? product.importCsvText : csvText,
        }),
      addImportBatch: (batch) =>
        void persist({
          ...product,
          importBatches: [batch, ...product.importBatches],
          importPhase: 'success',
        }),
      markManualTripsMigrated: () =>
        void persist({ ...product, manualTrips: [], manualTripsMigrated: true }),
      resetProductData: async () => {
        await clearProductUiState();
        setProduct(createInitialProductUiState());
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
