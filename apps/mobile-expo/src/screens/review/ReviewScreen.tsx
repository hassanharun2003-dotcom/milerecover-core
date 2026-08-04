import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { motion } from '@milerecover/config';
import {
  estimatedValueCents,
  formatCurrencyCents,
  formatDistance,
  rateForTimestamp,
  type RecoveryCandidate,
  type ReviewItem,
  type TripRecord,
} from '@milerecover/domain';
import {
  EmptyState,
  PrimaryButton,
  ReviewCard,
  ReviewedItemCard,
  SecondaryButton,
  SegmentedControl,
  SoftPanel,
  TabScreen,
  TertiaryButton,
  text,
  UndoSnackbar,
} from '../../design-system';
import { Alert, Text } from 'react-native';
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
  if (kind === 'possible_missing_trip') return 'Possible missing drive';
  if (kind === 'low_confidence_trip') return 'Not sure about this one';
  if (kind === 'conflicted_trip') return "Details don't match";
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
      return 'Automatic capture';
    case 'recovered':
      return 'Recovered';
    case 'imported':
      return 'Imported';
    case 'manual':
      return 'Manual entry';
    default:
      return 'Needs review';
  }
}

export function ReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
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
  const { product, pushReviewHistory, markReviewHistoryUndone, markFirstMissingTripSeen } = useProduct();
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const [segment, setSegment] = useState<'needs' | 'reviewed'>('needs');
  const [undoItem, setUndoItem] = useState<ReviewHistoryEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = experience.activeReviewItems;
  const reviewed = product.reviewHistoryEntries.filter((entry) => !entry.undoneAt);
  const locale = product.localeProfile;

  useEffect(() => {
    if (pending.some((item) => item.kind === 'possible_missing_trip') && product.firstMissingTripSeenAt == null) {
      markFirstMissingTripSeen();
    }
  }, [markFirstMissingTripSeen, pending, product.firstMissingTripSeenAt]);

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
    classifyTrip(trip.id, decision);
    pushDecision(item, decision, trip, trip.id, 'trip');
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
    return `Estimated value ${formatCurrencyCents(cents, locale.currencyCode, locale.localeTag)}`;
  };

  const checkMissedDrives = () => {
    refreshRecoverySuggestions(product.workLocations.map((loc) => ({ id: loc.id, label: loc.label })));
  };

  const safeBulkWorkItems = pending.filter((item) => {
    if (item.kind === 'possible_missing_trip') return false;
    const trip = state.trips.find((record) => record.id === item.tripId);
    if (!trip) return false;
    if (trip.confidence !== 'high') return false;
    if (!trip.purpose?.trim()) return false;
    if (!(trip.distanceMiles > 0)) return false;
    return item.kind === 'classification_needed';
  });

  const confirmAllSafe = () => {
    if (safeBulkWorkItems.length === 0) return;
    Alert.alert(
      `Confirm ${safeBulkWorkItems.length} clear work drive${safeBulkWorkItems.length === 1 ? '' : 's'}?`,
      'Only high-confidence trips with purpose and distance are included. You can undo each one afterward.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm all',
          onPress: () => {
            for (const item of safeBulkWorkItems) {
              decide(item, 'work');
            }
          },
        },
      ],
    );
  };

  return (
    <TabScreen>
      <SegmentedControl
        options={[
          { label: `Needs you (${pending.length})`, value: 'needs' },
          { label: `Done (${reviewed.length})`, value: 'reviewed' },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {segment === 'needs' ? (
        pending.length === 0 ? (
          <>
            <EmptyState
              title="You’re caught up"
              body="All confirmed work drives are ready for Proof."
            />
            <SecondaryButton
              label="Add a known work drive"
              onPress={() => navigation.navigate('ManualTrip')}
            />
            <TertiaryButton label="Check for missed drives" onPress={checkMissedDrives} />
          </>
        ) : (
          <>
            {safeBulkWorkItems.length >= 2 ? (
              <SoftPanel>
                <Text style={text.body}>
                  {safeBulkWorkItems.length} clear work drives can be confirmed together. Nothing uncertain is included.
                </Text>
                <PrimaryButton
                  label={`Confirm ${safeBulkWorkItems.length} clear work drives`}
                  onPress={confirmAllSafe}
                  accessibilityLabel={`Confirm ${safeBulkWorkItems.length} clear work drives`}
                />
              </SoftPanel>
            ) : null}
            {pending.map((item) => {
            const tripId = item.kind === 'possible_missing_trip' ? null : item.tripId;
            const trip = tripId ? state.trips.find((record) => record.id === tripId) : undefined;
            const vehicle = trip?.vehicleId
              ? product.vehicles.find((v) => v.id === trip.vehicleId)
              : null;
            const vehicleLabel = vehicle
              ? vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ')
              : null;
            const at = trip?.startAt ?? Date.now();
            const whenLabel = trip
              ? `${new Date(trip.startAt).toLocaleDateString(locale.localeTag, {
                  month: 'short',
                  day: 'numeric',
                })} · ${new Date(trip.startAt).toLocaleTimeString(locale.localeTag, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}`
              : item.subtitle;
            const routeLabel =
              trip?.startLabel || trip?.endLabel
                ? `${trip?.startLabel ?? 'Start'} → ${trip?.endLabel ?? 'Destination'}`
                : item.title;
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
                estimatedValue={estimateForMiles(item.distanceMiles, at)}
                reason={item.reason || 'Needs a quick decision before Proof'}
                provenance={provenanceForItem(item.kind)}
                evidence={
                  trip
                    ? `${captureSourceLabel(trip.source)}${trip.confidence ? ` · ${trip.confidence} confidence` : ''}`
                    : provenanceForItem(item.kind)
                }
                vehicle={vehicleLabel}
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
                    navigation.navigate('TripDetails', { tripId: item.tripId });
                  }
                }}
                onNotSure={() => decide(item, 'not_sure')}
                onNotDrive={() => decide(item, 'not_drive')}
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
        reviewed.map((entry) => (
          <ReviewedItemCard
            key={`${entry.id}-${entry.decidedAt}`}
            title={entry.targetKind === 'trip' ? 'Drive you reviewed' : 'Possible drive you reviewed'}
            subtitle={new Date(entry.decidedAt).toLocaleString()}
            decisionLabel={decisionLabel(entry.decision)}
            onUndo={() => undo(entry)}
          />
        ))
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
