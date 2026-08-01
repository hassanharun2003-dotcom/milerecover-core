import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store/AppContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootTabs } from './src/navigation/RootTabs';
import { StartupGate } from './src/components/StartupGate';

function RootNavigator() {
  const { state, retryRestore, resetLocalData } = useApp();

  return (
    <StartupGate
      phase={state.startupPhase}
      loadError={state.loadError}
      onRetry={retryRestore}
      onConfirmReset={resetLocalData}
    >
      {!state.onboardingComplete ? <OnboardingFlow /> : (
        <NavigationContainer>
          <RootTabs />
        </NavigationContainer>
      )}
    </StartupGate>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
