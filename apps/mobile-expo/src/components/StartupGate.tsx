import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import type { AppStartupPhase } from '@milerecover/domain';
import {
  DestructiveButton,
  ErrorBanner,
  PrimaryButton,
  SafeFillScreen,
  SecondaryButton,
  text,
} from '../design-system';
import type { LaunchKind } from '../startup/launchState';

interface StartupGateProps {
  phase: AppStartupPhase;
  loadError: string | null;
  onRetry: () => void;
  onConfirmReset: () => void;
  launchKind?: LaunchKind;
  children: React.ReactNode;
}

function messageForPhase(phase: AppStartupPhase, loadError: string | null): string {
  switch (phase) {
    case 'restoring':
      return 'Restoring your MileRecover data…';
    case 'unavailable':
      return loadError ?? 'Local storage is temporarily unavailable.';
    case 'migration-failed':
      return loadError ?? 'This app version cannot read your saved data yet.';
    case 'corrupt-recovered':
      return 'Some saved data could not be read. Your readable miles stay available when you continue.';
    case 'safe-reset-required':
      return 'Saved data appears damaged. You can try again, or reset local setup if needed. Mileage is never erased automatically.';
    default:
      return '';
  }
}

export function StartupGate({
  phase,
  loadError,
  onRetry,
  onConfirmReset,
  children,
}: StartupGateProps) {
  const [corruptAcknowledged, setCorruptAcknowledged] = useState(false);

  if (phase === 'ready-empty' || phase === 'ready-with-data') {
    return <>{children}</>;
  }

  if (phase === 'corrupt-recovered' && corruptAcknowledged) {
    return <>{children}</>;
  }

  const message = messageForPhase(phase, loadError);
  const showRetry = phase === 'unavailable' || phase === 'migration-failed' || phase === 'safe-reset-required';
  const showReset = phase === 'safe-reset-required';
  const showContinue = phase === 'corrupt-recovered';
  const isErrorPhase = phase === 'unavailable' || phase === 'migration-failed';

  return (
    <SafeFillScreen>
      <View style={styles.center} accessibilityLabel="App startup status">
        {phase === 'restoring' ? (
          <ActivityIndicator size="large" color={colors.forest[600]} accessibilityLabel="Loading" />
        ) : null}
        <Text style={text.title} accessibilityRole="header">
          {phase === 'restoring' ? 'MileRecover' : 'Couldn’t finish loading'}
        </Text>
        {isErrorPhase ? (
          <ErrorBanner title="Storage notice" body={message} />
        ) : (
          <Text style={[text.body, styles.body]}>{message}</Text>
        )}
        {showRetry ? (
          <PrimaryButton label="Try again" onPress={onRetry} accessibilityLabel="Try loading saved data again" />
        ) : null}
        {showContinue ? (
          <>
            <PrimaryButton
              label="Continue with recovered data"
              onPress={() => setCorruptAcknowledged(true)}
              accessibilityLabel="Continue with recovered data"
            />
            <SecondaryButton label="Try again" onPress={onRetry} accessibilityLabel="Try loading again" />
          </>
        ) : null}
        {showReset ? (
          <DestructiveButton
            label="Reset local setup"
            onPress={onConfirmReset}
            accessibilityLabel="Reset local setup after confirmation"
          />
        ) : null}
      </View>
    </SafeFillScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  body: {
    marginBottom: spacing.md,
  },
});
