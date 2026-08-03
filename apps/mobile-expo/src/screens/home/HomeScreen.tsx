import React, { useEffect, useRef } from 'react';
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
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  StatusCard,
  SummaryCard,
  TabScreen,
  TimelineRow,
  text,
} from '../../design-system';
import type { ActivityEventKind } from '../../fixtures/scenarios';
import { greetingForName } from '../../product/copy';
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
  const { state, permissions, automaticCaptureAvailable, refreshRecoverySuggestions } = useApp();
  const { product, consumePendingPostOnboardingRoute } = useProduct();
  const recoveryRefreshed = useRef(false);
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, secondaryAction, liveMode } = experience;
  const greeting = greetingForName(product.preferredName);

  useEffect(() => {
    const route = consumePendingPostOnboardingRoute();
    if (!route || route === 'Proof') {
      if (route === 'Proof') navigation.navigate('Proof');
      return;
    }
    if (route === 'ProtectionAlert') navigation.navigate('ProtectionAlert');
    else if (route === 'ManualTrip') navigation.navigate('ManualTrip');
    else if (route === 'BringExistingMileage') navigation.navigate('BringExistingMileage');
    else if (route === 'MissingTripRecovery') navigation.navigate('Review');
    // Intentionally once on mount / when pending is set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.pendingPostOnboardingRoute]);

  useEffect(() => {
    if (recoveryRefreshed.current || experience.confirmedTrips.length === 0) return;
    recoveryRefreshed.current = true;
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  }, [experience.confirmedTrips.length, product.workLocations, refreshRecoverySuggestions]);

  const handlePrimary = () => {
    if (scenario.primaryActionRoute === 'ProtectionAlert') {
      navigation.navigate('ProtectionAlert');
      return;
    }
    if (scenario.primaryActionRoute === 'Review') navigation.navigate('Review');
    else if (scenario.primaryActionRoute === 'Profile') navigation.navigate('Profile');
    else if (scenario.primaryActionRoute === 'Proof') navigation.navigate('Proof');
    else if (scenario.primaryActionRoute === 'ManualTrip') navigation.navigate('ManualTrip');
  };

  const handleSecondary = () => {
    if (!secondaryAction) return;
    if (secondaryAction.route === 'Review') navigation.navigate('Review');
    else navigation.navigate(secondaryAction.route);
  };

  const showWeekSummary =
    !liveMode ||
    scenario.weekSummary.milesProtected > 0 ||
    scenario.weekSummary.recoveredMiles > 0 ||
    scenario.weekSummary.milesReadyForProof > 0;

  return (
    <TabScreen>
      {greeting ? (
        <Text style={[text.body, { marginBottom: spacing.sm }]} accessibilityRole="text">
          {greeting}
        </Text>
      ) : null}

      {scenario.homeState === 'offline' ? (
        <OfflineBanner body="Your miles are safe on this device. Sync resumes when you are back online." />
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
        <Text style={[text.caption, { marginBottom: spacing.sm }]}>PROTECTION</Text>
        <EvidenceRow
          label="Setup"
          value={
            product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated'
              ? 'Not finished'
              : product.protectionSetupState === 'limited'
                ? 'Needs attention'
                : 'Configured'
          }
        />
        <EvidenceRow
          label="Background access"
          value={
            permissions.backgroundLocation === 'granted'
              ? 'On'
              : permissions.location === 'granted'
                ? 'Limited'
                : 'Off'
          }
        />
        <EvidenceRow label="Automatic capture" value={automaticCaptureAvailable ? 'Available' : 'Not available in this RC'} />
      </SoftPanel>

      {showWeekSummary ? (
        <>
          <Text style={[text.subtitle, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>
            This week
          </Text>
          <SummaryCard
            items={[
              { label: 'Miles kept', value: scenario.weekSummary.milesProtected.toFixed(1) },
              { label: 'Miles found', value: scenario.weekSummary.recoveredMiles.toFixed(1) },
              { label: 'Ready to share', value: scenario.weekSummary.milesReadyForProof.toFixed(1) },
            ]}
          />
        </>
      ) : null}

      <Text style={[text.subtitle, { marginBottom: spacing.sm, marginTop: spacing.sm }]}>Recent</Text>
      {scenario.activity.length === 0 ? (
        <StatusCard
          variant="neutral"
          title="Nothing recorded yet"
          body="When a real drive is saved - or you add one - it shows up here. We never invent miles."
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

      {secondaryAction ? (
        <View style={{ marginTop: spacing.md }}>
          {scenario.primaryAction ? (
            <SecondaryButton label={secondaryAction.label} onPress={handleSecondary} />
          ) : (
            <PrimaryButton label={secondaryAction.label} onPress={handleSecondary} />
          )}
        </View>
      ) : null}

      {liveMode && scenario.activity.length === 0 && !scenario.primaryAction && !secondaryAction ? (
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton
            label="Add a drive"
            onPress={() => navigation.navigate('ManualTrip')}
            accessibilityLabel="Add a drive from home"
          />
        </View>
      ) : null}
    </TabScreen>
  );
}
