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
  PrimaryButton,
  ScrollScreen,
  SectionHeader,
  SecondaryButton,
  StatusCard,
  SummaryCard,
  text,
} from '../../design-system';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Proof'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProofScreen() {
  const navigation = useNavigation<Nav>();
  const { state, permissions } = useApp();
  const { product } = useProduct();
  const { scenario } = selectProductExperience(state, product, permissions);

  if (!scenario.proofReady) {
    return (
      <ScrollScreen>
        <SectionHeader title="Proof" />
        <StatusCard
          variant="warning"
          title="Items need review"
          body={scenario.proofBlockReason ?? 'Resolve uncertain trips before final proof.'}
          actionLabel="Resolve items"
          onAction={() => navigation.navigate('Review')}
        />
        <SecondaryButton label="Preview current records" onPress={() => navigation.navigate('ReportPreview', { format: 'log' })} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <SectionHeader title="Proof" />
      <View style={{ backgroundColor: '#13402C', borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md }}>
        <Text style={[text.title, { color: '#fff' }]}>Ready for proof</Text>
        <Text style={[text.body, { color: '#E8F3ED', marginTop: spacing.xs }]}>
          {state.reportingPeriod.label}
        </Text>
        <SummaryCard
          items={[
            { label: 'Verified trips', value: String(scenario.trips.length) },
            { label: 'Total miles', value: scenario.periodMiles.toFixed(1) },
            { label: 'Unresolved', value: '0' },
          ]}
        />
        <PrimaryButton label="Preview report" onPress={() => navigation.navigate('ReportPreview', { format: 'reimbursement' })} />
      </View>

      <ListSection title="Included in this period">
        <ListRow label="Automatically recorded" value={`${scenario.trips.length} trips`} />
        <ListRow label="User-confirmed recovery" value={`${scenario.weekSummary.recoveredMiles.toFixed(1)} mi`} />
        <ListRow label="Imported trips" value={scenario.id === 'imported_history' ? '214' : '—'} />
        <ListRow label="Manual entries" value={String(product.manualTrips.length)} />
      </ListSection>

      <ListSection title="Export">
        <ListRow label="Export as CSV" onPress={() => navigation.navigate('ExportReport')} />
        <ListRow label="Export as PDF" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
      </ListSection>
    </ScrollScreen>
  );
}
