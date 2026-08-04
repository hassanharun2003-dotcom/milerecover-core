import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@milerecover/config';

const GUTTER = spacing.md;

type ShellProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
};

/**
 * Tab root screens — pad status bar / notch; tab bar owns the bottom inset.
 */
export function TabScreen({ children, style, contentStyle, footer }: ShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flex,
        {
          paddingTop: insets.top,
          paddingLeft: Math.max(insets.left, GUTTER),
          paddingRight: Math.max(insets.right, GUTTER),
          backgroundColor: colors.background.canvas,
        },
        style,
      ]}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

/**
 * Pushed stack screens under a native header — header owns the top;
 * pad bottom for Android system navigation / home indicator.
 */
export function StackScrollScreen({ children, style, contentStyle, footer }: ShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[
        styles.flex,
        {
          paddingLeft: Math.max(insets.left, GUTTER),
          paddingRight: Math.max(insets.right, GUTTER),
          backgroundColor: colors.background.canvas,
        },
        style,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              (footer ? spacing.xl : Math.max(insets.bottom, spacing.xl)) + spacing.md,
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={{
            paddingBottom: Math.max(insets.bottom, spacing.sm),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border.default,
            backgroundColor: colors.background.canvas,
            paddingTop: spacing.sm,
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/**
 * Full-bleed onboarding — all edges respected.
 */
export function OnboardingScreen({ children, style, contentStyle, footer }: ShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flex,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: footer ? spacing.sm : Math.max(insets.bottom, spacing.md),
          paddingLeft: Math.max(insets.left, GUTTER),
          paddingRight: Math.max(insets.right, GUTTER),
          backgroundColor: colors.background.canvas,
        },
        style,
      ]}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, spacing.sm), paddingTop: spacing.sm }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Non-scrolling full screen (startup / gates).
 */
export function SafeFillScreen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.flex,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          paddingLeft: Math.max(insets.left, GUTTER),
          paddingRight: Math.max(insets.right, GUTTER),
          backgroundColor: colors.background.canvas,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Stack screen with a fixed header that reserves its own layout space
 * (never overlays scroll content). Used by Plans billing toggle, etc.
 */
export function FixedHeaderScrollScreen({
  header,
  children,
  style,
  contentStyle,
  scrollKey,
}: ShellProps & { header: React.ReactNode; scrollKey?: string | number | boolean }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  React.useEffect(() => {
    if (scrollKey === undefined) return;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollKey]);
  return (
    <View
      style={[
        styles.flex,
        {
          paddingLeft: Math.max(insets.left, GUTTER),
          paddingRight: Math.max(insets.right, GUTTER),
          backgroundColor: colors.background.canvas,
        },
        style,
      ]}
    >
      <View style={styles.fixedHeader}>{header}</View>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  fixedHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.canvas,
  },
});
