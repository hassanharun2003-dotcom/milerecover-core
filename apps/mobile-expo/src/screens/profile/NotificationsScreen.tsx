import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import { MRCard, StackScrollScreen, text, useAppTheme } from '../../design-system';
import { useProduct } from '../../product/ProductContext';
import {
  requestNotificationPermission,
  type NotificationPreferenceKey,
} from '../../services/notifications';

const ROWS: { key: NotificationPreferenceKey; label: string; body: string }[] = [
  {
    key: 'tripReadyForReview',
    label: 'Drives ready for review',
    body: 'When trips need classification',
  },
  {
    key: 'possibleMissedDrive',
    label: 'Possible missed drives',
    body: 'When a recovery check finds candidates',
  },
  {
    key: 'trackingDegraded',
    label: 'Tracking needs attention',
    body: 'If protection may be interrupted',
  },
  {
    key: 'weeklySummary',
    label: 'Weekly summary',
    body: 'A calm weekly mileage snapshot',
  },
  {
    key: 'reportReminder',
    label: 'Report reminders',
    body: 'When a report period looks ready to share.',
  },
  {
    key: 'trialEnding',
    label: 'Trial ending',
    body: 'Only if you start a trial yourself.',
  },
  {
    key: 'paymentIssue',
    label: 'Billing issues',
    body: 'Renewal or payment problems from the store.',
  },
];

export function NotificationsScreen() {
  const { palette } = useAppTheme();
  const { product, setNotificationPreferences } = useProduct();
  const prefs = product.notificationPreferences;
  const [busy, setBusy] = useState(false);

  const enableMaster = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationPreferences({ enabled: false });
      return;
    }
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPreferences({ enabled: permission === 'granted' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <StackScrollScreen>
      <Text style={[text.headline, { marginBottom: spacing.sm }]} accessibilityRole="header">
        Notifications
      </Text>
      <Text style={[text.body, { marginBottom: spacing.md, color: palette.text.secondary }]}>
        No sensitive route details on the lock screen.
      </Text>

      <MRCard
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
          minHeight: 56,
        }}
        accessibilityLabel="Enable notifications"
      >
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={{ fontWeight: '700', color: palette.text.primary }}>Allow notifications</Text>
          <Text style={{ color: palette.text.secondary, marginTop: 2 }}>
            Master control for MileRecover alerts
          </Text>
        </View>
        <Switch
          value={prefs.enabled}
          disabled={busy}
          onValueChange={(value) => void enableMaster(value)}
          accessibilityLabel="Allow notifications"
        />
      </MRCard>

      {ROWS.map((row) => (
        <MRCard
          key={row.key}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.sm,
            minHeight: 64,
          }}
          accessibilityLabel={row.label}
        >
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <Text style={{ fontWeight: '600', color: palette.text.primary }}>{row.label}</Text>
            <Text style={{ color: palette.text.secondary, marginTop: 2, fontSize: 13 }}>
              {row.body}
            </Text>
          </View>
          <Switch
            value={prefs.enabled && prefs[row.key]}
            disabled={!prefs.enabled}
            onValueChange={(value) => setNotificationPreferences({ [row.key]: value })}
            accessibilityLabel={row.label}
          />
        </MRCard>
      ))}
    </StackScrollScreen>
  );
}
