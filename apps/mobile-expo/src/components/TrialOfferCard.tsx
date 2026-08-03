import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { capabilitiesForEntitlement, shouldOfferTrial } from '@milerecover/domain';
import { colors, radii, shadows, spacing } from '@milerecover/config';
import {
  SecondaryButton,
  TertiaryButton,
  text,
} from '../design-system';
import { useProduct } from '../product/ProductContext';
import { trialRenewalCopy } from '../services/purchases';

export function TrialOfferCard({
  onStartTrial,
}: {
  onStartTrial: () => void;
}) {
  const { product, markTrialOfferShown, dismissTrialOfferSession } = useProduct();
  const [shownThisSession, setShownThisSession] = useState(false);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const eligible = shouldOfferTrial(product.entitlement, 'first_confirmed_work_drive', {
    lastOfferAt: product.paywallCaps.lastTrialOfferAt,
    dismissedSession: product.paywallCaps.trialOfferDismissedSession,
  });
  const offer = eligible || (shownThisSession && !product.paywallCaps.trialOfferDismissedSession);

  useEffect(() => {
    if (eligible && product.firstConfirmedWorkDriveAt != null && !shownThisSession) {
      setShownThisSession(true);
      markTrialOfferShown();
    }
  }, [eligible, markTrialOfferShown, product.firstConfirmedWorkDriveAt, shownThisSession]);

  if (!offer || product.firstConfirmedWorkDriveAt == null || capabilities.canUseAutomaticCapture) {
    return null;
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="Keep this protection running with Plus"
    >
      <Text style={text.subtitle}>You’re getting real value</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>
        You saved a real work drive. Keep this protection running with Plus — automatic watching and missing-drive checks.
      </Text>
      <Text style={[text.caption, { marginTop: spacing.sm }]}>
        {trialRenewalCopy(product.entitlement.monthlyPriceLocalized, product.entitlement.trialEndsAt)}
      </Text>
      <View style={styles.actions}>
        <SecondaryButton label="Try Plus free for 7 days" onPress={onStartTrial} />
        <TertiaryButton label="Not now" onPress={dismissTrialOfferSession} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.forest[500],
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
});
