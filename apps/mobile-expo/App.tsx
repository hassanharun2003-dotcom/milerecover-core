import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, spacing } from '@milerecover/config';
import { capabilitiesForEntitlement } from '@milerecover/domain';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProductProvider, useProduct } from './src/product/ProductContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StartupGate } from './src/components/StartupGate';
import { ManualTripMigration } from './src/components/ManualTripMigration';
import { UpdateProvider } from './src/updates/UpdateProvider';
import { SafeFillScreen, text } from './src/design-system';
import { createTrackingController } from './src/services/trackingEngine';
import { resolveLaunchState } from './src/startup/launchState';

function BootSplash({ label }: { label: string }) {
  return (
    <SafeFillScreen>
      <View
        style={{ flex: 1, justifyContent: 'center', padding: spacing.md, gap: spacing.md }}
        accessibilityLabel="App startup status"
      >
        <ActivityIndicator size="large" color={colors.forest[600]} accessibilityLabel="Loading" />
        <Text style={text.title} accessibilityRole="header">
          MileRecover
        </Text>
        <Text style={text.body}>{label}</Text>
      </View>
    </SafeFillScreen>
  );
}

function TrackingBootstrap({ children }: { children: React.ReactNode }) {
  const { upsertTrip } = useApp();
  const { product } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const trackingAllowed = product.trackingEnabled && capabilities.canUseAutomaticCapture;
  const controller = useMemo(
    () =>
      createTrackingController({
        onTripClosed: upsertTrip,
        isAllowed: () => trackingAllowed,
      }),
    [trackingAllowed, upsertTrip],
  );

  useEffect(() => {
    if (trackingAllowed) {
      void controller.startTracking();
    } else {
      void controller.stopTracking();
    }
    return () => {
      void controller.stopTracking();
    };
  }, [controller, trackingAllowed]);

  return <>{children}</>;
}

function AppRoot() {
  const { state, retryRestore, resetLocalData, finishOnboarding } = useApp();
  const { product, hydrated: productHydrated } = useProduct();

  const appHydrated = state.startupPhase !== 'restoring';
  const launch = resolveLaunchState({
    appHydrated,
    productHydrated,
    startupPhase: state.startupPhase,
    onboarding: product.onboarding,
    tripCount: state.trips.length,
  });

  useEffect(() => {
    if (launch.kind === 'returningUser' && !state.onboardingComplete) {
      finishOnboarding();
    }
  }, [finishOnboarding, launch.kind, state.onboardingComplete]);

  if (launch.kind === 'booting') {
    return <BootSplash label="Checking your MileRecover setup…" />;
  }

  return (
    <StartupGate
      phase={state.startupPhase}
      loadError={state.loadError}
      onRetry={retryRestore}
      onConfirmReset={resetLocalData}
      launchKind={launch.kind}
    >
      <StatusBar style="dark" />
      <ManualTripMigration />
      <TrackingBootstrap>
        {launch.showOnboarding ? (
          <OnboardingFlow />
        ) : launch.allowHome ? (
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        ) : (
          <BootSplash label="Preparing MileRecover…" />
        )}
      </TrackingBootstrap>
    </StartupGate>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ProductProvider>
          <UpdateProvider>
            <AppRoot />
          </UpdateProvider>
        </ProductProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
