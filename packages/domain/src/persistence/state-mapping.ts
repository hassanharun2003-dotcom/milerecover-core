import { confirmedBusinessMiles } from '../trips/types';
import { buildReviewItemFromRecovery, buildReviewItemFromTrip, prioritizeReviewItems } from '../review/types';
import { createEmptyPersistedDocument, type PersistedAppDocument } from './schema';
import type { AppStartupPhase, PersistenceLoadOutcome } from './types';

export interface HydratedShellState {
  startupPhase: AppStartupPhase;
  document: PersistedAppDocument;
  loadError: string | null;
  dataStale: boolean;
}

export function documentToDerivedCounts(document: PersistedAppDocument, now: number = Date.now()): {
  periodConfirmedBusinessMiles: number;
  tripsTodayCount: number;
} {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayStart = startOfDay.getTime();
  const tripsTodayCount = document.trips.filter((t) => t.endAt >= dayStart).length;
  return {
    periodConfirmedBusinessMiles: confirmedBusinessMiles(document.trips),
    tripsTodayCount,
  };
}

export function buildReviewItemsFromDocument(document: PersistedAppDocument) {
  const fromTrips = document.trips
    .map(buildReviewItemFromTrip)
    .filter((item): item is NonNullable<typeof item> => item != null);
  const fromRecovery = document.recoveryCandidates
    .map(buildReviewItemFromRecovery)
    .filter((item): item is NonNullable<typeof item> => item != null);
  return prioritizeReviewItems([...fromTrips, ...fromRecovery]);
}

export function resolveStartupFromLoad(outcome: PersistenceLoadOutcome, now: number = Date.now()): HydratedShellState {
  switch (outcome.kind) {
    case 'empty':
      return {
        startupPhase: 'ready-empty',
        document: createEmptyPersistedDocument(now),
        loadError: null,
        dataStale: false,
      };
    case 'loaded': {
      const hasData =
        outcome.document.trips.length > 0 ||
        outcome.document.recoveryCandidates.length > 0 ||
        outcome.document.onboardingComplete;
      return {
        startupPhase: hasData ? 'ready-with-data' : 'ready-empty',
        document: {
          ...outcome.document,
          metadata: {
            ...outcome.document.metadata,
            lastSuccessfulLoadAt: now,
          },
        },
        loadError: null,
        dataStale: false,
      };
    }
    case 'unsupported_schema':
      return {
        startupPhase: 'migration-failed',
        document: createEmptyPersistedDocument(now),
        loadError: `Unsupported schema version ${outcome.foundVersion}`,
        dataStale: false,
      };
    case 'corrupt':
      return {
        startupPhase: outcome.recoveredDocument ? 'corrupt-recovered' : 'safe-reset-required',
        document: outcome.recoveredDocument ?? createEmptyPersistedDocument(now),
        loadError: outcome.message,
        dataStale: false,
      };
    case 'error':
      return {
        startupPhase: 'unavailable',
        document: createEmptyPersistedDocument(now),
        loadError: outcome.message,
        dataStale: false,
      };
  }
}

export function appStateFromDocument(
  document: PersistedAppDocument,
  startupPhase: AppStartupPhase,
  loadError: string | null,
  dataStale: boolean,
  now: number = Date.now()
) {
  const counts = documentToDerivedCounts(document, now);
  return {
    hydrated: startupPhase !== 'restoring',
    loadError,
    dataStale,
    startupPhase,
    onboardingComplete: document.onboardingComplete,
    onboarding: document.onboarding,
    trackingEngineState: document.trackingEngineState,
    lastConfirmedCaptureAt: document.lastConfirmedCaptureAt,
    lastSyncAt: document.lastSyncAt,
    recoveryCandidates: document.recoveryCandidates,
    trips: document.trips,
    reviewItems: buildReviewItemsFromDocument(document),
    tripsTodayCount: counts.tripsTodayCount,
    periodConfirmedBusinessMiles: counts.periodConfirmedBusinessMiles,
    reportingPeriod: document.reportingPeriod,
    mileageRate: document.mileageRate,
  };
}

export function documentFromAppSlice(input: {
  onboardingComplete: boolean;
  onboarding: PersistedAppDocument['onboarding'];
  permissions: PersistedAppDocument['permissions'];
  trackingEngineState: PersistedAppDocument['trackingEngineState'];
  lastConfirmedCaptureAt: number | null;
  lastSyncAt: number | null;
  trips: PersistedAppDocument['trips'];
  recoveryCandidates: PersistedAppDocument['recoveryCandidates'];
  reportingPeriod: PersistedAppDocument['reportingPeriod'];
  mileageRate: PersistedAppDocument['mileageRate'];
  metadata: PersistedAppDocument['metadata'];
  savedAt?: number;
}): PersistedAppDocument {
  return {
    schemaVersion: 1,
    savedAt: input.savedAt ?? Date.now(),
    onboardingComplete: input.onboardingComplete,
    onboarding: input.onboarding,
    permissions: input.permissions,
    trackingEngineState: input.trackingEngineState,
    lastConfirmedCaptureAt: input.lastConfirmedCaptureAt,
    lastSyncAt: input.lastSyncAt,
    trips: input.trips,
    recoveryCandidates: input.recoveryCandidates,
    reportingPeriod: input.reportingPeriod,
    mileageRate: input.mileageRate,
    metadata: input.metadata,
  };
}
