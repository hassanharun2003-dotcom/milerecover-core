import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { motion } from '@milerecover/config';
import {
  createTripRateSnapshot,
  estimatedValueCents,
  formatCurrencyCents,
  formatDistance,
  rateForTimestamp,
  type DistanceUnit,
  type RecoveryCandidate,
  type ReviewItem,
  type TripRecord,
} from '@milerecover/domain';
import {
  EmptyState,
  MRCard,
  MRPrimaryButton,
  MRSecondaryButton,
  MRSegmentedControl,
  ReviewCard,
  ReviewedItemCard,
  TabScreen,
  TertiaryButton,
  UndoSnackbar,
  text,
  useAppTheme,
} from '../../design-system';
import { Alert, Text, View } from 'react-native';
import { spacing, typography } from '@milerecover/config';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { selectProductExperience } from '../../product/selectors';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision, ReviewHistoryEntry } from '../../product/types';
import { ANALYTICS_EVENTS, logEvent } from '../../services/analytics';
import { useApp } from '../../store/AppContext';

type ReviewNav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'Review'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function decisionLabel(decision: string | null | undefined): string {
  switch (decision) {
    case 'work':
      return 'Work';
    case 'personal':
      return 'Personal';
    case 'not_drive':
      return 'Not a drive';
    case 'not_sure':
      return 'Not sure';
    default:
      return 'Saved';
  }
}

function provenanceForItem(kind: string): string {
  if (kind === 'possible_missing_trip') return 'Possible drive. Confirm it only if this was work.';
  if (kind === 'low_confidence_trip') return 'Low confidence. Check the details before it affects Proof.';
  if (kind === 'conflicted_trip') return "Details don't match yet.";
  return 'Needs a quick decision';
}

function isTripRecord(value: unknown): value is TripRecord {
  return Boolean(value && typeof value === 'object' && 'distanceMiles' in value && 'startAt' in value);
}

function isRecoveryCandidate(value: unknown): value is RecoveryCandidate {
  return Boolean(value && typeof value === 'object' && 'proposedStartAt' in value && 'plainLanguageExplanation' in value);
}

function captureSourceLabel(source: TripRecord['source'] | undefined): string {
  switch (source) {
    case 'auto_detected':
      return 'Automatically captured';
    case 'recovered':
      return 'Recovered drive';
    case 'imported':
      return 'Imported';
    case 'manual':
      return 'Added manually';
    default:
      return 'Needs review';
  }
}

function compactPlace(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return trimmed.split(',')[0]?.trim() || trimmed;
}

function sharedCity(start: string | null | undefined, end: string | null | undefined): boolean {
  const startCity = start?.split(',').slice(-1)[0]?.trim().toLowerCase();
  const endCity = end?.split(',').slice(-1)[0]?.trim().toLowerCase();
  return Boolean(startCity && endCity && startCity === endCity && start?.trim() !== end?.trim());
}

function routeLabelForTrip(trip: Pick<TripRecord, 'startLabel' | 'endLabel'> | null | undefined, fallback: string): string {
  const start = compactPlace(trip?.startLabel);
  const end = compactPlace(trip?.endLabel);
  if (start && end) {
    const near = sharedCity(trip?.startLabel, trip?.endLabel) || start.toLowerCase() === end.toLowerCase();
    return `${near ? `Near ${start}` : start} → ${near ? `Near ${end}` : end}`;
  }
  if (start) return `Near ${start} → Destination`;
  if (end) return `Start → Near ${end}`;
  return fallback;
}

function dateTimeLabel(at: number, localeTag: string): string {
  return `${new Date(at).toLocaleDateString(localeTag, {
    month: 'short',
    day: 'numeric',
  })} · ${new Date(at).toLocaleTimeString(localeTag, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function durationLabel(startAt: number | null | undefined, endAt: number | null | undefined): string | null {
  if (startAt == null || endAt == null || endAt <= startAt) return null;
  const minutes = Math.max(1, Math.round((endAt - startAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours} hr ${rem} min` : `${hours} hr`;
}

