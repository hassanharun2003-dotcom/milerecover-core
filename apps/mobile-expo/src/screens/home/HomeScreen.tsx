import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EvidenceRow,
  ProtectionCard,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  SummaryCard,
  TimelineRow,
  PrimaryButton,
  text,
} from '../../design-system';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function homeVariant(scenarioState: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (scenarioState) {
    case 'recovery_available':
      return 'warning';
    case 'protection_limited':
      return 'danger';
    case 'offline':
      return 'info';
    default:
      return 'success';
  }
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { state, permissions } = useApp();
  const { product } = useProduct();
  const experience = selectProductExperience(state, product, permissions);
  const { scenario } = experience;

  const handlePrimary = () => {
    if (scenario.primaryActionRoute === 'Review') navigation.navigate('Review');
    else if (scenario.primaryActionRoute === 'Profile') navigation.navigate('Profile');
    else if (scenario.primaryActionRoute === 'Proof') navigation.navigate('Proof');
    else if (scenario.homeState === 'protection_limited') navigation.navigate('ProtectionAlert');
  };

  return (
    <ScrollScreen>
      <SectionHeader title="Home" />
      <StatusCard
        variant={homeVariant(scenario.homeState)}
        title={scenario.homeTitle}
        body={scenario.homeDetail}
        actionLabel={scenario.primaryAction ?? undefined}
        onAction={scenario.primaryAction ? handlePrimary : undefined}
      />

      <ProtectionCard>
        <EvidenceRow label="Background access" value={scenario.homeState === 'protection_limited' ? 'Restricted' : 'On'} />
        <EvidenceRow label="Last protection check" value={scenario.homeState === 'offline' ? 'Pending sync' : 'Just now'} />
        <EvidenceRow label="Last drive status" value={scenario.tripsToday > 0 ? 'Recorded today' : 'Quiet so far'} />
      </ProtectionCard>

      <SectionHeader title="This week" />
      <SummaryCard
        items={[
          { label: 'Miles protected', value: scenario.weekSummary.milesProtected.toFixed(1) },
          { label: 'Recovered', value: scenario.weekSummary.recoveredMiles.toFixed(1) },
          { label: 'Ready for proof', value: scenario.weekSummary.milesReadyForProof.toFixed(1) },
        ]}
      />

      <SectionHeader title="Recent activity" />
      {scenario.activity.length === 0 ? (
        <StatusCard
          variant="info"
          title="Quiet day"
          body="Drive normally—we will surface trips in Review when something needs you."
        />
      ) : (
        scenario.activity.map((event) => (
          <TimelineRow
            key={event.id}
            title={event.title}
            subtitle={event.subtitle}
            timeLabel="Recently"
          />
        ))
      )}

      <SectionHeader title="Ready for proof" />
      <View style={{ marginBottom: spacing.md }}>
        {scenario.proofReady ? (
          <StatusCard variant="success" title="Records look ready" body="Preview your report when you need it." actionLabel="View proof" onAction={() => navigation.navigate('Proof')} />
        ) : (
          <StatusCard variant="info" title="Not quite ready" body={scenario.proofBlockReason ?? 'Confirm trips to prepare proof.'} />
        )}
      </View>

      {scenario.tripsToday === 0 && scenario.activity.length === 0 ? (
        <PrimaryButton label="Add manual trip" onPress={() => navigation.navigate('ManualTrip')} accessibilityLabel="Add manual trip from home" />
      ) : null}
    </ScrollScreen>
  );
}
