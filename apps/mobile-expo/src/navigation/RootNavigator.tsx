import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootTabs } from './RootTabs';
import { ManualTripScreen } from '../screens/manual/ManualTripScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={RootTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ManualTrip"
        component={ManualTripScreen}
        options={{
          title: 'Add trip',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