function reviewedHistoryCopy(entry: ReviewHistoryEntry, localeTag: string, distanceUnit: DistanceUnit): {
  title: string;
  subtitle: string;
} {
  if (entry.targetKind === 'trip' && isTripRecord(entry.previousSnapshot)) {
    const trip = entry.previousSnapshot;
    return {
      title: routeLabelForTrip(trip, 'Drive you reviewed'),
      subtitle: `${dateTimeLabel(trip.startAt, localeTag)} · ${formatDistance(
        trip.distanceMiles,
        distanceUnit,
        localeTag,
      )}`,
    };
  }
  if (entry.targetKind === 'recovery' && isRecoveryCandidate(entry.previousSnapshot)) {
    const candidate = entry.previousSnapshot;
    return {
      title: 'Possible drive you reviewed',
      subtitle: `${dateTimeLabel(candidate.proposedStartAt, localeTag)} · ${
        candidate.proposedDistanceMiles != null
          ? formatDistance(candidate.proposedDistanceMiles, distanceUnit, localeTag)
          : 'Distance needed'
      }`,
    };
  }
  return {
    title: entry.targetKind === 'trip' ? 'Drive you reviewed' : 'Possible drive you reviewed',
    subtitle: dateTimeLabel(entry.decidedAt, localeTag),
  };
}

