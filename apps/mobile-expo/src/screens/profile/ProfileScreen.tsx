import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { capabilitiesForEntitlement, formatActiveRateLabel, resolveProtectionStatus } from '@milerecover/domain';
import {
  ListRow,
  ListSection,
  TabScreen,
} from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import { DRIVING_PATTERN_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

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
  const displayName = product.preferredName?.trim() || 'Not set';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label ?? 'Not set';
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';
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
  const rateLabel = formatActiveRateLabel(product.localeProfile);
  const planLabel =
    product.entitlement.planId === 'free'
      ? 'Free'
      : product.entitlement.status === 'trialActive'
        ? `${product.entitlement.planId.toUpperCase()} trial`
        : product.entitlement.planId.toUpperCase();

  return (
    <TabScreen>
      <ListSection title="Your setup">
        <ListRow label="Name" value={displayName} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Goal" value={primaryGoal} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Driving pattern" value={drivingType} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add anytime'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
      </ListSection>

      <ListSection title="Mileage settings">
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
        <ListRow label="Mileage rate" value={rateLabel} onPress={() => navigation.navigate('EditSetup')} />
      </ListSection>

      <ListSection title="Drive protection">
        <ListRow label="Status" value={protection.title} showChevron={false} />
        <ListRow
          label="Tracking mode"
          value={product.trackingEnabled ? 'Automatic protection' : 'Manual trip'}
          onPress={() => navigation.navigate('TrackingActive')}
        />
        <ListRow
          label="Protection center"
          onPress={() => {
            if (protection.primaryIssue?.action === 'see_plans') {
              navigation.navigate('PlanSelection', { source: 'upgrade' });
            } else {
              navigation.navigate('ProtectionAlert');
            }
          }}
        />
      </ListSection>

      <ListSection title="Reports and data">
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
        <ListRow label="Export report" onPress={() => navigation.navigate('ExportReport')} />
        <ListRow label="Privacy" onPress={() => navigation.navigate('Privacy')} />
      </ListSection>

      <ListSection title="Plan and support">
        <ListRow
          label="Subscription"
          value={planLabel}
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow
          label="Restore purchases"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About" onPress={() => navigation.navigate('About')} />
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
