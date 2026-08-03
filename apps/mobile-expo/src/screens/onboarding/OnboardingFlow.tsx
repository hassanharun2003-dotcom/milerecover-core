import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  DRIVING_TYPE_OPTIONS,
  ONBOARDING_STEP_ORDER,
  PRIMARY_GOAL_OPTIONS,
  type DrivingType,
  type PrimaryGoal,
} from '../../product/types';
import { nextActionForGoal } from '../../product/copy';
import {
  ChecklistRow,
  FormField,
  OnboardingScreen,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
  SelectionCard,
  SoftPanel,
  StatusCard,
  TertiaryButton,
  WelcomeHero,
  text,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';

export function OnboardingFlow() {
  const { finishOnboarding } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setPrimaryGoal,
    setDrivingType,
    setPreferredName,
    setProtectionSetupState,
    skipPreferredName,
    completeProductOnboarding,
  } = useProduct();

  const [nameDraft, setNameDraft] = useState(product.preferredName ?? '');
  const step = product.onboardingStep;
  const stepIndex = Math.max(0, ONBOARDING_STEP_ORDER.indexOf(step));
  const next = nextActionForGoal(product.primaryGoal);

  const finish = (deepLink: boolean) => {
    completeProductOnboarding(deepLink ? next.route : null);
    finishOnboarding();
  };

  const welcome = useMemo(
    () => ({
      title: 'Protect every work mile.',
      body: 'MileRecover saves future drives, helps find missing mileage, and prepares records you can share—without inventing miles.',
    }),
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
          <WelcomeHero title={welcome.title} body={welcome.body} />
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton label="Get started" onPress={advanceOnboarding} />
            <SecondaryButton
              label="Bring existing mileage"
              onPress={() => {
                setPrimaryGoal('bring_history');
                advanceOnboarding();
              }}
            />
          </View>
        </View>
      ) : null}

      {step === 'primary_goal' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>
            What would help you most right now?
          </Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            One selection is enough. We’ll use it to choose your next step.
          </Text>
          {PRIMARY_GOAL_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={product.primaryGoal === opt.id}
              onPress={() => {
                setPrimaryGoal(opt.id as PrimaryGoal);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'driving_type' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How do you use work mileage?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            This changes how MileRecover talks—and what a report is for.
          </Text>
          {DRIVING_TYPE_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.id}
              title={opt.label}
              selected={product.drivingType === opt.id}
              onPress={() => {
                setDrivingType(opt.id as DrivingType);
                advanceOnboarding();
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'preferred_name' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>What should we call you?</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            Optional. Used sparingly—like a calm greeting, not on every card.
          </Text>
          <FormField
            label="Preferred name"
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="First name"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setPreferredName(nameDraft.trim() || null);
              advanceOnboarding();
            }}
          />
          <TertiaryButton
            label="Skip for now"
            onPress={() => {
              setPreferredName(null);
              skipPreferredName();
            }}
          />
        </View>
      ) : null}

      {step === 'protection_setup' ? (
        <View>
          <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
          <Text style={[text.body, { marginBottom: spacing.md }]}>
            We explain before any system prompt. We never pretend permissions are granted until Android
            confirms them—and never label unavailable features Ready.
          </Text>
          <SoftPanel>
            <ChecklistRow label="Location permission" status="pending" />
            <ChecklistRow label="Background location" status="pending" />
            <ChecklistRow label="Battery optimization" status="planned" />
            <ChecklistRow label="Notifications" status="planned" />
            <ChecklistRow label="Tracking engine" status="planned" />
            <Text style={[text.caption, { marginTop: spacing.sm }]}>
              Not granted yet—automatic capture is not active in this preview.
            </Text>
          </SoftPanel>
          <StatusCard
            variant="neutral"
            title="Your data stays yours"
            body="Trips live on this device first. Nothing is shared unless you choose to share it."
            emphasis="subtle"
          />
          <PrimaryButton
            label="Continue"
            onPress={() => {
              setProtectionSetupState('educated');
              advanceOnboarding();
            }}
          />
        </View>
      ) : null}

      {step === 'next_action' ? (
        <View>
          <StatusCard
            variant="success"
            title={next.title}
            body={next.body}
            emphasis="hero"
          />
          <PrimaryButton
            label={next.cta}
            onPress={() => finish(true)}
            accessibilityLabel={next.cta}
          />
          <View style={{ marginTop: spacing.sm }}>
            <SecondaryButton
              label="Go to Home"
              onPress={() => finish(false)}
              accessibilityLabel="Finish onboarding and go to Home"
            />
          </View>
        </View>
      ) : null}
    </OnboardingScreen>
  );
}
