/**
 * Image-lock presentation wrappers — locked spacing/type/radii from tokens.
 * Screens should prefer these over ad-hoc magic numbers.
 * Does not import from ./index to avoid circular deps.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { layout, radii, shadows, spacing, typography } from '@milerecover/config';
import { useAppTheme } from './ThemeProvider';
import { OnboardingScreen, TabScreen } from './screenShell';

export function MRScreen({
  children,
  style,
  footer,
  variant = 'onboarding',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
  variant?: 'tab' | 'onboarding';
}) {
  if (variant === 'tab') {
    return (
      <TabScreen style={style} footer={footer}>
        {children}
      </TabScreen>
    );
  }
  return (
    <OnboardingScreen style={style} footer={footer}>
      {children}
    </OnboardingScreen>
  );
}

export function MRHeader({
  title,
  left,
  right,
  onBack,
}: {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerSide}>
        {left ??
          (onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Text style={[styles.headerIconGlyph, { color: palette.text.primary }]}>‹</Text>
            </Pressable>
          ) : null)}
      </View>
      <View style={styles.headerCenter}>
        {title ? (
          <Text
            style={[styles.brandTitle, { color: palette.action.primary }]}
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
      </View>
      <View style={[styles.headerSide, styles.headerSideRight]}>{right}</View>
    </View>
  );
}

export function MRCard({
  children,
  style,
  onPress,
  selected,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: selected ? palette.action.selectedSurface : palette.background.card,
      borderColor: selected ? palette.action.selectedBorder : palette.border.default,
      borderWidth: selected ? 2 : 1,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        style={cardStyle}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

/** Dark-green hero surface — Home / Protection. */
export function MRHeroCard({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  const style = [
    styles.hero,
    {
      backgroundColor: palette.forest[900],
      borderColor: palette.forest[800],
    },
  ];
  if (onPress) {
    return (
      <Pressable
        style={style}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={style} accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

export function MRPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  const blocked = Boolean(disabled || loading);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: blocked ? palette.action.disabledSurface : palette.action.primary },
        pressed && !blocked && styles.pressed,
      ]}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
    >
      <Text
        style={[
          styles.primaryBtnText,
          { color: blocked ? palette.action.disabledText : palette.action.primaryText },
        ]}
      >
        {loading ? 'One moment…' : label}
      </Text>
    </Pressable>
  );
}

