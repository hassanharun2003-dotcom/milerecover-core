import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import { Card, PrimaryButton, ScreenContainer, uiStyles } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function OnboardingFlow() {
  const { state, completeOnboardingStep, finishOnboarding } = useApp();
  const step = state.onboarding.currentStep;

  const content = (() => {
    switch (step) {
      case 'welcome':
        return {
          title: 'Protect every work mile.',
          body: 'MileRecover tracks drives automatically and helps you recover trips you might have missed.',
          primary: 'Get Started',
          onPrimary: () => completeOnboardingStep('next'),
        };
      case 'location_permission':
        return {
          title: 'Location powers automatic protection',
          body: 'We use your location to detect drives and find gaps. Background access lets protection continue when the app is closed.',
          primary: 'Continue',
          onPrimary: () => completeOnboardingStep('next'),
        };
      case 'motion_permission':
        return {
          title: 'Motion helps detect drives',
          body: 'Activity recognition improves trip detection. You can skip this and still use manual review.',
          primary: 'Continue',
          secondary: 'Skip for now',
          onPrimary: () => completeOnboardingStep('next'),
          onSecondary: () => completeOnboardingStep('skip_motion'),
        };
      case 'ready_check':
        return {
          title: 'Check your protection setup',
          body: 'Grant any missing permissions in Settings. You can fix tracking anytime from Profile.',
          primary: 'Enter MileRecover',
          onPrimary: () => {
            completeOnboardingStep('next');
            finishOnboarding();
          },
        };
      default:
        throw new Error(`Unknown onboarding step: ${String(step)}`);
    }
  })();

  return (
    <ScreenContainer>
      <Card accessibilityLabel="Onboarding step">
        <Text style={uiStyles.title}>{content.title}</Text>
        <Text style={[uiStyles.body, styles.bodyGap]}>{content.body}</Text>
        <PrimaryButton label={content.primary} onPress={content.onPrimary} />
        {'secondary' in content && content.secondary && content.onSecondary ? (
          <Text
            style={styles.secondary}
            onPress={content.onSecondary}
            accessibilityRole="button"
            accessibilityLabel={content.secondary}
          >
            {content.secondary}
          </Text>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bodyGap: { marginBottom: spacing.lg },
  secondary: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.forest[600],
    fontSize: 16,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
});
