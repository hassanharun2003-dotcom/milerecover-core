import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@milerecover/config';
import { SecondaryButton, StatusCard } from '../design-system';
import { isStandaloneBuild, isStandaloneUpdateChannel } from '../constants/buildInfo';
import { isShareInFlight } from '../services/fileShare';
import * as Updates from 'expo-updates';
import { applyPendingUpdate, checkAndDownloadUpdate, updatesEnabled } from './appUpdates';
import { ANALYTICS_EVENTS, logEvent } from '../services/analytics';

interface UpdateContextValue {
  updateReady: boolean;
  lastCheckError: string | null;
  checkForUpdates: () => Promise<boolean>;
  applyUpdate: () => Promise<void>;
  dismissUpdatePrompt: () => void;
  updatesActive: boolean;
  /** Suppress prompt while a critical sheet/form is open. */
  setUpdatePromptBlocked: (blocked: boolean) => void;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

/** Approximate tab bar height used to sit the banner above navigation. */
const TAB_BAR_BASE = 56;

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  /** Start blocked so OTA never covers boot/onboarding before AppRoot decides. */
  const [blocked, setBlocked] = useState(true);
  const [lastCheckError, setLastCheckError] = useState<string | null>(null);
  const checkedOnLaunch = useRef(false);
  const variant = Constants.expoConfig?.extra?.appVariant as string | undefined;
  // Native channel is authoritative. Foundation channels (preview-foundation-*) are standalone.
  const channel = (() => {
    try {
      return Updates.channel ?? null;
    } catch {
      return null;
    }
  })();
  const standalone = isStandaloneBuild(variant) || isStandaloneUpdateChannel(channel);

  const runCheck = useCallback(async () => {
    try {
      const result = await checkAndDownloadUpdate();
      if (result.error) setLastCheckError(result.error);
      else setLastCheckError(null);
      if (result.downloaded) setUpdateReady(true);
      return result.downloaded;
    } catch (error) {
      setLastCheckError(error instanceof Error ? error.message : 'Update check failed');
      return false;
    }
  }, []);

  useEffect(() => {
    // Native checkAutomatically is NEVER — JS owns post-paint checks only.
    // Wait until Home is unlocked so OTA never blocks Welcome/onboarding.
    if (!standalone || !updatesEnabled() || checkedOnLaunch.current || blocked) return;
    checkedOnLaunch.current = true;
    const timer = setTimeout(() => {
      void runCheck();
    }, 2500);
    return () => clearTimeout(timer);
  }, [standalone, runCheck, blocked]);

  const applyUpdate = useCallback(async () => {
    if (isShareInFlight() || blocked) return;
    logEvent(ANALYTICS_EVENTS.updateApplied, {});
    await applyPendingUpdate();
  }, [blocked]);

  const dismissUpdatePrompt = useCallback(() => {
    setDismissedThisSession(true);
    setUpdateReady(false);
  }, []);

  const value = useMemo<UpdateContextValue>(
    () => ({
      updateReady: updateReady && !dismissedThisSession,
      lastCheckError,
      checkForUpdates: runCheck,
      applyUpdate,
      dismissUpdatePrompt,
      updatesActive: standalone && updatesEnabled(),
      setUpdatePromptBlocked: setBlocked,
    }),
    [
      updateReady,
      dismissedThisSession,
      lastCheckError,
      runCheck,
      applyUpdate,
      dismissUpdatePrompt,
      standalone,
    ],
  );

  const showBanner =
    updateReady && !dismissedThisSession && !blocked && !isShareInFlight();

  return (
    <UpdateContext.Provider value={value}>
      <View style={styles.flex}>{children}</View>
      {showBanner ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.bannerHost,
            {
              paddingBottom: Math.max(insets.bottom, spacing.sm) + TAB_BAR_BASE + spacing.sm,
              paddingLeft: Math.max(insets.left, spacing.md),
              paddingRight: Math.max(insets.right, spacing.md),
            },
          ]}
          accessibilityViewIsModal={false}
        >
          <View
            style={styles.banner}
            accessibilityRole="summary"
            accessibilityLabel="Update ready. Restart now or later."
          >
            <StatusCard
              variant="info"
              title="A new version is ready"
              body="Restart when you’re ready to apply it."
              emphasis="subtle"
            />
            <View style={styles.bannerActions}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Later"
                  onPress={dismissUpdatePrompt}
                  accessibilityLabel="Dismiss update until later this session"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Restart"
                  onPress={() => void applyUpdate()}
                  accessibilityLabel="Restart to apply the update"
                />
              </View>
            </View>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bannerHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  banner: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  caption: {
    marginTop: spacing.xs,
  },
});