export function ReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const { palette } = useAppTheme();
  const {
    state,
    permissions,
    automaticCaptureAvailable,
    classifyTrip,
    rejectRecovery,
    restoreTrip,
    upsertRecovery,
    refreshRecoverySuggestions,
  } = useApp();
  const {
    product,
    pushReviewHistory,
    markReviewHistoryUndone,
    markFirstMissingTripSeen,
    consumeMissingScan,
  } = useProduct();
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const [segment, setSegment] = useState<'needs' | 'reviewed'>('needs');
  const [undoItem, setUndoItem] = useState<ReviewHistoryEntry | null>(null);
  const [batchChoices, setBatchChoices] = useState<Record<string, 'work' | 'personal' | null>>({});
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = experience.activeReviewItems;
  const reviewed = product.reviewHistoryEntries.filter((entry) => !entry.undoneAt);
  const locale = product.localeProfile;

  const batchGroups = (() => {
    const groups = new Map<string, ReviewItem[]>();
    for (const item of pending) {
      if (item.kind === 'possible_missing_trip') continue;
      const trip = state.trips.find((record) => record.id === item.tripId);
      const key = routeLabelForTrip(trip, item.title);
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return [...groups.entries()]
      .filter(([, items]) => items.length >= 2)
      .map(([route, items]) => ({ route, items }));
  })();
  const showBatch = segment === 'needs' && batchGroups.length > 0;

  useEffect(() => {
    if (pending.some((item) => item.kind === 'possible_missing_trip') && product.firstMissingTripSeenAt == null) {
      markFirstMissingTripSeen();
    }
  }, [markFirstMissingTripSeen, pending, product.firstMissingTripSeenAt]);

  const previousPendingCount = useRef(pending.length);
  useEffect(() => {
    const prev = previousPendingCount.current;
    previousPendingCount.current = pending.length;
    if (prev >= 3 && pending.length === 0) {
      void import('../../services/reviewPrompt').then(({ maybeAskForReview }) =>
        maybeAskForReview('review_backlog_cleared'),
      );
    }
  }, [pending.length]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const showUndo = (entry: ReviewHistoryEntry) => {
    setUndoItem(entry);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoItem(null), motion.undoSnackbarMs);
  };

  const pushDecision = (
    item: ReviewItem,
    decision: Exclude<ReviewDecision, null>,
    previousSnapshot: unknown,
    targetId: string,
    targetKind: ReviewHistoryEntry['targetKind'],
  ) => {
    const entry: ReviewHistoryEntry = {
      id: item.id,
      targetId,
      targetKind,
      previousSnapshot,
      decision,
      decidedAt: Date.now(),
      undoneAt: null,
    };
    pushReviewHistory(entry);
    showUndo(entry);
  };

  const openRecovery = (reviewId: string) => {
    logEvent(ANALYTICS_EVENTS.recoveryStarted, { source: 'review' });
    navigation.navigate('MissingTripRecovery', { reviewId });
  };

  const decide = (item: ReviewItem, decision: Exclude<ReviewDecision, null>) => {
    logEvent(ANALYTICS_EVENTS.uncertainDriveReviewed, {
      decision,
      kind: item.kind,
    });

    if (item.kind === 'possible_missing_trip') {
      const candidate = state.recoveryCandidates.find((recovery) => recovery.id === item.recoveryCandidateId);
      if (!candidate) return;
      if (decision === 'work') {
        openRecovery(item.id);
        return;
      }
      if (decision === 'not_sure') {
        pushDecision(item, decision, candidate, candidate.id, 'recovery');
        return;
      }
      rejectRecovery(candidate.id);
      pushDecision(item, decision, candidate, candidate.id, 'recovery');
      return;
    }

    const trip = state.trips.find((record) => record.id === item.tripId);
    if (!trip) return;
    classifyTrip(
      trip.id,
      decision,
      decision === 'work'
        ? { rateSnapshot: createTripRateSnapshot(product.localeProfile, trip.startAt) }
        : undefined,
    );
    pushDecision(item, decision, trip, trip.id, 'trip');
  };

  const confirmBatchClassifications = () => {
    for (const group of batchGroups) {
      const choice = batchChoices[group.route];
      if (choice !== 'work' && choice !== 'personal') continue;
      for (const item of group.items) {
        decide(item, choice);
      }
    }
    setBatchChoices({});
  };

  const undo = (entry: ReviewHistoryEntry) => {
    if (entry.targetKind === 'trip' && isTripRecord(entry.previousSnapshot)) {
      restoreTrip(entry.previousSnapshot);
    }
    if (entry.targetKind === 'recovery' && isRecoveryCandidate(entry.previousSnapshot)) {
      upsertRecovery(entry.previousSnapshot);
    }
    markReviewHistoryUndone(entry.id);
    setUndoItem(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const estimateForMiles = (miles: number | null | undefined, at: number): string | null => {
    if (miles == null) return null;
    const rate = rateForTimestamp(locale.rates, at);
    if (!rate) return null;
    const cents = estimatedValueCents(miles, rate.centsPerMile);
    if (cents == null) return null;
    return formatCurrencyCents(cents, locale.currencyCode, locale.localeTag);
  };

  const checkMissedDrives = () => {
    if (!consumeMissingScan()) {
      Alert.alert(
        'Monthly scan used',
        'Free includes one missing-trip scan per month. Upgrade for recurring missed-drive review, or add drives manually.',
      );
      return;
    }
    markFirstMissingTripSeen();
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  };

  return (
    <TabScreen>
      <Text
        style={{
          fontSize: typography.size.title,
          lineHeight: typography.lineHeight.title,
          fontWeight: '700',
          color: palette.text.primary,
          marginBottom: spacing.md,
        }}
        accessibilityRole="header"
      >
        Review
      </Text>
      <MRSegmentedControl
        options={[
          { label: `Needs review (${pending.length})`, value: 'needs' },
          { label: `Done (${reviewed.length})`, value: 'reviewed' },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {showBatch ? (
        <MRCard style={{ marginBottom: spacing.md, padding: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.title,
              lineHeight: typography.lineHeight.title,
              fontWeight: '700',
              color: palette.text.primary,
              marginBottom: spacing.xs,
            }}
            accessibilityRole="header"
          >
            Classify quickly
          </Text>
          <Text style={[text.body, { color: palette.text.secondary, marginBottom: spacing.md }]}>
            Mark several similar drives at once.
          </Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            {batchGroups.map((group) => (
              <View
                key={group.route}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                }}
              >
                <Text style={[text.body, { flex: 1, fontWeight: '600', color: palette.text.primary }]}>
                  {group.route} · {group.items.length} drives
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <TertiaryButton
                    label="Work"
                    onPress={() =>
                      setBatchChoices((prev) => ({
                        ...prev,
                        [group.route]: prev[group.route] === 'work' ? null : 'work',
                      }))
                    }
                    accessibilityLabel={`Mark ${group.route} as Work`}
                  />
                  <TertiaryButton
                    label="Personal"
                    onPress={() =>
                      setBatchChoices((prev) => ({
                        ...prev,
                        [group.route]: prev[group.route] === 'personal' ? null : 'personal',
                      }))
                    }
                    accessibilityLabel={`Mark ${group.route} as Personal`}
                  />
                </View>
              </View>
            ))}
          </View>
          <MRPrimaryButton
            label="Confirm classifications"
            onPress={confirmBatchClassifications}
            disabled={!Object.values(batchChoices).some((v) => v === 'work' || v === 'personal')}
            accessibilityLabel="Confirm batch classifications"
          />
        </MRCard>
      ) : null}

      {segment === 'needs' ? (
        pending.length === 0 ? (
          <>
            <EmptyState
              title="You’re caught up"
              body="No drives need classification."
            />
            <MRSecondaryButton
              label="Add drive"
              onPress={() => navigation.navigate('ManualTrip')}
            />
            <TertiaryButton label="Check for missed drives" onPress={checkMissedDrives} />
          </>
        ) : (
          <>
            {pending.map((item) => {
            const tripId = item.kind === 'possible_missing_trip' ? null : item.tripId;
            const trip = tripId ? state.trips.find((record) => record.id === tripId) : undefined;
            const recovery =
              item.kind === 'possible_missing_trip'
                ? state.recoveryCandidates.find((candidate) => candidate.id === item.recoveryCandidateId)
                : null;
            const vehicle = trip?.vehicleId
              ? product.vehicles.find((v) => v.id === trip.vehicleId)
              : null;
            const vehicleLabel = vehicle
              ? vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ')
              : null;
            const at = trip?.startAt ?? recovery?.proposedStartAt ?? Date.now();
            const whenLabel = trip
              ? dateTimeLabel(trip.startAt, locale.localeTag)
              : recovery
                ? dateTimeLabel(recovery.proposedStartAt, locale.localeTag)
                : item.subtitle;
            const routeLabel = routeLabelForTrip(trip, recovery ? 'Possible drive → Add details' : item.title);
            const plainReason =
              recovery?.plainLanguageExplanation ||
              (trip?.confidence === 'low'
                ? trip.notes || 'Low confidence. Check the details before this drive affects Proof.'
                : item.reason || provenanceForItem(item.kind));
            const confidenceLabel =
              item.kind === 'possible_missing_trip'
                ? 'Possible drive'
                : trip?.confidence === 'high'
                  ? 'High confidence'
                  : trip?.confidence === 'medium'
                    ? 'Medium confidence'
                    : trip?.confidence === 'low'
                      ? 'Low confidence'
                      : null;
            return (
              <ReviewCard
                key={item.id}
                title={routeLabel}
                subtitle={whenLabel}
                distance={
                  item.distanceMiles != null
                    ? formatDistance(item.distanceMiles, locale.distanceUnit, locale.localeTag)
                    : 'Distance needed'
                }
                duration={durationLabel(trip?.startAt ?? recovery?.proposedStartAt, trip?.endAt ?? recovery?.proposedEndAt)}
                estimatedValue={estimateForMiles(item.distanceMiles, at)}
                purpose={trip?.purpose ?? null}
                confidence={confidenceLabel}
                reason={plainReason}
                provenance={provenanceForItem(item.kind)}
                evidence={trip ? captureSourceLabel(trip.source) : provenanceForItem(item.kind)}
                vehicle={vehicleLabel}
                routePreview={trip?.routePreview ?? null}
                onPress={() => {
                  if (item.kind === 'possible_missing_trip') {
                    openRecovery(item.id);
                  } else {
                    navigation.navigate('TripDetails', { tripId: item.tripId });
                  }
                }}
                onWork={() => decide(item, 'work')}
                onPersonal={() => decide(item, 'personal')}
                onEdit={() => {
                  if (item.kind === 'possible_missing_trip') {
                    openRecovery(item.id);
                  } else {
                    navigation.navigate('ManualTrip', { tripId: item.tripId });
                  }
                }}
                onNotSure={() => decide(item, 'not_sure')}
              />
            );
          })}
          </>
        )
      ) : reviewed.length === 0 ? (
        <EmptyState
          title="Nothing reviewed yet"
          body="Choices you make appear here, where you can undo them if needed."
        />
      ) : (
        reviewed.map((entry) => {
          const copy = reviewedHistoryCopy(entry, locale.localeTag, locale.distanceUnit);
          return (
            <ReviewedItemCard
              key={`${entry.id}-${entry.decidedAt}`}
              title={copy.title}
              subtitle={copy.subtitle}
              decisionLabel={decisionLabel(entry.decision)}
              onUndo={() => undo(entry)}
            />
          );
        })
      )}

      {segment === 'needs' && pending.length > 0 ? (
        <TertiaryButton label="Add a drive" onPress={() => navigation.navigate('ManualTrip')} />
      ) : null}

      {undoItem ? (
        <UndoSnackbar
          message={`Marked as ${decisionLabel(undoItem.decision)}`}
          onUndo={() => undo(undoItem)}
          onDismiss={() => setUndoItem(null)}
        />
      ) : null}
    </TabScreen>
  );
}
