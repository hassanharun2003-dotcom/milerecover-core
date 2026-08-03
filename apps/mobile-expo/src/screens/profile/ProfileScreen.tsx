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
  ScrollScreen,
  SecondaryButton,
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
  const { resetLocalData } = useApp();
  const { product, setDemoScenario, resetProductData, resetOnboarding } = useProduct();
  const plan = PLAN_FIXTURES.find((p) => p.id === product.selectedPlan);
  const vehicleLabel = product.vehicles[0]?.label ?? 'Primary vehicle';

  return (
    <ScrollScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          Alex Johnson
        </Text>
        <Text style={text.body}>alex@example.com</Text>
      </View>

      <MembershipBanner
        planName={plan?.id === 'free' ? 'MileRecover Free' : `MileRecover ${plan?.name ?? 'Free'}`}
        detail={
          plan?.id === 'free'
            ? 'Upgrade when it helps—never because we rushed you'
            : 'You’re covered · upgrade anytime if you need more'
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
          value={vehicleLabel}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow
          label="Work places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
        <ListRow
          label="Work schedule"
          value="Soon"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Work schedule',
              detail:
                'Schedule-aware help arrives after automatic capture. Optional—and never required to stay covered.',
            })
          }
        />
      </ListSection>

      <ListSection title="Protection">
        <ListRow label="Background access" onPress={() => navigation.navigate('ProtectionAlert')} />
        <ListRow label="Tracking status" onPress={() => navigation.navigate('TrackingActive')} />
        <ListRow
          label="Notifications"
          value="Soon"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Notifications',
              detail:
                'Quiet weekly digests will live here. Per-trip noise stays off by default—on purpose.',
            })
          }
        />
        <ListRow
          label="Battery guidance"
          value="Soon"
          onPress={() =>
            navigation.navigate('ComingLater', {
              title: 'Battery guidance',
              detail:
                'Friendly tips arrive with background capture. Your miles already save offline first.',
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
                'Full controls arrive as sharing expands. Local data on this device remains your source of truth.',
            })
          }
        />
      </ListSection>

      <ListSection title="Help">
        <ListRow label="Help center" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About MileRecover" onPress={() => navigation.navigate('About')} />
      </ListSection>

      {product.showDevTools ? (
        <ListSection title="Development only">
          {DEMO_SCENARIO_LIST.map((s) => (
            <ListRow
              key={s.id}
              label={s.label}
              value={product.demoScenario === s.id ? 'Active' : undefined}
              onPress={() => setDemoScenario(s.id)}
            />
          ))}
          <ListRow label="Reset onboarding" onPress={resetOnboarding} />
          <ListRow
            label="Clear local development data"
            onPress={() => {
              void resetProductData();
              resetLocalData();
            }}
          />
        </ListSection>
      ) : null}
    </ScrollScreen>
  );
}
