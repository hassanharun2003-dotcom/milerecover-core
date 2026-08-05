import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
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
import {
  FormField,
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  TertiaryButton,
  WelcomeHero,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

function inOrder(step: ProductOnboardingStep): boolean {
  return ONBOARDING_STEP_ORDER.includes(step);
}

function remapStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (inOrder(step)) return step;
  if (step === 'your_work' || step === 'primary_goal' || step === 'pain_points' || step === 'account') {
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

export function OnboardingFlow() {
  const { finishOnboarding, requestLocationPermission, requestBackgroundPermission, permissions } =
    useApp();
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
  } = useProduct();

  const [finishing, setFinishing] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
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
  const [rateCents, setRateCents] = useState(
    String(product.localeProfile.rates[0]?.centsPerMile ?? ''),
  );

  const step = remapStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
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
    const entered = Number.parseFloat(rateCents);
    // UI shows the active unit; domain rates are stored as cents-per-mile.
    const centsPerMile =
      Number.isFinite(entered) && entered > 0
        ? Math.round(unitDraft === 'km' ? entered * 1.609344 : entered)
        : undefined;
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

  const finish = (route: PostOnboardingRoute) => {
    if (finishing) return;
    setFinishing(true);
    const action: NextActionId =
      route === 'ProtectionAlert'
        ? 'start_protection'
        : route === 'BringExistingMileage'
          ? 'import_mileage'
          : route === 'MissingTripRecovery'
            ? 'begin_rescue'
            : route === 'ManualTrip'
              ? 'add_first_drive'
              : protectionConfigured
                ? 'start_protection'
                : 'add_first_drive';
    completeProductOnboarding(route);
    patchOnboarding({
      nextActionSelected: action,
      countryStepAcknowledged: true,
      protectionEducationAcknowledged: true,
      permissionsEducationAcknowledged: true,
    });
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
    finishOnboarding();
  };

  const rateLabel = unitDraft === 'km' ? 'Mileage rate (¢ per km)' : 'Mileage rate (¢ per mile)';
  const ratePreview = useMemo(() => {
    const entered = Number.parseFloat(rateCents);
    if (!Number.isFinite(entered) || entered <= 0) return 'Optional — you can set this later in Profile';
    return unitDraft === 'km' ? `${Math.round(entered)}¢ per km` : `${Math.round(entered)}¢ per mile`;
  }, [rateCents, unitDraft]);

  const goalLabel =
    PRIMARY_GOAL_OPTIONS.find((option) => option.id === product.primaryGoal)?.label ?? 'Not set';

  return (
    <OnboardingScreen
      footer={
        step === 'welcome' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton
              label="Get started"
              onPress={() => advanceOnboarding()}
              accessibilityLabel="Get started"
            />
            <SecondaryButton
              label="I already use a mileage app"
              onPress={() => {
                patchOnboarding({ selectedPainPoints: ['need_cleaner_reports'] });
                advanceOnboarding();
              }}
            />
          </View>
        ) : step === 'purpose' ? (
          <PrimaryButton
            label="Continue"
            onPress={() => {
              if (!product.primaryGoal) return;
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
            disabled={!product.primaryGoal}
            accessibilityLabel="Continue to country and rate"
          />
        ) : step === 'locale_setup' ? (
          <PrimaryButton
            label="Continue"
            onPress={() => {
              saveLocale();
              advanceOnboarding();
            }}
            accessibilityLabel="Continue to drive protection"
          />
        ) : step === 'protect_drives' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton
              label="Set up protection"
              loading={permissionBusy}
              onPress={() => {
                if (permissionBusy) return;
                setPermissionBusy(true);
                logEvent(ANALYTICS_EVENTS.protectionSetupStarted, {});
                setProtectionSetupState('educated');
                patchOnboarding({ protectionEducationAcknowledged: true });
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
                    advanceOnboarding();
                  }
                })();
              }}
              accessibilityLabel="Set up drive protection"
            />
            <TertiaryButton
              label="Not now — I’ll add drives manually"
              onPress={() => {
                setTrackingEnabled(false);
                setProtectionSetupState('not_started');
                patchOnboarding({
                  protectionEducationAcknowledged: true,
                  permissionsEducationAcknowledged: true,
                });
                advanceOnboarding();
              }}
            />
          </View>
        ) : null
      }
    >
      <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
      {stepIndex > 0 ? (
        <TertiaryButton label="Back" onPress={() => backOnboarding()} accessibilityLabel="Go back" />
      ) : null}

      {step === 'welcome' ? (
        <WelcomeHero
          title="MileRecover"
          eyebrow="Never lose another work drive."
          body="Automatically capture possible drives, review them in seconds, and create clear mileage proof."
        />
      ) : null}

      {step === 'purpose' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            What do you track mileage for?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This shapes report wording. You can change it anytime.
          </Text>
          {PRIMARY_GOAL_OPTIONS.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              body={option.body}
              selected={product.primaryGoal === option.id}
              onPress={() => {
                setPrimaryGoal(option.id);
                logEvent(ANALYTICS_EVENTS.goalSelected, { goal: option.id });
              }}
            />
          ))}
          {product.primaryGoal ? (
            <View style={{ marginTop: spacing.md }}>
              <FormField
                label="Preferred name (optional)"
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="First name"
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 'locale_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Country, units, and rate
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Use your employer’s or business rate. You can change it anytime.
          </Text>
          {COUNTRY_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              body={opt.id === recommendedCountry ? 'Suggested from your device' : undefined}
              selected={countryDraft === opt.id}
              onPress={() => {
                setCountryDraft(opt.id);
                if (opt.id !== 'OTHER') {
                  const preset = localeProfileFromCountry(opt.id);
                  setUnitDraft(preset.distanceUnit);
                  const cpm = preset.rates[0]?.centsPerMile ?? 0;
                  setRateCents(
                    String(
                      preset.distanceUnit === 'km' ? Math.round(cpm / 1.609344) : cpm || '',
                    ),
                  );
                }
              }}
            />
          ))}
          <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
            Distance unit
          </Text>
          <SelectionCard title="Miles" selected={unitDraft === 'mi'} onPress={() => setUnitDraft('mi')} />
          <SelectionCard
            title="Kilometers"
            selected={unitDraft === 'km'}
            onPress={() => setUnitDraft('km')}
          />
          {countryDraft === 'OTHER' ? (
            <FormField
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
          <FormField
            label={rateLabel}
            value={rateCents}
            onChangeText={setRateCents}
            placeholder="67"
            keyboardType="numeric"
            accessibilityLabel="Mileage rate"
          />
          <Text style={[text.caption, { marginTop: spacing.xs }]}>{ratePreview}</Text>
        </View>
      ) : null}

      {step === 'protect_drives' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Protect future drives
          </Text>
          <SoftPanel>
            <Text style={text.body}>Detect possible drives automatically</Text>
            <Text style={[text.body, { marginTop: spacing.sm }]}>
              Keep uncertain drives for your review
            </Text>
            <Text style={[text.body, { marginTop: spacing.sm }]}>Add a drive manually anytime</Text>
          </SoftPanel>
          <Text style={[text.body, { marginTop: spacing.md }]}>
            We’ll ask for location so MileRecover can notice possible drives. Uncertain drives stay in
            Review until you decide. We don’t invent mileage.
          </Text>
          <Text style={[text.caption, { marginTop: spacing.sm }]}>
            Location: {permissions.location === 'granted' ? 'Allowed' : 'Not yet'}
            {' · '}
            Background:{' '}
            {permissions.backgroundLocation === 'granted' ? 'Allowed' : 'Not yet'}
          </Text>
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            You’re ready
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            {protectionConfigured
              ? 'Automatic protection is ready. We’ll place uncertain drives in Review before they affect your records.'
              : 'You can add drives manually anytime. Turn on protection later from Profile when you’re ready.'}
          </Text>
          <SoftPanel>
            <Text style={text.subtitle}>{goalLabel}</Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              {product.localeProfile.countryDisplayName} ·{' '}
              {product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles'} ·{' '}
              {formatActiveRateLabel(product.localeProfile)}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              {protectionConfigured ? 'Protection ready' : 'Manual for now'}
            </Text>
          </SoftPanel>
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Go to Home"
              onPress={() => finish(null)}
              disabled={finishing}
              loading={finishing}
              accessibilityLabel="Go to Home"
            />
            <SecondaryButton
              label="Add my first drive"
              onPress={() => finish('ManualTrip')}
              disabled={finishing}
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
