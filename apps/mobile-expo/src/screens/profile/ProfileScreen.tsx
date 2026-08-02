import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '@milerecover/config';
import {
  ListRow,
  ListSection,
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  text,
} from '../../design-system';
import { PLAN_FIXTURES } from '../../fixtures/subscription';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { resetLocalData } = useApp();
  const { product, setDemoScenario, setSelectedPlan, resetProductData, resetOnboarding } = useProduct();
  const plan = PLAN_FIXTURES.find((p) => p.id === product.selectedPlan);

  return (
    <ScrollScreen>
      <SectionHeader title="Profile" />
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title}>MileRecover member</Text>
        <Text style={text.body}>member@milerecover.app</Text>
      </View>

      <StatusCard
        variant="success"
        title={plan?.name ?? 'Free'}
        body={plan?.tagline ?? 'Your current plan'}
        actionLabel="View plans"
        onAction={() => navigation.navigate('PlanSelection', { source: 'profile' })}
      />

      <ListSection title="Driving setup">
        <ListRow label="Vehicles" value={String(product.vehicles.length)} onPress={() => navigation.navigate('VehicleSetup')} />
        <ListRow label="Work locations" onPress={() => navigation.navigate('WorkLocationSetup')} />
        <ListRow label="Work patterns" value="Optional" />
      </ListSection>

      <ListSection title="Data">
        <ListRow label="Bring existing mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export defaults" onPress={() => navigation.navigate('ExportReport')} />
        <ListRow label="Backup status" value="Placeholder" />
      </ListSection>

      <ListSection title="Protection">
        <ListRow label="Tracking protection" onPress={() => navigation.navigate('ProtectionAlert')} />
        <ListRow label="Notifications" value="On" />
        <ListRow label="Battery guidance" />
      </ListSection>

      <ListSection title="Trust">
        <ListRow label="Privacy and security" />
        <ListRow label="Data controls" />
        <ListRow label="Help center" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="Contact support" onPress={() => navigation.navigate('HelpSupport')} />
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
