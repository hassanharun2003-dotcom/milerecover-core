import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { layout, spacing, typography } from '@milerecover/config';
import {
  capabilitiesForEntitlement,
  milesToDisplay,
  rateForTimestamp,
  type ProtectionStatusView,
} from '@milerecover/domain';
import {
  MRCard,
  MRHeader,
  MRHeroCard,
  MRMetricTile,
  MRPrimaryButton,
  MRTertiaryButton,
  SkeletonBlock,
  SoftPanel,
  TabScreen,
  text,
  useAppTheme,
} from '../../design-system';
import { daypartGreeting, greetingForName } from '../../product/copy';
import { selectHomePeriodSummary, selectPendingReviewCount, selectProtectionView } from '../../product/presentation';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { TrialOfferCard } from '../../components/TrialOfferCard';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type CompactStatus =
  | 'protected'
  | 'configured_waiting'
  | 'checking'
  | 'needs_permission'
  | 'battery_limited'
  | 'stale'
  | 'error'
  | 'off'
  | 'manual_mode';

function compactProtection(input: ProtectionStatusView): {
  kind: CompactStatus;
  sentence: string;
  actionLabel: string;
  action: 'protection' | 'plans' | 'none';
} {
  switch (input.state) {
    case 'PROTECTED':
      return {
        kind: 'protected',
        sentence: input.lastCheckLabel ?? 'Protection is on.',
        actionLabel: 'View tracking health',
        action: 'protection',
      };
    case 'CONFIGURED_WAITING':
      return {
        kind: 'configured_waiting',
        sentence: 'Waiting for your first drive.',
        actionLabel: 'View tracking health',
        action: 'protection',
      };
    case 'CHECKING':
      return {
        kind: 'checking',
        sentence: 'Checking protection status…',
        actionLabel: input.primaryAction.label,
        action: 'protection',
      };
    case 'BATTERY_LIMITED':
      return {
        kind: 'battery_limited',
        sentence: 'Battery settings may block some drives.',
        actionLabel: 'Fix tracking',
        action: 'protection',
      };
    case 'OFF':
      return {
        kind: 'off',
        sentence: 'Drive protection is paused.',
        actionLabel: 'Fix tracking',
        action: 'protection',
      };
    case 'MANUAL_ONLY':
      return {
        kind: 'manual_mode',
        sentence: 'Manual logging is ready.',
        actionLabel: input.primaryAction.label,
        action: input.primaryAction.action === 'see_plans' ? 'plans' : 'none',
      };
    case 'STALE':
      return {
        kind: 'stale',
        sentence: 'Protection needs a fresh check.',
        actionLabel: 'Fix tracking',
        action: 'protection',
      };
    case 'ERROR':
      return {
        kind: 'error',
        sentence: input.message,
        actionLabel: input.primaryAction.action === 'none' ? '' : 'Fix tracking',
        action: input.primaryAction.action === 'none' ? 'none' : 'protection',
      };
    case 'NEEDS_PERMISSION':
    default:
      return {
        kind: 'needs_permission',
        sentence: input.message,
        actionLabel: 'Fix tracking',
        action: 'protection',
      };
  }
}

function HomeSkeleton() {
  return (
    <TabScreen>
      <SkeletonBlock width="58%" height={24} style={{ marginBottom: spacing.md }} />
      <SoftPanel>
        <SkeletonBlock width="36%" height={20} style={{ marginBottom: spacing.sm }} />
        <SkeletonBlock width="92%" height={16} />
      </SoftPanel>
      <SkeletonBlock width="100%" height={48} style={{ marginTop: spacing.sm }} />
    </TabScreen>
  );
}

