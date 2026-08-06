import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  advanceOnboarding,
  applyClassification,
  appStateFromDocument,
  applyRecoveryTransition,
  buildReviewItemsFromDocument,
  createEmptyPersistedDocument,
  documentFromAppSlice,
  isDuplicateAutoTrip,
  rejectTrip,
  resolveStartupFromLoad,
  runUnifiedRecoveryScan,
  tripFromConfirmedRecovery,
  type PermissionSnapshot,
  type PersistedAppDocument,
  type PersistenceRepository,
  type RecoveryCandidate,
  type TrackingEngineState,
  type TripClassification,
  type TripRecord,
} from '@milerecover/domain';
import { createProductionPersistenceRepository } from '../persistence/AsyncStoragePersistenceRepository';
import {
  AUTOMATIC_CAPTURE_AVAILABLE,
  openAppSettings,
  openBatteryOptimizationSettings,
  readLocationPermissionSnapshot,
  requestBackgroundLocation,
  requestForegroundLocation,
} from '../services/locationPermissions';
import { resetAppExperience } from '../services/dataPrivacy';
import { createInitialAppState, type MileRecoverAppState } from './types';

export type ClassifyAction = 'work' | 'personal' | 'not_drive' | 'not_sure';

interface AppContextValue {
  state: MileRecoverAppState;
  permissions: PermissionSnapshot;
  automaticCaptureAvailable: boolean;
  completeOnboardingStep: (action: 'next' | 'skip_motion') => void;
  finishOnboarding: () => void;
  restartOnboarding: () => void;
  retryRestore: () => void;
  resetLocalData: () => Promise<void>;
  upsertTrip: (trip: TripRecord) => void;
  deleteTrip: (tripId: string) => TripRecord | null;
  restoreTrip: (trip: TripRecord) => void;
  classifyTrip: (
    tripId: string,
    action: ClassifyAction,
    options?: {
      rateSnapshot?: TripRecord['rateSnapshot'];
    },
  ) => TripRecord | null;
  upsertRecovery: (candidate: RecoveryCandidate) => void;
  rejectRecovery: (candidateId: string) => void;
  confirmRecovery: (
    candidateId: string,
    distanceMiles: number,
    purpose: string,
  ) => TripRecord | null;
  refreshRecoverySuggestions: (workPlaces?: { id: string; label: string }[]) => void;
  setReportingPeriod: (period: MileRecoverAppState['reportingPeriod']) => void;
  setTrackingEngineState: (engineState: TrackingEngineState, lastSampleAt?: number | null) => void;
  refreshPermissions: () => Promise<PermissionSnapshot>;
  requestLocationPermission: () => Promise<PermissionSnapshot>;
  requestBackgroundPermission: () => Promise<PermissionSnapshot>;
  openSystemSettings: () => Promise<void>;
  openBatterySettings: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function buildPersistedDocument(
  state: MileRecoverAppState,
  permissions: PermissionSnapshot,
  metadata: PersistedAppDocument['metadata'],
): PersistedAppDocument {
  return documentFromAppSlice({
    onboardingComplete: state.onboardingComplete,
    onboarding: state.onboarding,
    permissions,
    trackingEngineState: state.trackingEngineState,
    lastConfirmedCaptureAt: state.lastConfirmedCaptureAt,
    lastSyncAt: state.lastSyncAt,
    trips: state.trips,
    recoveryCandidates: state.recoveryCandidates,
    reportingPeriod: state.reportingPeriod,
    mileageRate: state.mileageRate,
    metadata,
  });
}

function withDerived(next: MileRecoverAppState): MileRecoverAppState {
  const doc = buildPersistedDocument(next, {
    location: 'not_determined',
    backgroundLocation: 'not_determined',
    motion: 'not_applicable',
    batteryOptimizationRestricted: false,
  }, { lastSuccessfulSaveAt: null, lastSuccessfulLoadAt: null });
  // Recompute review items from trips/recovery only
  const reviewItems = buildReviewItemsFromDocument({
    ...createEmptyPersistedDocument(),
    trips: next.trips,
    recoveryCandidates: next.recoveryCandidates,
  });
  const confirmedMiles = next.trips
    .filter((t) => t.status === 'confirmed' && t.classification === 'business')
    .reduce((s, t) => s + t.distanceMiles, 0);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return {
    ...next,
    reviewItems,
    periodConfirmedBusinessMiles: confirmedMiles,
    tripsTodayCount: next.trips.filter((t) => t.endAt >= startOfDay.getTime()).length,
  };
}

interface AppProviderProps {
  children: React.ReactNode;
  repository?: PersistenceRepository;
}

export function AppProvider({ children, repository }: AppProviderProps) {
  const repoRef = useRef<PersistenceRepository>(repository ?? createProductionPersistenceRepository());
  const [state, setState] = useState<MileRecoverAppState>(() => createInitialAppState());
  const [permissions, setPermissions] = useState<PermissionSnapshot>({
    location: 'not_determined',
    backgroundLocation: 'not_determined',
    motion: 'not_applicable',
    batteryOptimizationRestricted: false,
  });
  const metadataRef = useRef<PersistedAppDocument['metadata']>({
    lastSuccessfulSaveAt: null,
    lastSuccessfulLoadAt: null,
  });

  const appWriteLatestRef = useRef<{
    state: MileRecoverAppState;
    permissions: PermissionSnapshot;
  } | null>(null);
  const appWriteChainRef = useRef<Promise<void>>(Promise.resolve());

  const persistCurrent = useCallback(
    (nextState: MileRecoverAppState, nextPermissions: PermissionSnapshot) => {
      if (nextState.startupPhase === 'restoring' || nextState.startupPhase === 'unavailable') {
        return;
      }
      // Latest-wins queue: rapid commits must not let an older save finish last.
      appWriteLatestRef.current = { state: nextState, permissions: nextPermissions };
      appWriteChainRef.current = appWriteChainRef.current
        .then(async () => {
          const latest = appWriteLatestRef.current;
          if (!latest) return;
          appWriteLatestRef.current = null;
          const document = buildPersistedDocument(
            latest.state,
            latest.permissions,
            metadataRef.current,
          );
          const saved = await repoRef.current.save(document);
          if (saved.ok) {
            metadataRef.current = {
              ...metadataRef.current,
              lastSuccessfulSaveAt: saved.savedAt,
            };
          } else {
            setState((prev) => ({
              ...prev,
              loadError: saved.message,
              startupPhase:
                prev.startupPhase === 'ready-empty' || prev.startupPhase === 'ready-with-data'
                  ? 'unavailable'
                  : prev.startupPhase,
            }));
          }
          // Another commit arrived while we were saving — drain it too.
          if (appWriteLatestRef.current) {
            const again = appWriteLatestRef.current;
            appWriteLatestRef.current = null;
            const document2 = buildPersistedDocument(
              again.state,
              again.permissions,
              metadataRef.current,
            );
            const saved2 = await repoRef.current.save(document2);
            if (saved2.ok) {
              metadataRef.current = {
                ...metadataRef.current,
                lastSuccessfulSaveAt: saved2.savedAt,
              };
            }
          }
        })
        .catch(() => {
          // Keep chain alive after failures.
        });
    },
    [],
  );

  const commit = useCallback(
    (updater: (prev: MileRecoverAppState) => MileRecoverAppState, nextPermissions?: PermissionSnapshot) => {
      setState((prev) => {
        const next = withDerived(updater(prev));
        persistCurrent(next, nextPermissions ?? permissions);
        return next;
      });
      if (nextPermissions) setPermissions(nextPermissions);
    },
    [persistCurrent, permissions],
  );

  const restore = useCallback(async () => {
    setState((prev) => ({ ...prev, startupPhase: 'restoring', hydrated: false, loadError: null }));
    const outcome = await repoRef.current.load();
    const hydrated = resolveStartupFromLoad(outcome);
    metadataRef.current = hydrated.document.metadata;
    setPermissions(hydrated.document.permissions);
    const mapped = appStateFromDocument(
      hydrated.document,
      hydrated.startupPhase,
      hydrated.loadError,
      hydrated.dataStale,
    );
    setState(withDerived(mapped));
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      permissions,
      automaticCaptureAvailable: AUTOMATIC_CAPTURE_AVAILABLE,
      completeOnboardingStep: (action) => {
        commit((prev) => ({
          ...prev,
          onboarding: advanceOnboarding(prev.onboarding, action),
        }));
      },
      finishOnboarding: () => {
        commit((prev) => ({
          ...prev,
          onboardingComplete: true,
          startupPhase: 'ready-with-data',
        }));
      },
      restartOnboarding: () => {
        // Preserve trips, recovery, and permissions — only reset onboarding flags.
        commit((prev) => ({
          ...prev,
          onboardingComplete: false,
          onboarding: {
            currentStep: 'welcome',
            completedSteps: [],
            skippedMotion: false,
          },
          startupPhase: prev.trips.length > 0 ? 'ready-with-data' : 'ready-empty',
        }));
      },
      retryRestore: () => {
        void restore();
      },
      resetLocalData: async () => {
        await resetAppExperience({ appRepository: repoRef.current });
        metadataRef.current = createEmptyPersistedDocument().metadata;
        const empty = createEmptyPersistedDocument();
        setPermissions(empty.permissions);
        setState(withDerived(appStateFromDocument(empty, 'ready-empty', null, false)));
      },
      upsertTrip: (trip) => {
        commit((prev) => {
          if (
            trip.source === 'auto_detected' &&
            !prev.trips.some((t) => t.id === trip.id) &&
            isDuplicateAutoTrip(trip, prev.trips)
          ) {
            return prev;
          }
          const exists = prev.trips.some((t) => t.id === trip.id);
          const trips = exists
            ? prev.trips.map((t) => (t.id === trip.id ? trip : t))
            : [trip, ...prev.trips];
          const lastConfirmedCaptureAt =
            trip.source === 'auto_detected'
              ? Math.max(prev.lastConfirmedCaptureAt ?? 0, trip.endAt)
              : prev.lastConfirmedCaptureAt;
          return {
            ...prev,
            trips,
            lastConfirmedCaptureAt:
              lastConfirmedCaptureAt === 0 ? prev.lastConfirmedCaptureAt : lastConfirmedCaptureAt,
          };
        });
      },
      deleteTrip: (tripId) => {
        const removed = state.trips.find((t) => t.id === tripId) ?? null;
        if (!removed) return null;
        commit((prev) => ({ ...prev, trips: prev.trips.filter((t) => t.id !== tripId) }));
        return removed;
      },
      restoreTrip: (trip) => {
        commit((prev) => {
          if (prev.trips.some((t) => t.id === trip.id)) {
            return { ...prev, trips: prev.trips.map((t) => (t.id === trip.id ? trip : t)) };
          }
          return { ...prev, trips: [trip, ...prev.trips] };
        });
      },
      classifyTrip: (tripId, action, options) => {
        const current = state.trips.find((t) => t.id === tripId);
        if (!current) return null;
        let updated =
          action === 'not_drive'
            ? rejectTrip(current)
            : action === 'not_sure'
              ? {
                  ...current,
                  classification: 'unclassified' as const,
                  status: 'pending' as const,
                  confidence: 'low' as const,
                  updatedAt: Date.now(),
                }
              : applyClassification(current, action === 'work' ? 'business' : 'personal');
        // Stamp immutable rate snapshot at accept time when provided.
        if (action === 'work' && updated.status === 'confirmed' && options?.rateSnapshot) {
          updated = {
            ...updated,
            rateSnapshot: current.rateSnapshot ?? options.rateSnapshot,
          };
        }
        commit((prev) => ({
          ...prev,
          trips: prev.trips.map((t) => (t.id === tripId ? updated : t)),
        }));
        return updated;
      },
      upsertRecovery: (candidate) => {
        commit((prev) => {
          const exists = prev.recoveryCandidates.some((c) => c.id === candidate.id);
          const recoveryCandidates = exists
            ? prev.recoveryCandidates.map((c) => (c.id === candidate.id ? candidate : c))
            : [...prev.recoveryCandidates, candidate];
          return { ...prev, recoveryCandidates };
        });
      },
      rejectRecovery: (candidateId) => {
        commit((prev) => ({
          ...prev,
          recoveryCandidates: prev.recoveryCandidates.map((c) => {
            if (c.id !== candidateId) return c;
            let stateName = c.state;
            if (stateName === 'detected' || stateName === 'inferred') {
              const presented = applyRecoveryTransition(stateName, 'present_to_user', c.confidence);
              if (presented.ok && presented.nextState) stateName = presented.nextState;
            }
            const result = applyRecoveryTransition(stateName, 'user_reject', c.confidence);
            return result.ok && result.nextState ? { ...c, state: result.nextState } : c;
          }),
        }));
      },
      confirmRecovery: (candidateId, distanceMiles, purpose) => {
        const candidate = state.recoveryCandidates.find((c) => c.id === candidateId);
        if (!candidate || !Number.isFinite(distanceMiles) || distanceMiles <= 0) return null;
        let stateName = candidate.state;
        if (stateName === 'detected' || stateName === 'inferred') {
          const presented = applyRecoveryTransition(stateName, 'present_to_user', candidate.confidence);
          if (!presented.ok || !presented.nextState) return null;
          stateName = presented.nextState;
        }
        // User-entered distance is a correction when confidence is low (never silent confirm).
        const action = candidate.confidence === 'low' ? 'user_correct' : 'user_confirm';
        const transition = applyRecoveryTransition(stateName, action, candidate.confidence);
        if (!transition.ok || !transition.nextState) return null;
        const created = tripFromConfirmedRecovery(
          { ...candidate, state: transition.nextState },
          distanceMiles,
          purpose,
        );
        commit((prev) => ({
          ...prev,
          trips: [created, ...prev.trips],
          recoveryCandidates: prev.recoveryCandidates.map((c) =>
            c.id === candidateId ? { ...c, state: transition.nextState! } : c,
          ),
        }));
        return created;
      },
      refreshRecoverySuggestions: (workPlaces = []) => {
        commit((prev) => {
          const suggestions = runUnifiedRecoveryScan({
            trips: prev.trips,
            existing: prev.recoveryCandidates,
            workPlaces,
            lastConfirmedCaptureAt: prev.lastConfirmedCaptureAt,
            trackingEngineState: prev.trackingEngineState,
          });
          if (suggestions.length === 0) return prev;
          return {
            ...prev,
            recoveryCandidates: [...prev.recoveryCandidates, ...suggestions],
          };
        });
      },
      setReportingPeriod: (period) => {
        commit((prev) => ({ ...prev, reportingPeriod: period }));
      },
      setTrackingEngineState: (engineState, lastSampleAt) => {
        commit((prev) => ({
          ...prev,
          trackingEngineState: engineState,
          lastSyncAt: lastSampleAt ?? prev.lastSyncAt,
        }));
      },
      refreshPermissions: async () => {
        const next = await readLocationPermissionSnapshot(permissions);
        setPermissions(next);
        commit((prev) => prev, next);
        return next;
      },
      requestLocationPermission: async () => {
        const next = await requestForegroundLocation();
        setPermissions(next);
        commit((prev) => prev, next);
        return next;
      },
      requestBackgroundPermission: async () => {
        const next = await requestBackgroundLocation(permissions);
        setPermissions(next);
        commit((prev) => prev, next);
        return next;
      },
      openSystemSettings: () => openAppSettings(),
      openBatterySettings: () => openBatteryOptimizationSettings(),
    }),
    [state, permissions, commit, restore],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
