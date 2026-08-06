import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, radii, shadows, spacing, touchTarget, typography, type AppPalette } from '@milerecover/config';
import { statusColors, type StatusVariant } from './theme';
import { useAppTheme } from './ThemeProvider';
import {
  TabScreen,
  StackScrollScreen,
  OnboardingScreen,
  SafeFillScreen,
  FixedHeaderScrollScreen,
} from './screenShell';
export {
  TabScreen,
  StackScrollScreen,
  OnboardingScreen,
  SafeFillScreen,
  FixedHeaderScrollScreen,
};
export { ThemeProvider, useAppTheme } from './ThemeProvider';
export {
  MRScreen,
  MRHeader,
  MRCard,
  MRHeroCard,
  MRPrimaryButton,
  MRSecondaryButton,
  MRIconCircle,
  MRMetricTile,
  MRSegmentedControl,
  MRStatusPanel,
  MRFormField,
  MRTertiaryButton,
  MRWelcomeLogo,
  MRProgressBar,
  MRWelcomeDots,
} from './imageLock';

export const text = StyleSheet.create({
  display: {
    fontSize: typography.size.display,
    lineHeight: typography.lineHeight.display,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headline: {
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    fontWeight: '700',
    color: colors.text.primary,
  },
  title: {
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
    color: colors.text.secondary,
  },
  inverse: {
    color: colors.text.inverse,
  },
  tabular: {
    fontVariant: typography.tabularNums as unknown as TextStyle['fontVariant'],
  },
});

const cardBase = {
  backgroundColor: colors.background.card,
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: colors.border.default,
  padding: spacing.md,
  ...shadows.card,
} as const;

type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'action' | 'disabled';

function toneColor(palette: AppPalette, tone: TextTone = 'primary'): string {
  switch (tone) {
    case 'secondary':
      return palette.text.secondary;
    case 'muted':
      return palette.text.muted;
    case 'inverse':
      return palette.text.inverse;
    case 'action':
      return palette.action.secondaryText;
    case 'disabled':
      return palette.text.disabled;
    default:
      return palette.text.primary;
  }
}

function themedText(palette: AppPalette, tone: TextTone = 'primary'): TextStyle {
  return { color: toneColor(palette, tone) };
}

function themedCard(palette: AppPalette): ViewStyle {
  return {
    backgroundColor: palette.background.card,
    borderColor: palette.border.default,
  };
}

function themedPanel(palette: AppPalette): ViewStyle {
  return {
    backgroundColor: palette.background.mist,
    borderColor: palette.border.default,
  };
}

function themedInput(palette: AppPalette): ViewStyle {
  return {
    backgroundColor: palette.input.surface,
    borderColor: palette.border.default,
  };
}

export function AppScreen({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const { palette } = useAppTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: palette.background.canvas }, style]}>
      {children}
    </SafeAreaView>
  );
}

/**
 * @deprecated Prefer TabScreen or StackScrollScreen for correct Android safe areas.
 * Kept as an alias to StackScrollScreen for gradual migration.
 */
export { StackScrollScreen as ScrollScreen } from './screenShell';

export function AppHeader({
  title,
  subtitle,
  onBack,
  dark = true,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  dark?: boolean;
}) {
  const { palette } = useAppTheme();
  const headerText = dark ? themedText(palette, 'inverse') : themedText(palette);
  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Text style={[text.body, headerText]}>← Back</Text>
        </Pressable>
      ) : null}
      <Text style={[text.title, headerText]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[text.body, headerText, styles.headerSub]}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[text.subtitle, themedText(palette)]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={[styles.link, themedText(palette, 'action')]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: StatusVariant }) {
  const { palette } = useAppTheme();
  const c = statusColors(variant, palette);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]} accessibilityLabel={label}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  const blocked = Boolean(disabled || loading);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        { backgroundColor: palette.action.primary },
        blocked && {
          backgroundColor: palette.action.disabledSurface,
          borderColor: palette.action.disabledSurface,
        },
        pressed && !disabled && !loading && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
    >
      <Text style={[styles.primaryBtnText, { color: blocked ? palette.action.disabledText : palette.action.primaryText }]}>
        {loading ? 'One moment…' : label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, accessibilityLabel, compact }: {
  label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string; compact?: boolean;
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
        compact && styles.secondaryBtnCompact,
        pressed && !disabled && styles.btnPressed,
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

/** Compact selectable chip — never word-breaks labels across tiny flex columns. */
export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        {
          backgroundColor: selected ? palette.action.selectedSurface : palette.background.card,
          borderColor: selected ? palette.action.selectedBorder : palette.action.outlineBorder,
        },
        pressed && styles.btnPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          { color: selected ? palette.text.primary : palette.action.secondaryText },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.chipRowScroll}
    >
      {children}
    </ScrollView>
  );
}

export function TertiaryButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  const { palette } = useAppTheme();
  return (
    <Pressable style={styles.tertiaryBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={[styles.tertiaryBtnText, themedText(palette, 'action')]}>{label}</Text>
    </Pressable>
  );
}

export function DestructiveButton({ label, onPress, disabled, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.destructiveBtn,
        {
          backgroundColor: disabled ? palette.action.disabledSurface : palette.status.dangerBg,
          borderColor: disabled ? palette.action.disabledSurface : palette.status.danger,
        },
        pressed && !disabled && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.destructiveBtnText, { color: disabled ? palette.action.disabledText : palette.status.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OfflineBanner({ body = 'Saved safely offline. Sync will resume when you are back online.' }: { body?: string }) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.offlineBanner, themedPanel(palette)]} accessibilityRole="text" accessibilityLabel={body}>
      <Text style={[text.caption, themedText(palette), { fontWeight: '600' }]}>Offline</Text>
      <Text style={[text.caption, themedText(palette, 'secondary'), { marginTop: 2 }]}>{body}</Text>
    </View>
  );
}

