import React, { createContext, useContext, useMemo, useState } from 'react';
import type { PermissionSnapshot } from '@milerecover/domain';
import { advanceOnboarding } from '@milerecover/domain';
import { createInitialAppState, type MileRecoverAppState } from './types';

interface AppContextValue {
  state: MileRecoverAppState;
  permissions: PermissionSnapshot;
  completeOnboardingStep: (action: 'next' | 'skip_motion') => void;
  finishOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MileRecoverAppState>(() => createInitialAppState());
  const [permissions] = useState<PermissionSnapshot>({
    location: 'not_determined',
    backgroundLocation: 'not_determined',
    motion: 'not_applicable',
    batteryOptimizationRestricted: false,
  });

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      permissions,
      completeOnboardingStep: (action) => {
        setState((prev) => ({
          ...prev,
          onboarding: advanceOnboarding(prev.onboarding, action),
        }));
      },
      finishOnboarding: () => {
        setState((prev) => ({ ...prev, onboardingComplete: true }));
      },
    }),
    [state, permissions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
