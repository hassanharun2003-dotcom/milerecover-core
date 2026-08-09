import type { OnboardingProgress } from '../onboarding/progression';
import type { PermissionSnapshot } from '../permissions/types';
import type { RecoveryCandidate } from '../recovery/types';
import type { TrackingEngineState } from '../protection-health/types';
import type { TripRecord } from '../trips/types';

/** Current on-disk schema version for Package 3 local persistence. */
export const CURRENT_PERSISTENCE_SCHEMA_VERSION = 1;

/** Maximum schema version this client can read after migrations. */
export const SUPPORTED_PERSISTENCE_SCHEMA_VERSION = CURRENT_PERSISTENCE_SCHEMA_VERSION;

export interface ReportingPeriodPersisted {
  id: string;
  label: string;
  startAt: number;
  endAt: number;
}

export interface MileageRatePersisted {
  id: string;
  label: string;
  centsPerMile: number;
}

export interface PersistenceMetadata {
  lastSuccessfulSaveAt: number | null;
  lastSuccessfulLoadAt: number | null;
}

/** Versioned document stored locally — no raw coordinates or route geometry. */
export interface PersistedAppDocumentV1 {
  schemaVersion: 1;
  savedAt: number;
  onboardingComplete: boolean;
  onboarding: OnboardingProgress;
  permissions: PermissionSnapshot;
  trackingEngineState: TrackingEngineState;
  lastConfirmedCaptureAt: number | null;
  lastSyncAt: number | null;
  trips: TripRecord[];
  recoveryCandidates: RecoveryCandidate[];
  reportingPeriod: ReportingPeriodPersisted;
  mileageRate: MileageRatePersisted | null;
  metadata: PersistenceMetadata;
}

export type PersistedAppDocument = PersistedAppDocumentV1;

export function createEmptyPersistedDocument(now: number = Date.now()): PersistedAppDocumentV1 {
  const year = new Date(now).getFullYear();
  return {
    schemaVersion: 1,
    savedAt: now,
    onboardingComplete: false,
    onboarding: {
      currentStep: 'welcome',
      completedSteps: [],
      skippedMotion: false,
    },
    permissions: {
      location: 'not_determined',
      backgroundLocation: 'not_determined',
      motion: 'not_applicable',
      batteryOptimizationRestricted: false,
    },
    trackingEngineState: 'idle',
    lastConfirmedCaptureAt: null,
    lastSyncAt: null,
    trips: [],
    recoveryCandidates: [],
    reportingPeriod: {
      id: `ytd-${year}`,
      label: `${year} year to date`,
      startAt: new Date(year, 0, 1).getTime(),
      endAt: now,
    },
    mileageRate: null,
    metadata: {
      lastSuccessfulSaveAt: null,
      lastSuccessfulLoadAt: null,
    },
  };
}
