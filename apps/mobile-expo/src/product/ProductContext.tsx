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
  createInitialProductUiState,
  ONBOARDING_STEP_ORDER,
  type ImportFlowPhase,
  type ManualTripDraft,
  type ProductOnboardingStep,
  type ProductUiState,
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
  setOnboardingNeed: (need: string) => void;
  setOnboardingUsage: (usage: string) => void;
  skipOptionalSetup: () => void;
  resetOnboarding: () => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  setSelectedPlan: (plan: PlanTier) => void;
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
  const [product, setProduct] = useState<ProductUiState>(() => initialState ?? createInitialProductUiState());
  const [hydrated, setHydrated] = useState(skipHydration);

  useEffect(() => {
    if (skipHydration) return;
    void (async () => {
      const loaded = await loadProductUiState();
      setProduct(loaded);
      setHydrated(true);
    })();
  }, [skipHydration]);

  const persist = useCallback(async (next: ProductUiState) => {
    setProduct(next);
    if (hydrated) await saveProductUiState(next);
  }, [hydrated]);

  const value = useMemo<ProductContextValue>(
    () => ({
      product,
      hydrated,
      setOnboardingStep: (step) => void persist({ ...product, onboardingStep: step }),
      advanceOnboarding: () => {
        const idx = ONBOARDING_STEP_ORDER.indexOf(product.onboardingStep);
        const nextStep = ONBOARDING_STEP_ORDER[Math.min(idx + 1, ONBOARDING_STEP_ORDER.length - 1)];
        void persist({ ...product, onboardingStep: nextStep });
      },
      backOnboarding: () => {
        const idx = ONBOARDING_STEP_ORDER.indexOf(product.onboardingStep);
        if (idx <= 0) return;
        void persist({ ...product, onboardingStep: ONBOARDING_STEP_ORDER[idx - 1] });
      },
      setOnboardingNeed: (need) => void persist({ ...product, onboardingNeed: need }),
      setOnboardingUsage: (usage) => void persist({ ...product, onboardingUsage: usage }),
      skipOptionalSetup: () =>
        void persist({
          ...product,
          onboardingSkippedOptional: true,
          onboardingStep: 'ready',
        }),
      resetOnboarding: () =>
        void persist({
          ...createInitialProductUiState(),
          demoScenario: product.demoScenario,
          selectedPlan: product.selectedPlan,
          showDevTools: product.showDevTools,
        }),
      setDemoScenario: (scenario) => void persist({ ...product, demoScenario: scenario }),
      setSelectedPlan: (plan) => void persist({ ...product, selectedPlan: plan }),
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
    [product, hydrated, persist]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProduct must be used within ProductProvider');
  return ctx;
}
