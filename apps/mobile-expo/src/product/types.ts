import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';

export type ProductOnboardingStep =
  | 'welcome'
  | 'primary_goal'
  | 'driving_type'
  | 'preferred_name'
  | 'vehicle_setup'
  | 'work_place_setup'
  | 'protection_setup'
  | 'next_action';

export type PrimaryGoal =
  | 'protect_future'
  | 'find_missing'
  | 'bring_history'
  | 'prepare_report';

export type DrivingType = 'employee' | 'gig' | 'small_business' | 'other';

export type ProtectionSetupState =
  | 'not_started'
  | 'educated'
  | 'configured'
  | 'limited'
  | 'healthy';

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

export type PostOnboardingRoute =
  | 'ProtectionAlert'
  | 'BringExistingMileage'
  | 'ManualTrip'
  | 'Proof'
  | 'MissingTripRecovery'
  | null;

export interface ReviewHistoryEntry {
  id: string;
  targetId: string;
  targetKind: 'trip' | 'recovery';
  previousSnapshot: unknown;
  decision: Exclude<ReviewDecision, null>;
  decidedAt: number;
  undoneAt: number | null;
}

export interface VehicleDraft {
  id: string;
  nickname: string;
  make: string;
  model: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkLocationDraft {
  id: string;
  label: string;
  address: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface ImportBatchSummary {
  id: string;
  fileLabel: string;
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  createdAt: number;
}

/** @deprecated migrated into domain TripRecord */
export interface ManualTripDraft {
  id: string;
  date: string;
  distanceMiles: number;
  purpose: string;
  createdAt: number;
}

export interface ProductUiState {
  schemaVersion: 3;
  onboardingStep: ProductOnboardingStep;
  preferredName: string | null;
  primaryGoal: PrimaryGoal | null;
  drivingType: DrivingType | null;
  protectionSetupState: ProtectionSetupState;
  onboardingNeed: string | null;
  onboardingUsage: string | null;
  onboardingSkippedOptional: boolean;
  demoModeEnabled: boolean;
  demoScenario: DemoScenario;
  selectedPlan: PlanTier;
  pendingPostOnboardingRoute: PostOnboardingRoute;
  reviewDecisions: Record<string, ReviewDecision>;
  reviewedHistory: string[];
  reviewHistoryEntries: ReviewHistoryEntry[];
  /** Legacy — migrated into domain trips once */
  manualTrips: ManualTripDraft[];
  vehicles: VehicleDraft[];
  workLocations: WorkLocationDraft[];
  importPhase: ImportFlowPhase;
  importFileLabel: string | null;
  importCsvText: string | null;
  importBatches: ImportBatchSummary[];
  showDevTools: boolean;
  manualTripsMigrated: boolean;
}

export const PRODUCT_UI_STORAGE_KEY = '@milerecover/product-ui/v3';
export const PRODUCT_UI_STORAGE_KEY_V2 = '@milerecover/product-ui/v2';
export const PRODUCT_UI_STORAGE_KEY_V1 = '@milerecover/product-ui/v1';

export function allowInternalPreviewTools(variant?: string): boolean {
  const v = variant ?? (typeof process !== 'undefined' ? process.env.APP_VARIANT : undefined);
  return Boolean(__DEV__ || v === 'preview' || v === 'development');
}

export function createInitialProductUiState(): ProductUiState {
  return {
    schemaVersion: 3,
    onboardingStep: 'welcome',
    preferredName: null,
    primaryGoal: null,
    drivingType: null,
    protectionSetupState: 'not_started',
    onboardingNeed: null,
    onboardingUsage: null,
    onboardingSkippedOptional: false,
    demoModeEnabled: false,
    demoScenario: 'new_user',
    selectedPlan: 'free',
    pendingPostOnboardingRoute: null,
    reviewDecisions: {},
    reviewedHistory: [],
    reviewHistoryEntries: [],
    manualTrips: [],
    vehicles: [],
    workLocations: [],
    importPhase: 'idle',
    importFileLabel: null,
    importCsvText: null,
    importBatches: [],
    showDevTools: allowInternalPreviewTools(),
    manualTripsMigrated: false,
  };
}

export const ONBOARDING_STEP_ORDER: ProductOnboardingStep[] = [
  'welcome',
  'primary_goal',
  'driving_type',
  'preferred_name',
  'vehicle_setup',
  'work_place_setup',
  'protection_setup',
  'next_action',
];

export const PRIMARY_GOAL_OPTIONS: { id: PrimaryGoal; label: string }[] = [
  { id: 'protect_future', label: 'Protect future drives' },
  { id: 'find_missing', label: 'Recover possible missing mileage' },
  { id: 'bring_history', label: 'Bring existing history' },
  { id: 'prepare_report', label: 'Prepare a report' },
];

export const DRIVING_TYPE_OPTIONS: { id: DrivingType; label: string }[] = [
  { id: 'employee', label: 'Employee reimbursement' },
  { id: 'gig', label: 'Gig or independent driving' },
  { id: 'small_business', label: 'Small business' },
  { id: 'other', label: 'Other work driving' },
];

export function mapLegacyNeedToGoal(need: string | null | undefined): PrimaryGoal | null {
  if (!need) return null;
  const n = need.toLowerCase();
  if (n.includes('missing') || n.includes('recover')) return 'find_missing';
  if (n.includes('bring') || n.includes('import') || n.includes('history')) return 'bring_history';
  if (n.includes('report') || n.includes('prepare')) return 'prepare_report';
  if (n.includes('protect') || n.includes('future')) return 'protect_future';
  return null;
}

export function mapLegacyUsageToDrivingType(usage: string | null | undefined): DrivingType | null {
  if (!usage) return null;
  const u = usage.toLowerCase();
  if (u.includes('employee') || u.includes('reimburs')) return 'employee';
  if (u.includes('gig') || u.includes('independent')) return 'gig';
  if (u.includes('small business') || u.includes('business')) return 'small_business';
  return 'other';
}

export function mapLegacyOnboardingStep(step: string | null | undefined): ProductOnboardingStep {
  switch (step) {
    case 'need_selection':
    case 'primary_goal':
      return 'primary_goal';
    case 'usage_type':
    case 'driving_type':
      return 'driving_type';
    case 'optional_setup':
    case 'preferred_name':
      return 'preferred_name';
    case 'vehicle_setup':
      return 'vehicle_setup';
    case 'work_place_setup':
      return 'work_place_setup';
    case 'protection_setup':
      return 'protection_setup';
    case 'ready':
    case 'next_action':
      return 'next_action';
    case 'welcome':
      return 'welcome';
    default:
      return 'welcome';
  }
}
