import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import { Card, ScreenContainer, uiStyles } from '../../components/ui';
import { selectProofViewModel } from '../../selectors/proofSelectors';
import { useApp } from '../../store/AppContext';

export function ProofScreen() {
  const { state } = useApp();
  const proof = selectProofViewModel(state);

  return (
    <ScreenContainer>
      <Text style={uiStyles.title} accessibilityRole="header">
        Proof
      </Text>
      <Card accessibilityLabel="Proof summary">
        <Text style={styles.label}>{proof.periodLabel}</Text>
        <Text style={uiStyles.metric}>{proof.confirmedBusinessMiles.toFixed(1)} business mi</Text>
        {proof.estimatedDeductionCents != null ? (
          <Text style={uiStyles.body}>
            Est. deduction: ${(proof.estimatedDeductionCents / 100).toFixed(2)}
            {'\n'}
            {proof.estimatedDeductionLabel}
          </Text>
        ) : (
          <Text style={uiStyles.body}>Configure a mileage rate in Profile to see an estimate.</Text>
        )}
        <Text style={styles.status}>Status: {proof.completeness.replace('_', ' ')}</Text>
        {proof.unresolvedReviewCount > 0 ? (
          <Text style={uiStyles.body}>{proof.unresolvedReviewCount} review item(s) open.</Text>
        ) : null}
        {proof.staleDataWarning ? <Text style={styles.warn}>{proof.staleDataWarning}</Text> : null}
      </Card>
      <Card accessibilityLabel="Export unavailable">
        <Text style={uiStyles.body}>
          Export and PDF reports are not available in this package. Preview only.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.text.secondary, marginBottom: spacing.xs },
  status: { marginTop: spacing.md, fontWeight: '600', color: colors.forest[700] },
  warn: { marginTop: spacing.sm, color: colors.review[600] },
});
