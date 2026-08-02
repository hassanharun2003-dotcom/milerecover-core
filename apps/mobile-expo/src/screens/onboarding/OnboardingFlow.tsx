import React, { useMemo } from 'react';
import { View } from 'react-native';
import { spacing } from '@milerecover/config';
import { ONBOARDING_STEP_ORDER } from '../../product/types';
import {
  AppScreen,
  PrimaryButton,
  ProgressIndicator,
  SafeAreaFooter,
  ScrollScreen,
  SecondaryButton,
  SelectionCard,
  StatusCard,
  SummaryCard,
  TertiaryButton,
  text,
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
          body: 'Track new drives, notice possible gaps, and keep clear proof without babysitting another mileage app.',
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
        {stepIndex > 0 ? <TertiaryButton label="Back" onPress={backOnboarding} /> : null}

        {'title' in content && content.title ? (
          <View>
            <StatusCard variant="success" title={content.title} body={content.body ?? ''} />
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
            <StatusCard variant="info" title="What do you need today?" body="Choose what matters most right now. You can change this later." />
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
              body="MileRecover works best with location and background protection. We will never pretend permissions are granted until you enable them."
            />
            <SummaryCard
              items={[
                { label: 'Location', value: 'Education only' },
                { label: 'Background', value: 'Planned' },
                { label: 'Battery', value: 'Guidance' },
                { label: 'Offline', value: 'Supported later' },
              ]}
            />
            <PrimaryButton label="Continue" onPress={advanceOnboarding} />
          </View>
        ) : null}

        {content.mode === 'optional' ? (
          <View>
            <StatusCard variant="info" title="Optional setup" body="Add details when you are ready. Skipping is always safe." />
            <SelectionCard title="Add a vehicle" body="Name the car you usually drive for work" selected={false} onPress={advanceOnboarding} />
            <SelectionCard title="Add work locations" body="Help MileRecover understand your routine" selected={false} onPress={advanceOnboarding} />
            <SelectionCard title="Set your work pattern" body="Optional schedule hints for recovery" selected={false} onPress={advanceOnboarding} />
            <TertiaryButton label="Skip for now" onPress={skipOptionalSetup} />
          </View>
        ) : null}

        {content.mode === 'ready' ? (
          <View>
            <StatusCard
              variant="success"
              title="You're all set"
              body="Protection is configured. MileRecover will monitor your drives and surface anything that needs your attention."
            />
            <SummaryCard
              items={[
                { label: 'Monitoring', value: 'Active' },
                { label: 'Review inbox', value: 'Ready' },
                { label: 'Proof', value: 'When you are' },
              ]}
            />
            <PrimaryButton label="Enter MileRecover" onPress={finish} />
          </View>
        ) : null}
      </ScrollScreen>
    </AppScreen>
  );
}
