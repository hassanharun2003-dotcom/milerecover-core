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
import { SecondaryButton, StatusCard, text as textStyles } from '../design-system';
import { isStandaloneBuild } from '../constants/buildInfo';
import { isShareInFlight } from '../services/fileShare';
import * as Updates from 'expo-updates';
import { applyPendingUpdate, checkAndDownloadUpdate, updatesEnabled } from './appUpdates';

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
  // Native channel is authoritative. A mis-published OTA can embed appVariant=development
  // while the APK still listens on preview/production — treat those as standalone.
  const channel = Updates.channel ?? null;
  const standalone =
    isStandaloneBuild(variant) || channel === 'preview' || channel === 'production';

  const runCheck = useCallback(async () => {
    const result = await checkAndDownloadUpdate();
    if (result.error) setLastCheckError(result.error);
    else setLastCheckError(null);
    if (result.downloaded) setUpdateReady(true);
    return result.downloaded;
  }, []);

  useEffect(() => {
    // Defer launch check until the prompt is unblocked (after onboarding / boot).
    if (!standalone || !updatesEnabled() || checkedOnLaunch.current || blocked) return;
    checkedOnLaunch.current = true;
    void runCheck();
  }, [standalone, runCheck, blocked]);

  const applyUpdate = useCallback(async () => {
    if (isShareInFlight() || blocked) return;
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
              title="Update ready"
              body="A MileRecover update is downloaded. Restart when you’re ready."
              emphasis="subtle"
            />
            <View style={styles.bannerActions}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Later"
                  onPress={dismissUpdatePrompt}
                  accessibilityLabel="Dismiss update prompt until next launch"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Restart now"
                  onPress={() => void applyUpdate()}
                  accessibilityLabel="Restart now to apply the update"
                />
              </View>
            </View>
            <Text style={[textStyles.caption, styles.caption]}>
              Won’t cover your tabs. Unsaved forms are not interrupted while you keep editing.
            </Text>
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
