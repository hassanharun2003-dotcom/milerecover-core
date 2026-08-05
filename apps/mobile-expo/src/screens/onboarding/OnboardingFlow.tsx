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
import { nextActionForGoal } from '../../product/copy';
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
  if (step === 'vehicle_setup' || step === 'driving_pattern' || step === 'familiar_places' || step === 'personalize') {
    return 'protect_drives';
  }
  return 'welcome';
}

export function OnboardingFlow() {
  const { finishOnboarding, requestLocationPermission, requestBackgroundPermission, permissions } = useApp();
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
  const next = nextActionForGoal(product.primaryGoal);

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
    const cents = Number.parseFloat(rateCents);
    const profile = localeProfileFromCountry(countryDraft, {
      distanceUnit: countryDraft === 'OTHER' ? unitDraft : unitDraft,
      currencyCode: countryDraft === 'OTHER' ? otherCurrency : undefined,
      centsPerMile: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : undefined,
    });
    if (countryDraft !== 'OTHER' && unitDraft !== profile.distanceUnit) {
      profile.distanceUnit = unitDraft;
    }
    setLocaleProfile({ ...profile, activeRateNeedsReview: !(Number.isFinite(cents) && cents > 0) });
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
            : 'add_first_drive';
    completeProductOnboarding(route);
    patchOnboarding({ nextActionSelected: action });
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, { next: action });
    finishOnboarding();
  };

  const ratePreview = useMemo(() => {
    const cents = Number.parseFloat(rateCents);
    if (!Number.isFinite(cents) || cents <= 0) return 'Optional — you can set this later';
    return unitDraft === 'km'
      ? `About ${Math.round(cents / 1.609344)}¢ per km`
      : `${Math.round(cents)}¢ per mile`;
  }, [rateCents, unitDraft]);

  return (
    <OnboardingScreen
      footer={
        step === 'welcome' ? (
          <PrimaryButton label="Get started" onPress={() => advanceOnboarding()} accessibilityLabel="Get started" />
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
          <View>
            <PrimaryButton
              label="Turn on drive protection"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.protectionSetupStarted, {});
                setProtectionSetupState('educated');
                void (async () => {
                  const fg = await requestLocationPermission();
                  if (fg.location === 'granted') {
                    await requestBackgroundPermission();
                    setTrackingEnabled(true);
                    setProtectionSetupState('configured');
                  }
                })();
                advanceOnboarding();
              }}
              accessibilityLabel="Turn on drive protection"
            />
            <TertiaryButton
              label="Skip for now — add drives manually"
              onPress={() => {
                setProtectionSetupState('not_started');
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
        <View>
          <WelcomeHero
            title="MileRecover"
            body="Protect every work mile. Recover forgotten drives and create beautiful proof — without inventing mileage."
          />
        </View>
      ) : null}

      {step === 'purpose' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            How do you use mileage?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This sets report wording. You can change it anytime.
          </Text>
          <FormField
            label="Preferred name (optional)"
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="First name"
          />
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
        </View>
      ) : null}

      {step === 'locale_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Country, units, and rate
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Choose how distance and value appear. Rates are your choice — not a tax guarantee.
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
                  setRateCents(String(preset.rates[0]?.centsPerMile ?? ''));
                }
              }}
            />
          ))}
          <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>Distance unit</Text>
          <SelectionCard title="Miles" selected={unitDraft === 'mi'} onPress={() => setUnitDraft('mi')} />
          <SelectionCard title="Kilometers" selected={unitDraft === 'km'} onPress={() => setUnitDraft('km')} />
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
            label={unitDraft === 'km' ? 'Suggested rate (¢ per mile equivalent)' : 'Suggested rate (¢ per mile)'}
            value={rateCents}
            onChangeText={setRateCents}
            placeholder="67"
            keyboardType="numeric"
            accessibilityLabel="Suggested mileage rate"
          />
          <Text style={[text.caption, { marginTop: spacing.xs }]}>{ratePreview}</Text>
        </View>
      ) : null}

      {step === 'protect_drives' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            Protect your drives
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Set up drive protection so fewer work miles are missed. Manual entry always works.
          </Text>
          <SoftPanel>
            <Text style={text.body}>Location while using the app</Text>
            <Text style={[text.caption, { marginTop: spacing.xs }]}>
              {permissions.location === 'granted' ? 'Allowed' : 'Needed for automatic capture'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.md }]}>Background location</Text>
            <Text style={[text.caption, { marginTop: spacing.xs }]}>
              {permissions.backgroundLocation === 'granted'
                ? 'Allowed'
                : 'Helps catch drives when the app isn’t open'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.md }]}>Battery settings</Text>
            <Text style={[text.caption, { marginTop: spacing.xs }]}>
              Some phones pause apps — we’ll help you check if needed.
            </Text>
          </SoftPanel>
          <Text style={[text.caption, { marginTop: spacing.sm }]}>
            Skip for now if you prefer adding drives yourself.
          </Text>
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]} accessibilityRole="header">
            You’re ready
          </Text>
          <SoftPanel>
            <Text style={text.body}>
              Goal: {PRIMARY_GOAL_OPTIONS.find((o) => o.id === product.primaryGoal)?.label ?? 'Not set'}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              {product.localeProfile.countryDisplayName} ·{' '}
              {product.localeProfile.distanceUnit === 'km' ? 'Kilometers' : 'Miles'} ·{' '}
              {formatActiveRateLabel(product.localeProfile)}
            </Text>
            <Text style={[text.body, { marginTop: spacing.xs }]}>
              Protection:{' '}
              {product.trackingEnabled || product.protectionSetupState === 'configured'
                ? 'On or ready to confirm'
                : 'Manual for now'}
            </Text>
          </SoftPanel>
          <Text style={[text.body, { marginTop: spacing.md, marginBottom: spacing.md }]}>{next.body}</Text>
          <PrimaryButton label="Go to Home" onPress={() => finish(next.route)} accessibilityLabel="Go to Home" />
          <SecondaryButton label="Add a first drive" onPress={() => finish('ManualTrip')} />
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