export function MRSecondaryButton({
  label,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryBtn,
        {
          backgroundColor: disabled ? palette.action.disabledSurface : 'transparent',
          borderColor: disabled ? palette.action.disabledSurface : palette.action.outlineBorder,
        },
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      <Text
        style={[
          styles.secondaryBtnText,
          { color: disabled ? palette.action.disabledText : palette.action.secondaryText },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MRIconCircle({
  glyph,
  accessibilityLabel,
  tone = 'ok',
}: {
  glyph: string;
  accessibilityLabel?: string;
  tone?: 'ok' | 'attention' | 'info';
}) {
  const { palette } = useAppTheme();
  const backgroundColor =
    tone === 'attention'
      ? '#FEF3C7'
      : tone === 'info'
        ? palette.background.mist
        : palette.background.mist;
  const color = tone === 'attention' ? '#B45309' : palette.action.primary;
  return (
    <View
      style={[styles.iconCircle, { backgroundColor }]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? glyph}
    >
      <Text style={[styles.iconGlyph, { color }]}>{glyph}</Text>
    </View>
  );
}

export function MRMetricTile({ label, value }: { label: string; value: string }) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: palette.background.card,
          borderColor: palette.border.default,
        },
      ]}
      accessibilityLabel={`${value} ${label}`}
    >
      <Text
        style={{
          color: palette.text.primary,
          fontSize: typography.size.bodyLarge,
          lineHeight: typography.lineHeight.body,
          fontWeight: '700',
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        style={{
          color: palette.text.secondary,
          fontSize: typography.size.caption,
          lineHeight: typography.lineHeight.caption,
          marginTop: spacing.xs,
          textAlign: 'center',
          fontWeight: '500',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function MRSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: palette.background.mist }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segment,
              selected && { backgroundColor: palette.background.card },
            ]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={{
                color: selected ? palette.action.secondaryText : palette.text.secondary,
                fontWeight: selected ? '600' : '400',
                fontSize: typography.size.body,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MRStatusPanel({
  message,
  tone = 'ok',
  onPress,
}: {
  message: string;
  tone?: 'ok' | 'attention' | 'info';
  onPress?: () => void;
}) {
  const { palette } = useAppTheme();
  const bg =
    tone === 'attention' ? palette.status.warningBg : palette.background.mist;
  const border =
    tone === 'attention' ? palette.status.warningAccent : palette.forest[500];
  const fg =
    tone === 'attention' ? palette.status.warning : palette.forest[700];
  const content = (
    <View style={styles.statusRow}>
      <MRIconCircle
        glyph={tone === 'attention' ? '!' : '✓'}
        tone={tone === 'attention' ? 'attention' : 'ok'}
        accessibilityLabel={tone === 'attention' ? 'Needs attention' : 'Status ok'}
      />
      <Text
        style={{
          flex: 1,
          color: fg,
          fontWeight: '600',
          fontSize: typography.size.caption,
          lineHeight: typography.lineHeight.caption,
        }}
        numberOfLines={3}
      >
        {message}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={message}
        style={[styles.statusPanel, { backgroundColor: bg, borderColor: border }]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      style={[styles.statusPanel, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="text"
      accessibilityLabel={message}
    >
      {content}
    </View>
  );
}

export function MRFormField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  autoCapitalize,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          color: palette.text.secondary,
          fontSize: typography.size.caption,
          marginBottom: spacing.xs,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.field,
          { backgroundColor: palette.input.surface, borderColor: palette.border.default },
        ]}
      >
        {onChangeText ? (
          <TextInput
            accessibilityLabel={accessibilityLabel ?? label}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            placeholderTextColor={palette.input.placeholder}
            style={{
              color: palette.input.text,
              fontSize: typography.size.bodyLarge,
              padding: 0,
            }}
          />
        ) : (
          <Text style={{ color: palette.input.text, fontSize: typography.size.bodyLarge }}>
            {value || placeholder || ''}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Collage welcome mark: dark-green rounded square with white path/shield. */
export function MRWelcomeLogo() {
  const { palette } = useAppTheme();
  return (
    <View
      style={[styles.welcomeLogo, { backgroundColor: palette.forest[900] }]}
      accessibilityRole="image"
      accessibilityLabel="MileRecover logo"
    >
      <View style={styles.welcomeLogoInner}>
        <View style={[styles.welcomeLogoPath, { backgroundColor: palette.text.inverse }]} />
        <View
          style={[
            styles.welcomeLogoShield,
            { borderColor: palette.text.inverse, backgroundColor: 'transparent' },
          ]}
        />
      </View>
    </View>
  );
}

export function MRProgressBar({ step, total }: { step: number; total: number }) {
  const { palette } = useAppTheme();
  const ratio = total <= 0 ? 0 : Math.min(1, Math.max(0, (step + 1) / total));
  return (
    <View style={styles.progressBlock} accessibilityLabel={`Step ${step + 1} of ${total}`}>
      <Text
        style={{
          color: palette.text.secondary,
          textAlign: 'center',
          fontWeight: '500',
          fontSize: typography.size.caption,
        }}
      >
        {step + 1} of {total}
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: palette.border.default }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(ratio * 100)}%` as `${number}%`, backgroundColor: palette.action.primary },
          ]}
        />
      </View>
    </View>
  );
}

export function MRWelcomeDots({ activeIndex = 0, total = 4 }: { activeIndex?: number; total?: number }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.dotsRow} accessibilityLabel={`Intro ${activeIndex + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? palette.action.primary : palette.border.default,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function MRTertiaryButton({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={styles.tertiaryBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={{ color: palette.action.secondaryText, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginBottom: spacing.sm,
  },
  headerSide: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconGlyph: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
  brandTitle: {
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.body,
    fontWeight: '700',
  },
  card: {
    borderRadius: radii.lg,
    padding: layout.cardPad,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  hero: {
    borderRadius: radii.xl,
    padding: layout.pageX,
    marginBottom: layout.section,
    borderWidth: 1,
    ...shadows.lifted,
  },
  primaryBtn: {
    borderRadius: 14,
    minHeight: layout.buttonH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: {
    fontWeight: '600',
    fontSize: typography.size.bodyLarge,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: layout.buttonH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    alignSelf: 'stretch',
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: typography.size.bodyLarge,
  },
  pressed: { opacity: 0.88 },
  iconCircle: {
    width: layout.iconCircle,
    height: layout.iconCircle,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: layout.iconGlyph,
    fontWeight: '700',
    lineHeight: layout.iconGlyph + 2,
  },
  metricTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.smMd,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
    minHeight: layout.segmentH,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  statusPanel: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.smMd,
    paddingHorizontal: layout.cardPad,
    marginBottom: layout.section,
    minHeight: layout.iconCircle + spacing.sm,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  field: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.fieldH,
    justifyContent: 'center',
  },
  welcomeLogo: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogoInner: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeLogoPath: {
    position: 'absolute',
    width: 8,
    height: 28,
    borderRadius: 4,
    transform: [{ rotate: '-18deg' }],
  },
  welcomeLogoShield: {
    width: 28,
    height: 32,
    borderWidth: 2.5,
    borderRadius: 6,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  progressBlock: {
    marginBottom: layout.section,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tertiaryBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
