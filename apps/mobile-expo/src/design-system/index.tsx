import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing, touchTarget, typography } from '@milerecover/config';
import { statusColors, type StatusVariant } from './theme';

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

export function ScrollScreen({
  children,
  contentStyle,
  footer,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
}) {
  return (
    <AppScreen edges={['left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer}
    </AppScreen>
  );
}

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

export function PrimaryButton({ label, onPress, disabled, accessibilityLabel }: {
  label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={[styles.primaryBtn, disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, accessibilityLabel }: {
  label: string; onPress: () => void; accessibilityLabel?: string;
}) {
  return (
    <Pressable style={styles.secondaryBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function TertiaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tertiaryBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.tertiaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function StatusCard({
  title,
  body,
  variant = 'success',
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  variant?: StatusVariant;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = statusColors(variant);
  const isAlert = variant === 'warning' || variant === 'danger';
  return (
    <View
      style={[styles.statusCard, isAlert ? { backgroundColor: c.bg, borderColor: c.fg } : styles.statusCardProtected]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${body}`}
    >
      <Text style={[text.subtitle, isAlert ? { color: c.fg } : styles.statusProtectedTitle]}>{title}</Text>
      <Text style={[text.body, isAlert ? { color: colors.text.primary } : styles.statusProtectedBody, { marginTop: spacing.xs }]}>
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
          <Text style={styles.summaryValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.evidenceRow}>
      <Text style={text.caption}>{label}</Text>
      <Text style={text.body}>{value}</Text>
    </View>
  );
}

export function TimelineRow({ title, subtitle, timeLabel }: { title: string; subtitle: string; timeLabel: string }) {
  return (
    <View style={styles.timelineRow} accessibilityRole="text">
      <View style={styles.timelineDot} />
      <View style={{ flex: 1 }}>
        <Text style={text.subtitle}>{title}</Text>
        <Text style={text.body}>{subtitle}</Text>
        <Text style={text.caption}>{timeLabel}</Text>
      </View>
    </View>
  );
}

export function ReviewCard({
  title,
  subtitle,
  distance,
  reason,
  onWork,
  onPersonal,
  onNotDrive,
}: {
  title: string;
  subtitle: string;
  distance: string;
  reason: string;
  onWork: () => void;
  onPersonal: () => void;
  onNotDrive: () => void;
}) {
  return (
    <View style={cardBase} accessibilityRole="summary">
      <Text style={text.subtitle}>{title}</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>{subtitle}</Text>
      <Text style={[text.caption, { marginTop: spacing.sm }]}>{distance} · {reason}</Text>
      <View style={styles.reviewActions}>
        <SecondaryButton label="Work" onPress={onWork} accessibilityLabel="Yes, work drive" />
        <SecondaryButton label="Personal" onPress={onPersonal} />
        <TertiaryButton label="Not a drive" onPress={onNotDrive} />
      </View>
    </View>
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
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const content = (
    <>
      <Text style={text.body}>{label}</Text>
      <View style={styles.listRowRight}>
        {value ? <Text style={text.caption}>{value}</Text> : null}
        {showChevron ? <Text style={text.caption}> ›</Text> : null}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={styles.listRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.listRow}>{content}</View>;
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
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={[cardBase, highlighted && styles.planHighlighted]}>
      {highlighted ? <Badge label="Most popular" variant="info" /> : null}
      <Text style={[text.title, { marginTop: spacing.sm }]}>{name}</Text>
      <Text style={text.subtitle}>{price}<Text style={text.body}> / {period}</Text></Text>
      {features.map((f) => (
        <Text key={f} style={[text.body, { marginTop: spacing.xs }]}>• {f}</Text>
      ))}
      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton label={`Choose ${name}`} onPress={onSelect} />
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

export function FormField({ label, value, placeholder, onChangeText }: {
  label: string; value: string; placeholder?: string; onChangeText?: (t: string) => void;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[text.caption, { marginBottom: spacing.xs }]}>{label}</Text>
      <View style={styles.formField}>
        {onChangeText ? (
          <TextInput
            accessibilityLabel={label}
            value={value}
            placeholder={placeholder}
            onChangeText={onChangeText}
            style={text.body}
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
  return <View style={[cardBase, styles.protectionCard]}>{children}</View>;
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
  btnDisabled: { opacity: 0.5 },
  statusCard: { borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  statusCardProtected: { backgroundColor: colors.forest[800], borderColor: colors.forest[700] },
  statusProtectedTitle: { color: colors.text.inverse },
  statusProtectedBody: { color: colors.forest[100] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: typography.size.title, fontWeight: '700', color: colors.forest[700], marginTop: spacing.xs },
  evidenceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest[500], marginTop: 6 },
  reviewActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  listSection: { marginTop: spacing.lg },
  listSectionTitle: { marginBottom: spacing.sm, letterSpacing: 0.5 },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: touchTarget.minHeight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingVertical: spacing.sm,
  },
  listRowRight: { flexDirection: 'row', alignItems: 'center' },
  selectionCard: { marginBottom: spacing.sm },
  selectionCardSelected: { borderColor: colors.forest[600], backgroundColor: colors.forest[100] },
  planHighlighted: { borderColor: colors.forest[600], borderWidth: 2 },
  empty: { alignItems: 'center', padding: spacing.xl },
  progressRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.neutral[200] },
  progressDotActive: { backgroundColor: colors.forest[600] },
  segmented: { flexDirection: 'row', backgroundColor: colors.neutral[100], borderRadius: radii.md, padding: spacing.xs, marginBottom: spacing.md },
  segment: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.sm },
  segmentSelected: { backgroundColor: colors.background.card },
  formField: { borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.md, padding: spacing.md, backgroundColor: colors.background.card },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.default, backgroundColor: colors.background.card },
  protectionCard: { backgroundColor: colors.forest[100], borderColor: colors.forest[500] },
});
