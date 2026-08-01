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
  appStateFromDocument,
  createEmptyPersistedDocument,
  documentFromAppSlice,
  resolveStartupFromLoad,
  type PermissionSnapshot,
  type PersistedAppDocument,
  type PersistenceRepository,
} from '@milerecover/domain';
import { createProductionPersistenceRepository } from '../persistence/AsyncStoragePersistenceRepository';
import { createInitialAppState, type MileRecoverAppState } from './types';

interface AppContextValue {
  state: MileRecoverAppState;
  permissions: PermissionSnapshot;
  completeOnboardingStep: (action: 'next' | 'skip_motion') => void;
  finishOnboarding: () => void;
  retryRestore: () => void;
  resetLocalData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function buildPersistedDocument(
  state: MileRecoverAppState,
  permissions: PermissionSnapshot,
  metadata: PersistedAppDocument['metadata']
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
          startupPhase: prev.startupPhase === 'ready-empty' || prev.startupPhase === 'ready-with-data' ? 'unavailable' : prev.startupPhase,
        }));
      }
    },
    []
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
      hydrated.dataStale
    );
    setState(mapped);
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      permissions,
      completeOnboardingStep: (action) => {
        setState((prev) => {
          const next = {
            ...prev,
            onboarding: advanceOnboarding(prev.onboarding, action),
          };
          void persistCurrent(next, permissions);
          return next;
        });
      },
      finishOnboarding: () => {
        setState((prev) => {
          const next = {
            ...prev,
            onboardingComplete: true,
            startupPhase: 'ready-with-data' as const,
          };
          void persistCurrent(next, permissions);
          return next;
        });
      },
      retryRestore: () => {
        void restore();
      },
      resetLocalData: () => {
        void (async () => {
          await repoRef.current.clear();
          metadataRef.current = createEmptyPersistedDocument().metadata;
          setPermissions(createEmptyPersistedDocument().permissions);
          const mapped = appStateFromDocument(
            createEmptyPersistedDocument(),
            'ready-empty',
            null,
            false
          );
          setState(mapped);
        })();
      },
    }),
    [state, permissions, persistCurrent, restore]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
