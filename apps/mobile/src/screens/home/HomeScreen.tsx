import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import { Card, ScreenContainer, uiStyles } from '../../components/ui';
import { selectHomeViewModel } from '../../selectors/homeSelectors';
import { useApp } from '../../store/AppContext';

function levelColor(level: string): string {
  switch (level) {
    case 'protected':
      return colors.protected[600];
    case 'attention':
      return colors.review[600];
    case 'at_risk':
    case 'limited':
      return colors.danger[600];
    default:
      return colors.neutral[700];
  }
}

export function HomeScreen() {
  const { state, permissions } = useApp();
  const vm = selectHomeViewModel(state, permissions);

  return (
    <ScreenContainer>
      <Text style={uiStyles.title} accessibilityRole="header">
        Home
      </Text>

      <Card accessibilityLabel={`Protection health: ${vm.protection.userLabel}`}>
        <Text style={styles.cardLabel}>Protection Health</Text>
        <Text style={[styles.level, { color: levelColor(vm.protection.level) }]}>
          {vm.protection.userLabel}
        </Text>
        <Text style={uiStyles.body}>{vm.protection.userDetail}</Text>
        <Text style={styles.meta}>Tracking: {state.trackingEngineState}</Text>
      </Card>

      {vm.showAlert && vm.alertMessage ? (
        <Card accessibilityLabel="Action needed">
          <Text style={styles.alertTitle}>Action needed</Text>
          <Text style={uiStyles.body}>{vm.alertMessage}</Text>
        </Card>
      ) : null}

      <Card accessibilityLabel="Today summary">
        <Text style={styles.cardLabel}>Today</Text>
        <Text style={uiStyles.body}>{vm.todaySummary}</Text>
      </Card>

      <Card accessibilityLabel="Protected mileage this period">
        <Text style={styles.cardLabel}>{state.reportingPeriod.label}</Text>
        <Text style={uiStyles.metric}>{vm.periodProtectedMiles.toFixed(1)} mi protected</Text>
        <Text style={styles.meta}>Confirmed business miles only</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  level: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  meta: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text.secondary,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.review[600],
    marginBottom: spacing.xs,
  },
});
