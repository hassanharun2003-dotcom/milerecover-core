import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';

export type ProductOnboardingStep =
  | 'welcome'
  | 'primary_goal'
  | 'driving_type'
  | 'preferred_name'
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

/** Destinations allowed after finishing onboarding (consumed once on Home). */
export type PostOnboardingRoute =
  | 'ProtectionAlert'
  | 'BringExistingMileage'
  | 'ManualTrip'
  | 'Proof'
  | null;

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

export interface WorkLocationDraft {
  id: string;
  label: string;
  address: string;
}

export interface ProductUiState {
  /** Storage schema — bump when migrating fields */
  schemaVersion: 2;
  onboardingStep: ProductOnboardingStep;
  preferredName: string | null;
  primaryGoal: PrimaryGoal | null;
  drivingType: DrivingType | null;
  protectionSetupState: ProtectionSetupState;
  /** Legacy string goal label kept for migration display only */
  onboardingNeed: string | null;
  onboardingUsage: string | null;
  onboardingSkippedOptional: boolean;
  /**
   * Internal preview/demo only. When false, Home/Proof never use DEMO_SCENARIOS
   * invented mileage or identity.
   */
  demoModeEnabled: boolean;
  demoScenario: DemoScenario;
  /**
   * Entitlement from a real source only. Until billing ships this stays `free`
   * outside explicit internal demo mode.
   */
  selectedPlan: PlanTier;
  /** One-shot navigation after onboarding finish — not a durable preference */
  pendingPostOnboardingRoute: PostOnboardingRoute;
  reviewDecisions: Record<string, ReviewDecision>;
  reviewedHistory: string[];
  manualTrips: ManualTripDraft[];
  vehicles: VehicleDraft[];
  workLocations: WorkLocationDraft[];
  importPhase: ImportFlowPhase;
  importFileLabel: string | null;
  showDevTools: boolean;
}

export const PRODUCT_UI_STORAGE_KEY = '@milerecover/product-ui/v2';
/** Prior key — migrated once into v2 */
export const PRODUCT_UI_STORAGE_KEY_V1 = '@milerecover/product-ui/v1';

/** Dev client or standalone preview — never production store builds. */
export function allowInternalPreviewTools(variant?: string): boolean {
  const v = variant ?? (typeof process !== 'undefined' ? process.env.APP_VARIANT : undefined);
  return Boolean(__DEV__ || v === 'preview' || v === 'development');
}

export function createInitialProductUiState(): ProductUiState {
  return {
    schemaVersion: 2,
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
    manualTrips: [],
    vehicles: [],
    workLocations: [],
    importPhase: 'idle',
    importFileLabel: null,
    showDevTools: allowInternalPreviewTools(),
  };
}

export const ONBOARDING_STEP_ORDER: ProductOnboardingStep[] = [
  'welcome',
  'primary_goal',
  'driving_type',
  'preferred_name',
  'protection_setup',
  'next_action',
];

export const PRIMARY_GOAL_OPTIONS: { id: PrimaryGoal; label: string }[] = [
  { id: 'protect_future', label: 'Protect future drives' },
  { id: 'find_missing', label: 'Find possible missing mileage' },
  { id: 'bring_history', label: 'Bring existing mileage' },
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
      return 'primary_goal';
    case 'usage_type':
      return 'driving_type';
    case 'optional_setup':
      return 'preferred_name';
    case 'ready':
      return 'next_action';
    case 'welcome':
    case 'primary_goal':
    case 'driving_type':
    case 'preferred_name':
    case 'protection_setup':
    case 'next_action':
      return step;
    default:
      return 'welcome';
  }
}
