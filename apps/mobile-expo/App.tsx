import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, spacing } from '@milerecover/config';
import {
  canCaptureAutomaticTrip,
  capabilitiesForEntitlement,
  mapEngineRuntimeToShell,
} from '@milerecover/domain';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProductProvider, useProduct } from './src/product/ProductContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StartupGate } from './src/components/StartupGate';
import { ManualTripMigration } from './src/components/ManualTripMigration';
import { UpdateProvider, useAppUpdates } from './src/updates/UpdateProvider';
import { SafeFillScreen, text, ThemeProvider, useAppTheme } from './src/design-system';
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
  const { upsertTrip, setTrackingEngineState, state } = useApp();
  const { product } = useProduct();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const allowanceOk = canCaptureAutomaticTrip(product.entitlement, state.trips);
  const trackingAllowed =
    product.trackingEnabled && capabilities.canUseAutomaticCapture && allowanceOk;
  const tripsRef = useRef(state.trips);
  tripsRef.current = state.trips;
  const productRef = useRef(product);
  productRef.current = product;

  const controller = useMemo(
    () =>
      createTrackingController({
        onTripClosed: upsertTrip,
        isAllowed: () => {
          const caps = capabilitiesForEntitlement(productRef.current.entitlement);
          return (
            productRef.current.trackingEnabled &&
            caps.canUseAutomaticCapture &&
            canCaptureAutomaticTrip(productRef.current.entitlement, tripsRef.current)
          );
        },
        onEngineStateChange: (runtime, lastSampleAt) => {
          setTrackingEngineState(mapEngineRuntimeToShell(runtime), lastSampleAt);
        },
        getExistingTrips: () => tripsRef.current,
      }),
    [setTrackingEngineState, upsertTrip],
  );

  useEffect(() => {
    if (trackingAllowed) {
      void controller.startTracking();
    } else {
      void controller.stopTracking();
      setTrackingEngineState('idle');
    }
    return () => {
      void controller.stopTracking();
    };
  }, [controller, setTrackingEngineState, trackingAllowed]);

  // Process-death / resume: refresh diagnostics into AppContext while protection is on.
  useEffect(() => {
    if (!trackingAllowed) return;
    let cancelled = false;
    const tick = async () => {
      const diagnostics = await controller.getDiagnostics();
      if (cancelled) return;
      setTrackingEngineState(
        mapEngineRuntimeToShell(diagnostics.engineState),
        diagnostics.lastSampleAt,
      );
    };
    void tick();
    const id = setInterval(() => void tick(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [controller, setTrackingEngineState, trackingAllowed]);

  return <>{children}</>;
}

function AppRoot() {
  const { state, retryRestore, resetLocalData, finishOnboarding } = useApp();
  const { product, hydrated: productHydrated } = useProduct();
  const { setUpdatePromptBlocked } = useAppUpdates();
  const { isDark } = useAppTheme();

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

  // Only allow OTA prompts once Home is unlocked — never over Welcome/onboarding.
  useEffect(() => {
    setUpdatePromptBlocked(!launch.allowHome);
  }, [launch.allowHome, setUpdatePromptBlocked]);

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
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
      <ThemeProvider>
        <AppProvider>
          <ProductProvider>
            <UpdateProvider>
              <AppRoot />
            </UpdateProvider>
          </ProductProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
