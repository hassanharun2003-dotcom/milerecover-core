import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { layout, spacing, typography } from '@milerecover/config';
import {
  formatActiveRateLabel,
  localeProfileFromCountry,
  recommendCountryFromLocale,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
  type NextActionId,
} from '@milerecover/domain';
import {
  COUNTRY_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PRIMARY_GOAL_OPTIONS,
  type PostOnboardingRoute,
  type ProductOnboardingStep,
} from '../../product/types';
import { CountryFlag } from '../../components/CountryFlag';
import {
  ReadyArt,
  TrackingArt,
  WelcomeArt,
} from '../../components/ProductArt';
import {
  BottomSheet,
  ChecklistRow,
  MRCard,
  MRFormField,
  MRIconCircle,
  MRPrimaryButton,
  MRProgressBar,
  MRSecondaryButton,
  MRSegmentedControl,
  MRStatusPanel,
  MRTertiaryButton,
  OnboardingScreen,
  SelectionCard,
  text,
  useAppTheme,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import {
  AUTH_GENERIC_FAILURE_MESSAGE,
  getAuthPort,
  type AuthProviderId,
} from '../../services/auth';

const PURPOSE_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  employee_reimbursement: 'briefcase-outline',
  self_employed_business: 'storefront-outline',
  gig_delivery: 'bicycle-outline',
  mixed: 'person-outline',
};

const PROTECTION_BENEFITS = [
  'Detects when a drive starts and ends',
  'Uses motion to reduce unnecessary GPS use',
  'You stay in control of Work vs Personal',
] as const;

const KM_PER_MILE = 1.609344;

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (step === 'your_work' || step === 'primary_goal' || step === 'pain_points') {
    return 'purpose';
  }
  if (step === 'country' || step === 'preferred_name') return 'locale_setup';
  if (step === 'permissions_education' || step === 'protection_education') return 'protect_drives';
  if (
    step === 'vehicle_setup' ||
    step === 'driving_pattern' ||
    step === 'familiar_places' ||
    step === 'personalize'
  ) {
    return 'protect_drives';
  }
  return 'welcome';
}

function centsPerMileToDisplayDollars(centsPerMile: number, unit: DistanceUnit): string {
  if (!(centsPerMile > 0)) return '';
  const centsPerUnit = unit === 'km' ? centsPerMile / KM_PER_MILE : centsPerMile;
  return (centsPerUnit / 100).toFixed(2);
}

function displayDollarsToCentsPerMile(dollarsText: string, unit: DistanceUnit): number | undefined {
  const dollars = Number.parseFloat(dollarsText);
  if (!Number.isFinite(dollars) || dollars <= 0) return undefined;
  const centsPerUnit = Math.round(dollars * 100);
  return unit === 'km' ? Math.round(centsPerUnit * KM_PER_MILE) : centsPerUnit;
}

function convertDisplayRate(dollarsText: string, from: DistanceUnit, to: DistanceUnit): string {
  if (from === to) return dollarsText;
  const dollars = Number.parseFloat(dollarsText);
  if (!Number.isFinite(dollars) || dollars <= 0) return dollarsText;
  // Preserve economic rate: $1.80/mi ↔ ≈ $1.12/km
  const next = from === 'mi' && to === 'km' ? dollars / KM_PER_MILE : dollars * KM_PER_MILE;
  return next.toFixed(2);
}

function formatDisplayRate(dollarsText: string, unit: DistanceUnit): string {
  const dollars = Number.parseFloat(dollarsText);
  if (!(Number.isFinite(dollars) && dollars > 0)) return 'Not set';
  return unit === 'km' ? `$${dollars.toFixed(2)} / km` : `$${dollars.toFixed(2)} / mile`;
}

