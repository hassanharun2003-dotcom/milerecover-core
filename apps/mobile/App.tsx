import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store/AppContext';
import { OnboardingFlow } from './src/screens/onboarding/OnboardingFlow';
import { RootTabs } from './src/navigation/RootTabs';

function RootNavigator() {
  const { state } = useApp();
  if (!state.onboardingComplete) {
    return <OnboardingFlow />;
  }
  return (
    <NavigationContainer>
      <RootTabs />
    </NavigationContainer>
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
