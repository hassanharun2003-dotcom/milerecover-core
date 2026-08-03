import React from 'react';
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
  TabScreen,
  text,
} from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import { DRIVING_TYPE_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { resetLocalData, restartOnboarding } = useApp();
  const {
    product,
    setDemoScenario,
    setDemoModeEnabled,
    resetProductData,
    resetOnboarding,
  } = useProduct();
  const displayName = product.preferredName?.trim() || 'Your profile';
  const drivingType = DRIVING_TYPE_OPTIONS.find((option) => option.id === product.drivingType)?.label;
  const voice = voiceForDrivingType(product.drivingType);

  return (
    <TabScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          {displayName}
        </Text>
        <Text style={text.body}>
          {product.preferredName ? 'Saved on this device' : 'Add a preferred name by restarting onboarding.'}
        </Text>
      </View>

      <MembershipBanner
        planName="MileRecover Free"
        detail="Free is active. Billing is not connected in this release candidate."
      />
      <SecondaryButton
        label="See plan preview"
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
      />

      <ListSection title="Profile">
        <ListRow label="Name" value={product.preferredName?.trim() || 'Not set'} showChevron={false} />
        <ListRow label="Driving type" value={drivingType ?? 'Not set'} showChevron={false} />
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
        <ListRow label="Protection" onPress={() => navigation.navigate('ProtectionAlert')} />
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export report" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <ListSection title="Privacy">
        <ListRow
          label="Data and privacy"
          value="Local first"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Data and privacy',
              detail:
                'Full privacy controls are not available in this preview. Trips remain local first and exports happen only when you share them.',
            })
          }
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
