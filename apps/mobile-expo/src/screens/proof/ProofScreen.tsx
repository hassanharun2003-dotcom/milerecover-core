import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EmptyState,
  ListRow,
  ListSection,
  ProofHeroCard,
  ScrollScreen,
  SecondaryButton,
  StatusCard,
  TertiaryButton,
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
  const [showDetails, setShowDetails] = useState(false);

  if (!scenario.proofReady) {
    return (
      <ScrollScreen>
        <StatusCard
          variant="warning"
          title="A few drives need a look first"
          body={scenario.proofBlockReason ?? 'A quick yes or no in Review and you’ll be ready to submit.'}
          actionLabel="Review drives"
          onAction={() => navigation.navigate('Review')}
          emphasis="hero"
        />
        <View style={{ marginTop: spacing.sm }}>
          <SecondaryButton
            label="Preview what you have"
            onPress={() => navigation.navigate('ReportPreview', { format: 'log' })}
          />
        </View>
      </ScrollScreen>
    );
  }

  if (scenario.trips.length === 0 && product.manualTrips.length === 0) {
    return (
      <ScrollScreen>
        <EmptyState
          title="Nothing to share yet"
          body="Once a few drives are confirmed, your report will be ready here—calm and complete."
          actionLabel="Add a drive"
          onAction={() => navigation.navigate('ManualTrip')}
        />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <ProofHeroCard
        periodLabel={state.reportingPeriod.label}
        tripCount={scenario.trips.length}
        totalMiles={scenario.periodMiles.toFixed(1)}
        unresolved={null}
        onPreview={() => navigation.navigate('ReportPreview', { format: 'reimbursement' })}
      />

      <ListSection title="Export">
        <ListRow label="Share as PDF" onPress={() => navigation.navigate('ReportPreview', { format: 'pdf' })} />
        <ListRow label="Share as CSV" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <View style={{ marginTop: spacing.md }}>
        <TertiaryButton
          label={showDetails ? 'Hide period details' : 'Show period details'}
          onPress={() => setShowDetails((v) => !v)}
          accessibilityLabel={showDetails ? 'Hide period details' : 'Show period details'}
        />
      </View>

      {showDetails ? (
        <>
          <ListSection title="Included this period">
            <ListRow label="Confirmed drives" value={`${scenario.trips.length}`} />
            <ListRow label="Miles found" value={`${scenario.weekSummary.recoveredMiles.toFixed(1)} mi`} />
            <ListRow
              label="Brought from history"
              value={scenario.id === 'imported_history' ? '214 organized' : 'None'}
            />
            <ListRow label="Added by you" value={String(product.manualTrips.length)} />
          </ListSection>

          <ListSection title="What’s behind the report">
            <ListRow label="Route summaries" value="When available" />
            <ListRow label="Work places" value="Optional" />
            <ListRow label="Notes and photos" value="When you add them" />
          </ListSection>
        </>
      ) : null}
    </ScrollScreen>
  );
}
