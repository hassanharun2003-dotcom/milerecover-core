import React, { useMemo } from 'react';
import { View } from 'react-native';
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
  StatusCard,
  SummaryCard,
  TertiaryButton,
  WelcomeHero,
} from '../../design-system';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';

const NEED_OPTIONS = [
  'Protect future drives',
  'Recover possible missing mileage',
  'Bring existing history',
  'Prepare a report',
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
          title: 'Protect every work mile.',
          body: 'We track new drives, find what others miss, and help you prove every mile with confidence.',
          primary: 'Protect my miles',
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
        {stepIndex > 0 ? <TertiaryButton label="Back" onPress={backOnboarding} accessibilityLabel="Go back to previous onboarding step" /> : null}

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
            <StatusCard variant="info" title="What do you need today?" body="One choice is enough. You can change this later." />
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
            <StatusCard variant="info" title="How do you use work mileage?" body="This helps MileRecover speak your language—not an accountant's." />
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
            <StatusCard
              variant="info"
              title="Set up your protection"
              body="MileRecover works best with location and background access. We never pretend permissions are granted until you enable them."
            />
            <View style={[cardShell, { marginBottom: spacing.md }]}>
              <ChecklistRow label="Location access" status="pending" />
              <ChecklistRow label="Background tracking" status="pending" />
              <ChecklistRow label="Battery optimization" status="planned" />
              <ChecklistRow label="Offline recording" status="planned" />
            </View>
            <StatusCard
              variant="neutral"
              title="Your data stays yours"
              body="Trips are stored on your device first. Nothing is shared without your action."
            />
            <PrimaryButton label="Continue" onPress={advanceOnboarding} />
          </View>
        ) : null}

        {content.mode === 'optional' ? (
          <View>
            <StatusCard
              variant="info"
              title="Optional setup"
              body="These details help later reports. You can add them from Profile after Home—skipping is always safe."
            />
            <SelectionCard
              title="Remind me: add a vehicle"
              body="Available from Profile after setup—not enabled yet"
              selected={false}
              onPress={advanceOnboarding}
            />
            <SelectionCard
              title="Remind me: add work locations"
              body="Available from Profile after setup—not enabled yet"
              selected={false}
              onPress={advanceOnboarding}
            />
            <SelectionCard
              title="Remind me: set work pattern"
              body="Available from Profile after setup—not enabled yet"
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
              title="You're ready to explore"
              body="Onboarding is complete. Location and background protection are not granted yet—they unlock when tracking is implemented and you approve system prompts."
            />
            <SummaryCard
              items={[
                { label: 'Background access', value: 'Not granted yet' },
                { label: 'Location access', value: 'Not granted yet' },
                { label: 'Battery optimization', value: 'Guidance only' },
              ]}
            />
            <PrimaryButton label="Go to Home" onPress={finish} accessibilityLabel="Finish onboarding and go to Home" />
          </View>
        ) : null}
      </ScrollScreen>
    </AppScreen>
  );
}

const cardShell = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#E7E5E4',
  padding: 16,
};
