import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootTabs } from './RootTabs';
import { BringExistingMileageScreen } from '../screens/import/BringExistingMileageScreen';
import { ImportExceptionReviewScreen, ImportPreviewScreen } from '../screens/import/ImportPreviewScreen';
import { AboutScreen } from '../screens/about/AboutScreen';
import { DiagnosticsScreen } from '../screens/about/DiagnosticsScreen';
import {
  ComingLaterScreen,
  ExportReportScreen,
  HelpSupportScreen,
  ManualTripScreen,
  MissingDrivesIntroScreen,
  MissingTripRecoveryScreen,
  PlanSelectionScreen,
  PrivacyScreen,
  ProtectionAlertScreen,
  ReportPreviewScreen,
  RescueProductsScreen,
  TermsScreen,
  TrackingActiveScreen,
  TripDetailsScreen,
  VehicleSetupScreen,
  WorkLocationSetupScreen,
} from '../screens/flows/SupportingScreens';
import { EditSetupScreen } from '../screens/profile/EditSetupScreen';
import { useAppTheme } from '../design-system/ThemeProvider';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { palette } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        // Image-lock: light headers — dark green reserved for hero surfaces only.
        headerStyle: { backgroundColor: palette.background.canvas },
        headerTintColor: palette.text.primary,
        headerTitleStyle: { fontWeight: '700' as const, color: palette.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background.canvas },
        headerTransparent: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={RootTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ManualTrip" component={ManualTripScreen} options={{ title: 'Add drive' }} />
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip details' }} />
      <Stack.Screen name="MissingTripRecovery" component={MissingTripRecoveryScreen} options={{ title: 'Recovery' }} />
      <Stack.Screen name="MissingDrivesIntro" component={MissingDrivesIntroScreen} options={{ title: 'Missing drives' }} />
      <Stack.Screen name="ProtectionAlert" component={ProtectionAlertScreen} options={{ title: 'Protection Center' }} />
      <Stack.Screen name="TrackingActive" component={TrackingActiveScreen} options={{ title: 'Tracking health' }} />
      <Stack.Screen name="BringExistingMileage" component={BringExistingMileageScreen} options={{ title: 'Bring mileage' }} />
      <Stack.Screen name="ImportPreview" component={ImportPreviewScreen} options={{ title: 'Import preview' }} />
      <Stack.Screen name="ImportExceptionReview" component={ImportExceptionReviewScreen} options={{ title: 'Exceptions' }} />
      <Stack.Screen name="VehicleSetup" component={VehicleSetupScreen} options={{ title: 'Vehicles' }} />
      <Stack.Screen name="WorkLocationSetup" component={WorkLocationSetupScreen} options={{ title: 'Work locations' }} />
      <Stack.Screen name="ComingLater" component={ComingLaterScreen} options={{ title: 'Coming later' }} />
      <Stack.Screen name="ExportReport" component={ExportReportScreen} options={{ title: 'Export' }} />
      <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} options={{ title: 'Preview' }} />
      <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} options={{ title: 'Go Pro' }} />
      <Stack.Screen name="EditSetup" component={EditSetupScreen} options={{ title: 'Edit setup' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms' }} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: 'Help' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} options={{ title: 'Diagnostics' }} />
      <Stack.Screen name="RescueProducts" component={RescueProductsScreen} options={{ title: 'Rescue' }} />
    </Stack.Navigator>
  );
}
