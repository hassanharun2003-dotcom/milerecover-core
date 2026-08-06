import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { spacing } from '@milerecover/config';
import {
  canCaptureAutomaticTrip,
  capabilitiesForEntitlement,
  mapEngineRuntimeToShell,
} from '@milerecover/domain';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProductProvider, useProduct } from './src/product/ProductContext';
import { StartupGate } from './src/components/StartupGate';
import { ManualTripMigration } from './src/components/ManualTripMigration';
import { StartupErrorBoundary } from './src/components/StartupErrorBoundary';
import { UpdateProvider, useAppUpdates } from './src/updates/UpdateProvider';
import { SafeFillScreen, text, ThemeProvider, useAppTheme } from './src/design-system';
import { resolveLaunchState } from './src/startup/launchState';

const OnboardingFlow = lazy(() =>
  import('./src/screens/onboarding/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow })),
);
const RootNavigator = lazy(() =>
  import('./src/navigation/RootNavigator').then((m) => ({ default: m.RootNavigator })),
);

function BootSplash({ label }: { label: string }) {
  const { palette } = useAppTheme();

  return (
    <SafeFillScreen>
      <View
        style={{ flex: 1, justifyContent: 'center', padding: spacing.md, gap: spacing.md }}
        accessibilityLabel="App startup status"
      >
        <ActivityIndicator size="large" color={palette.action.primary} accessibilityLabel="Loading" />
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
  const [controller, setController] = useState<
    Awaited<ReturnType<typeof import('./src/services/trackingEngine').createTrackingController>> | null
  >(null);

  // Defer native tracking module import until after first paint / Home unlock path.
  useEffect(() => {
    let cancelled = false;
    void import('./src/services/trackingEngine').then(({ createTrackingController }) => {
      if (cancelled) return;
      setController(
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
          getPrimaryVehicleId: () =>
            productRef.current.vehicles.find((vehicle) => vehicle.isPrimary)?.id ??
            productRef.current.vehicles[0]?.id ??
            null,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [setTrackingEngineState, upsertTrip]);

  useEffect(() => {
    if (!controller) return;
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

  useEffect(() => {
    if (!controller || !trackingAllowed) return;
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

function AppRoot({ remountKey }: { remountKey: number }) {
  const { state, retryRestore, resetLocalData, finishOnboarding } = useApp();
  const { product, hydrated: productHydrated } = useProduct();
  const { setUpdatePromptBlocked } = useAppUpdates();

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
      <StatusBar style="dark" />
      <ManualTripMigration />
      <TrackingBootstrap>
        <Suspense fallback={<BootSplash label="Preparing MileRecover…" />} key={remountKey}>
          {launch.showOnboarding ? (
            <OnboardingFlow />
          ) : launch.allowHome ? (
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          ) : (
            <BootSplash label="Preparing MileRecover…" />
          )}
        </Suspense>
      </TrackingBootstrap>
    </StartupGate>
  );
}

function AppShell() {
  const [remountKey, setRemountKey] = useState(0);
  const { resetLocalData, restartOnboarding } = useApp();
  const { resetProductData, resetOnboarding } = useProduct();

  return (
    <StartupErrorBoundary
      onRetry={() => setRemountKey((value) => value + 1)}
      onResetPreviewState={async () => {
        try {
          await resetProductData();
          await resetLocalData();
          resetOnboarding();
          restartOnboarding();
        } catch {
          // Boundary must stay up even if reset fails.
        }
        setRemountKey((value) => value + 1);
      }}
    >
      <UpdateProvider>
        <AppRoot remountKey={remountKey} />
      </UpdateProvider>
    </StartupErrorBoundary>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <ProductProvider>
            <AppShell />
          </ProductProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
