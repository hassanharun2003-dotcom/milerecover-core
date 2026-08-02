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
  SectionHeader,
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

  return (
    <ScrollScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">Alex Johnson</Text>
        <Text style={text.body}>alex@example.com</Text>
      </View>

      <MembershipBanner
        planName={plan?.id === 'free' ? 'MileRecover Free' : `MileRecover ${plan?.name ?? 'Free'}`}
        detail={plan?.id === 'free' ? 'Upgrade when MileRecover has helped you' : 'Member · protection active'}
      />
      <SecondaryButton
        label="View plans"
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        accessibilityLabel="View subscription plans"
      />

      <ListSection title="Driving setup">
        <ListRow label="Vehicles" value={String(product.vehicles.length)} onPress={() => navigation.navigate('VehicleSetup')} />
        <ListRow label="Work locations" onPress={() => navigation.navigate('WorkLocationSetup')} />
        <ListRow label="Work schedule" value="Optional" />
      </ListSection>

      <ListSection title="Bring your mileage">
        <ListRow label="Import existing history" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export defaults" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <ListSection title="Protection and notifications">
        <ListRow label="Tracking protection" onPress={() => navigation.navigate('ProtectionAlert')} />
        <ListRow label="Notifications" value="On" />
        <ListRow label="Battery guidance" value="Tips saved" />
      </ListSection>

      <ListSection title="Trust and privacy">
        <ListRow label="Data and privacy" />
        <ListRow label="Help center" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About MileRecover" />
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
