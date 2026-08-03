import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, spacing } from '@milerecover/config';
import { capabilitiesForEntitlement, isOnboardingMinimumComplete } from '@milerecover/domain';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProductProvider, useProduct } from './src/product/ProductContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StartupGate } from './src/components/StartupGate';
import { ManualTripMigration } from './src/components/ManualTripMigration';
import { UpdateProvider } from './src/updates/UpdateProvider';
import { SafeFillScreen, text } from './src/design-system';
import { createTrackingController } from './src/services/trackingEngine';

function ProductHydrationGate({ children }: { children: React.ReactNode }) {
  const { hydrated } = useProduct();
  if (!hydrated) {
    return (
      <SafeFillScreen>
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.md, gap: spacing.md }}>
          <ActivityIndicator size="large" color={colors.forest[600]} accessibilityLabel="Loading" />
          <Text style={text.body}>Restoring product setup...</Text>
        </View>
      </SafeFillScreen>
    );
  }
  return <>{children}</>;
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
  const { product } = useProduct();
  const setupComplete = isOnboardingMinimumComplete(product.onboarding);

  useEffect(() => {
    if (setupComplete && !state.onboardingComplete) {
      finishOnboarding();
    }
  }, [finishOnboarding, setupComplete, state.onboardingComplete]);

  return (
    <StartupGate
      phase={state.startupPhase}
      loadError={state.loadError}
      onRetry={retryRestore}
      onConfirmReset={resetLocalData}
    >
      <StatusBar style="dark" />
      <ManualTripMigration />
      <ProductHydrationGate>
        <TrackingBootstrap>
          {!setupComplete ? (
            <OnboardingFlow />
          ) : (
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          )}
        </TrackingBootstrap>
      </ProductHydrationGate>
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
