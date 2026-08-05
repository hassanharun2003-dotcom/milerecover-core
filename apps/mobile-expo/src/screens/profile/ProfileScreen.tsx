import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatActiveRateLabel } from '@milerecover/domain';
import { ConfirmDialog, ListRow, ListSection, TabScreen } from '../../design-system';
import { DEMO_SCENARIO_LIST } from '../../fixtures/scenarios';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import {
  selectAllowance,
  selectEntitlementPlanLabel,
  selectPendingReviewCount,
  selectProtectionView,
} from '../../product/presentation';
import { allowInternalPreviewTools, DRIVING_PATTERN_OPTIONS, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable, state } = useApp();
  const { product, setDemoScenario, setDemoModeEnabled, resetProductData } = useProduct();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const displayName = product.preferredName?.trim() || 'Not set';
  const drivingType = DRIVING_PATTERN_OPTIONS.find((option) => option.id === product.drivingType)?.label ?? 'Not set';
  const primaryGoal = PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';
  const pendingReviewCount = selectPendingReviewCount(
    state,
    product,
    permissions,
    automaticCaptureAvailable,
  );
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
  });
  const allowance = selectAllowance(state, product);
  const rateLabel = formatActiveRateLabel(product.localeProfile);
  const planLabel = selectEntitlementPlanLabel(product.entitlement);
  const internalPreviewTools = product.showDevTools && allowInternalPreviewTools();
  const resetExperience = async () => {
    if (resetting) return;
    setResetting(true);
    setConfirmResetVisible(false);
    try {
      await resetProductData();
      await resetLocalData();
      restartOnboarding();
    } finally {
      setResetting(false);
    }
  };

  return (
    <TabScreen>
      <ListSection title="Profile">
        <ListRow label="Name" value={displayName} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Goal" value={primaryGoal} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow label="Driving pattern" value={drivingType} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow
          label="Familiar places"
          value={product.workLocations.length > 0 ? String(product.workLocations.length) : 'Add anytime'}
          onPress={() => navigation.navigate('WorkLocationSetup')}
        />
      </ListSection>

      <ListSection title="Vehicle & mileage">
        <ListRow
          label="Vehicles"
          value={product.vehicles.length > 0 ? String(product.vehicles.length) : 'Add a vehicle'}
          onPress={() => navigation.navigate('VehicleSetup')}
        />
        <ListRow label="Mileage rate" value={rateLabel} onPress={() => navigation.navigate('EditSetup')} />
        <ListRow
          label="Country"
          value={product.localeProfile.countryDisplayName}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Distance"
          value={product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
          onPress={() => navigation.navigate('EditSetup')}
        />
        <ListRow
          label="Currency"
          value={product.localeProfile.currencyCode}
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      <ListSection title="Tracking & recovery">
        <ListRow label="Status" value={protection.title} showChevron={false} />
        <ListRow
          label="Protection center"
          onPress={() => {
            if (protection.primaryAction.action === 'see_plans') {
              navigation.navigate('PlanSelection', { source: 'upgrade' });
            } else {
              navigation.navigate('ProtectionAlert');
            }
          }}
        />
        <ListRow
          label="Tracking mode"
          value={product.trackingEnabled ? 'Automatic protection' : 'Manual'}
          onPress={() => navigation.navigate('TrackingActive')}
        />
        <ListRow
          label="Auto trips this month"
          value={
            allowance.limit == null
              ? `${allowance.used} · Unlimited`
              : `${allowance.used} of ${allowance.limit}`
          }
          onPress={() => navigation.navigate('TrackingActive')}
        />
        <ListRow label="Import mileage" onPress={() => navigation.navigate('BringExistingMileage')} />
      </ListSection>

      <ListSection title="Plan">
        <ListRow
          label="Plan"
          value={planLabel}
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
        <ListRow
          label="Restore purchases"
          onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
        />
      </ListSection>

      <ListSection title="Support & privacy">
        <ListRow label="Privacy" onPress={() => navigation.navigate('Privacy')} />
        <ListRow label="Help" onPress={() => navigation.navigate('HelpSupport')} />
        <ListRow label="About" onPress={() => navigation.navigate('About')} />
        <ListRow
          label="Review setup"
          value="Trips stay saved"
          onPress={() => navigation.navigate('EditSetup')}
        />
      </ListSection>

      {internalPreviewTools ? (
        <ListSection title="Internal preview tools">
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
            label="Reset app for testing"
            value="Clears setup + local data"
            onPress={() => setConfirmResetVisible(true)}
            busy={resetting}
          />
        </ListSection>
      ) : null}
      <ConfirmDialog
        visible={confirmResetVisible}
        title="Reset app for testing?"
        body="This clears setup, trips, imports, and local testing data on this device. Use only for preview testing."
        confirmLabel="Reset app"
        cancelLabel="Keep data"
        onConfirm={() => void resetExperience()}
        onCancel={() => setConfirmResetVisible(false)}
      />
    </TabScreen>
  );
}