export function ErrorBanner({ title, body }: { title: string; body: string }) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        styles.errorBanner,
        { backgroundColor: palette.status.dangerBg, borderColor: palette.status.danger },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${body}`}
    >
      <Text style={[text.subtitle, { color: palette.status.danger }]}>{title}</Text>
      <Text style={[text.body, themedText(palette), { marginTop: spacing.xs }]}>{body}</Text>
    </View>
  );
}

export function FormError({ message }: { message: string }) {
  const { palette } = useAppTheme();
  return (
    <Text style={[styles.formError, { color: palette.status.danger }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

export function UndoSnackbar({
  message,
  onUndo,
  onDismiss,
}: {
  message: string;
  onUndo: () => void;
  onDismiss?: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={[styles.undoSnackbar, { backgroundColor: palette.neutral[900] }]} accessibilityRole="summary" accessibilityLabel={message}>
      <Text style={[text.body, themedText(palette, 'inverse'), { flex: 1 }]}>{message}</Text>
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        accessibilityLabel="Undo"
        style={styles.undoSnackbarAction}
      >
        <Text style={[styles.undoSnackbarActionText, { color: palette.forest[100] }]}>Undo</Text>
      </Pressable>
      {onDismiss ? (
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.undoSnackbarAction}>
          <Text style={[styles.undoSnackbarActionText, { color: palette.forest[100] }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SoftPanel({ children }: { children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return <View style={[styles.softPanel, themedPanel(palette)]}>{children}</View>;
}

export function StatusCard({
  title,
  body,
  variant = 'success',
  actionLabel,
  onAction,
  emphasis = 'default',
}: {
  title: string;
  body: string;
  variant?: StatusVariant;
  actionLabel?: string;
  onAction?: () => void;
  /** hero = one dark focal surface; subtle = borderless calm panel */
  emphasis?: 'default' | 'hero' | 'subtle';
}) {
  const { palette } = useAppTheme();
  const c = statusColors(variant, palette);
  const isAlert = variant === 'warning' || variant === 'danger';
  const isHeroSuccess = variant === 'success' && emphasis === 'hero';
  const isSubtle = emphasis === 'subtle';
  return (
    <View
      style={[
        styles.statusCard,
        isAlert
          ? { backgroundColor: c.bg, borderColor: c.fg }
          : isHeroSuccess
            ? [
                styles.statusCardProtected,
                { backgroundColor: palette.forest[800], borderColor: palette.forest[700] },
              ]
            : isSubtle
              ? [styles.statusCardSubtle, themedCard(palette)]
              : { backgroundColor: c.bg, borderColor: palette.border.default },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${body}`}
    >
      <Text
        style={[
          text.subtitle,
          isAlert
            ? { color: c.fg }
            : isHeroSuccess
              ? [styles.statusProtectedTitle, themedText(palette, 'inverse')]
              : themedText(palette),
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          text.body,
          isAlert
            ? themedText(palette)
            : isHeroSuccess
              ? [styles.statusProtectedBody, { color: palette.forest[100] }]
              : themedText(palette, 'secondary'),
          { marginTop: spacing.xs },
        ]}
      >
        {body}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function SummaryCard({ items }: { items: { label: string; value: string }[] }) {
  const { palette } = useAppTheme();
  return (
    <View style={[cardBase, themedCard(palette), styles.summaryRow]} accessibilityRole="summary">
      {items.map((item) => (
        <View key={item.label} style={styles.summaryItem}>
          <Text style={[text.caption, themedText(palette, 'secondary')]}>{item.label}</Text>
          <Text style={[styles.summaryValue, text.tabular, { color: palette.action.secondaryText }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function EvidenceRow({ label, value }: { label: string; value: string }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.evidenceRow} accessibilityLabel={`${label}, ${value}`}>
      <Text style={[text.caption, styles.evidenceLabel, themedText(palette, 'secondary')]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[text.body, styles.evidenceValue, themedText(palette)]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function TimelineRow({
  title,
  subtitle,
  timeLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  timeLabel: string;
  onPress?: () => void;
}) {
  const { palette } = useAppTheme();
  const content = (
    <>
      <View style={[styles.timelineDot, { backgroundColor: palette.forest[500] }]} />
      <View style={{ flex: 1 }}>
        <Text style={[text.subtitle, themedText(palette)]}>{title}</Text>
        <Text style={[text.body, themedText(palette, 'secondary')]}>{subtitle}</Text>
        <Text style={[text.caption, themedText(palette, 'secondary')]}>{timeLabel}</Text>
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        style={styles.timelineRow}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={styles.timelineRow} accessibilityRole="text">
      {content}
    </View>
  );
}

export function ReviewCard({
  title,
  subtitle,
  distance,
  duration,
  estimatedValue,
  purpose,
  confidence,
  reason,
  provenance,
  evidence,
  vehicle,
  routePreview,
  onPress,
  onWork,
  onPersonal,
  onEdit,
  onNotSure,
}: {
  title: string;
  subtitle: string;
  distance: string;
  /** Duration label e.g. "28 min" — image-lock metric row. */
  duration?: string | null;
  estimatedValue?: string | null;
  purpose?: string | null;
  confidence?: string | null;
  reason: string;
  provenance?: string;
  evidence?: string | null;
  vehicle?: string | null;
  routePreview?: Array<{ latitude: number; longitude: number }> | null;
  onPress?: () => void;
  onWork: () => void;
  onPersonal: () => void;
  onEdit?: () => void;
  onNotSure?: () => void;
}) {
  const { palette } = useAppTheme();
  const a11y = [
    title,
    `Time ${subtitle}`,
    `Distance ${distance}`,
    duration ? `Duration ${duration}` : null,
    purpose ? `Purpose ${purpose}` : null,
    estimatedValue,
  ]
    .filter(Boolean)
    .join('. ');
  const chip = (label: string, active: boolean, onPressChip: () => void) => (
    <Pressable
      key={label}
      onPress={onPressChip}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${title}`}
      style={{
        flex: 1,
        minHeight: 40,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? palette.action.primary : palette.background.mist,
        borderWidth: 1,
        borderColor: active ? palette.action.primary : palette.border.default,
      }}
    >
      <Text
        style={{
          color: active ? palette.action.primaryText : palette.text.secondary,
          fontWeight: '600',
          fontSize: typography.size.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  return (
    <Pressable
      style={({ pressed }) => [
        {
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: palette.border.default,
          backgroundColor: palette.background.card,
          padding: layout.cardPad,
          marginBottom: spacing.md,
        },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="summary"
      accessibilityLabel={a11y}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text style={{ color: palette.text.secondary, fontSize: typography.size.caption, fontWeight: '500' }}>
          {subtitle}
        </Text>
        {onEdit ? (
          <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button" accessibilityLabel={`More for ${title}`}>
            <Text style={{ color: palette.text.secondary, fontSize: 18, fontWeight: '700' }}>⋯</Text>
          </Pressable>
        ) : null}
      </View>
      <Text
        style={{
          color: palette.text.primary,
          fontSize: typography.size.bodyLarge,
          fontWeight: '700',
          marginBottom: spacing.sm,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <View
        style={{
          height: 120,
          borderRadius: radii.md,
          backgroundColor: palette.background.mist,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
          overflow: 'hidden',
        }}
      >
        {routePreview && routePreview.length >= 2 ? (
          <RouteMapPreview points={routePreview} height={120} width={320} />
        ) : (
          <Text style={{ color: palette.forest[700], fontWeight: '600' }}>Route preview</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={{ color: palette.text.primary, fontWeight: '700', fontSize: typography.size.body }}>
          {distance}
        </Text>
        <Text style={{ color: palette.text.primary, fontWeight: '700', fontSize: typography.size.body }}>
          {duration ?? '—'}
        </Text>
        <Text style={{ color: palette.text.primary, fontWeight: '700', fontSize: typography.size.body }}>
          {estimatedValue ?? '—'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {chip('Work', purpose === 'work' || purpose === 'Work', onWork)}
        {chip('Personal', purpose === 'personal' || purpose === 'Personal', onPersonal)}
        {onNotSure ? chip('Not sure', purpose === 'unsure' || purpose === 'Not sure', onNotSure) : null}
      </View>
      {confidence || reason ? (
        <Text
          style={{
            color: palette.text.secondary,
            fontSize: typography.size.caption,
            marginTop: spacing.sm,
          }}
          numberOfLines={2}
        >
          {[confidence, reason].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.listSection}>
      <Text style={[text.caption, styles.listSectionTitle, themedText(palette, 'muted')]}>{title.toUpperCase()}</Text>
      <View style={[cardBase, themedCard(palette)]}>{children}</View>
    </View>
  );
}

export function ListRow({
  label,
  value,
  onPress,
  showChevron = !!onPress,
  disabled,
  busy,
  icon,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  busy?: boolean;
  /** Compact leading glyph for blueprint Profile rows. */
  icon?: string;
}) {
  const { palette } = useAppTheme();
  const displayValue = busy ? (value && /preparing/i.test(value) ? value : 'Preparing…') : value;
  const blocked = Boolean(disabled || busy);
  const a11yLabel = displayValue ? `${label}, ${displayValue}` : label;
  const longValue = Boolean(displayValue && displayValue.length > 22);
  const leading = icon ? (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: palette.background.mist,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={{ color: palette.forest[700], fontWeight: '700', fontSize: 13 }}>{icon}</Text>
    </View>
  ) : null;
  const content = longValue ? (
    <View style={styles.listRowStacked}>
      <View style={styles.listRowStackedTop}>
        {leading}
        <Text style={[text.body, styles.listRowLabelGrow, themedText(palette)]} numberOfLines={2}>
          {label}
        </Text>
        {showChevron && !busy ? <Text style={[text.caption, styles.listRowChevron, themedText(palette, 'secondary')]}>›</Text> : null}
      </View>
      {displayValue ? (
        <Text style={[text.caption, styles.listRowValueStacked, themedText(palette, 'secondary')]} numberOfLines={4}>
          {displayValue}
        </Text>
      ) : null}
    </View>
  ) : (
    <>
      {leading}
      <Text
        style={[text.body, displayValue ? styles.listRowLabel : styles.listRowLabelGrow, themedText(palette)]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <View style={styles.listRowRight}>
        {displayValue ? (
          <Text style={[text.caption, styles.listRowValue, themedText(palette, 'secondary')]} numberOfLines={2}>
            {displayValue}
          </Text>
        ) : null}
        {showChevron && !busy ? <Text style={[text.caption, styles.listRowChevron, themedText(palette, 'secondary')]}>›</Text> : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        style={[styles.listRow, { borderBottomColor: palette.border.default }, blocked && styles.listRowDisabled]}
        onPress={onPress}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ disabled: blocked, busy: Boolean(busy) }}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={[styles.listRow, { borderBottomColor: palette.border.default }]} accessibilityLabel={a11yLabel}>
      {content}
    </View>
  );
}

export function SelectionCard({ title, body, selected, onPress }: {
  title: string; body?: string; selected: boolean; onPress: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={[
        cardBase,
        themedCard(palette),
        styles.selectionCard,
        selected && styles.selectionCardSelected,
        selected && {
          backgroundColor: palette.action.selectedSurface,
          borderColor: palette.action.selectedBorder,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <Text style={[text.subtitle, themedText(palette)]}>{title}</Text>
      {body ? <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.xs }]}>{body}</Text> : null}
    </Pressable>
  );
}

export function PlanCard({
  name,
  price,
  period,
  features,
  highlighted,
  onSelect,
  tagline,
  current,
  savingsLabel,
  purchaseDisabled,
  priceNote,
  selectLabel,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
  tagline?: string;
  current?: boolean;
  savingsLabel?: string;
  purchaseDisabled?: boolean;
  priceNote?: string;
  selectLabel?: string;
}) {
  const { palette } = useAppTheme();
  const premium = Boolean(highlighted);
  const titleColor = premium ? palette.text.inverse : palette.text.primary;
  const bodyColor = premium ? palette.forest[100] : palette.text.secondary;
  const accentColor = premium ? palette.text.inverse : palette.action.secondaryText;
  return (
    <View
      style={[
        cardBase,
        themedCard(palette),
        styles.planCard,
        highlighted && styles.planHighlighted,
        highlighted && {
          borderColor: palette.forest[800],
          backgroundColor: palette.forest[800],
          ...shadows.lifted,
        },
      ]}
    >
      {highlighted ? <Badge label="Recommended" variant="success" /> : null}
      {current ? <Badge label="Your plan" variant="success" /> : null}
      <Text style={[text.subtitle, { color: titleColor, marginTop: spacing.xs }]}>{name}</Text>
      {tagline ? (
        <Text style={[text.body, { color: accentColor, marginTop: spacing.xs }]} numberOfLines={2}>
          {tagline}
        </Text>
      ) : null}
      <Text style={[text.title, { color: titleColor, marginTop: spacing.sm }]} allowFontScaling>
        {price}
        <Text style={[text.caption, { color: bodyColor }]}> / {period}</Text>
      </Text>
      {priceNote ? <Text style={[text.caption, { color: bodyColor, marginTop: spacing.xs }]}>{priceNote}</Text> : null}
      {savingsLabel ? <Text style={[text.caption, { color: bodyColor, marginTop: spacing.xs }]}>{savingsLabel}</Text> : null}
      {features.slice(0, 3).map((f) => (
        <Text key={f} style={[text.body, { color: bodyColor, marginTop: spacing.xs }]} numberOfLines={2}>
          • {f}
        </Text>
      ))}
      <View style={{ marginTop: spacing.md }}>
        {premium ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: palette.background.card,
                opacity: current || purchaseDisabled ? 0.55 : pressed ? 0.9 : 1,
              },
            ]}
            onPress={onSelect}
            disabled={current || purchaseDisabled}
            accessibilityRole="button"
            accessibilityLabel={selectLabel ?? `Choose ${name}`}
          >
            <Text style={[styles.primaryBtnText, { color: palette.forest[800] }]}>
              {current
                ? 'Current plan'
                : purchaseDisabled
                  ? 'Purchases unavailable'
                  : selectLabel ?? `Choose ${name}`}
            </Text>
          </Pressable>
        ) : (
        <PrimaryButton
          label={
            current
              ? 'Current plan'
              : purchaseDisabled
                ? 'Purchases unavailable'
                : selectLabel ?? `Choose ${name}`
          }
          onPress={onSelect}
          disabled={current || purchaseDisabled}
        />
        )}
      </View>
    </View>
  );
}

export function ImportOptionCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      style={[cardBase, themedCard(palette), { marginBottom: spacing.sm }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[text.subtitle, themedText(palette)]}>{title}</Text>
      <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.xs }]}>{subtitle}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, actionLabel, onAction }: {
  title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.empty} accessibilityRole="text">
      <Text style={[text.title, themedText(palette)]}>{title}</Text>
      <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.sm, textAlign: 'center' }]}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg, width: '100%' }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function ProgressIndicator({ step, total }: { step: number; total: number }) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.progressRow} accessibilityLabel={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            { backgroundColor: palette.border.default },
            i <= step && styles.progressDotActive,
            i <= step && { backgroundColor: palette.action.primary },
          ]}
        />
      ))}
    </View>
  );
}

export function SegmentedControl<T extends string>({
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
              selected && styles.segmentSelected,
              selected && { backgroundColor: palette.background.card },
            ]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                text.body,
                themedText(palette, selected ? 'action' : 'secondary'),
                selected && { fontWeight: '600' },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  compact,
  autoCapitalize,
  autoFocus,
  accessibilityLabel,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address';
  compact?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoFocus?: boolean;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={{ marginBottom: compact ? spacing.sm : spacing.md }}>
      <Text style={[text.caption, themedText(palette, 'secondary'), { marginBottom: spacing.xs }]}>{label}</Text>
      <View style={[styles.formField, themedInput(palette), compact ? styles.formFieldCompact : null]}>
        {onChangeText ? (
          <TextInput
            accessibilityLabel={accessibilityLabel ?? label}
            value={value}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={false}
            numberOfLines={1}
            placeholderTextColor={palette.input.placeholder}
            style={[
              text.body,
              { color: palette.input.text },
              compact ? { paddingVertical: 0, minHeight: 22 } : null,
            ]}
          />
        ) : (
          <Text style={[text.body, { color: palette.input.text }]}>{value || placeholder || ''}</Text>
        )}
      </View>
    </View>
  );
}

export function SafeAreaFooter({ children }: { children: React.ReactNode }) {
  const { palette } = useAppTheme();
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.footer,
        { backgroundColor: palette.background.card, borderTopColor: palette.border.default },
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

export function ProtectionCard({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'protected' | 'attention' | 'mint';
}) {
  const { palette } = useAppTheme();
  const tone =
    variant === 'protected'
      ? {
          backgroundColor: palette.forest[700],
          borderColor: palette.forest[800],
          ...shadows.lifted,
        }
      : variant === 'attention'
        ? {
            backgroundColor: palette.status.warningBg,
            borderColor: palette.status.warningAccent,
          }
        : variant === 'mint'
          ? {
              backgroundColor: palette.background.mist,
              borderColor: palette.forest[500],
            }
          : themedPanel(palette);
  return (
    <View
      style={[
        styles.softPanel,
        { padding: spacing.mdLg, borderRadius: radii.lg, borderWidth: 1 },
        tone,
      ]}
      accessibilityRole="summary"
    >
      {children}
    </View>
  );
}

/** Dark-green money-protection hero — Home / Protection Center. */
export function ProtectionHero({
  title,
  valueLabel,
  valueCaption,
  supporting,
  onPress,
}: {
  title: string;
  /** Formatted currency when trustworthy; omit for empty/truthful alternative. */
  valueLabel?: string | null;
  valueCaption?: string;
  supporting: string;
  onPress?: () => void;
}) {
  const { palette } = useAppTheme();
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={[text.caption, { color: palette.forest[100] }]}>{title}</Text>
          {valueLabel ? (
            <>
              <Text
                style={[text.display, { color: palette.text.inverse, marginTop: spacing.xs }]}
                accessibilityRole="text"
              >
                {valueLabel}
              </Text>
              {valueCaption ? (
                <Text style={[text.body, { color: palette.forest[100], marginTop: spacing.xs }]}>
                  {valueCaption}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[text.title, { color: palette.text.inverse, marginTop: spacing.sm }]}>
              {supporting}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityElementsHidden
        >
          <Text style={{ color: palette.text.inverse, fontSize: 22, fontWeight: '700' }}>✓</Text>
        </View>
      </View>
      {valueLabel ? (
        <Text style={[text.caption, { color: palette.forest[100], marginTop: spacing.md }]}>
          {supporting}
        </Text>
      ) : null}
    </>
  );
  const style = [
    {
      backgroundColor: palette.forest[800],
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: palette.forest[700],
      ...shadows.lifted,
    },
  ];
  if (onPress) {
    return (
      <Pressable
        style={style}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${valueLabel ?? supporting}`}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View style={style} accessibilityRole="summary" accessibilityLabel={`${title}. ${valueLabel ?? supporting}`}>
      {body}
    </View>
  );
}

export function StatusBanner({
  tone = 'ok',
  message,
  onPress,
}: {
  tone?: 'ok' | 'attention' | 'info';
  message: string;
  onPress?: () => void;
}) {
  const { palette } = useAppTheme();
  const bg =
    tone === 'attention'
      ? palette.status.warningBg
      : tone === 'info'
        ? palette.background.mist
        : palette.status.successBg;
  const fg =
    tone === 'attention'
      ? palette.status.warning
      : tone === 'info'
        ? palette.forest[700]
        : palette.status.success;
  const content = (
    <Text style={[text.caption, { color: fg, fontWeight: '600' }]} numberOfLines={3}>
      {message}
    </Text>
  );
  const wrap = {
    backgroundColor: bg,
    borderRadius: radii.md,
    paddingVertical: spacing.smMd,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: tone === 'attention' ? palette.status.warningAccent : palette.border.default,
    minHeight: touchTarget.minHeight,
    justifyContent: 'center' as const,
  };
  if (onPress) {
    return (
      <Pressable style={wrap} onPress={onPress} accessibilityRole="button" accessibilityLabel={message}>
        {content}
      </Pressable>
    );
  }
  return (
    <View style={wrap} accessibilityRole="text" accessibilityLabel={message}>
      {content}
    </View>
  );
}

export function MetricRow({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.background.card,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: palette.border.default,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.md,
        ...shadows.card,
      }}
      accessibilityRole="summary"
    >
      {items.map((item, index) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            alignItems: 'center',
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: palette.border.default,
            paddingHorizontal: spacing.xs,
          }}
        >
          <Text style={[text.subtitle, { color: palette.forest[700], textAlign: 'center' }]} numberOfLines={2}>
            {item.value}
          </Text>
          <Text style={[text.caption, { color: palette.text.secondary, marginTop: spacing.xs, textAlign: 'center' }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PrivacyNote({
  body = 'Your data stays private and secure on this device.',
}: {
  body?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      }}
      accessibilityRole="text"
      accessibilityLabel={body}
    >
      <Text style={{ color: palette.forest[700], fontWeight: '700', fontSize: 12 }}>Lock</Text>
      <Text style={[text.caption, { color: palette.text.secondary, flex: 1 }]}>{body}</Text>
    </View>
  );
}

/** Alias — TabScreen / StackScrollScreen already provide safe containers. */
export const ScreenContainer = TabScreen;
export const MetricCard = SummaryCard;
export const ReviewTripCard = ReviewCard;
export const ProofSummaryCard = SummaryCard;

/** Amber attention box for Proof corrections and similar alerts. */
export function AttentionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: palette.status.warningBg,
        borderColor: palette.status.warningAccent,
        borderWidth: 1.5,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <Text style={[text.subtitle, { color: palette.status.warning, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function WelcomeHero({
  title,
  body,
  eyebrow,
}: {
  title: string;
  body: string;
  eyebrow?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={styles.welcomeHero} accessibilityRole="header">
      <Image
        source={require('../../assets/icon.png')}
        style={styles.welcomeHeroLogo}
        accessibilityLabel="MileRecover logo"
      />
      <Text style={[text.headline, themedText(palette)]}>{title}</Text>
      {eyebrow ? (
        <Text style={[text.subtitle, themedText(palette), { marginTop: spacing.md }]}>{eyebrow}</Text>
      ) : null}
      {body ? (
        <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.sm }]}>{body}</Text>
      ) : null}
    </View>
  );
}

export function ChecklistRow({ label, status }: { label: string; status: 'ready' | 'pending' | 'planned' }) {
  const { palette } = useAppTheme();
  const mark = status === 'ready' ? '✓' : status === 'pending' ? '○' : '…';
  const statusLabel = status === 'ready' ? 'ready' : status === 'pending' ? 'pending' : 'planned for tracking';
  return (
    <View
      style={[styles.checklistRow, { borderBottomColor: palette.border.default }]}
      accessibilityRole="text"
      accessibilityLabel={`${label}, ${statusLabel}`}
    >
      <Text style={[styles.checklistMark, themedText(palette, 'action')]}>{mark}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[text.body, themedText(palette)]}>{label}</Text>
        {status !== 'ready' ? (
          <Text style={[text.caption, themedText(palette, 'secondary')]}>
            {status === 'pending' ? 'Enable when tracking starts' : 'Coming with tracking'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ProofHeroCard({
  periodLabel,
  tripCount,
  totalMiles,
  unresolved,
  onPreview,
  title = 'Your records are ready to review',
}: {
  periodLabel: string;
  tripCount: number;
  totalMiles: string;
  unresolved?: string | null;
  onPreview: () => void;
  title?: string;
}) {
  const { palette } = useAppTheme();
  const showUnresolved = unresolved != null && unresolved !== '' && unresolved !== '0';
  return (
    <View
      style={[styles.proofHero, { backgroundColor: palette.forest[800] }]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${tripCount} drives. ${totalMiles} miles.`}
    >
      <Text style={[text.title, themedText(palette, 'inverse')]}>{title}</Text>
      <Text style={[text.body, styles.proofHeroSub, { color: palette.forest[100] }]}>{periodLabel}</Text>
      <View style={styles.proofHeroStats}>
        <View style={styles.proofHeroStat}>
          <Text style={[styles.proofHeroStatValue, text.tabular, themedText(palette, 'inverse')]}>{tripCount}</Text>
          <Text style={[styles.proofHeroStatLabel, { color: palette.forest[100] }]}>drives</Text>
        </View>
        <View style={styles.proofHeroStat}>
          <Text style={[styles.proofHeroStatValue, text.tabular, themedText(palette, 'inverse')]}>{totalMiles}</Text>
          <Text style={[styles.proofHeroStatLabel, { color: palette.forest[100] }]}>miles</Text>
        </View>
        {showUnresolved ? (
          <View style={styles.proofHeroStat}>
            <Text style={[styles.proofHeroStatValue, text.tabular, themedText(palette, 'inverse')]}>{unresolved}</Text>
            <Text style={[styles.proofHeroStatLabel, { color: palette.forest[100] }]}>unresolved</Text>
          </View>
        ) : (
          <View style={styles.proofHeroStat}>
            <Text style={[styles.proofHeroStatValue, text.tabular, themedText(palette, 'inverse')]}>—</Text>
            <Text style={[styles.proofHeroStatLabel, { color: palette.forest[100] }]}>none open</Text>
          </View>
        )}
      </View>
      <PrimaryButton label="Preview report" onPress={onPreview} accessibilityLabel="Preview mileage report" />
    </View>
  );
}

export function MapPlaceholder() {
  return <RouteMapPreview points={null} />;
}

type LatLng = { latitude: number; longitude: number };

function tryNativeRouteMap(
  usable: LatLng[],
  height: number,
  width: number,
  primaryColor: string,
): React.ReactElement | null {
  try {
    // Optional native maps — requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY at native build time.
    // Without a key, keep the recorded-point polyline (never invent geometry).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants') as {
      default?: { expoConfig?: { extra?: { googleMapsApiKey?: string } } };
      expoConfig?: { extra?: { googleMapsApiKey?: string } };
    };
    const expoConfig = Constants.expoConfig ?? Constants.default?.expoConfig;
    const mapsKey =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || expoConfig?.extra?.googleMapsApiKey || '';
    if (!String(mapsKey).trim()) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('react-native-maps') as {
      default: React.ComponentType<Record<string, unknown>>;
      Marker: React.ComponentType<Record<string, unknown>>;
      Polyline: React.ComponentType<Record<string, unknown>>;
    };
    const MapView = maps.default;
    const { Marker, Polyline } = maps;
    if (!MapView || !Polyline || !Marker) return null;
    const lats = usable.map((p) => p.latitude);
    const lngs = usable.map((p) => p.longitude);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latDelta = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.6);
    const lngDelta = Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.6);
    return (
      <MapView
        style={{ height, width }}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        pointerEvents="none"
        accessibilityLabel={`Route with ${usable.length} recorded points`}
      >
        <Polyline coordinates={usable} strokeColor={primaryColor} strokeWidth={3} />
        <Marker coordinate={usable[0]} title="Start" pinColor={primaryColor} />
        <Marker coordinate={usable[usable.length - 1]} title="End" pinColor="#16A34A" />
      </MapView>
    );
  } catch {
    return null;
  }
}

/**
 * Observed-route preview. Draws only provided points — never invents a path.
 * Prefers react-native-maps when the native module is present; otherwise a
 * recorded-point polyline fallback. Never fabricates geometry.
 */
export function RouteMapPreview({
  points,
  height = 88,
  width = 88,
}: {
  points?: Array<{ latitude: number; longitude: number }> | null;
  height?: number;
  width?: number;
}) {
  const { palette } = useAppTheme();
  const usable = (points ?? []).filter(
    (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
  );
  if (usable.length < 2) {
    return (
      <View
        style={[
          styles.mapPlaceholder,
          {
            height,
            width,
            backgroundColor: palette.background.mist,
            borderColor: palette.forest[500],
          },
        ]}
        accessibilityLabel="Route unavailable"
      >
        <Text style={[styles.mapPlaceholderText, themedText(palette, 'action')]}>Route unavailable</Text>
      </View>
    );
  }
  const nativeMap = tryNativeRouteMap(usable, height, width, palette.action.primary);
  if (nativeMap) {
    return (
      <View style={{ height, width, borderRadius: radii.md, overflow: 'hidden' }}>{nativeMap}</View>
    );
  }
  const lats = usable.map((p) => p.latitude);
  const lngs = usable.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.0008;
  const latSpan = Math.max(maxLat - minLat, pad);
  const lngSpan = Math.max(maxLng - minLng, pad);
  const markers = usable.map((p, index) => {
    const x = ((p.longitude - minLng) / lngSpan) * (width - 12) + 6;
    const y = (1 - (p.latitude - minLat) / latSpan) * (height - 12) + 6;
    return { key: `${index}`, x, y, first: index === 0, last: index === usable.length - 1 };
  });
  return (
    <View
      style={[
        styles.mapPlaceholder,
        {
          height,
          width,
          overflow: 'hidden',
          backgroundColor: palette.background.mist,
          borderColor: palette.forest[500],
        },
      ]}
      accessibilityLabel={`Route with ${usable.length} recorded points`}
    >
      {markers.map((m, i) =>
        i > 0 ? (
          <View
            key={`seg-${m.key}`}
            style={{
              position: 'absolute',
              left: Math.min(markers[i - 1].x, m.x),
              top: Math.min(markers[i - 1].y, m.y),
              width: Math.max(2, Math.abs(m.x - markers[i - 1].x)),
              height: Math.max(2, Math.abs(m.y - markers[i - 1].y)),
              backgroundColor: palette.forest[500],
              opacity: 0.35,
              borderRadius: 1,
            }}
          />
        ) : null,
      )}
      {markers.map((m) => (
        <View
          key={m.key}
          style={{
            position: 'absolute',
            left: m.x - (m.first || m.last ? 4 : 2),
            top: m.y - (m.first || m.last ? 4 : 2),
            width: m.first || m.last ? 8 : 4,
            height: m.first || m.last ? 8 : 4,
            borderRadius: 4,
            backgroundColor: m.first ? palette.forest[800] : m.last ? palette.protected[600] : palette.forest[500],
          }}
        />
      ))}
    </View>
  );
}

export function SkeletonBlock({
  height = 16,
  width = '100%',
  style,
}: {
  height?: number;
  width?: number | `${number}%` | '100%';
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        {
          height,
          width: width as ViewStyle['width'],
          borderRadius: radii.sm,
          backgroundColor: palette.background.mist,
          opacity: 0.7,
        },
        style,
      ]}
      accessibilityLabel="Loading"
    />
  );
}

/** Lightweight icon glyph for list/status rows — keeps DS free of icon packs. */
export function IconGlyph({
  label,
  accessibilityLabel,
}: {
  label: string;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[styles.iconGlyph, { backgroundColor: palette.background.mist }]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.iconGlyphText, themedText(palette, 'action')]}>{label}</Text>
    </View>
  );
}

/** Simple period bar chart for Proof — values only, no invented data. */
export function SimpleBarChart({
  bars,
  accessibilityLabel,
}: {
  bars: Array<{ label: string; value: number }>;
  accessibilityLabel?: string;
}) {
  const { palette } = useAppTheme();
  const max = Math.max(...bars.map((b) => b.value), 0.0001);
  const trackHeight = 140;
  return (
    <View style={styles.barChart} accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
      {bars.map((bar) => {
        const fill = Math.max(6, Math.round((bar.value / max) * trackHeight));
        return (
          <View key={bar.label} style={styles.barChartCol}>
            <View style={[styles.barChartTrack, { height: trackHeight, backgroundColor: palette.background.mist }]}>
              <View style={[styles.barChartFill, { height: fill, backgroundColor: palette.action.primary }]} />
            </View>
            <Text style={[styles.barChartLabel, themedText(palette, 'secondary')]} numberOfLines={1}>
              {bar.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.dialogScrim, { backgroundColor: palette.semantic.scrim }]}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          style={[styles.dialogCard, { backgroundColor: palette.semantic.surface }]}
          onPress={() => undefined}
          accessibilityRole="summary"
        >
          <Text style={[text.title, themedText(palette)]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.sm, marginBottom: spacing.md }]}>
            {body}
          </Text>
          <PrimaryButton label={confirmLabel} onPress={onConfirm} />
          <TertiaryButton label={cancelLabel} onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function BottomSheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const { palette } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.sheetScrim, { backgroundColor: palette.semantic.scrim }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
      >
        <Pressable
          style={[
            styles.sheetCard,
            { maxHeight: height * 0.72, backgroundColor: palette.semantic.surface },
          ]}
          onPress={() => undefined}
          accessibilityRole="summary"
        >
          <View style={[styles.sheetHandle, { backgroundColor: palette.border.default }]} />
          <Text style={[text.subtitle, themedText(palette), { marginBottom: spacing.md }]} accessibilityRole="header">
            {title}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
          <TertiaryButton label="Close" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ReviewedItemCard({
  title,
  subtitle,
  decisionLabel,
  onUndo,
}: {
  title: string;
  subtitle: string;
  decisionLabel: string;
  onUndo: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: palette.border.default,
        backgroundColor: palette.background.card,
        padding: layout.cardPad,
        marginBottom: spacing.md,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${subtitle}. ${decisionLabel}`}
    >
      <Text style={{ color: palette.text.secondary, fontSize: typography.size.caption, fontWeight: '500' }}>
        {subtitle}
      </Text>
      <Text
        style={{
          color: palette.text.primary,
          fontSize: typography.size.bodyLarge,
          fontWeight: '700',
          marginTop: spacing.xs,
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <View
        style={{
          marginTop: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radii.md,
            backgroundColor: palette.background.mist,
          }}
        >
          <Text style={{ color: palette.forest[700], fontWeight: '600' }}>{decisionLabel}</Text>
        </View>
        <TertiaryButton label="Undo" onPress={onUndo} accessibilityLabel={`Undo ${decisionLabel} for ${title}`} />
      </View>
    </View>
  );
}

export function MembershipBanner({ planName, detail }: { planName: string; detail: string }) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        styles.membershipBanner,
        { backgroundColor: palette.background.mist, borderColor: palette.forest[500] },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${planName}. ${detail}`}
    >
      <Text style={[text.subtitle, themedText(palette, 'action')]}>{planName}</Text>
      <Text style={[text.body, styles.membershipBannerSub, themedText(palette, 'secondary')]}>{detail}</Text>
    </View>
  );
}

export function LoadingState({ message }: { message: string }) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[styles.loadingState, themedCard(palette)]}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <Text style={[text.subtitle, themedText(palette)]}>{message}</Text>
      <Text style={[text.body, themedText(palette, 'secondary'), { marginTop: spacing.sm }]}>This usually takes a few seconds.</Text>
    </View>
  );
}

export function TripCard({ title, subtitle, miles }: { title: string; subtitle: string; miles: string }) {
  const { palette } = useAppTheme();
  return (
    <View style={[cardBase, themedCard(palette), { marginBottom: spacing.sm }]}>
      <Text style={[text.subtitle, themedText(palette)]}>{title}</Text>
      <Text style={[text.body, themedText(palette, 'secondary')]}>{subtitle}</Text>
      <Text style={[text.caption, themedText(palette, 'secondary'), { marginTop: spacing.xs }]}>{miles}</Text>
    </View>
  );
}

/** Blueprint-locked named aliases — prefer these in new screens. */
export { AttentionBox as InlineAttention };
export const TextButton = TertiaryButton;
export const StatusBadge = Badge;
export const ChoiceCard = SelectionCard;
export const SummaryMetric = SummaryCard;
export const SettingsGroup = ListSection;
export const SettingsRow = ListRow;
export const RouteMapCard = RouteMapPreview;
export const PeriodSegmentControl = SegmentedControl;
export const ConfirmationDialog = ConfirmDialog;
export const LoadingSkeleton = SkeletonBlock;

export function InlineNotice({
  title,
  body,
  variant = 'info',
}: {
  title?: string;
  body: string;
  variant?: StatusVariant;
}) {
  return (
    <StatusCard
      variant={variant}
      title={title ?? (variant === 'danger' ? 'Something went wrong' : 'Note')}
      body={body}
      emphasis="subtle"
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  body,
  actionLabel,
  onAction,
}: {
  title?: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <StatusCard variant="danger" title={title} body={body} emphasis="hero" />
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} accessibilityLabel={actionLabel} />
      ) : null}
    </View>
  );
}

export function TrialBanner({
  title = '7 days free',
  body = 'Try Plus features. Cancel anytime.',
  priceNote,
  primaryLabel = 'Start 7-day free trial',
  secondaryLabel = 'Not now',
  onPrimary,
  onSecondary,
}: {
  title?: string;
  body?: string;
  priceNote?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  const { palette } = useAppTheme();
  return (
    <View
      style={[
        styles.membershipBanner,
        { backgroundColor: palette.background.mist, borderColor: palette.forest[500] },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <Text style={[text.subtitle, themedText(palette, 'action')]}>{title}</Text>
      <Text style={[text.body, styles.membershipBannerSub, themedText(palette, 'secondary')]}>{body}</Text>
      {priceNote ? (
        <Text style={[text.caption, themedText(palette, 'secondary'), { marginTop: spacing.xs }]}>
          {priceNote}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
        <SecondaryButton label={primaryLabel} onPress={onPrimary} compact />
        {onSecondary ? <TertiaryButton label={secondaryLabel} onPress={onSecondary} /> : null}
      </View>
    </View>
  );
}

export function ReportOptionRow({
  label,
  value,
  locked,
  onPress,
}: {
  label: string;
  value?: string;
  locked?: boolean;
  onPress?: () => void;
}) {
  return (
    <ListRow
      label={label}
      value={locked ? value ?? 'Plus' : value}
      onPress={onPress}
      showChevron={Boolean(onPress)}
    />
  );
}

/** Snackbar alias — UndoSnackbar is the production toast pattern. */
export const Toast = UndoSnackbar;
export const Snackbar = UndoSnackbar;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerDark: { backgroundColor: colors.header.background, paddingBottom: spacing.md },
  headerSub: { marginTop: spacing.xs, opacity: 0.9 },
  backBtn: { minHeight: touchTarget.minHeight, justifyContent: 'center', marginBottom: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.lg },
  link: { color: colors.forest[600], fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill },
  badgeText: { fontSize: typography.size.caption, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.forest[700],
    borderRadius: 14,
    minHeight: layout.buttonH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: { color: colors.text.inverse, fontWeight: '600', fontSize: typography.size.bodyLarge },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.forest[600],
    borderRadius: 14,
    minHeight: layout.buttonH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    alignSelf: 'stretch',
  },
  secondaryBtnCompact: {
    alignSelf: 'auto',
    minHeight: 40,
    paddingHorizontal: spacing.smMd,
  },
  secondaryBtnText: { color: colors.forest[700], fontWeight: '600', fontSize: typography.size.body },
  secondaryBtnTextDisabled: { color: colors.neutral[500] },
  chip: {
    borderWidth: 1,
    borderColor: colors.forest[600],
    borderRadius: radii.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    marginRight: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.forest[100],
    borderColor: colors.forest[700],
    borderWidth: 2,
  },
  chipText: {
    color: colors.forest[700],
    fontWeight: '600',
    fontSize: typography.size.body,
    flexShrink: 0,
  },
  chipTextSelected: {
    color: colors.forest[900],
    fontWeight: '700',
  },
  chipRowScroll: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    gap: spacing.xs,
  },
  tertiaryBtn: { minHeight: touchTarget.minHeight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  tertiaryBtnText: { color: colors.forest[600], fontWeight: '600' },
  destructiveBtn: {
    backgroundColor: colors.danger[100],
    borderWidth: 1,
    borderColor: colors.danger[600],
    borderRadius: radii.md,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  destructiveBtnText: { color: colors.danger[600], fontWeight: '600', fontSize: typography.size.body },
  offlineBanner: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    padding: spacing.smMd,
    marginBottom: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.danger[100],
    borderWidth: 1,
    borderColor: colors.danger[600],
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  formError: {
    color: colors.danger[600],
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    marginBottom: spacing.sm,
  },
  undoSnackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[900],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smMd,
    marginTop: spacing.md,
  },
  undoSnackbarAction: { minHeight: touchTarget.minHeight, justifyContent: 'center', paddingHorizontal: spacing.xs },
  undoSnackbarActionText: { color: colors.forest[100], fontWeight: '700' },
  btnDisabled: { opacity: 0.62 },
  btnPressed: { opacity: 0.88 },
  cardPressed: { opacity: 0.96 },
  statusCard: { borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  statusCardProtected: { backgroundColor: colors.forest[800], borderColor: colors.forest[700] },
  statusCardSubtle: {
    backgroundColor: colors.background.card,
    borderColor: 'transparent',
    borderWidth: 0,
    ...shadows.card,
  },
  softPanel: {
    backgroundColor: colors.forest[100],
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusProtectedTitle: { color: colors.text.inverse },
  statusProtectedBody: { color: colors.forest[100] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: typography.size.title, fontWeight: '700', color: colors.forest[700], marginTop: spacing.xs },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest[500], marginTop: 6 },
  reviewActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  reviewDecisionActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  reviewDecisionButton: { flex: 1, minWidth: 0 },
  reviewEditAction: { marginTop: spacing.sm },
  listSection: { marginTop: spacing.lg },
  listSectionTitle: { marginBottom: spacing.sm, letterSpacing: 0.5 },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: touchTarget.minHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  listRowDisabled: { opacity: 0.55 },
  listRowLabel: {
    flexShrink: 0,
    minWidth: '34%',
    maxWidth: '46%',
    paddingRight: spacing.xs,
    paddingTop: 2,
  },
  listRowLabelGrow: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
    paddingTop: 2,
  },
  listRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 0,
    gap: spacing.xs,
  },
  listRowValue: {
    flexShrink: 1,
    flexGrow: 1,
    textAlign: 'right',
    minWidth: 0,
  },
  listRowStacked: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  listRowStackedTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listRowValueStacked: {
    textAlign: 'left',
    minWidth: 0,
  },
  listRowChevron: {
    flexShrink: 0,
    width: 14,
    textAlign: 'center',
    fontSize: typography.size.bodyLarge,
    color: colors.text.secondary,
  },
  evidenceLabel: {
    flexShrink: 0,
    minWidth: '34%',
    maxWidth: '46%',
    paddingRight: spacing.xs,
  },
  evidenceValue: {
    flex: 1,
    textAlign: 'right',
    minWidth: 0,
  },
  selectionCard: { marginBottom: spacing.sm },
  selectionCardSelected: { borderColor: colors.forest[600], backgroundColor: colors.forest[100] },
  planCard: { marginBottom: spacing.md, padding: spacing.md },
  planHighlighted: { borderColor: colors.forest[600], borderWidth: 2 },
  empty: { alignItems: 'center', padding: spacing.xl },
  progressRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[200] },
  progressDotActive: { backgroundColor: colors.forest[600] },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radii.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
    minHeight: layout.segmentH,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.background.card },
  formField: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: layout.fieldH,
    justifyContent: 'center',
    backgroundColor: colors.background.card,
  },
  formFieldCompact: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44, justifyContent: 'center' },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.default, backgroundColor: colors.background.card },
  protectionCard: { backgroundColor: colors.forest[100], borderColor: colors.forest[500] },
  welcomeHero: { marginBottom: spacing.lg },
  welcomeHeroIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeHeroIconText: { color: colors.text.inverse, fontSize: 28, fontWeight: '700' },
  welcomeHeroLogo: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  checklistRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  checklistMark: { width: 24, color: colors.forest[700], fontWeight: '700', fontSize: typography.size.bodyLarge },
  proofHero: { backgroundColor: colors.forest[800], borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  proofHeroSub: { color: colors.forest[100], marginTop: spacing.xs },
  proofHeroStats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.lg },
  proofHeroStat: { flex: 1, alignItems: 'center' },
  proofHeroStatValue: { color: colors.text.inverse, fontSize: typography.size.title, fontWeight: '700' },
  proofHeroStatLabel: { color: colors.forest[100], fontSize: typography.size.caption, marginTop: spacing.xs },
  mapPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.forest[100],
    borderWidth: 1,
    borderColor: colors.forest[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  mapPlaceholderText: { color: colors.forest[700], fontWeight: '600', fontSize: typography.size.caption },
  reviewCardTop: { flexDirection: 'row', marginBottom: spacing.sm },
  membershipBanner: {
    backgroundColor: colors.forest[100],
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.forest[500],
  },
  membershipBannerSub: { color: colors.text.secondary, marginTop: spacing.xs },
  loadingState: { ...cardBase, alignItems: 'center', paddingVertical: spacing.xl, borderWidth: 0 },
  iconGlyph: {
    width: touchTarget.minWidth,
    height: touchTarget.minHeight,
    borderRadius: radii.md,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyphText: { color: colors.forest[800], fontWeight: '700', fontSize: typography.size.body },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  barChartCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barChartTrack: {
    width: '100%',
    maxWidth: 36,
    justifyContent: 'flex-end',
    backgroundColor: colors.forest[100],
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  barChartFill: {
    width: '100%',
    backgroundColor: colors.forest[600],
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  barChartLabel: {
    fontSize: typography.size.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  dialogScrim: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialogCard: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lifted,
  },
  sheetScrim: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.lifted,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
    marginBottom: spacing.md,
  },
});
