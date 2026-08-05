import type {
  DrivingPattern,
  EntitlementSnapshot,
  LocaleProfile,
  MileageGoal,
  NextActionId,
  OnboardingStepId,
  PainPoint,
  VersionedOnboardingState,
} from '@milerecover/domain';
import {
  createEmptyOnboardingState,
  createFreeEntitlement,
  CURRENT_ONBOARDING_VERSION,
  localeProfileFromCountry,
  recommendCountryFromLocale,
} from '@milerecover/domain';
import type { PlanTier } from '../fixtures/subscription';
import type { DemoScenario } from '../fixtures/scenarios';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '../services/notifications';

export { CURRENT_ONBOARDING_VERSION };

export type ProductOnboardingStep = OnboardingStepId;

export type PrimaryGoal = MileageGoal;
export type DrivingType = DrivingPattern;

export type ProtectionSetupState =
  | 'not_started'
  | 'educated'
  | 'configured'
  | 'limited'
  | 'healthy';

export type ReviewDecision = 'work' | 'personal' | 'not_drive' | 'not_sure' | null;

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
  /** Once true, nickname no longer auto-follows year/make/model. */
  nicknameUserSet?: boolean;
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
  /** International profile — units, currency, effective-dated rates. */
  localeProfile: LocaleProfile;
  reportStyle: string | null;
  trackingEnabled: boolean;
  notificationPreferences: NotificationPreferences;
  firstConfirmedWorkDriveAt: number | null;
  firstReportPreviewAt: number | null;
  firstRecoverySeenAt: number | null;
  firstExportAt: number | null;
  firstMissingTripSeenAt: number | null;
  firstRecoveredDriveAt: number | null;
  celebratedFirstDriveAt: number | null;
  celebratedFirstReportAt: number | null;
  celebratedFirstRecoveryAt: number | null;
  /** Dismissed "Finish setup" card on Home. */
  finishSetupDismissedAt: number | null;
  /** Calendar period key (YYYY-MM) for Free missing-scan allowance. */
  missingScanPeriodKey: string | null;
  /** Scans used in missingScanPeriodKey. */
  missingScansUsedThisPeriod: number;
  /** When the Free 7-day import preview started (null = not started). */
  importPreviewStartedAt: number | null;
}

export const PRODUCT_UI_STORAGE_KEY = '@milerecover/product-ui/v4';
export const PRODUCT_UI_STORAGE_KEY_V3 = '@milerecover/product-ui/v3';
export const PRODUCT_UI_STORAGE_KEY_V2 = '@milerecover/product-ui/v2';
export const PRODUCT_UI_STORAGE_KEY_V1 = '@milerecover/product-ui/v1';
export const PRODUCT_UI_STORAGE_KEYS = [
  PRODUCT_UI_STORAGE_KEY,
  PRODUCT_UI_STORAGE_KEY_V3,
  PRODUCT_UI_STORAGE_KEY_V2,
  PRODUCT_UI_STORAGE_KEY_V1,
] as const;

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
    localeProfile: localeProfileFromCountry(recommendCountryFromLocale(undefined)),
    reportStyle: null,
    trackingEnabled: false,
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    firstConfirmedWorkDriveAt: null,
    firstReportPreviewAt: null,
    firstRecoverySeenAt: null,
    firstExportAt: null,
    firstMissingTripSeenAt: null,
    firstRecoveredDriveAt: null,
    celebratedFirstDriveAt: null,
    celebratedFirstReportAt: null,
    celebratedFirstRecoveryAt: null,
    finishSetupDismissedAt: null,
    missingScanPeriodKey: null,
    missingScansUsedThisPeriod: 0,
    importPreviewStartedAt: null,
  };
}

/**
 * Final product lock — five onboarding stages.
 * Welcome → Purpose → Country/Units/Rate → Protection → Ready.
 */
export const ONBOARDING_STEP_ORDER: ProductOnboardingStep[] = [
  'welcome',
  'purpose',
  'locale_setup',
  'protect_drives',
  'ready',
];

export const COUNTRY_OPTIONS = [
  { id: 'US' as const, label: 'United States' },
  { id: 'CA' as const, label: 'Canada' },
  { id: 'GB' as const, label: 'United Kingdom' },
  { id: 'AU' as const, label: 'Australia' },
  { id: 'OTHER' as const, label: 'Other country' },
];

export const PRIMARY_GOAL_OPTIONS: { id: PrimaryGoal; label: string; body: string }[] = [
  { id: 'employee_reimbursement', label: 'Employee', body: 'Share clear records with work.' },
  { id: 'self_employed_business', label: 'Business', body: 'Keep client and tax-ready logs.' },
  { id: 'gig_delivery', label: 'Gig', body: 'Protect shifts and earnings records.' },
  { id: 'mixed', label: 'Mixed', body: 'More than one of these.' },
];

export const PAIN_POINT_OPTIONS: { id: PainPoint; label: string }[] = [
  { id: 'forget_to_track', label: 'I forget to track drives' },
  { id: 'tracker_misses', label: 'My tracker misses drives' },
  { id: 'need_cleaner_reports', label: 'I need cleaner reports' },
  { id: 'older_mileage', label: 'I have older mileage to recover' },
  { id: 'separate_work_personal', label: 'I want to separate work and personal driving' },
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
