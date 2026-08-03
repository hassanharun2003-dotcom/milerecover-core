import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store/AppContext';
import { ProductProvider } from './src/product/ProductContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StartupGate } from './src/components/StartupGate';
import { ManualTripMigration } from './src/components/ManualTripMigration';
import { UpdateProvider } from './src/updates/UpdateProvider';

function AppRoot() {
  const { state, retryRestore, resetLocalData } = useApp();

  return (
    <StartupGate
      phase={state.startupPhase}
      loadError={state.loadError}
      onRetry={retryRestore}
      onConfirmReset={resetLocalData}
    >
      <StatusBar style="dark" />
      <ManualTripMigration />
      {!state.onboardingComplete ? (
        <OnboardingFlow />
      ) : (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
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
