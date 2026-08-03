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
  SecondaryButton,
  StatusCard,
  TabScreen,
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
  const { scenario, liveMode, voice } = selectProductExperience(state, product, permissions);
  const [showDetails, setShowDetails] = useState(false);
  const confirmedCount = scenario.trips.length + product.manualTrips.length;
  const hasRecords = confirmedCount > 0 || scenario.periodMiles > 0;

  if (!scenario.proofReady && !hasRecords) {
    return (
      <TabScreen>
        <EmptyState
          title="No confirmed drives yet"
          body={`Confirmed ${voice.workNoun} drives will appear here, ready to review and ${voice.shareVerb}.`}
          actionLabel="Add a drive"
          onAction={() => navigation.navigate('ManualTrip')}
        />
      </TabScreen>
    );
  }

  if (!scenario.proofReady) {
    return (
      <TabScreen>
        <StatusCard
          variant="warning"
          title="Review one item before sharing"
          body={scenario.proofBlockReason ?? 'A quick decision in Review and you’ll be ready.'}
          actionLabel="Review drives"
          onAction={() => navigation.navigate('Review')}
          emphasis="hero"
        />
        <View style={{ marginTop: spacing.sm }}>
          <SecondaryButton
            label="Preview sample layout"
            onPress={() => navigation.navigate('ReportPreview', { format: 'log' })}
          />
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <ProofHeroCard
        periodLabel={state.reportingPeriod.label}
        tripCount={confirmedCount}
        totalMiles={scenario.periodMiles.toFixed(1)}
        unresolved={null}
        title="Your records are ready to review"
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
        />
      </View>

      {showDetails ? (
        <>
          <ListSection title="Included this period">
            <ListRow label="Confirmed work drives" value={`${confirmedCount}`} />
            <ListRow label="Miles found" value={`${scenario.weekSummary.recoveredMiles.toFixed(1)} mi`} />
            <ListRow
              label="Brought from history"
              value={!liveMode && scenario.id === 'imported_history' ? '214 organized' : 'None'}
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
    </TabScreen>
  );
}
