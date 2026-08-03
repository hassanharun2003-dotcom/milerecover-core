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
  type ImportFlowPhase,
  type ManualTripDraft,
  type PostOnboardingRoute,
  type PrimaryGoal,
  type ProductOnboardingStep,
  type ProductUiState,
  type ProtectionSetupState,
  type ReviewDecision,
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
  /** @deprecated use setPrimaryGoal */
  setOnboardingNeed: (need: string) => void;
  /** @deprecated use setDrivingType */
  setOnboardingUsage: (usage: string) => void;
  skipPreferredName: () => void;
  resetOnboarding: () => void;
  setDemoModeEnabled: (enabled: boolean) => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  /**
   * Paid tiers only stick in demo mode. Live mode keeps Free until real billing.
   * Returns whether entitlement actually changed.
   */
  setSelectedPlan: (plan: PlanTier) => boolean;
  setPendingPostOnboardingRoute: (route: PostOnboardingRoute) => void;
  consumePendingPostOnboardingRoute: () => PostOnboardingRoute;
  /** Atomic mark for end of onboarding (protection educated + optional deep link). */
  completeProductOnboarding: (route?: PostOnboardingRoute) => void;
  setReviewDecision: (itemId: string, decision: ReviewDecision) => void;
  undoReviewDecision: (itemId: string) => void;
  addManualTrip: (draft: Omit<ManualTripDraft, 'id' | 'createdAt'>) => void;
  upsertVehicle: (vehicle: VehicleDraft) => void;
  upsertWorkLocation: (location: WorkLocationDraft) => void;
  setImportPhase: (phase: ImportFlowPhase, fileLabel?: string | null) => void;
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
        void persist({
          ...product,
          primaryGoal: goal,
          onboardingNeed: goal,
        }),
      setDrivingType: (type) =>
        void persist({
          ...product,
          drivingType: type,
          onboardingUsage: type,
        }),
      setPreferredName: (name) =>
        void persist({
          ...product,
          preferredName: name?.trim() ? name.trim() : null,
        }),
      setProtectionSetupState: (protectionSetupState) =>
        void persist({ ...product, protectionSetupState }),
      setOnboardingNeed: (need) => void persist({ ...product, onboardingNeed: need }),
      setOnboardingUsage: (usage) => void persist({ ...product, onboardingUsage: usage }),
      skipPreferredName: () =>
        void persist({
          ...product,
          onboardingSkippedOptional: true,
          onboardingStep: 'protection_setup',
        }),
      resetOnboarding: () =>
        void persist({
          ...createInitialProductUiState(),
          showDevTools: product.showDevTools,
          demoModeEnabled: false,
        }),
      setDemoModeEnabled: (enabled) =>
        void persist({
          ...product,
          demoModeEnabled: enabled && allowInternalPreviewTools(),
          demoScenario: enabled ? product.demoScenario : 'new_user',
          // Paid demo entitlement clears when leaving demo mode
          selectedPlan: enabled ? product.selectedPlan : 'free',
        }),
      setDemoScenario: (scenario) =>
        void persist({
          ...product,
          demoModeEnabled: true,
          demoScenario: scenario,
        }),
      setSelectedPlan: (plan) => {
        if (plan !== 'free' && !product.demoModeEnabled) {
          // Do not fake a completed purchase in live / production state
          return false;
        }
        void persist({ ...product, selectedPlan: plan });
        return true;
      },
      setPendingPostOnboardingRoute: (route) =>
        void persist({ ...product, pendingPostOnboardingRoute: route }),
      consumePendingPostOnboardingRoute: () => {
        const route = product.pendingPostOnboardingRoute;
        if (route) {
          void persist({ ...product, pendingPostOnboardingRoute: null });
        }
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
      addManualTrip: (draft) => {
        const entry: ManualTripDraft = {
          ...draft,
          id: `manual-${Date.now()}`,
          createdAt: Date.now(),
        };
        void persist({ ...product, manualTrips: [entry, ...product.manualTrips] });
      },
      upsertVehicle: (vehicle) => {
        const exists = product.vehicles.some((v) => v.id === vehicle.id);
        const vehicles = exists
          ? product.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v))
          : [...product.vehicles, vehicle];
        void persist({ ...product, vehicles });
      },
      upsertWorkLocation: (location) => {
        const exists = product.workLocations.some((l) => l.id === location.id);
        const workLocations = exists
          ? product.workLocations.map((l) => (l.id === location.id ? location : l))
          : [...product.workLocations, location];
        void persist({ ...product, workLocations });
      },
      setImportPhase: (phase, fileLabel = null) =>
        void persist({
          ...product,
          importPhase: phase,
          importFileLabel: fileLabel ?? product.importFileLabel,
        }),
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