type NextBestAction =
  | {
      label: string;
      run: () => void;
      secondaryLabel?: string;
      secondaryRun?: () => void;
    }
  | {
      label: string;
      run: null;
      secondaryLabel?: string;
      secondaryRun?: () => void;
    };

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const { palette } = useAppTheme();
  const { state, permissions, automaticCaptureAvailable, refreshRecoverySuggestions } = useApp();
  const {
    product,
    hydrated: productHydrated,
    consumePendingPostOnboardingRoute,
    markFirstConfirmedWorkDrive,
    markFirstRecoveredDrive,
    markFirstMissingTripSeen,
    markFirstReportPreview,
  } = useProduct();
  const recoveryRefreshed = useRef(false);
  const homeReady = state.hydrated && productHydrated;
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const { scenario, liveMode } = experience;
  const greeting = greetingForName(product.preferredName) ?? daypartGreeting();
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const pendingReviewCount = selectPendingReviewCount(state, product, permissions, automaticCaptureAvailable);
  const protection = selectProtectionView({
    app: state,
    product,
    permissions,
    automaticCaptureAvailable,
    pendingReviewCount,
    offline: scenario.homeState === 'offline',
  });
  const compact = compactProtection(protection);
  const protectionNeedsAction =
    compact.action !== 'none' &&
    (compact.kind === 'needs_permission' ||
      compact.kind === 'off' ||
      compact.kind === 'battery_limited' ||
      compact.kind === 'stale' ||
      compact.kind === 'error');
  const openTrackingHealth = () => {
    if (protectionNeedsAction) {
      logEvent(ANALYTICS_EVENTS.protectionDegradedViewed, {});
    }
    if (compact.action === 'plans') navigation.navigate('PlanSelection', { source: 'upgrade' });
    else navigation.navigate('ProtectionAlert');
  };

  const confirmedCount = experience.confirmedTrips.length;
  const recoveredCount = experience.confirmedTrips.filter((trip) => trip.source === 'recovered').length;
  const locale = product.localeProfile;
  const currentRate = rateForTimestamp(locale.rates, Date.now());
  const rateUsable = currentRate != null && !locale.activeRateNeedsReview;
  const yearSummary = selectHomePeriodSummary({
    trips: experience.confirmedTrips,
    locale,
    preferredName: product.preferredName,
    primaryGoal: product.primaryGoal,
    periodKind: 'ytd',
  });
  const monthSummary = selectHomePeriodSummary({
    trips: experience.confirmedTrips,
    locale,
    preferredName: product.preferredName,
    primaryGoal: product.primaryGoal,
    periodKind: 'this_month',
  });

  const nextBest = useMemo<NextBestAction>(() => {
    if (protectionNeedsAction) {
      return {
        label: 'Fix tracking',
        run: () => openTrackingHealth(),
        secondaryLabel: 'Add a drive manually',
        secondaryRun: () => navigation.navigate('ManualTrip'),
      };
    }
    if (pendingReviewCount > 0) {
      return {
        label:
          pendingReviewCount === 1
            ? 'Review 1 drive'
            : `Review ${pendingReviewCount} drives`,
        run: () => navigation.navigate('Review'),
      };
    }
    if (locale.activeRateNeedsReview || !rateUsable) {
      return {
        label: 'Complete report details',
        run: () => navigation.navigate('EditSetup'),
      };
    }
    if (product.importPhase !== 'idle' && product.importPhase !== 'success') {
      return {
        label: 'Finish your import',
        run: () => navigation.navigate('BringExistingMileage'),
      };
    }
    if (experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip')) {
      return {
        label: 'Check for missed drives',
        run: () => navigation.navigate('MissingDrivesIntro'),
      };
    }
    if (scenario.proofReady && confirmedCount > 0) {
      return {
        label: 'Preview your report',
        run: () => navigation.navigate('Proof'),
      };
    }
    if (confirmedCount === 0) {
      return {
        label: 'Add your first drive',
        run: () => navigation.navigate('ManualTrip'),
        secondaryLabel: 'Check for missed drives',
        secondaryRun: () => navigation.navigate('MissingDrivesIntro'),
      };
    }
    return {
      label: 'You’re all caught up',
      run: null,
      secondaryLabel: 'Check for missed drives',
      secondaryRun: () => navigation.navigate('MissingDrivesIntro'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    compact.action,
    confirmedCount,
    experience.activeReviewItems,
    locale.activeRateNeedsReview,
    navigation,
    pendingReviewCount,
    product.importPhase,
    protectionNeedsAction,
    rateUsable,
    scenario.proofReady,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    const route = consumePendingPostOnboardingRoute();
    if (!route || route === 'Proof') {
      if (route === 'Proof') navigation.navigate('Proof');
      return;
    }
    if (route === 'ProtectionAlert') navigation.navigate('ProtectionAlert');
    else if (route === 'ManualTrip') navigation.navigate('ManualTrip');
    else if (route === 'BringExistingMileage') navigation.navigate('BringExistingMileage');
    else if (route === 'MissingTripRecovery') navigation.navigate('Review');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeReady, product.pendingPostOnboardingRoute]);

  useEffect(() => {
    if (!homeReady) return;
    if (!capabilities.canUseGapDetection) return;
    if (recoveryRefreshed.current || experience.confirmedTrips.length === 0) return;
    recoveryRefreshed.current = true;
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  }, [
    capabilities.canUseGapDetection,
    experience.confirmedTrips.length,
    homeReady,
    product.workLocations,
    refreshRecoverySuggestions,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && confirmedCount > 0 && product.firstConfirmedWorkDriveAt == null) {
      markFirstConfirmedWorkDrive();
    }
  }, [confirmedCount, homeReady, liveMode, markFirstConfirmedWorkDrive, product.firstConfirmedWorkDriveAt]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && recoveredCount > 0 && product.firstRecoveredDriveAt == null) {
      markFirstRecoveredDrive();
    }
  }, [homeReady, liveMode, markFirstRecoveredDrive, product.firstRecoveredDriveAt, recoveredCount]);

  useEffect(() => {
    if (!homeReady) return;
    if (
      liveMode &&
      experience.activeReviewItems.some((item) => item.kind === 'possible_missing_trip') &&
      product.firstMissingTripSeenAt == null
    ) {
      markFirstMissingTripSeen();
    }
  }, [
    experience.activeReviewItems,
    homeReady,
    liveMode,
    markFirstMissingTripSeen,
    product.firstMissingTripSeenAt,
  ]);

  useEffect(() => {
    if (!homeReady) return;
    if (liveMode && scenario.proofReady && product.firstReportPreviewAt == null && confirmedCount > 0) {
      markFirstReportPreview();
    }
  }, [
    confirmedCount,
    homeReady,
    liveMode,
    markFirstReportPreview,
    product.firstReportPreviewAt,
    scenario.proofReady,
  ]);

  if (!homeReady) return <HomeSkeleton />;

  const healthy =
    compact.kind === 'protected' || compact.kind === 'configured_waiting';
  const showHeroMoney =
    confirmedCount > 0 &&
    compact.kind === 'protected' &&
    yearSummary.estimatedValueCents != null &&
    yearSummary.estimatedValueCents > 0 &&
    yearSummary.estimatedValueLabel !== 'Review rate';

  let heroTitle = 'Protection needs attention';
  let heroSupporting = compact.sentence;
  if (compact.kind === 'manual_mode') {
    heroTitle = 'Manual mode';
    heroSupporting = 'Add drives yourself — automatic tracking is off.';
  } else if (compact.kind === 'configured_waiting' || (healthy && confirmedCount === 0)) {
    heroTitle = 'Protection is on';
    heroSupporting = 'Waiting for your first drive.';
  } else if (compact.kind === 'protected') {
    heroTitle = 'Protection is on';
    heroSupporting = compact.sentence;
  } else if (yearSummary.estimatedValueLabel === 'Review rate') {
    heroTitle = 'Add or confirm a mileage rate';
    heroSupporting = 'Needed to estimate value.';
  } else if (compact.kind === 'needs_permission') {
    heroTitle = 'Protection needs attention';
    heroSupporting =
      permissions.location === 'granted' && permissions.backgroundLocation !== 'granted'
        ? 'Background location is off.'
        : compact.sentence;
  }

  const workMilesValue = milesToDisplay(monthSummary.workMiles, locale.distanceUnit).toLocaleString(
    locale.localeTag,
    {
      maximumFractionDigits: monthSummary.workMiles >= 100 ? 0 : 1,
      minimumFractionDigits: 0,
    },
  );

  const trackingLinkLabel = protectionNeedsAction
    ? 'Fix tracking'
    : compact.action === 'plans'
      ? compact.actionLabel
      : 'View tracking health';

  return (
    <TabScreen>
      <MRHeader
        title="MileRecover"
        left={
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 20, color: palette.text.primary, fontWeight: '700', letterSpacing: -1 }}>
              ≡
            </Text>
          </Pressable>
        }
        right={
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={palette.text.primary} />
          </Pressable>
        }
      />

      <Text
        style={{
          fontSize: typography.size.title,
          lineHeight: typography.lineHeight.title,
          fontWeight: '700',
          color: palette.text.primary,
          marginBottom: layout.section,
        }}
        accessibilityRole="text"
      >
        {greeting}
      </Text>

      {/* Status hero — not secret navigation. Explicit tracking-health link below. */}
      <MRHeroCard
        accessibilityLabel={
          showHeroMoney
            ? `Protection is on. You've protected ${yearSummary.estimatedValueLabel} this year.`
            : `${heroTitle}. ${heroSupporting}`
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            {showHeroMoney ? (
              <>
                <Text style={{ color: palette.forest[100], fontSize: typography.size.caption, fontWeight: '500' }}>
                  Protection is on
                </Text>
                <Text
                  style={{
                    color: palette.text.inverse,
                    fontSize: typography.size.display,
                    lineHeight: typography.lineHeight.display,
                    fontWeight: '700',
                    marginTop: spacing.xs,
                  }}
                >
                  {yearSummary.estimatedValueLabel}
                </Text>
                <Text
                  style={{
                    color: palette.forest[100],
                    fontSize: typography.size.bodyLarge,
                    marginTop: spacing.xs,
                  }}
                >
                  protected this year.
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    color: palette.text.inverse,
                    fontSize: typography.size.title,
                    lineHeight: typography.lineHeight.title,
                    fontWeight: '700',
                  }}
                >
                  {heroTitle}
                </Text>
                <Text
                  style={{
                    color: palette.forest[100],
                    fontSize: typography.size.bodyLarge,
                    marginTop: spacing.xs,
                  }}
                >
                  {heroSupporting}
                </Text>
              </>
            )}
          </View>
          <View
            style={{
              width: layout.iconCircle + 8,
              height: layout.iconCircle + 8,
              borderRadius: (layout.iconCircle + 8) / 2,
              backgroundColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityElementsHidden
          >
            <Ionicons
              name={protectionNeedsAction ? 'shield-outline' : 'shield-checkmark'}
              size={22}
              color={palette.text.inverse}
            />
          </View>
        </View>
        {compact.action !== 'none' ? (
          <Pressable
            onPress={openTrackingHealth}
            accessibilityRole="button"
            accessibilityLabel={trackingLinkLabel}
            style={{ marginTop: spacing.md }}
            hitSlop={8}
          >
            <Text
              style={{
                color: palette.text.inverse,
                fontWeight: '700',
                fontSize: typography.size.caption,
                textDecorationLine: 'underline',
              }}
            >
              {trackingLinkLabel}
            </Text>
          </Pressable>
        ) : null}
      </MRHeroCard>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: layout.section,
        }}
      >
        <MRMetricTile
          label={locale.distanceUnit === 'km' ? 'Work km' : 'Work miles'}
          value={workMilesValue}
        />
        <MRMetricTile label="Work drives" value={String(monthSummary.tripCount)} />
        <MRMetricTile
          label="This month"
          value={
            monthSummary.estimatedValueCents != null
              ? monthSummary.estimatedValueLabel
              : monthSummary.estimatedValueLabel === 'Review rate'
                ? '—'
                : monthSummary.estimatedValueLabel
          }
        />
      </View>

      {/* Single next action — no duplicate protection status banner. */}
      <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Next up</Text>
      <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        {nextBest.run ? (
          <MRPrimaryButton
            label={nextBest.label}
            onPress={nextBest.run}
            accessibilityLabel={nextBest.label}
          />
        ) : (
          <MRCard
            style={{
              minHeight: layout.buttonH,
              paddingVertical: spacing.smMd,
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: typography.size.bodyLarge,
                fontWeight: '600',
                color: palette.text.primary,
              }}
            >
              {nextBest.label}
            </Text>
            <Text style={{ fontSize: typography.size.caption, color: palette.text.secondary }}>
              Your next useful step will appear here.
            </Text>
          </MRCard>
        )}
        {nextBest.secondaryLabel && nextBest.secondaryRun ? (
          <MRTertiaryButton
            label={nextBest.secondaryLabel}
            onPress={nextBest.secondaryRun}
            accessibilityLabel={nextBest.secondaryLabel}
          />
        ) : null}
      </View>

      <TrialOfferCard
        confirmedWorkDriveCount={confirmedCount}
        onStartTrial={() => navigation.navigate('PlanSelection', { source: 'upgrade' })}
      />
    </TabScreen>
  );
}
