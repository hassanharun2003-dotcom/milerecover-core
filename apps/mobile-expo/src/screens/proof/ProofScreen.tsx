import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  ListRow,
  ListSection,
  ProofHeroCard,
  ScrollScreen,
  SectionHeader,
  SecondaryButton,
  StatusCard,
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
        <View style={{ marginTop: spacing.sm }}>
          <SecondaryButton label="Preview current records" onPress={() => navigation.navigate('ReportPreview', { format: 'log' })} />
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <SectionHeader title="Proof" />
      <ProofHeroCard
        periodLabel={state.reportingPeriod.label}
        tripCount={scenario.trips.length}
        totalMiles={scenario.periodMiles.toFixed(1)}
        unresolved="0"
        onPreview={() => navigation.navigate('ReportPreview', { format: 'reimbursement' })}
      />

      <ListSection title="Included in this period">
        <ListRow label="Verified trips" value={`${scenario.trips.length} recorded`} />
        <ListRow label="Recovered trips" value={`${scenario.weekSummary.recoveredMiles.toFixed(1)} mi`} />
        <ListRow label="Imported trips" value={scenario.id === 'imported_history' ? '214 organized' : '—'} />
        <ListRow label="Manual entries" value={String(product.manualTrips.length)} />
        <ListRow label="Adjustments" value="None pending" />
      </ListSection>

      <ListSection title="Evidence">
        <ListRow label="Route summaries" value="Available" />
        <ListRow label="Work locations" value="Optional" />
        <ListRow label="Photos and notes" value="When added" />
      </ListSection>

      <ListSection title="Export">
        <ListRow label="Export as CSV" onPress={() => navigation.navigate('ExportReport')} />
        <ListRow label="Export as PDF" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
      </ListSection>
    </ScrollScreen>
  );
}
