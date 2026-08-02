import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { spacing } from '@milerecover/config';
import { SecondaryButton, StatusCard } from '../design-system';
import { isStandaloneBuild } from '../constants/buildInfo';
import { applyPendingUpdate, checkAndDownloadUpdate, updatesEnabled } from './appUpdates';

interface UpdateContextValue {
  updateReady: boolean;
  lastCheckError: string | null;
  checkForUpdates: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  updatesActive: boolean;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateReady, setUpdateReady] = useState(false);
  const [lastCheckError, setLastCheckError] = useState<string | null>(null);
  const checkedOnLaunch = useRef(false);
  const variant = Constants.expoConfig?.extra?.appVariant as string | undefined;
  const standalone = isStandaloneBuild(variant);

  const runCheck = useCallback(async () => {
    const result = await checkAndDownloadUpdate();
    if (result.error) setLastCheckError(result.error);
    else setLastCheckError(null);
    if (result.downloaded) setUpdateReady(true);
    return result.downloaded;
  }, []);

  useEffect(() => {
    if (!standalone || !updatesEnabled() || checkedOnLaunch.current) return;
    checkedOnLaunch.current = true;
    void runCheck();
  }, [standalone, runCheck]);

  const applyUpdate = useCallback(async () => {
    await applyPendingUpdate();
  }, []);

  const value = useMemo<UpdateContextValue>(
    () => ({
      updateReady,
      lastCheckError,
      checkForUpdates: runCheck,
      applyUpdate,
      updatesActive: standalone && updatesEnabled(),
    }),
    [updateReady, lastCheckError, runCheck, applyUpdate, standalone],
  );

  return (
    <UpdateContext.Provider value={value}>
      {children}
      {updateReady ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, zIndex: 10 }}>
          <StatusCard
            variant="info"
            title="Update ready"
            body="A MileRecover update is ready. Restart to apply."
            actionLabel="Restart now"
            onAction={() => void applyUpdate()}
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton label="Later" onPress={() => setUpdateReady(false)} accessibilityLabel="Apply update later" />
          </View>
        </View>
      ) : null}
    </UpdateContext.Provider>
  );
}

export function useAppUpdates(): UpdateContextValue {
  const ctx = useContext(UpdateContext);
  if (!ctx) throw new Error('useAppUpdates must be used within UpdateProvider');
  return ctx;
}
