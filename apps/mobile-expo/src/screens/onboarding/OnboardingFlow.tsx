import React, { useEffect } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  ONBOARDING_STEP_ORDER,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
  type ProductOnboardingStep,
} from '../../product/types';
import { nextActionForGoal } from '../../product/copy';
import {
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  StatusCard,
  TertiaryButton,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import { CarRouteHero } from '../../components/CarRouteHero';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';

function remapLegacyStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (ONBOARDING_STEP_ORDER.includes(step)) return step;
  if (step === 'welcome' || step === 'primary_goal' || step === 'pain_points' || step === 'ready') {
    return step;
  }
  if (['preferred_name', 'vehicle_setup', 'familiar_places', 'driving_pattern', 'protection_education'].includes(step)) {
    return 'ready';
  }
  if (step === 'permissions_education') return 'ready';
  return 'welcome';
}

function readyBenefits(goal: typeof PRIMARY_GOAL_OPTIONS[number]['id'] | null, pains: PainPoint[]): string[] {
  const benefits: string[] = [];
  if (pains.includes('older_mileage')) {
    benefits.push('Bring older miles back together when you’re ready.');
  } else {
    benefits.push('Save work drives in a few taps.');
  }
  if (pains.includes('forget_to_track') || pains.includes('tracker_misses') || goal === 'gig_delivery') {
    benefits.push('Turn on watching later if you want automatic coverage.');
  } else {
    benefits.push('Review anything uncertain before it enters a report.');
  }
  if (pains.includes('need_cleaner_reports') || goal === 'employee_reimbursement') {
    benefits.push('Share cleaner records when work asks.');
  } else {
    benefits.push('Your saved miles stay on this device.');
  }
  return benefits.slice(0, 3);
}

export function OnboardingFlow() {
  const { finishOnboarding } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setSelectedPainPoints,
    completeProductOnboarding,
  } = useProduct();

  const step = remapLegacyStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);
  const selectedPainPoints = product.selectedPainPoints.filter((p) => p !== 'battery_worry') as PainPoint[];

  useEffect(() => {
    if (product.onboardingStep !== step) {
      setOnboardingStep(step);
    }
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stepIndex <= 0) return false;
      backOnboarding();
      return true;
    });
    return () => sub.remove();
  }, [backOnboarding, stepIndex]);

  const finish = (deepLink: boolean) => {
    completeProductOnboarding(deepLink ? 'ProtectionAlert' : null);
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, {
      goal: product.primaryGoal ?? 'unset',
      painCount: selectedPainPoints.length,
      nextAction: deepLink ? 'start_protection' : next.id,
    });
    finishOnboarding();
  };

  const togglePainPoint = (painPoint: PainPoint) => {
    const nextPainPoints = selectedPainPoints.includes(painPoint)
      ? selectedPainPoints.filter((item) => item !== painPoint)
      : [...selectedPainPoints, painPoint];
    setSelectedPainPoints(nextPainPoints);
  };

  return (
    <OnboardingScreen>
      <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
      {stepIndex > 0 ? (
        <TertiaryButton
          label="Back"
          onPress={backOnboarding}
          accessibilityLabel="Go back to previous onboarding step"
        />
      ) : null}

      {step === 'welcome' ? (
        <View>
          <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
            MileRecover
          </Text>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            Keep your work miles from disappearing.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Capture, recover, review, and prove work mileage — without inventing anything.
          </Text>
          <CarRouteHero />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Get started"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.onboardingStarted, { intent: 'protect' });
                advanceOnboarding();
              }}
            />
            <SecondaryButton
              label="Bring existing mileage"
              onPress={() => {
                logEvent(ANALYTICS_EVENTS.onboardingStarted, { intent: 'bring_existing' });
                setPrimaryGoal('mixed');
                setSelectedPainPoints(['older_mileage']);
                setOnboardingStep('ready');
              }}
            />
          </View>
        </View>
      ) : null}

      {step === 'primary_goal' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            What do you use work mileage for?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tap one. You can change this later in Profile.
          </Text>
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              body={opt.body}
              selected={product.primaryGoal === opt.id}
              onPress={() => {
                setPrimaryGoal(opt.id);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'pain_points' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What causes the most trouble?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Tap anything that sounds familiar. One is enough.
          </Text>
          {PAIN_POINT_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={selectedPainPoints.includes(opt.id)}
              onPress={() => togglePainPoint(opt.id)}
            />
          ))}
          <PrimaryButton
            label="Continue"
            onPress={advanceOnboarding}
            disabled={selectedPainPoints.length === 0}
          />
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <StatusCard
            variant="success"
            title="You’re ready"
            body="Home will show what to do next. Optional setup can wait."
            emphasis="hero"
          />
          {readyBenefits(product.primaryGoal, selectedPainPoints).map((line) => (
            <SoftPanel key={line}>
              <Text style={text.body}>{line}</Text>
            </SoftPanel>
          ))}
          <PrimaryButton
            label="Go to Home"
            onPress={() => finish(false)}
            accessibilityLabel="Finish onboarding and go to Home"
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label="Set up automatic protection"
              onPress={() => finish(true)}
              accessibilityLabel="Set up automatic protection"
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
