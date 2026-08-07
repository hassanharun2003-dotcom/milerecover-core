import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatActiveRateLabel } from '@milerecover/domain';
import { layout, spacing, typography } from '@milerecover/config';
import {
  APP_VERSION,
} from '../../constants/buildInfo';
import { ConfirmDialog, MRCard, TabScreen, useAppTheme } from '../../design-system';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { useProduct } from '../../product/ProductContext';
import {
  selectPendingReviewCount,
  selectProtectionView,
} from '../../product/presentation';
import { allowInternalPreviewTools, PRIMARY_GOAL_OPTIONS } from '../../product/types';
import { useApp } from '../../store/AppContext';
import { getAuthPort, type AuthSession } from '../../services/auth';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <MRCard
      onPress={onPress}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        marginBottom: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.smMd,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: palette.background.mist,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={16} color={palette.forest[700]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text.primary, fontWeight: '600', fontSize: typography.size.body }}>
          {label}
        </Text>
        {value ? (
          <Text style={{ color: palette.text.secondary, fontSize: typography.size.caption, marginTop: 1 }}>
            {value}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: palette.text.secondary, fontSize: 20 }}>›</Text>
    </MRCard>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { palette } = useAppTheme();
  return (
    <Text
      style={{
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        color: palette.text.secondary,
        fontWeight: '700',
        fontSize: typography.size.caption,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
      }}
      accessibilityRole="header"
    >
      {label}
    </Text>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { palette } = useAppTheme();
  const { resetLocalData, restartOnboarding, permissions, automaticCaptureAvailable, state } = useApp();
  const { product, resetProductData, resetOnboarding, setPreferredName } = useProduct();
  const [confirmResetVisible, setConfirmResetVisible] = useState(false);
  const [confirmResetOnboardingVisible, setConfirmResetOnboardingVisible] = useState(false);
  const [confirmSignOutVisible, setConfirmSignOutVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    void getAuthPort()
      .getSession()
      .then(setAuthSession)
      .catch(() => setAuthSession(null));
  }, []);
  const displayName =
    product.preferredName?.trim() ||
    authSession?.displayName?.trim() ||
    'Your profile';
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
  const rateLabel = formatActiveRateLabel(product.localeProfile);
  const internalPreviewTools = product.showDevTools && allowInternalPreviewTools();
  const initial = (product.preferredName?.trim()?.[0] || 'M').toUpperCase();
  const workSubtitle =
    primaryGoal === 'Employee reimbursement'
      ? `Employee · ${product.localeProfile.countryDisplayName}`
      : `${primaryGoal} · ${product.localeProfile.countryDisplayName}`;
  const trackingLabel =
    protection.state === 'PROTECTED'
      ? 'All systems normal'
      : protection.state === 'OFF' || protection.state === 'MANUAL_ONLY'
        ? 'Paused'
        : protection.title;

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: layout.section,
        }}
        accessibilityRole="header"
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: palette.forest[900],
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
          accessibilityLabel={`Avatar ${initial}`}
        >
          <Text style={{ color: palette.text.inverse, fontSize: 28, fontWeight: '700' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text.primary,
              fontSize: typography.size.headline,
              fontWeight: '700',
            }}
          >
            {displayName}
          </Text>
          <Text style={{ color: palette.text.secondary, marginTop: spacing.xs, fontSize: typography.size.body }}>
            {workSubtitle}
          </Text>
        </View>
      </View>

      <SectionLabel label="Account" />
      <SettingsRow
        icon="person-outline"
        label="Account"
        value={authSession?.email ?? 'Email & sign-in'}
        onPress={() => (authSession ? setConfirmSignOutVisible(true) : navigation.navigate('EditSetup'))}
      />
      <SettingsRow
        icon="briefcase-outline"
        label="Work information"
        value={primaryGoal}
        onPress={() => navigation.navigate('EditSetup')}
      />
      <SettingsRow
        icon="cash-outline"
        label="Mileage rate"
        value={rateLabel}
        onPress={() => navigation.navigate('EditSetup')}
      />
      <SettingsRow
        icon="car-outline"
        label="Vehicles"
        value={
          product.vehicles.length === 0
            ? 'Add a vehicle'
            : `${product.vehicles.length} vehicle${product.vehicles.length === 1 ? '' : 's'}`
        }
        onPress={() => navigation.navigate('VehicleSetup')}
      />

      <SectionLabel label="Tracking" />
      <SettingsRow
        icon="shield-checkmark-outline"
        label="Tracking health"
        value={trackingLabel}
        onPress={() => {
          if (protection.primaryAction.action === 'see_plans') {
            navigation.navigate('PlanSelection', { source: 'upgrade' });
          } else {
            navigation.navigate('ProtectionAlert');
          }
        }}
      />
      <SettingsRow
        icon="notifications-outline"
        label="Notifications"
        value={product.notificationPreferences.enabled ? 'Manage alerts' : 'Off'}
        onPress={() => navigation.navigate('Notifications')}
      />
      <SettingsRow
        icon="location-outline"
        label="Frequent drives"
        value="Named work places"
        onPress={() => navigation.navigate('WorkLocationSetup')}
      />

      <SectionLabel label="Data" />
      <SettingsRow
        icon="swap-horizontal-outline"
        label="Import mileage"
        value="Bring your trips with you"
        onPress={() => navigation.navigate('BringExistingMileage')}
      />
      <SettingsRow
        icon="share-outline"
        label="Export history"
        value="CSV & reports"
        onPress={() => navigation.navigate('ExportReport')}
      />

      <SectionLabel label="Plan" />
      <SettingsRow
        icon="diamond-outline"
        label="Plan & subscription"
        value={product.selectedPlan === 'free' ? 'Free' : product.selectedPlan}
        onPress={() => navigation.navigate('PlanSelection', { source: 'profile' })}
      />

      <SectionLabel label="Support" />
      <SettingsRow
        icon="help-circle-outline"
        label="Help & support"
        onPress={() => navigation.navigate('HelpSupport')}
      />
      <SettingsRow
        icon="shield-outline"
        label="Privacy"
        onPress={() => navigation.navigate('Privacy')}
      />
      <SettingsRow
        icon="document-text-outline"
        label="Terms"
        onPress={() => navigation.navigate('Terms')}
      />
      <SettingsRow
        icon="information-circle-outline"
        label="About MileRecover"
        value={`Version ${APP_VERSION}`}
        onPress={() => navigation.navigate('About')}
      />

      {internalPreviewTools ? (
        <>
          <SectionLabel label="Preview" />
          <SettingsRow
            icon="refresh-outline"
            label="Reset onboarding"
            value="Keeps trips · restarts setup"
            onPress={() => setConfirmResetOnboardingVisible(true)}
          />
          <SettingsRow
            icon="trash-outline"
            label="Reset App To Brand New User"
            value={resetting ? 'Resetting…' : 'Clears onboarding, guest, cache'}
            onPress={() => setConfirmResetVisible(true)}
          />
        </>
      ) : null}

      <ConfirmDialog
        visible={confirmResetOnboardingVisible}
        title="Reset onboarding?"
        body="Returns you to Welcome and clears setup answers. Saved trips stay on this device."
        confirmLabel="Reset onboarding"
        cancelLabel="Keep setup"
        onConfirm={() => {
          setConfirmResetOnboardingVisible(false);
          resetOnboarding({ keepVehicles: true });
          restartOnboarding();
        }}
        onCancel={() => setConfirmResetOnboardingVisible(false)}
      />
      <ConfirmDialog
        visible={confirmResetVisible}
        title="Reset App To Brand New User?"
        body="Clears onboarding, guest state, navigation restore, preview caches, and local trips on this device. Preview builds only."
        confirmLabel="Reset to brand new"
        cancelLabel="Keep data"
        onConfirm={() => void resetExperience()}
        onCancel={() => setConfirmResetVisible(false)}
      />
      <ConfirmDialog
        visible={confirmSignOutVisible}
        title="Sign out?"
        body="You’ll stay on this device as a guest. Saved miles remain on this phone."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={() => {
          setConfirmSignOutVisible(false);
          void (async () => {
            await getAuthPort().signOut();
            setAuthSession(null);
            if (!product.preferredName) setPreferredName(null);
          })();
        }}
        onCancel={() => setConfirmSignOutVisible(false)}
      />
    </TabScreen>
  );
}
