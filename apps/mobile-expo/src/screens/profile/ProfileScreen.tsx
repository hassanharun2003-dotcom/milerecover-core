import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  ListRow,
  ListSection,
  MembershipBanner,
  SecondaryButton,
  StatusCard,
  TabScreen,
  text,
} from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { protectionLabel, voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import { DRIVING_PATTERN_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { getTrackingDiagnostics, type TrackingDiagnostics } from '../../services/trackingEngine';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable } = useApp();
  const {
    product,
    setDemoScenario,
    setDemoModeEnabled,
    resetProductData,
    resetOnboarding,
  } = useProduct();
  const [diagnostics, setDiagnostics] = useState<TrackingDiagnostics | null>(null);
  const displayName = product.preferredName?.trim() || 'Your profile';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label;
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label;
  const voice = voiceForDrivingType(product.drivingType);

  useEffect(() => {
    void getTrackingDiagnostics().then(setDiagnostics);
  }, [product.trackingEnabled]);

  return (
    <TabScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          {displayName}
        </Text>
        <Text style={text.body}>
          {product.preferredName ? 'Saved on this device' : 'Add a preferred name anytime.'}
        </Text>
      </View>

      <MembershipBanner
        planName={`MileRecover ${product.entitlement.planId.toUpperCase()}`}
        detail={`Status: ${product.entitlement.status}. Source: ${product.entitlement.source}.`}
      />
      <SecondaryButton
        label="Manage plan"
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
      />

      <ListSection title="Profile">
        <ListRow label="Preferred name" value={product.preferredName?.trim() || 'Not set'} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Primary goal" value={primaryGoal ?? 'Not set'} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Pain points" value={product.selectedPainPoints.length ? String(product.selectedPainPoints.length) : 'Not set'} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Driving pattern" value={drivingType ?? 'Not set'} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Report style" value={voice.reportNoun} showChevron={false} />
      </ListSection>

      <ListSection title="Driving">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'None'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow
          label="Work places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'None'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <ListSection title="Records">
        <ListRow
          label="Protection education"
          value={protectionLabel(product.protectionSetupState)}
          onPress={() => navigation.navigate('ProtectionAlert')}
        />
        <ListRow
          label="Tracking status"
          value={diagnostics?.engineState ?? (product.trackingEnabled ? 'enabled' : 'off')}
          onPress={() => navigation.navigate('TrackingActive')}
        />
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export report" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <StatusCard
        variant={product.trackingEnabled && diagnostics?.backgroundLimited ? 'warning' : 'neutral'}
        title="Protection diagnostics"
        body={`Foreground: ${permissions.location}. Background: ${permissions.backgroundLocation}. Engine: ${diagnostics?.engineState ?? 'unknown'}. Capture runtime: ${automaticCaptureAvailable ? 'available' : 'unavailable'}. Samples: ${diagnostics?.sampleCount ?? 0}.`}
        emphasis="subtle"
      />

      <ListSection title="Privacy">
        <ListRow
          label="Data and privacy"
          value="Local first"
          onPress={() => navigation.navigate('Privacy')}
        />
      </ListSection>

      <ListSection title="Help">
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About" onPress={() => navigation.navigate('About')} />
        <ListRow
          label="Restart onboarding"
          onPress={() => {
            resetOnboarding();
            restartOnboarding();
          }}
        />
      </ListSection>

      {product.showDevTools ? (
        <ListSection title="Internal preview tools">
          <ListRow
            label="Demo mode"
            value={product.demoModeEnabled ? 'On' : 'Off'}
            onPress={() => setDemoModeEnabled(!product.demoModeEnabled)}
          />
          {product.demoModeEnabled
            ? DEMO_SCENARIO_LIST.map((scenario) => (
                <ListRow
                  key={scenario.id}
                  label={scenario.label}
                  value={product.demoScenario === scenario.id ? 'Active' : undefined}
                  onPress={() => setDemoScenario(scenario.id)}
                />
              ))
            : null}
          <ListRow
            label="Reset preview data"
            onPress={() => {
              void resetProductData();
              resetLocalData();
              restartOnboarding();
            }}
          />
        </ListSection>
      ) : null}
    </TabScreen>
  );
}
