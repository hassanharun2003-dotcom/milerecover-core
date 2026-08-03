import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  Badge,
  EvidenceRow,
  OfflineBanner,
  ScrollScreen,
  SectionHeader,
  StatusCard,
  SummaryCard,
  TimelineRow,
  PrimaryButton,
  SoftPanel,
  text,
} from '../../design-system';
import type { ActivityEventKind } from '../../fixtures/scenarios';
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

function activityTimeLabel(timestamp: number): string {
  const hoursAgo = Math.round((Date.now() - timestamp) / 3600000);
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const daysAgo = Math.round(hoursAgo / 24);
  return daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
}

function activityBadge(kind: ActivityEventKind): string | null {
  if (kind === 'gap_found') return 'Needs a look';
  if (kind === 'history_imported') return 'Imported';
  return null;
}

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { state, permissions } = useApp();
  const { product } = useProduct();
  const experience = selectProductExperience(state, product, permissions);
  const { scenario } = experience;
  const needsAction = Boolean(scenario.primaryAction);

  const handlePrimary = () => {
    if (scenario.primaryActionRoute === 'ProtectionAlert') {
      navigation.navigate('ProtectionAlert');
      return;
    }
    if (scenario.primaryActionRoute === 'Review') navigation.navigate('Review');
    else if (scenario.primaryActionRoute === 'Profile') navigation.navigate('Profile');
    else if (scenario.primaryActionRoute === 'Proof') navigation.navigate('Proof');
  };

  return (
    <ScrollScreen>
      {scenario.homeState === 'offline' ? (
        <OfflineBanner body="Your miles are safe on this device. Sync resumes when you’re back online." />
      ) : null}

      <StatusCard
        variant={homeVariant(scenario.homeState)}
        title={scenario.homeTitle}
        body={scenario.homeDetail}
        actionLabel={scenario.primaryAction ?? undefined}
        onAction={scenario.primaryAction ? handlePrimary : undefined}
        emphasis="hero"
      />

      <SoftPanel>
        <Text style={[text.caption, { marginBottom: spacing.sm }]}>PROTECTION AT A GLANCE</Text>
        <EvidenceRow
          label="Background access"
          value={scenario.homeState === 'protection_limited' ? 'Limited' : 'On'}
        />
        <EvidenceRow
          label="Last check"
          value={scenario.homeState === 'offline' ? 'Waiting to sync' : 'Just now'}
        />
        <EvidenceRow
          label="Today"
          value={scenario.tripsToday > 0 ? 'Drive saved' : 'Quiet so far'}
        />
      </SoftPanel>

      <SectionHeader title="This week" />
      <SummaryCard
        items={[
          { label: 'Miles kept', value: scenario.weekSummary.milesProtected.toFixed(1) },
          { label: 'Miles found', value: scenario.weekSummary.recoveredMiles.toFixed(1) },
          { label: 'Ready to share', value: scenario.weekSummary.milesReadyForProof.toFixed(1) },
        ]}
      />

      <SectionHeader title="Recent" />
      {scenario.activity.length === 0 ? (
        <StatusCard
          variant="neutral"
          title="Quiet for now"
          body="Drive as usual. We’ll surface anything that needs you in Review—never invent miles."
          emphasis="subtle"
        />
      ) : (
        scenario.activity.map((event) => (
          <View key={event.id} style={{ marginBottom: spacing.sm }}>
            <TimelineRow
              title={event.title}
              subtitle={event.subtitle}
              timeLabel={activityTimeLabel(event.timestamp)}
            />
            {activityBadge(event.kind) ? (
              <View style={{ marginLeft: spacing.lg, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
                <Badge
                  label={activityBadge(event.kind)!}
                  variant={event.kind === 'gap_found' ? 'warning' : 'info'}
                />
              </View>
            ) : null}
          </View>
        ))
      )}

      <SectionHeader title="If work asks today" />
      <View style={{ marginBottom: spacing.md }}>
        {scenario.proofReady ? (
          <StatusCard
            variant="info"
            title="Your report is ready whenever you need it"
            body="Preview what you’d share—no scramble."
            actionLabel="Open report"
            onAction={() => navigation.navigate('Proof')}
            emphasis="subtle"
          />
        ) : (
          <StatusCard
            variant="neutral"
            title={needsAction && scenario.reviewItems.length > 0 ? 'Almost ready to share' : 'Not ready to share yet'}
            body={scenario.proofBlockReason ?? 'Confirm a few drives and you’ll be set.'}
            actionLabel={scenario.reviewItems.length > 0 ? 'Review drives' : undefined}
            onAction={scenario.reviewItems.length > 0 ? () => navigation.navigate('Review') : undefined}
            emphasis="subtle"
          />
        )}
      </View>

      {scenario.tripsToday === 0 && scenario.activity.length === 0 ? (
        <PrimaryButton
          label="Add a drive"
          onPress={() => navigation.navigate('ManualTrip')}
          accessibilityLabel="Add a drive from home"
        />
      ) : null}
    </ScrollScreen>
  );
}
