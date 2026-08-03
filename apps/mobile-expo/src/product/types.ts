import type {
  DrivingPattern,
  EntitlementSnapshot,
  MileageGoal,
  NextActionId,
  OnboardingStepId,
  PainPoint,
  VersionedOnboardingState,
} from '@milerecover/domain';
import { createEmptyOnboardingState, createFreeEntitlement } from '@milerecover/domain';
import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '../services/notifications';

export type ProductOnboardingStep = OnboardingStepId;

export type PrimaryGoal = MileageGoal;
export type DrivingType = DrivingPattern;

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
  | 'TrackingActive'
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
  year: string;
  make: string;
  model: string;
  plate: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkLocationDraft {
  id: string;
  label: string;
  address: string;
  notes: string;
  kind: 'home' | 'workplace' | 'client' | 'other';
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

export interface PaywallCapState {
  lastFullScreenAt: number | null;
  dismissedInSession: boolean;
  lastTrialOfferAt: number | null;
  trialOfferDismissedSession: boolean;
}

export interface ProductUiState {
  schemaVersion: 4;
  onboarding: VersionedOnboardingState;
  /** @deprecated use onboarding.currentStep */
  onboardingStep: ProductOnboardingStep;
  preferredName: string | null;
  primaryGoal: PrimaryGoal | null;
  drivingType: DrivingType | null;
  selectedPainPoints: PainPoint[];
  protectionSetupState: ProtectionSetupState;
  onboardingNeed: string | null;
  onboardingUsage: string | null;
  onboardingSkippedOptional: boolean;
  demoModeEnabled: boolean;
  demoScenario: DemoScenario;
  /** UI preference only — real access from entitlement */
  selectedPlan: PlanTier;
  entitlement: EntitlementSnapshot;
  paywallCaps: PaywallCapState;
  pendingPostOnboardingRoute: PostOnboardingRoute;
  reviewDecisions: Record<string, ReviewDecision>;
  reviewedHistory: string[];
  reviewHistoryEntries: ReviewHistoryEntry[];
  manualTrips: ManualTripDraft[];
  vehicles: VehicleDraft[];
  workLocations: WorkLocationDraft[];
  importPhase: ImportFlowPhase;
  importFileLabel: string | null;
  importCsvText: string | null;
  importBatches: ImportBatchSummary[];
  showDevTools: boolean;
  manualTripsMigrated: boolean;
  reimbursementCentsPerMile: number | null;
  reportStyle: string | null;
  trackingEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  firstConfirmedWorkDriveAt: number | null;
  firstReportPreviewAt: number | null;
  firstRecoverySeenAt: number | null;
}

export const PRODUCT_UI_STORAGE_KEY = '@milerecover/product-ui/v4';
export const PRODUCT_UI_STORAGE_KEY_V3 = '@milerecover/product-ui/v3';
export const PRODUCT_UI_STORAGE_KEY_V2 = '@milerecover/product-ui/v2';
export const PRODUCT_UI_STORAGE_KEY_V1 = '@milerecover/product-ui/v1';

export function allowInternalPreviewTools(variant?: string): boolean {
  const v = variant ?? (typeof process !== 'undefined' ? process.env.APP_VARIANT : undefined);
  return Boolean(__DEV__ || v === 'preview' || v === 'development');
}

export function createInitialProductUiState(): ProductUiState {
  const onboarding = createEmptyOnboardingState();
  return {
    schemaVersion: 4,
    onboarding,
    onboardingStep: onboarding.currentStep,
    preferredName: null,
    primaryGoal: null,
    drivingType: null,
    selectedPainPoints: [],
    protectionSetupState: 'not_started',
    onboardingNeed: null,
    onboardingUsage: null,
    onboardingSkippedOptional: false,
    demoModeEnabled: false,
    demoScenario: 'new_user',
    selectedPlan: 'free',
    entitlement: createFreeEntitlement(),
    paywallCaps: {
      lastFullScreenAt: null,
      dismissedInSession: false,
      lastTrialOfferAt: null,
      trialOfferDismissedSession: false,
    },
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
    reimbursementCentsPerMile: null,
    reportStyle: null,
    trackingEnabled: false,
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    firstConfirmedWorkDriveAt: null,
    firstReportPreviewAt: null,
    firstRecoverySeenAt: null,
  };
}

export const ONBOARDING_STEP_ORDER: ProductOnboardingStep[] = [
  'welcome',
  'primary_goal',
  'pain_points',
  'driving_pattern',
  'preferred_name',
  'vehicle_setup',
  'familiar_places',
  'protection_education',
  'permissions_education',
  'ready',
];

export const PRIMARY_GOAL_OPTIONS: { id: PrimaryGoal; label: string; body: string }[] = [
  { id: 'employee_reimbursement', label: 'Employee reimbursement', body: 'Share clear records with work.' },
  { id: 'gig_delivery', label: 'Gig or delivery driving', body: 'Protect shifts and earnings records.' },
  { id: 'self_employed_business', label: 'Self-employed or business', body: 'Keep client and tax-ready logs.' },
  { id: 'mixed', label: 'A mix of these', body: 'Neutral work-driving language.' },
];

export const PAIN_POINT_OPTIONS: { id: PainPoint; label: string }[] = [
  { id: 'forget_to_track', label: 'I forget to track drives' },
  { id: 'tracker_misses', label: 'My tracker misses drives' },
  { id: 'need_cleaner_reports', label: 'I need cleaner reports' },
  { id: 'older_mileage', label: 'I have older mileage to recover' },
  { id: 'battery_worry', label: 'I worry about battery use' },
  { id: 'separate_work_personal', label: 'I separate work and personal drives' },
];

export const DRIVING_PATTERN_OPTIONS: { id: DrivingType; label: string }[] = [
  { id: 'regular_locations', label: 'Regular work locations' },
  { id: 'different_places', label: 'Different places each day' },
  { id: 'delivery_rideshare', label: 'Delivery or rideshare routes' },
  { id: 'client_visits', label: 'Client visits and appointments' },
  { id: 'not_sure', label: 'Not sure yet' },
];

/** @deprecated aliases for older tests */
export const DRIVING_TYPE_OPTIONS = DRIVING_PATTERN_OPTIONS;

export type { NextActionId, PainPoint, MileageGoal, DrivingPattern, OnboardingStepId };
