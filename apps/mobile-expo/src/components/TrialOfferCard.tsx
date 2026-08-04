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
import { earnedTrialMoment, earnedTrialTrigger } from '../product/trialValue';
import { trialRenewalCopy } from '../services/purchases';

export function TrialOfferCard({
  onStartTrial,
  confirmedWorkDriveCount = 0,
}: {
  onStartTrial: () => void;
  confirmedWorkDriveCount?: number;
}) {
  const { product, markTrialOfferShown, dismissTrialOfferSession } = useProduct();
  const [shownThisSession, setShownThisSession] = useState(false);
  const capabilities = capabilitiesForEntitlement(product.entitlement);
  const moment = earnedTrialMoment(product, confirmedWorkDriveCount);
  const trigger = moment ? earnedTrialTrigger(moment) : 'plus_only_capability';
  const eligible =
    moment != null &&
    shouldOfferTrial(product.entitlement, trigger, {
      lastOfferAt: product.paywallCaps.lastTrialOfferAt,
      dismissedSession: product.paywallCaps.trialOfferDismissedSession,
    });
  const offer = eligible || (shownThisSession && moment != null && !product.paywallCaps.trialOfferDismissedSession);

  useEffect(() => {
    if (eligible && !shownThisSession) {
      setShownThisSession(true);
      markTrialOfferShown();
    }
  }, [eligible, markTrialOfferShown, shownThisSession]);

  if (!offer || moment == null || capabilities.canUseAutomaticCapture) {
    return null;
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="Continue automatic protection free for 7 days"
    >
      <Text style={text.subtitle}>We’ve already helped protect your mileage</Text>
      <Text style={[text.body, { marginTop: spacing.xs }]}>
        Continue automatic protection free for 7 days. No countdown. Cancel anytime in the store.
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
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
});
