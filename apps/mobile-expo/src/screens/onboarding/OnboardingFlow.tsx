import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  DRIVING_PATTERN_OPTIONS,
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

function optionLabel<T extends string>(options: { id: T; label: string }[], id: T | null): string {
  return options.find((option) => option.id === id)?.label ?? 'Not set';
}

function readyBody(goal: typeof PRIMARY_GOAL_OPTIONS[number]['id'] | null, pains: PainPoint[]): string {
  if (pains.includes('older_mileage')) {
    return 'You’re ready to bring older miles back together — nothing is added without your say-so.';
  }
  if (goal === 'employee_reimbursement') {
    return 'Your reimbursement record is ready to begin.';
  }
  if (goal === 'gig_delivery') {
    return 'You’re ready to protect your first work shift.';
  }
  if (goal === 'self_employed_business') {
    return 'Your business mileage record is ready.';
  }
  return 'You’re set. Home will show what to do next.';
}

function remapLegacyStep(step: ProductOnboardingStep): ProductOnboardingStep {
  if (ONBOARDING_STEP_ORDER.includes(step)) return step;
  if (step === 'permissions_education') return 'ready';
  return 'protection_education';
}

export function OnboardingFlow() {
  const { finishOnboarding } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    patchOnboarding,
    setOnboardingStep,
    setPrimaryGoal,
    setSelectedPainPoints,
    setDrivingType,
    setProtectionSetupState,
    completeProductOnboarding,
  } = useProduct();

  const step = remapLegacyStep(product.onboardingStep);
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);
  const selectedPainPoints = product.selectedPainPoints;

  useEffect(() => {
    if (product.onboardingStep !== step) {
      setOnboardingStep(step);
    }
  }, [product.onboardingStep, setOnboardingStep, step]);

  useEffect(() => {
    logEvent(ANALYTICS_EVENTS.onboardingStepViewed, { step });
  }, [step]);

  const finish = (deepLink: boolean) => {
    completeProductOnboarding(deepLink ? next.route : null);
    logEvent(ANALYTICS_EVENTS.onboardingCompleted, {
      goal: product.primaryGoal ?? 'unset',
      painCount: product.selectedPainPoints.length,
      nextAction: next.id,
    });
    finishOnboarding();
  };

  const togglePainPoint = (painPoint: PainPoint) => {
    const nextPainPoints = selectedPainPoints.includes(painPoint)
      ? selectedPainPoints.filter((item) => item !== painPoint)
      : [...selectedPainPoints, painPoint];
    setSelectedPainPoints(nextPainPoints);
  };

  const protectionPanels = useMemo(
    () => [
      ['A drive happens', 'MileRecover can quietly notice movement when you turn watching on.'],
      ['You stay in control', 'Anything uncertain waits in Review. We never invent miles or silently decide work vs personal.'],
    ],
    [],
  );

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
            Your miles. Protected. Nothing left behind.
          </Text>
          <Text style={[text.body, { marginBottom: spacing.sm }]}>
            Capture, recover, review, and prove your work mileage — without inventing anything.
          </Text>
          <CarRouteHero />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Protect my miles"
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
                setOnboardingStep('driving_pattern');
              }}
            />
          </View>
        </View>
      ) : null}

      {step === 'primary_goal' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            What do you need MileRecover to protect?
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
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What usually causes the most trouble?</Text>
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

      {step === 'driving_pattern' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How do your work drives look?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>Tap one. We’ll use the right words.</Text>
          {DRIVING_PATTERN_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={product.drivingType === opt.id}
              onPress={() => {
                setDrivingType(opt.id);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'protection_education' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            You stay in control. We never invent miles or silently decide uncertain drives.
          </Text>
          <CarRouteHero compact />
          {protectionPanels.map(([title, body]) => (
            <SoftPanel key={title}>
              <Text style={[text.subtitle, { marginBottom: spacing.xs }]}>{title}</Text>
              <Text style={text.body}>{body}</Text>
            </SoftPanel>
          ))}
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setProtectionSetupState('educated');
              patchOnboarding({
                protectionEducationAcknowledged: true,
                completedSteps: [...product.onboarding.completedSteps, 'protection_education'],
              });
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'ready' ? (
        <View>
          <StatusCard
            variant="success"
            title="You’re ready"
            body={readyBody(product.primaryGoal, product.selectedPainPoints)}
            emphasis="hero"
          />
          <Text style={[text.caption, { marginBottom: spacing.md }]}>
            {PRIMARY_GOAL_OPTIONS.find((g) => g.id === product.primaryGoal)?.label ?? 'Your miles'}
            {' · '}
            {optionLabel(DRIVING_PATTERN_OPTIONS, product.drivingType)}
          </Text>
          <PrimaryButton
            label="Go to Home"
            onPress={() => finish(false)}
            accessibilityLabel="Finish onboarding and go to Home"
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label={next.cta}
              onPress={() => finish(true)}
              accessibilityLabel={next.cta}
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
