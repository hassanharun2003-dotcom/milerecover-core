import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import { ONBOARDING_STEP_ORDER } from '../../product/types';
import {
  AppScreen,
  ChecklistRow,
  PrimaryButton,
  ProgressIndicator,
  ScrollScreen,
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

const NEED_OPTIONS = [
  'Keep future drives covered',
  'Find possible missing miles',
  'Bring existing history',
  'Get a report ready',
];

const USAGE_OPTIONS = [
  'Employee reimbursement',
  'Gig or independent driving',
  'Small business',
  'Other work driving',
];

export function OnboardingFlow() {
  const { finishOnboarding } = useApp();
  const {
    product,
    advanceOnboarding,
    backOnboarding,
    setOnboardingNeed,
    setOnboardingUsage,
    skipOptionalSetup,
  } = useProduct();

  const step = product.onboardingStep;
  const stepIndex = ONBOARDING_STEP_ORDER.indexOf(step);

  const content = useMemo(() => {
    switch (step) {
      case 'welcome':
        return {
          title: 'Quietly protect every work mile.',
          body: 'We’ll keep an eye on your work drives—and help you show them when you need to. No pressure. No invented miles.',
          primary: 'Start covering my miles',
          secondary: 'Bring existing mileage',
          onPrimary: advanceOnboarding,
          onSecondary: () => {
            setOnboardingNeed('Bring existing history');
            advanceOnboarding();
          },
        };
      case 'need_selection':
        return { mode: 'need' as const };
      case 'usage_type':
        return { mode: 'usage' as const };
      case 'protection_setup':
        return { mode: 'protection' as const };
      case 'optional_setup':
        return { mode: 'optional' as const };
      case 'ready':
        return { mode: 'ready' as const };
      default:
        return { mode: 'ready' as const };
    }
  }, [step, advanceOnboarding, setOnboardingNeed]);

  const finish = () => {
    advanceOnboarding();
    finishOnboarding();
  };

  return (
    <AppScreen>
      <ScrollScreen contentStyle={{ paddingTop: spacing.lg }}>
        <ProgressIndicator step={stepIndex} total={ONBOARDING_STEP_ORDER.length} />
        {stepIndex > 0 ? (
          <TertiaryButton
            label="Back"
            onPress={backOnboarding}
            accessibilityLabel="Go back to previous onboarding step"
          />
        ) : null}

        {'title' in content && content.title ? (
          <View>
            <WelcomeHero title={content.title} body={content.body ?? ''} />
            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <PrimaryButton label={content.primary!} onPress={content.onPrimary!} />
              {'secondary' in content && content.secondary ? (
                <SecondaryButton label={content.secondary} onPress={content.onSecondary!} />
              ) : null}
            </View>
          </View>
        ) : null}

        {content.mode === 'need' ? (
          <View>
            <Text style={[text.title, { marginBottom: spacing.sm }]}>What do you need today?</Text>
            <Text style={[text.body, { marginBottom: spacing.md }]}>
              One choice is enough. You can change this later.
            </Text>
            {NEED_OPTIONS.map((opt) => (
              <SelectionCard
                key={opt}
                title={opt}
                selected={product.onboardingNeed === opt}
                onPress={() => {
                  setOnboardingNeed(opt);
                  advanceOnboarding();
                }}
              />
            ))}
          </View>
        ) : null}

        {content.mode === 'usage' ? (
          <View>
            <Text style={[text.title, { marginBottom: spacing.sm }]}>How do you use work mileage?</Text>
            <Text style={[text.body, { marginBottom: spacing.md }]}>
              This helps MileRecover speak plainly—not like software.
            </Text>
            {USAGE_OPTIONS.map((opt) => (
              <SelectionCard
                key={opt}
                title={opt}
                selected={product.onboardingUsage === opt}
                onPress={() => {
                  setOnboardingUsage(opt);
                  advanceOnboarding();
                }}
              />
            ))}
          </View>
        ) : null}

        {content.mode === 'protection' ? (
          <View>
            <Text style={[text.title, { marginBottom: spacing.sm }]}>How protection works</Text>
            <Text style={[text.body, { marginBottom: spacing.md }]}>
              MileRecover works best with location and background access. We never pretend permissions are granted until you enable them.
            </Text>
            <SoftPanel>
              <ChecklistRow label="Location access" status="pending" />
              <ChecklistRow label="Background tracking" status="pending" />
              <ChecklistRow label="Battery-friendly capture" status="planned" />
              <ChecklistRow label="Offline saving" status="planned" />
            </SoftPanel>
            <StatusCard
              variant="neutral"
              title="Your data stays yours"
              body="Trips live on your device first. Nothing is shared unless you choose to share it."
              emphasis="subtle"
            />
            <PrimaryButton label="Continue" onPress={advanceOnboarding} />
          </View>
        ) : null}

        {content.mode === 'optional' ? (
          <View>
            <Text style={[text.title, { marginBottom: spacing.sm }]}>Optional details</Text>
            <Text style={[text.body, { marginBottom: spacing.md }]}>
              These help later reports. Skip anytime—you can add them from Profile.
            </Text>
            <SelectionCard
              title="Remind me: add a vehicle"
              body="Available from Profile after setup"
              selected={false}
              onPress={advanceOnboarding}
            />
            <SelectionCard
              title="Remind me: add work places"
              body="Available from Profile after setup"
              selected={false}
              onPress={advanceOnboarding}
            />
            <SelectionCard
              title="Remind me: set work pattern"
              body="Available from Profile after setup"
              selected={false}
              onPress={advanceOnboarding}
            />
            <TertiaryButton label="Skip for now" onPress={skipOptionalSetup} />
          </View>
        ) : null}

        {content.mode === 'ready' ? (
          <View>
            <StatusCard
              variant="success"
              title="You're set"
              body="Drive as usual. We’ll ask when something needs a quick look—never invent miles while you’re exploring."
              emphasis="hero"
            />
            <SoftPanel>
              <Text style={[text.caption, { marginBottom: spacing.sm }]}>COMING WITH TRACKING</Text>
              <ChecklistRow label="Location access" status="pending" />
              <ChecklistRow label="Background access" status="pending" />
              <Text style={[text.caption, { marginTop: spacing.sm }]}>
                Not granted yet—they unlock when tracking ships and you approve the system prompts.
              </Text>
            </SoftPanel>
            <PrimaryButton
              label="Go to Home"
              onPress={finish}
              accessibilityLabel="Finish onboarding and go to Home"
            />
          </View>
        ) : null}
      </ScrollScreen>
    </AppScreen>
  );
}
