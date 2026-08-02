import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@milerecover/config';
import { RootTabs } from './RootTabs';
import { BringExistingMileageScreen } from '../screens/import/BringExistingMileageScreen';
import { ImportExceptionReviewScreen, ImportPreviewScreen } from '../screens/import/ImportPreviewScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import {
  ExportReportScreen,
  HelpSupportScreen,
  ManualTripScreen,
  MissingTripRecoveryScreen,
  PlanSelectionScreen,
  ProtectionAlertScreen,
  ReportPreviewScreen,
  TripDetailsScreen,
  VehicleSetupScreen,
  WorkLocationSetupScreen,
} from '../screens/flows/SupportingScreens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.header.background },
  headerTintColor: colors.text.inverse,
  headerTitleStyle: { fontWeight: '600' as const },
};

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MainTabs" component={RootTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ManualTrip" component={ManualTripScreen} options={{ title: 'Add manual trip' }} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip details' }} />
      <Stack.Screen name="MissingTripRecovery" component={MissingTripRecoveryScreen} options={{ title: 'Recovery' }} />
      <Stack.Screen name="ProtectionAlert" component={ProtectionAlertScreen} options={{ title: 'Protection' }} />
      <Stack.Screen name="BringExistingMileage" component={BringExistingMileageScreen} options={{ title: 'Bring mileage' }} />
      <Stack.Screen name="ImportPreview" component={ImportPreviewScreen} options={{ title: 'Import preview' }} />
      <Stack.Screen name="ImportExceptionReview" component={ImportExceptionReviewScreen} options={{ title: 'Exceptions' }} />
      <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} options={{ title: 'Vehicles' }} />
      <Stack.Screen name="WorkLocationSetup" component={WorkLocationSetupScreen} options={{ title: 'Work locations' }} />
      <Stack.Screen name="ExportReport" component={ExportReportScreen} options={{ title: 'Export' }} />
      <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} options={{ title: 'Preview' }} />
      <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} options={{ title: 'Plans' }} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: 'Help' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    </Stack.Navigator>
  );
}
