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
  rejectTrip,
  resolveStartupFromLoad,
  suggestRecoveryFromTripGaps,
  tripFromConfirmedRecovery,
  type PermissionSnapshot,
  type PersistedAppDocument,
  type PersistenceRepository,
  type RecoveryCandidate,
  type TripClassification,
  type TripRecord,
} from '@milerecover/domain';
import { createProductionPersistenceRepository } from '../persistence/AsyncStoragePersistenceRepository';
import {
  AUTOMATIC_CAPTURE_AVAILABLE,
  openAppSettings,
  readLocationPermissionSnapshot,
  requestBackgroundLocation,
  requestForegroundLocation,
} from '../services/locationPermissions';
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
  resetLocalData: () => void;
  upsertTrip: (trip: TripRecord) => void;
  deleteTrip: (tripId: string) => TripRecord | null;
  restoreTrip: (trip: TripRecord) => void;
  classifyTrip: (tripId: string, action: ClassifyAction) => TripRecord | null;
  upsertRecovery: (candidate: RecoveryCandidate) => void;
  rejectRecovery: (candidateId: string) => void;
  confirmRecovery: (
    candidateId: string,
    distanceMiles: number,
    purpose: string,
  ) => TripRecord | null;
  refreshRecoverySuggestions: (workPlaces?: { id: string; label: string }[]) => void;
  setReportingPeriod: (period: MileRecoverAppState['reportingPeriod']) => void;
  refreshPermissions: () => Promise<PermissionSnapshot>;
  requestLocationPermission: () => Promise<PermissionSnapshot>;
  requestBackgroundPermission: () => Promise<PermissionSnapshot>;
  openSystemSettings: () => Promise<void>;
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

  const persistCurrent = useCallback(
    async (nextState: MileRecoverAppState, nextPermissions: PermissionSnapshot) => {
      if (nextState.startupPhase === 'restoring' || nextState.startupPhase === 'unavailable') {
        return;
      }
      const document = buildPersistedDocument(nextState, nextPermissions, metadataRef.current);
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
    },
    [],
  );

  const commit = useCallback(
    (updater: (prev: MileRecoverAppState) => MileRecoverAppState, nextPermissions?: PermissionSnapshot) => {
      setState((prev) => {
        const next = withDerived(updater(prev));
        void persistCurrent(next, nextPermissions ?? permissions);
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
      resetLocalData: () => {
        void (async () => {
          await repoRef.current.clear();
          metadataRef.current = createEmptyPersistedDocument().metadata;
          const empty = createEmptyPersistedDocument();
          setPermissions(empty.permissions);
          setState(withDerived(appStateFromDocument(empty, 'ready-empty', null, false)));
        })();
      },
      upsertTrip: (trip) => {
        commit((prev) => {
          const exists = prev.trips.some((t) => t.id === trip.id);
          const trips = exists
            ? prev.trips.map((t) => (t.id === trip.id ? trip : t))
            : [trip, ...prev.trips];
          return { ...prev, trips };
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
      classifyTrip: (tripId, action) => {
        const current = state.trips.find((t) => t.id === tripId);
        if (!current) return null;
        const updated =
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
          const suggestions = suggestRecoveryFromTripGaps(prev.trips, {
            existing: prev.recoveryCandidates,
            workPlaces,
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
