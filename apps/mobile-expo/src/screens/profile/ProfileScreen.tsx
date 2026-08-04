import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import { capabilitiesForEntitlement, resolveProtectionStatus } from '@milerecover/domain';
import {
  ListRow,
  ListSection,
  MembershipBanner,
  PrimaryButton,
  SecondaryButton,
  SoftPanel,
  TabScreen,
  text,
} from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { voiceForDrivingType } from '../../product/copy';
import { useProduct } from '../../product/ProductContext';
import { DRIVING_PATTERN_OPTIONS, PAIN_POINT_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function painSummary(ids: string[]): string {
  if (!ids.length) return 'Not set';
  const labels = ids
    .map((id) => PAIN_POINT_OPTIONS.find((option) => option.id === id)?.label)
    .filter(Boolean) as string[];
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}; ${labels[1]}`;
  return `${labels[0]} · +${labels.length - 1} more`;
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const {
    resetLocalData,
    restartOnboarding,
    permissions,
    automaticCaptureAvailable,
    state,
  } = useApp();
  const {
    product,
    setDemoScenario,
    setDemoModeEnabled,
    resetProductData,
    resetOnboarding,
  } = useProduct();
  const displayName = product.preferredName?.trim() || 'Your profile';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label;
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label;
  const voice = voiceForDrivingType(product.drivingType);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const setupIncomplete =
    product.protectionSetupState === 'not_started' || product.protectionSetupState === 'educated';
  const protection = resolveProtectionStatus({
    permissions,
    trackingEnabled: product.trackingEnabled,
    canUseAutomaticCapture: capabilities.canUseAutomaticCapture && automaticCaptureAvailable,
    trackingEngineState: state.trackingEngineState,
    lastConfirmedCaptureAt: state.lastConfirmedCaptureAt,
    lastSyncAt: state.lastSyncAt,
    pendingReviewCount: state.reviewItems.length,
    setupIncomplete,
  });
  const rateUnit = product.localeProfile.distanceUnit === 'km' ? '¢/mi stored' : '¢/mi';

  return (
    <TabScreen>
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={text.title} accessibilityRole="header">
          {displayName}
        </Text>
        <Text style={text.body}>
          {product.preferredName ? 'Saved on this device' : 'Add a preferred name anytime.'}
        </Text>
      </View>

      <MembershipBanner
        planName={
          product.entitlement.planId === 'free'
            ? 'You’re on Free'
            : `MileRecover ${product.entitlement.planId.toUpperCase()}`
        }
        detail={
          product.entitlement.status === 'trialActive'
            ? 'Plus trial is active.'
            : product.entitlement.planId === 'free'
              ? 'Upgrade anytime when automatic protection or PDF reports would help.'
              : 'Purchases confirm in the App Store or Google Play.'
        }
      />

      <ListSection title="Account">
        <ListRow
          label="Preferred name"
          value={product.preferredName?.trim() || 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Primary goal"
          value={primaryGoal ?? 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="What gets in the way"
          value={painSummary(product.selectedPainPoints)}
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      <ListSection title="Driving setup">
        <ListRow
          label="Driving pattern"
          value={drivingType ?? 'Not set'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow label="Report style" value={voice.reportNoun} showChevron={false} />
        <ListRow
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <ListSection title="Country and units">
        <ListRow
          label="Country"
          value={product.localeProfile.countryDisplayName}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Units"
          value={product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Currency"
          value={product.localeProfile.currencyCode}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Mileage rate"
          value={
            product.reimbursementCentsPerMile != null
              ? `${product.reimbursementCentsPerMile}${rateUnit}`
              : 'Not set'
          }
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      <ListSection title="Vehicle">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add anytime'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
      </ListSection>

      <ListSection title="Protection">
        <SoftPanel>
          <Text style={text.subtitle}>{protection.title}</Text>
          <Text style={[text.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            {protection.detail}
          </Text>
          <PrimaryButton
            label={
              protection.status === 'protected'
                ? 'Open Protection Center'
                : protection.primaryIssue?.actionLabel ?? 'Open Protection Center'
            }
            onPress={() => {
              if (protection.primaryIssue?.action === 'see_plans') {
                navigation.navigate('PlanSelection', { source: 'upgrade' });
              } else {
                navigation.navigate('ProtectionAlert');
              }
            }}
            accessibilityLabel="Open Protection Center"
          />
        </SoftPanel>
        <ListRow
          label="Tracking mode"
          value={product.trackingEnabled ? 'Automatic protection' : 'Manual trip'}
          onPress={() => navigation.navigate('TrackingActive')}
        />
      </ListSection>

      <ListSection title="Imports">
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export report" onPress={() => navigation.navigate('ExportReport')} />
      </ListSection>

      <ListSection title="Plan">
        <ListRow
          label="Subscription"
          value={product.entitlement.planId === 'free' ? 'Free' : product.entitlement.planId}
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow
          label="Restore purchases"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <SecondaryButton
          label="Manage plan"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
      </ListSection>

      <ListSection title="Help and privacy">
        <ListRow
          label="Data and privacy"
          value="Local first"
          onPress={() => navigation.navigate('Privacy')}
        />
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
      </ListSection>

      <ListSection title="About">
        <ListRow label="About MileRecover" onPress={() => navigation.navigate('About')} />
      </ListSection>

      {product.showDevTools ? (
        <ListSection title="Internal preview tools">
          <ListRow
            label="Restart onboarding only"
            onPress={() => {
              resetOnboarding();
              restartOnboarding();
            }}
          />
          <ListRow
            label="Demo mode"
            value={product.demoModeEnabled ? 'On' : 'Off'}
            onPress={() => setDemoModeEnabled(!product.demoModeEnabled)}
          />
          {product.demoModeEnabled
            ? DEMO_SCENARIO_LIST.map((scenario) => (
                <ListRow
                  key={scenario.id}
                  label={scenario.label}
                  value={product.demoScenario === scenario.id ? 'Active' : undefined}
                  onPress={() => setDemoScenario(scenario.id)}
                />
              ))
            : null}
          <ListRow
            label="Simulate first launch"
            value="Clears setup + local data"
            onPress={() => {
              resetProductData();
              resetLocalData();
              restartOnboarding();
            }}
          />
        </ListSection>
      ) : null}
    </TabScreen>
  );
}
