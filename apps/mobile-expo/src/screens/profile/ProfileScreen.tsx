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
import { PLAN_FIXTURES } from '../../fixtures/subscription';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';

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
  const plan = PLAN_FIXTURES.find((p) => p.id === product.selectedPlan);
  const displayName = product.preferredName?.trim() || 'Your account';

  return (
    <TabScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          {displayName}
        </Text>
        <Text style={text.body}>
          {product.preferredName
            ? 'Signed in on this device'
            : 'No name yet — add one from Restart onboarding if you like'}
        </Text>
      </View>

      <MembershipBanner
        planName={plan?.id === 'free' ? 'MileRecover Free' : `MileRecover ${plan?.name ?? 'Free'}`}
        detail={
          plan?.id === 'free'
            ? 'Upgrade when it helps—never because we rushed you'
            : 'Active entitlement on this preview'
        }
      />
      <SecondaryButton
        label="See plans"
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        accessibilityLabel="View subscription plans"
      />

      <ListSection title="Driving">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'None'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow
          label="Work places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
        <ListRow
          label="Work schedule"
          value="Not available in this preview"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Work schedule',
              detail:
                'Schedule-aware help is not available in this preview. It will open when the capability ships—no fake toggle.',
            })
          }
        />
      </ListSection>

      <ListSection title="Protection">
        <ListRow label="Background access" onPress={() => navigation.navigate('ProtectionAlert')} />
        <ListRow label="Tracking status" onPress={() => navigation.navigate('TrackingActive')} />
        <ListRow
          label="Notifications"
          value="Not available in this preview"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Notifications',
              detail: 'Quiet weekly digests are not available in this preview.',
            })
          }
        />
        <ListRow
          label="Battery guidance"
          value="Not available in this preview"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Battery guidance',
              detail: 'Battery tips arrive with background capture. Not available in this preview.',
            })
          }
        />
      </ListSection>

      <ListSection title="Import">
        <ListRow
          label="Bring existing history"
          onPress={() => navigation.navigate('BringExistingMileage')}
        />
        <ListRow label="Export defaults" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <ListSection title="Privacy">
        <ListRow
          label="Data and privacy"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Data and privacy',
              detail:
                'Full privacy controls are not available in this preview. Local data on this device remains your source of truth.',
            })
          }
        />
      </ListSection>

      <ListSection title="Help">
        <ListRow label="Help center" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About MileRecover" onPress={() => navigation.navigate('About')} />
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
            ? DEMO_SCENARIO_LIST.map((s) => (
                <ListRow
                  key={s.id}
                  label={s.label}
                  value={product.demoScenario === s.id ? 'Active' : undefined}
                  onPress={() => setDemoScenario(s.id)}
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
