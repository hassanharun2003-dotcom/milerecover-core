import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@milerecover/config';
import { Card, ScreenContainer, uiStyles } from '../../components/ui';
import { useApp } from '../../store/AppContext';

export function ManualTripScreen() {
  return (
    <ScreenContainer>
      <Text style={uiStyles.title} accessibilityRole="header">
        Add trip
      </Text>
      <Card accessibilityLabel="Manual trip guidance">
        <Text style={uiStyles.body}>
          Automatic capture is the default. Use manual entry only when you drove without tracking or
          need to record a trip yourself.
        </Text>
        <Text style={styles.note}>Manual trip form — Package 3 increment (no fake prefilled data).</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  note: {
    marginTop: spacing.md,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});
