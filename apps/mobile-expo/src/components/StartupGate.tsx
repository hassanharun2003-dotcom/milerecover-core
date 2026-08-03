import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import type { AppStartupPhase } from '@milerecover/domain';
import {
  AppScreen,
  DestructiveButton,
  ErrorBanner,
  PrimaryButton,
  text,
} from '../design-system';

interface StartupGateProps {
  phase: AppStartupPhase;
  loadError: string | null;
  onRetry: () => void;
  onConfirmReset: () => void;
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
      return 'Some saved data could not be read. You can continue with a safe empty state.';
    case 'safe-reset-required':
      return 'Saved data appears damaged. Reset local data to continue safely.';
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
  const showRetry = phase === 'unavailable' || phase === 'migration-failed';
  const showReset = phase === 'safe-reset-required';
  const showContinue = phase === 'corrupt-recovered';
  const isErrorPhase = showRetry || showReset;

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.center} accessibilityLabel="App startup status">
        {phase === 'restoring' ? (
          <ActivityIndicator size="large" color={colors.forest[600]} accessibilityLabel="Loading" />
        ) : null}
        <Text style={text.title} accessibilityRole="header">
          {phase === 'restoring' ? 'Loading' : 'Storage notice'}
        </Text>
        {isErrorPhase ? (
          <ErrorBanner title="Storage notice" body={message} />
        ) : (
          <Text style={[text.body, styles.body]}>{message}</Text>
        )}
        {showRetry ? (
          <PrimaryButton label="Retry" onPress={onRetry} accessibilityLabel="Retry loading saved data" />
        ) : null}
        {showContinue ? (
          <PrimaryButton
            label="Continue with safe empty state"
            onPress={() => setCorruptAcknowledged(true)}
            accessibilityLabel="Continue after storage recovery"
          />
        ) : null}
        {showReset ? (
          <DestructiveButton
            label="Reset local data"
            onPress={onConfirmReset}
            accessibilityLabel="Reset local data after confirmation"
          />
        ) : null}
      </View>
    </AppScreen>
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
