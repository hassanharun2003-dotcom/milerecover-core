import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';

export type ProductOnboardingStep =
  | 'welcome'
  | 'need_selection'
  | 'usage_type'
  | 'protection_setup'
  | 'optional_setup'
  | 'ready';

export type ReviewDecision = 'work' | 'personal' | 'not_drive' | null;

export type ImportFlowPhase =
  | 'idle'
  | 'file_selected'
  | 'processing'
  | 'preview'
  | 'duplicates'
  | 'unsupported'
  | 'review_required'
  | 'success'
  | 'failed';

export interface ManualTripDraft {
  id: string;
  date: string;
  distanceMiles: number;
  purpose: string;
  createdAt: number;
}

export interface VehicleDraft {
  id: string;
  label: string;
}

export interface ProductUiState {
  onboardingStep: ProductOnboardingStep;
  onboardingNeed: string | null;
  onboardingUsage: string | null;
  onboardingSkippedOptional: boolean;
  demoScenario: DemoScenario;
  selectedPlan: PlanTier;
  reviewDecisions: Record<string, ReviewDecision>;
  reviewedHistory: string[];
  manualTrips: ManualTripDraft[];
  vehicles: VehicleDraft[];
  importPhase: ImportFlowPhase;
  importFileLabel: string | null;
  showDevTools: boolean;
}

export const PRODUCT_UI_STORAGE_KEY = '@milerecover/product-ui/v1';

export function createInitialProductUiState(): ProductUiState {
  return {
    onboardingStep: 'welcome',
    onboardingNeed: null,
    onboardingUsage: null,
    onboardingSkippedOptional: false,
    demoScenario: 'fully_protected',
    selectedPlan: 'free',
    reviewDecisions: {},
    reviewedHistory: [],
    manualTrips: [],
    vehicles: [{ id: 'vehicle-1', label: 'Primary vehicle' }],
    importPhase: 'idle',
    importFileLabel: null,
    showDevTools: __DEV__,
  };
}

export const ONBOARDING_STEP_ORDER: ProductOnboardingStep[] = [
  'welcome',
  'need_selection',
  'usage_type',
  'protection_setup',
  'optional_setup',
  'ready',
];
