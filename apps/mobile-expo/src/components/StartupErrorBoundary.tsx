import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radii, spacing } from '@milerecover/config';
import { PrimaryButton, SecondaryButton, TertiaryButton, text } from '../design-system';
import Constants from 'expo-constants';
import { allowInternalPreviewTools } from '../product/types';
import { APP_BUILD_LABEL, APP_VERSION } from '../constants/buildInfo';

const CRASH_RECORD_KEY = '@milerecover/startup_crash_v1';

type CrashRecord = {
  id: string;
  at: string;
  message: string;
  name: string;
  componentStack?: string;
};

type Props = {
  children: ReactNode;
  onRetry?: () => void;
  onResetPreviewState?: () => void | Promise<void>;
};

type State = {
  error: Error | null;
  errorId: string | null;
  showDetails: boolean;
};

function makeErrorId(): string {
  return `MR-${Date.now().toString(36).toUpperCase()}`;
}

async function persistCrashRecord(record: CrashRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(CRASH_RECORD_KEY, JSON.stringify(record));
  } catch {
    // Never block recovery UI on logging failure.
  }
}

/**
 * Production-safe shell boundary. Catches ordinary JS render/init errors so the
 * process does not silently exit. Native crashes still require source fixes.
 */
export class StartupErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorId: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, errorId: makeErrorId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const errorId = this.state.errorId ?? makeErrorId();
    void persistCrashRecord({
      id: errorId,
      at: new Date().toISOString(),
      message: error.message?.slice(0, 400) ?? 'Unknown error',
      name: error.name?.slice(0, 80) ?? 'Error',
      componentStack: info.componentStack?.slice(0, 1200),
    });
    if (this.state.errorId !== errorId) {
      this.setState({ errorId });
    }
  }

  private retry = () => {
    this.setState({ error: null, errorId: null, showDetails: false });
    this.props.onRetry?.();
  };

  private resetPreview = () => {
    void Promise.resolve(this.props.onResetPreviewState?.()).finally(() => {
      this.setState({ error: null, errorId: null, showDetails: false });
    });
  };

  render() {
    const { error, errorId, showDetails } = this.state;
    if (!error) return this.props.children;

    const variant = Constants.expoConfig?.extra?.appVariant as string | undefined;
    const preview = allowInternalPreviewTools(variant);
    return (
      <View style={styles.root} accessibilityLabel="Startup error">
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[text.title, styles.brand]} accessibilityRole="header">
            MileRecover
          </Text>
          <Text style={text.headline}>Something interrupted startup</Text>
          <Text style={text.body}>
            The app hit a recoverable error while opening. Your miles stay on this device. Try again
            — or reset preview setup if this keeps happening.
          </Text>
          <View style={styles.idBox}>
            <Text style={[text.caption, styles.idLabel]}>Error ID</Text>
            <Text style={[text.subtitle, styles.idValue]} accessibilityLabel={`Error identifier ${errorId ?? ''}`}>
              {errorId}
            </Text>
            <Text style={text.caption}>
              {APP_VERSION} · {APP_BUILD_LABEL}
            </Text>
          </View>
          <PrimaryButton label="Try again" onPress={this.retry} accessibilityLabel="Retry startup" />
          {preview ? (
            <>
              <SecondaryButton
                label="Reset preview state"
                onPress={this.resetPreview}
                accessibilityLabel="Reset preview onboarding and local cache"
              />
              <TertiaryButton
                label={showDetails ? 'Hide technical details' : 'Show technical details'}
                onPress={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
              />
              {showDetails ? (
                <Text style={[text.caption, styles.details]} selectable>
                  {error.name}: {error.message}
                </Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  brand: {
    color: colors.forest[700],
  },
  idBox: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.background.mist,
    gap: spacing.xs,
  },
  idLabel: {
    color: colors.text.muted,
    fontWeight: '600',
  },
  idValue: {
    fontWeight: '700',
  },
  details: {
    fontFamily: 'monospace',
  },
});