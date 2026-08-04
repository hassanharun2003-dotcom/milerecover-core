import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing, touchTarget, typography } from '@milerecover/config';
import { statusColors, type StatusVariant } from './theme';
export {
  TabScreen,
  StackScrollScreen,
  OnboardingScreen,
  SafeFillScreen,
  FixedHeaderScrollScreen,
} from './screenShell';

export const text = StyleSheet.create({
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

export function AppScreen({
  children,
  style,
  edges = ['top', 'left', 'right'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
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
  return (
    <View style={[styles.header, dark && styles.headerDark]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Text style={[text.body, dark && text.inverse]}>← Back</Text>
        </Pressable>
      ) : null}
      <Text style={[text.title, dark && text.inverse]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={[text.body, dark && text.inverse, styles.headerSub]}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={text.subtitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: StatusVariant }) {
  const c = statusColors(variant);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]} accessibilityLabel={label}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <Text style={styles.primaryBtnText}>{loading ? 'One moment…' : label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.secondaryBtn, disabled && styles.btnDisabled, pressed && !disabled && styles.btnPressed]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function TertiaryButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable style={styles.tertiaryBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={styles.tertiaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function DestructiveButton({ label, onPress, disabled, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.destructiveBtn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.destructiveBtnText}>{label}</Text>
    </Pressable>
  );
}

export function OfflineBanner({ body = 'Saved safely offline. Sync will resume when you are back online.' }: { body?: string }) {
  return (
    <View style={styles.offlineBanner} accessibilityRole="text" accessibilityLabel={body}>
      <Text style={[text.caption, { color: colors.text.primary, fontWeight: '600' }]}>Offline</Text>
      <Text style={[text.caption, { color: colors.text.secondary, marginTop: 2 }]}>{body}</Text>
    </View>
  );
}

export function ErrorBanner({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLabel={`${title}. ${body}`}>
      <Text style={[text.subtitle, { color: colors.danger[600] }]}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>{body}</Text>
    </View>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <Text style={styles.formError} accessibilityRole="alert">
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
  return (
    <View style={styles.undoSnackbar} accessibilityRole="summary" accessibilityLabel={message}>
      <Text style={[text.body, text.inverse, { flex: 1 }]}>{message}</Text>
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        accessibilityLabel="Undo"
        style={styles.undoSnackbarAction}
      >
        <Text style={styles.undoSnackbarActionText}>Undo</Text>
      </Pressable>
      {onDismiss ? (
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.undoSnackbarAction}>
          <Text style={styles.undoSnackbarActionText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SoftPanel({ children }: { children: React.ReactNode }) {
  return <View style={styles.softPanel}>{children}</View>;
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
  const c = statusColors(variant);
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
            ? styles.statusCardProtected
            : isSubtle
              ? styles.statusCardSubtle
              : { backgroundColor: c.bg, borderColor: colors.border.default },
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
              ? styles.statusProtectedTitle
              : { color: colors.text.primary },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          text.body,
          isAlert
            ? { color: colors.text.primary }
            : isHeroSuccess
              ? styles.statusProtectedBody
              : { color: colors.text.secondary },
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
  return (
    <View style={[cardBase, styles.summaryRow]} accessibilityRole="summary">
      {items.map((item) => (
        <View key={item.label} style={styles.summaryItem}>
          <Text style={text.caption}>{item.label}</Text>
          <Text style={[styles.summaryValue, text.tabular]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.evidenceRow} accessibilityLabel={`${label}, ${value}`}>
      <Text style={[text.caption, styles.evidenceLabel]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[text.body, styles.evidenceValue]} numberOfLines={3}>
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
  const content = (
    <>
      <View style={styles.timelineDot} />
      <View style={{ flex: 1 }}>
        <Text style={text.subtitle}>{title}</Text>
        <Text style={text.body}>{subtitle}</Text>
        <Text style={text.caption}>{timeLabel}</Text>
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
  reason,
  provenance,
  onPress,
  onWork,
  onPersonal,
  onNotDrive,
}: {
  title: string;
  subtitle: string;
  distance: string;
  reason: string;
  provenance?: string;
  onPress?: () => void;
  onWork: () => void;
  onPersonal: () => void;
  onNotDrive: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [cardBase, pressed && styles.cardPressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={styles.reviewCardTop}>
        <MapPlaceholder />
        <View style={{ flex: 1 }}>
          <Text style={text.subtitle}>{title}</Text>
          <Text style={[text.body, { marginTop: spacing.xs }]}>{subtitle}</Text>
          <Text style={[text.caption, { marginTop: spacing.sm }]}>{distance}</Text>
          {provenance ? <Badge label={provenance} variant="info" /> : null}
          <Text style={[text.caption, { marginTop: spacing.xs }]}>{reason}</Text>
        </View>
      </View>
      <View style={styles.reviewActions}>
        <SecondaryButton label="Work" onPress={onWork} accessibilityLabel="Yes, work drive" />
        <SecondaryButton label="Personal" onPress={onPersonal} />
        <TertiaryButton label="Not a drive" onPress={onNotDrive} />
      </View>
    </Pressable>
  );
}

export function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.listSection}>
      <Text style={[text.caption, styles.listSectionTitle]}>{title.toUpperCase()}</Text>
      <View style={cardBase}>{children}</View>
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
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  const displayValue = busy ? (value && /preparing/i.test(value) ? value : 'Preparing…') : value;
  const blocked = Boolean(disabled || busy);
  const a11yLabel = displayValue ? `${label}, ${displayValue}` : label;
  const content = (
    <>
      <Text style={[text.body, styles.listRowLabel]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.listRowRight}>
        {displayValue ? (
          <Text style={[text.caption, styles.listRowValue]} numberOfLines={2}>
            {displayValue}
          </Text>
        ) : null}
        {showChevron && !busy ? <Text style={[text.caption, styles.listRowChevron]}>›</Text> : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        style={[styles.listRow, blocked && styles.listRowDisabled]}
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
    <View style={styles.listRow} accessibilityLabel={a11yLabel}>
      {content}
    </View>
  );
}

export function SelectionCard({ title, body, selected, onPress }: {
  title: string; body?: string; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      style={[cardBase, styles.selectionCard, selected && styles.selectionCardSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <Text style={text.subtitle}>{title}</Text>
      {body ? <Text style={[text.body, { marginTop: spacing.xs }]}>{body}</Text> : null}
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
}) {
  return (
    <View style={[cardBase, styles.planCard, highlighted && styles.planHighlighted]}>
      {highlighted ? <Badge label="Recommended" variant="info" /> : null}
      {current ? <Badge label="Your plan" variant="success" /> : null}
      <Text style={[text.subtitle, { marginTop: spacing.xs }]}>{name}</Text>
      {tagline ? (
        <Text style={[text.body, { marginTop: spacing.xs, color: colors.forest[700] }]} numberOfLines={2}>
          {tagline}
        </Text>
      ) : null}
      <Text style={[text.title, { marginTop: spacing.sm }]} allowFontScaling>
        {price}
        <Text style={text.caption}> / {period}</Text>
      </Text>
      {priceNote ? <Text style={[text.caption, { marginTop: spacing.xs }]}>{priceNote}</Text> : null}
      {savingsLabel ? <Text style={[text.caption, { marginTop: spacing.xs }]}>{savingsLabel}</Text> : null}
      {features.slice(0, 3).map((f) => (
        <Text key={f} style={[text.body, { marginTop: spacing.xs }]} numberOfLines={2}>
          • {f}
        </Text>
      ))}
      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton
          label={current ? 'Current plan' : purchaseDisabled ? 'Purchases unavailable' : `Choose ${name}`}
          onPress={onSelect}
          disabled={current || purchaseDisabled}
        />
      </View>
    </View>
  );
}

export function ImportOptionCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={[cardBase, { marginBottom: spacing.sm }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <Text style={text.subtitle}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>{subtitle}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, actionLabel, onAction }: {
  title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.empty} accessibilityRole="text">
      <Text style={text.title}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.sm, textAlign: 'center' }]}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg, width: '100%' }}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function ProgressIndicator({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressRow} accessibilityLabel={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
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
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segment, selected && styles.segmentSelected]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[text.body, selected && { color: colors.forest[700], fontWeight: '600' }]}>{opt.label}</Text>
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
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText?: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address';
  compact?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ marginBottom: compact ? spacing.sm : spacing.md }}>
      <Text style={[text.caption, { marginBottom: spacing.xs }]}>{label}</Text>
      <View style={[styles.formField, compact ? styles.formFieldCompact : null]}>
        {onChangeText ? (
          <TextInput
            accessibilityLabel={label}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={false}
            numberOfLines={1}
            style={[text.body, compact ? { paddingVertical: 0, minHeight: 22 } : null]}
          />
        ) : (
          <Text style={text.body}>{value || placeholder || ''}</Text>
        )}
      </View>
    </View>
  );
}

export function SafeAreaFooter({ children }: { children: React.ReactNode }) {
  return <SafeAreaView edges={['bottom']} style={styles.footer}>{children}</SafeAreaView>;
}

export function ProtectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.softPanel} accessibilityRole="summary">{children}</View>;
}

export function WelcomeHero({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.welcomeHero} accessibilityRole="header">
      <View style={styles.welcomeHeroIcon}>
        <Text style={styles.welcomeHeroIconText}>M</Text>
      </View>
      <Text style={text.headline}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.md }]}>{body}</Text>
    </View>
  );
}

export function ChecklistRow({ label, status }: { label: string; status: 'ready' | 'pending' | 'planned' }) {
  const mark = status === 'ready' ? '✓' : status === 'pending' ? '○' : '…';
  const statusLabel = status === 'ready' ? 'ready' : status === 'pending' ? 'pending' : 'planned for tracking';
  return (
    <View style={styles.checklistRow} accessibilityRole="text" accessibilityLabel={`${label}, ${statusLabel}`}>
      <Text style={styles.checklistMark}>{mark}</Text>
      <View style={{ flex: 1 }}>
        <Text style={text.body}>{label}</Text>
        {status !== 'ready' ? <Text style={text.caption}>{status === 'pending' ? 'Enable when tracking starts' : 'Coming with tracking'}</Text> : null}
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
  const showUnresolved = unresolved != null && unresolved !== '' && unresolved !== '0';
  return (
    <View
      style={styles.proofHero}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${tripCount} drives. ${totalMiles} miles.`}
    >
      <Text style={[text.title, text.inverse]}>{title}</Text>
      <Text style={[text.body, styles.proofHeroSub]}>{periodLabel}</Text>
      <View style={styles.proofHeroStats}>
        <View style={styles.proofHeroStat}>
          <Text style={[styles.proofHeroStatValue, text.tabular]}>{tripCount}</Text>
          <Text style={styles.proofHeroStatLabel}>drives</Text>
        </View>
        <View style={styles.proofHeroStat}>
          <Text style={[styles.proofHeroStatValue, text.tabular]}>{totalMiles}</Text>
          <Text style={styles.proofHeroStatLabel}>miles</Text>
        </View>
        {showUnresolved ? (
          <View style={styles.proofHeroStat}>
            <Text style={[styles.proofHeroStatValue, text.tabular]}>{unresolved}</Text>
            <Text style={styles.proofHeroStatLabel}>unresolved</Text>
          </View>
        ) : (
          <View style={styles.proofHeroStat}>
            <Text style={[styles.proofHeroStatValue, text.tabular]}>—</Text>
            <Text style={styles.proofHeroStatLabel}>none open</Text>
          </View>
        )}
      </View>
      <PrimaryButton label="Preview report" onPress={onPreview} accessibilityLabel="Preview mileage report" />
    </View>
  );
}

export function MapPlaceholder() {
  return (
    <View style={styles.mapPlaceholder} accessibilityLabel="Route map preview placeholder">
      <Text style={styles.mapPlaceholderText}>Route</Text>
    </View>
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
  return (
    <View style={[cardBase, { marginBottom: spacing.sm }]} accessibilityRole="summary">
      <Text style={text.subtitle}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>{subtitle}</Text>
      <Text style={[text.caption, { marginTop: spacing.sm }]}>Decision: {decisionLabel}</Text>
      <View style={{ marginTop: spacing.md }}>
        <SecondaryButton label="Undo decision" onPress={onUndo} accessibilityLabel={`Undo ${decisionLabel} decision for ${title}`} />
      </View>
    </View>
  );
}

export function MembershipBanner({ planName, detail }: { planName: string; detail: string }) {
  return (
    <View style={styles.membershipBanner} accessibilityRole="summary" accessibilityLabel={`${planName}. ${detail}`}>
      <Text style={[text.subtitle, { color: colors.forest[800] }]}>{planName}</Text>
      <Text style={[text.body, styles.membershipBannerSub]}>{detail}</Text>
    </View>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.loadingState} accessibilityRole="progressbar" accessibilityLabel={message}>
      <Text style={text.subtitle}>{message}</Text>
      <Text style={[text.body, { marginTop: spacing.sm }]}>This usually takes a few seconds.</Text>
    </View>
  );
}

export function TripCard({ title, subtitle, miles }: { title: string; subtitle: string; miles: string }) {
  return (
    <View style={[cardBase, { marginBottom: spacing.sm }]}>
      <Text style={text.subtitle}>{title}</Text>
      <Text style={text.body}>{subtitle}</Text>
      <Text style={[text.caption, { marginTop: spacing.xs }]}>{miles}</Text>
    </View>
  );
}

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
    borderRadius: radii.md,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: { color: colors.text.inverse, fontWeight: '600', fontSize: typography.size.body },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.forest[600],
    borderRadius: radii.md,
    minHeight: touchTarget.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  secondaryBtnText: { color: colors.forest[700], fontWeight: '600' },
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
  btnDisabled: { opacity: 0.5 },
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
  segmented: { flexDirection: 'row', backgroundColor: colors.neutral[100], borderRadius: radii.md, padding: spacing.xs, marginBottom: spacing.md },
  segment: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.background.card },
  formField: { borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.background.card },
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
});
