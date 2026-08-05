import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@milerecover/config';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, style, accessibilityLabel }: CardProps) {
  return (
    <View style={[styles.card, style]} accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function PrimaryButton({ label, onPress, accessibilityLabel }: PrimaryButtonProps) {
  return (
    <Text
      style={styles.primaryButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {label}
    </Text>
  );
}

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export const uiStyles = StyleSheet.create({
  title: {
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    color: colors.text.secondary,
  },
  metric: {
    fontSize: typography.size.title,
    fontWeight: '600',
    color: colors.forest[700],
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  primaryButton: {
    backgroundColor: colors.forest[600],
    color: colors.text.inverse,
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    overflow: 'hidden',
    fontSize: typography.size.body,
    fontWeight: '600',
    minHeight: 48,
  },
});