export function OnboardingFlow() {
  const { palette } = useAppTheme();
  const { finishOnboarding, requestLocationPermission, requestBackgroundPermission } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setPreferredName,
    setLocaleProfile,
    setProtectionSetupState,
    setTrackingEnabled,
    patchOnboarding,
    completeProductOnboarding,
    flushProductPersistence,
  } = useProduct();

  const authPort = getAuthPort();
  const googleAvailable = authPort.isProviderAvailable('google');
  const appleAvailable = Platform.OS === 'ios' && authPort.isProviderAvailable('apple');
  const [finishing, setFinishing] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [legalSheet, setLegalSheet] = useState<'privacy' | 'terms' | null>(null);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [rateEditing, setRateEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(product.preferredName ?? '');
  const recommendedCountry = recommendCountryFromLocale(
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : undefined,
  );
  const [countryDraft, setCountryDraft] = useState<CountryCode>(
    product.localeProfile.countryCode || recommendedCountry,
  );
  const [unitDraft, setUnitDraft] = useState<DistanceUnit>(product.localeProfile.distanceUnit);
  const [otherCurrency, setOtherCurrency] = useState<CurrencyCode>(
    product.localeProfile.currencyCode === 'OTHER' ? 'OTHER' : product.localeProfile.currencyCode,
  );
  const [rateDollars, setRateDollars] = useState(
    centsPerMileToDisplayDollars(
      product.localeProfile.rates[0]?.centsPerMile ?? 0,
      product.localeProfile.distanceUnit,
    ) || '0.70',
  );
  /** Figma: Tracking Education → Permission Education within protect_drives. */
  const [protectionPhase, setProtectionPhase] = useState<'tracking' | 'permission'>('tracking');

  const step = remapStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  /** Collage progress is 1–5 excluding Welcome (Purpose shows “2 of 5”). */
  const progressSteps = ONBOARDING_STEP_ORDER.filter((s) => s !== 'welcome');
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex((s) => s === step),
  );
  const protectionConfigured =
    product.trackingEnabled ||
    product.protectionSetupState === 'configured' ||
    product.protectionSetupState === 'healthy';

  useEffect(() => {
    if (product.onboardingStep !== step) setOnboardingStep(step);
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStarted, {});
  }, []);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  const saveLocale = () => {
    const centsPerMile = displayDollarsToCentsPerMile(rateDollars, unitDraft);
    const profile = localeProfileFromCountry(countryDraft, {
      distanceUnit: unitDraft,
      currencyCode: countryDraft === 'OTHER' ? otherCurrency : undefined,
      centsPerMile,
    });
    profile.distanceUnit = unitDraft;
    setLocaleProfile({ ...profile, activeRateNeedsReview: centsPerMile == null });
    patchOnboarding({ countryStepAcknowledged: true });
    logEvent(ANALYTICS_EVENTS.countrySelected, { country: countryDraft });
  };

  /** After Google/guest auth, enter purpose onboarding — never Home. */
  const enterOnboardingAfterAuth = () => {
    patchOnboarding({ accountStepAcknowledged: true });
    setOnboardingStep('purpose');
  };

  const acknowledgeAccountAndContinue = () => {
    enterOnboardingAfterAuth();
  };

  const tryAuth = async (provider: AuthProviderId) => {
    if (authBusy) return;
    if (!authPort.isProviderAvailable(provider)) {
      // Never show a silent no-op button — callers hide unavailable providers.
      return;
    }
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      const result = await authPort.signIn(provider);
      if (result.ok) {
        if (result.displayName) {
          const first = result.displayName.trim().split(/\s+/)[0] ?? result.displayName;
          setPreferredName(first);
          setNameDraft(first);
        }
        // Real provider success → onboarding purpose (not Home).
        enterOnboardingAfterAuth();
        return;
      }
      if (result.reason === 'cancelled') {
        setAuthNotice(null);
        return;
      }
      setAuthNotice(result.message || AUTH_GENERIC_FAILURE_MESSAGE);
    } finally {
      setAuthBusy(false);
    }
  };

  const authFooter = (
    <View style={{ gap: spacing.sm }}>
      {authNotice ? (
        <Text
          style={[text.caption, { color: palette.text.secondary, textAlign: 'center' }]}
          accessibilityRole="text"
        >
          {authNotice}
        </Text>
      ) : null}
      {googleAvailable ? (
        <MRPrimaryButton
          label={authBusy ? 'Signing in…' : 'Continue with Google'}
          onPress={() => void tryAuth('google')}
          disabled={authBusy}
          loading={authBusy}
          accessibilityLabel="Continue with Google"
        />
      ) : null}
      {appleAvailable ? (
        <MRSecondaryButton
          label="Continue with Apple"
          onPress={() => void tryAuth('apple')}
          disabled={authBusy}
          accessibilityLabel="Continue with Apple"
        />
      ) : null}
      <MRTertiaryButton
        label="Continue without an account"
        onPress={() => {
          setAuthNotice(null);
          acknowledgeAccountAndContinue();
        }}
        accessibilityLabel="Continue without an account"
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.md,
          marginTop: spacing.xs,
        }}
      >
        <Pressable
          onPress={() => setLegalSheet('privacy')}
          accessibilityRole="link"
          accessibilityLabel="Privacy"
          hitSlop={8}
        >
          <Text style={[text.caption, { color: palette.text.secondary }]}>Privacy</Text>
        </Pressable>
        <Pressable
          onPress={() => setLegalSheet('terms')}
          accessibilityRole="link"
          accessibilityLabel="Terms"
          hitSlop={8}
        >
          <Text style={[text.caption, { color: palette.text.secondary }]}>Terms</Text>
        </Pressable>
      </View>
    </View>
  );

  const [persistError, setPersistError] = useState<string | null>(null);

  const finish = (route: PostOnboardingRoute) => {
    if (finishing) return;
    setFinishing(true);
    setPersistError(null);
    const action: NextActionId =
      route === 'ManualTrip'
        ? 'add_first_drive'
        : route === 'BringExistingMileage'
          ? 'import_mileage'
          : protectionConfigured
            ? 'start_protection'
            : 'add_first_drive';
    void (async () => {
      try {
        patchOnboarding({
          nextActionSelected: action,
          accountStepAcknowledged: true,
          countryStepAcknowledged: true,
          protectionEducationAcknowledged: true,
          permissionsEducationAcknowledged: true,
        });
        await completeProductOnboarding(route);
        await flushProductPersistence();
        logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
        finishOnboarding();
      } catch {
        setPersistError('Couldn’t save your setup. Check storage and try again.');
      } finally {
        // Always clear so Ready never sticks on “One moment…” after a hang/cancel.
        setFinishing(false);
      }
    })();
  };

  const displayRate = useMemo(() => {
    const formatted = formatDisplayRate(rateDollars, unitDraft);
    if (formatted !== 'Not set') return formatted;
    return formatActiveRateLabel({
      ...product.localeProfile,
      distanceUnit: unitDraft,
      activeRateNeedsReview: false,
    })
      .replace('¢/mi', ' / mile')
      .replace('¢/km', ' / km');
  }, [product.localeProfile, rateDollars, unitDraft]);

  const countryLabel =
    COUNTRY_OPTIONS.find((option) => option.id === countryDraft)?.label ?? countryDraft;

  const applyCountry = (id: CountryCode) => {
    setCountryDraft(id);
    setCountrySheetOpen(false);
    if (id !== 'OTHER') {
      const preset = localeProfileFromCountry(id);
      setUnitDraft(preset.distanceUnit);
      const cpm = preset.rates[0]?.centsPerMile ?? 0;
      setRateDollars(centsPerMileToDisplayDollars(cpm, preset.distanceUnit) || rateDollars);
    }
  };

  const changeUnit = (next: DistanceUnit) => {
    if (next === unitDraft) return;
    setRateDollars((prev) => convertDisplayRate(prev, unitDraft, next));
    setUnitDraft(next);
  };

  const purposeLabel =
    PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';
  const showProgress = step !== 'welcome' && step !== 'ready';
  const showBack = stepIndex > 0 && step !== 'ready';

  return (
    <OnboardingScreen
      footer={
        step === 'welcome' || step === 'account' ? (
          authFooter
        ) : step === 'purpose' ? (
          <MRPrimaryButton
            label="Continue →"
            onPress={() => {
              if (!product.primaryGoal) return;
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
            disabled={!product.primaryGoal}
            accessibilityLabel="Continue to region and rate"
          />
        ) : step === 'locale_setup' ? (
          <MRPrimaryButton
            label="Continue →"
            onPress={() => {
              saveLocale();
              advanceOnboarding();
            }}
            accessibilityLabel="Continue to drive protection"
          />
        ) : step === 'protect_drives' && protectionPhase === 'tracking' ? (
          <MRPrimaryButton
            label="Set up tracking"
            onPress={() => {
              logEvent(ANALYTICS_EVENTS.protectionSetupStarted, {});
              setProtectionSetupState('educated');
              patchOnboarding({ protectionEducationAcknowledged: true });
              setProtectionPhase('permission');
            }}
            accessibilityLabel="Set up tracking"
          />
        ) : step === 'protect_drives' ? (
          <View style={{ gap: spacing.sm }}>
            <MRPrimaryButton
              label="Allow when prompted"
              loading={permissionBusy}
              onPress={() => {
                if (permissionBusy) return;
                setPermissionBusy(true);
                void (async () => {
                  try {
                    const fg = await requestLocationPermission();
                    if (fg.location === 'granted') {
                      await requestBackgroundPermission();
                      setTrackingEnabled(true);
                      setProtectionSetupState('configured');
                      patchOnboarding({
                        protectionEducationAcknowledged: true,
                        permissionsEducationAcknowledged: true,
                      });
                    } else {
                      patchOnboarding({
                        protectionEducationAcknowledged: true,
                        permissionsEducationAcknowledged: true,
                      });
                    }
                  } finally {
                    setPermissionBusy(false);
                    setProtectionPhase('tracking');
                    advanceOnboarding();
                  }
                })();
              }}
              accessibilityLabel="Allow location when prompted"
            />
            <MRTertiaryButton
              label="Set up later"
              onPress={() => {
                setTrackingEnabled(false);
                setProtectionSetupState('not_started');
                patchOnboarding({
                  protectionEducationAcknowledged: true,
                  permissionsEducationAcknowledged: true,
                });
                setProtectionPhase('tracking');
                advanceOnboarding();
              }}
            />
          </View>
        ) : null
      }
    >
      {showProgress ? (
        <View style={{ marginBottom: spacing.sm }}>
          {showBack ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Pressable
                onPress={() => backOnboarding()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                style={{ width: 40, height: 40, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 28, color: palette.text.primary }}>‹</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <MRProgressBar step={progressIndex} total={progressSteps.length} />
              </View>
              <View style={{ width: 40 }} />
            </View>
          ) : (
            <MRProgressBar step={progressIndex} total={progressSteps.length} />
          )}
        </View>
      ) : null}

      {step === 'welcome' || step === 'account' ? (
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <WelcomeArt style={{ width: '100%', marginBottom: spacing.md }} />
          <Text
            style={{
              fontSize: typography.size.display,
              lineHeight: typography.lineHeight.display,
              fontWeight: '800',
              color: palette.text.primary,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
            accessibilityRole="header"
          >
            MileRecover
          </Text>
          <Text
            style={{
              fontSize: typography.size.title,
              lineHeight: typography.lineHeight.title,
              fontWeight: '700',
              color: palette.text.primary,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            Never lose a work mile.
          </Text>
          <Text
            style={{
              fontSize: typography.size.body,
              lineHeight: typography.lineHeight.body,
              color: palette.text.secondary,
              textAlign: 'center',
              marginBottom: spacing.md,
              paddingHorizontal: spacing.sm,
            }}
          >
            Protect your mileage, recover what was missed, and keep proof ready.
          </Text>
          {!googleAvailable ? (
            <Text
              style={[
                text.caption,
                { color: palette.text.secondary, textAlign: 'center', marginBottom: spacing.sm },
              ]}
            >
              Continue without an account to set up MileRecover on this device.
            </Text>
          ) : null}
          <BottomSheet
            visible={legalSheet != null}
            title={legalSheet === 'terms' ? 'Terms' : 'Privacy'}
            onClose={() => setLegalSheet(null)}
          >
            <Text style={[text.body, { marginBottom: spacing.md }]}>
              {legalSheet === 'terms'
                ? 'MileRecover helps you log and organize work mileage on this device. Store purchases are managed by Google Play or the App Store. Contact support@milerecover.com for account questions.'
                : 'Your drives and setup stay on this device unless you export them. MileRecover does not show sensitive route details on lock-screen notifications. You control location permissions in system settings.'}
            </Text>
            <MRTertiaryButton label="Close" onPress={() => setLegalSheet(null)} />
          </BottomSheet>
        </View>
      ) : null}

      {step === 'purpose' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            What do you use your mileage for?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We'll personalize MileRecover around the way you drive.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {PRIMARY_GOAL_OPTIONS.map((option) => {
              const selected = product.primaryGoal === option.id;
              return (
                <MRCard
                  key={option.id}
                  selected={selected}
                  onPress={() => {
                    setPrimaryGoal(option.id);
                    logEvent(ANALYTICS_EVENTS.goalSelected, { goal: option.id });
                  }}
                  accessibilityLabel={option.label}
                  style={{
                    minHeight: 56,
                    marginBottom: 0,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <MRIconCircle
                    icon={PURPOSE_ICONS[option.id] ?? 'ellipse-outline'}
                    accessibilityLabel={option.label}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: typography.size.body,
                        fontWeight: '600',
                        color: palette.text.primary,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{
                        marginTop: 2,
                        fontSize: typography.size.caption,
                        color: palette.text.secondary,
                      }}
                      numberOfLines={1}
                    >
                      {option.body}
                    </Text>
                  </View>
                  {selected ? (
                    <Text style={{ color: palette.action.primary, fontWeight: '700', fontSize: 18 }}>✓</Text>
                  ) : null}
                </MRCard>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 'locale_setup' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.md }]} accessibilityRole="header">
            Set your region and mileage rate
          </Text>

          <Text style={[text.caption, { marginBottom: spacing.xs, fontWeight: '500' }]}>Country</Text>
          <Pressable
            onPress={() => setCountrySheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Change country, currently ${countryLabel}`}
            style={{
              minHeight: layout.fieldH,
              borderWidth: 1,
              borderColor: palette.border.default,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.xs,
              backgroundColor: palette.background.card,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <CountryFlag code={countryDraft} size={22} />
              <Text style={{ color: palette.text.primary, fontSize: typography.size.bodyLarge }}>
                {countryLabel}
              </Text>
            </View>
            <Text style={{ color: palette.text.secondary, fontSize: typography.size.caption }}>
              Change country
            </Text>
          </Pressable>

          <Text style={[text.caption, { marginBottom: spacing.xs, marginTop: spacing.sm, fontWeight: '500' }]}>
            Mileage rate
          </Text>
          <View
            style={{
              minHeight: layout.fieldH,
              borderWidth: 1,
              borderColor: palette.border.default,
              borderRadius: 12,
              paddingHorizontal: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
              backgroundColor: palette.background.card,
            }}
          >
            <Text
              style={{
                color: palette.text.primary,
                fontWeight: '700',
                fontSize: typography.size.bodyLarge,
              }}
            >
              {displayRate === 'Not set' ? 'Set a rate' : displayRate}
            </Text>
            <Pressable
              onPress={() => setRateEditing((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel="Update rate"
            >
              <Text style={{ color: palette.action.primary, fontWeight: '700' }}>Update rate</Text>
            </Pressable>
          </View>

          {rateEditing ? (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[text.caption, { marginBottom: spacing.xs }]}>Distance unit</Text>
              <MRSegmentedControl
                value={unitDraft}
                onChange={changeUnit}
                options={[
                  { label: 'Miles', value: 'mi' },
                  { label: 'Kilometres', value: 'km' },
                ]}
              />
              {countryDraft === 'OTHER' ? (
                <MRFormField
                  label="Currency code"
                  value={otherCurrency === 'OTHER' ? '' : otherCurrency}
                  onChangeText={(value) => {
                    const nextCode = value.trim().toUpperCase();
                    if (!nextCode) setOtherCurrency('OTHER');
                    else if (['USD', 'CAD', 'GBP', 'AUD', 'EUR'].includes(nextCode)) {
                      setOtherCurrency(nextCode as CurrencyCode);
                    }
                  }}
                  placeholder="e.g. EUR"
                  autoCapitalize="characters"
                />
              ) : null}
              <MRFormField
                label={unitDraft === 'km' ? 'Mileage rate ($ per km)' : 'Mileage rate ($ per mile)'}
                value={rateDollars}
                onChangeText={setRateDollars}
                placeholder="0.70"
                keyboardType="decimal-pad"
                accessibilityLabel="Mileage rate in dollars"
              />
              <Text style={[text.caption, { marginTop: spacing.xs }]}>
                Enter a normal amount like 0.70 — dollars per mile, not cents.
              </Text>
            </View>
          ) : null}

          <MRStatusPanel
            tone="info"
            message="This is your chosen estimate. You can change it anytime."
          />

          <BottomSheet
            visible={countrySheetOpen}
            title="Choose country"
            onClose={() => setCountrySheetOpen(false)}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <SelectionCard
                key={opt.id}
                title={opt.label}
                body={opt.id === recommendedCountry ? 'Suggested from your device' : undefined}
                selected={countryDraft === opt.id}
                onPress={() => applyCountry(opt.id)}
                leading={<CountryFlag code={opt.id} size={22} />}
              />
            ))}
          </BottomSheet>
        </View>
      ) : null}

      {step === 'protect_drives' && protectionPhase === 'tracking' ? (
        <View>
          <TrackingArt />
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Drive normally. MileRecover does the remembering.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            MileRecover uses motion and location signals to detect likely drives while protecting your
            privacy.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {PROTECTION_BENEFITS.map((label) => (
              <ChecklistRow key={label} label={label} status="ready" />
            ))}
          </View>
        </View>
      ) : null}

      {step === 'protect_drives' && protectionPhase === 'permission' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Allow location for automatic tracking
          </Text>
          <MRStatusPanel
            tone="info"
            message="Location helps detect drives while the app is closed. Motion helps reduce battery use. You choose what becomes Work or Personal."
          />
          <View style={{ gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md }}>
            {[
              'Detect drives automatically',
              'Keep tracking when the app is closed',
              'Reduce missed work mileage',
            ].map((label) => (
              <ChecklistRow key={label} label={label} status="ready" />
            ))}
          </View>
          <Text style={[text.caption]}>
            You'll stay in control. Sensitive route details won't appear on lock-screen notifications.
          </Text>
        </View>
      ) : null}

      {step === 'ready' ? (
        <View style={{ alignItems: 'center' }}>
          <ReadyArt style={{ width: '100%', marginBottom: spacing.md }} />
          <Text
            style={[text.headline, { marginBottom: spacing.sm, textAlign: 'center' }]}
            accessibilityRole="header"
          >
            You're ready.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.lg, textAlign: 'center' }]}>
            Automatic tracking is prepared. Take your first drive and MileRecover will handle the rest.
          </Text>
          <View
            style={{
              width: '100%',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: palette.border.default,
              backgroundColor: palette.background.card,
              padding: spacing.md,
              marginBottom: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Text style={[text.caption, { color: palette.text.secondary }]}>Your setup</Text>
            <Text style={[text.body, { color: palette.text.primary }]}>Purpose · {purposeLabel}</Text>
            <Text style={[text.body, { color: palette.text.primary }]}>
              Region · {countryLabel} · {unitDraft === 'km' ? 'Kilometres' : 'Miles'}
            </Text>
            <Text style={[text.body, { color: palette.text.primary }]}>
              Rate · {formatDisplayRate(rateDollars, unitDraft)}
            </Text>
            <Text style={[text.body, { color: palette.text.primary }]}>
              Protection · {protectionConfigured ? 'On' : 'Manual for now'}
            </Text>
          </View>
          {persistError ? (
            <Text
              style={[
                text.body,
                { color: palette.status.danger, marginBottom: spacing.sm, textAlign: 'center' },
              ]}
              accessibilityLabel="Onboarding save error"
            >
              {persistError}
            </Text>
          ) : null}
          <View style={{ width: '100%', gap: spacing.sm }}>
            <MRPrimaryButton
              label="Go to Home"
              onPress={() => finish(null)}
              disabled={finishing}
              loading={finishing}
              accessibilityLabel="Go to Home"
            />
            <MRSecondaryButton
              label="Add my first drive"
              onPress={() => finish('ManualTrip')}
              disabled={finishing}
            />
            <Text style={[text.caption, { textAlign: 'center', color: palette.text.secondary }]}>
              Notification permission is asked later, after Home.
            </Text>
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
