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
  ReviewCard,
  ReviewedItemCard,
  SegmentedControl,
  SoftPanel,
  TabScreen,
  TertiaryButton,
  text,
  UndoSnackbar,
} from '../../design-system';
import { Text } from 'react-native';
import { CarRouteHero } from '../../components/CarRouteHero';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';
import { selectProductExperience } from '../../product/selectors';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision, ReviewHistoryEntry } from '../../product/types';
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
  if (kind === 'conflicted_trip') return 'Details don’t match';
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
  } = useApp();
  const { product, pushReviewHistory, markReviewHistoryUndone, markFirstMissingTripSeen } = useProduct();
  const experience = selectProductExperience(state, product, permissions, automaticCaptureAvailable);
  const [segment, setSegment] = useState<'needs' | 'reviewed'>('needs');
  const [undoItem, setUndoItem] = useState<ReviewHistoryEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = experience.activeReviewItems;
  const reviewed = product.reviewHistoryEntries.filter((entry) => !entry.undoneAt);
  const locale = product.localeProfile;

  const workMilesReady = useMemo(() => {
    return experience.confirmedTrips
      .filter((trip) => trip.classification === 'business' && trip.status === 'confirmed')
      .reduce((sum, trip) => sum + trip.distanceMiles, 0);
  }, [experience.confirmedTrips]);

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

  const decide = (item: ReviewItem, decision: Exclude<ReviewDecision, null>) => {
    if (item.kind === 'possible_missing_trip') {
      const candidate = state.recoveryCandidates.find((recovery) => recovery.id === item.recoveryCandidateId);
      if (!candidate) return;
      if (decision === 'work') {
        navigation.navigate('MissingTripRecovery', { reviewId: item.id });
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

  const caughtUpBody =
    workMilesReady > 0
      ? `${formatDistance(workMilesReady, locale.distanceUnit, locale.localeTag)} of work travel ${
          locale.distanceUnit === 'km' ? 'are' : 'are'
        } ready for Proof.`
      : 'We’ll let you know when something needs a quick look. Nothing uncertain enters Proof until you decide.';

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
            <EmptyState title="All caught up" body={caughtUpBody} />
            <CarRouteHero />
            <SoftPanel>
              <Text style={text.body}>
                Review is for uncertain drives only. Add known work drives from Home anytime.
              </Text>
            </SoftPanel>
          </>
        ) : (
          pending.map((item) => {
            const tripId = item.kind === 'possible_missing_trip' ? null : item.tripId;
            const trip = tripId ? state.trips.find((record) => record.id === tripId) : undefined;
            const vehicle = trip?.vehicleId
              ? product.vehicles.find((v) => v.id === trip.vehicleId)
              : null;
            const vehicleLabel = vehicle
              ? vehicle.nickname || [vehicle.make, vehicle.model].filter(Boolean).join(' ')
              : null;
            const insufficientEvidence =
              item.kind === 'low_confidence_trip' ||
              item.kind === 'conflicted_trip' ||
              item.distanceMiles == null ||
              trip?.confidence === 'low';
            const at = trip?.startAt ?? Date.now();
            return (
              <ReviewCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                distance={
                  item.distanceMiles != null
                    ? formatDistance(item.distanceMiles, locale.distanceUnit, locale.localeTag)
                    : 'Distance needed'
                }
                estimatedValue={estimateForMiles(item.distanceMiles, at)}
                reason={item.reason}
                provenance={provenanceForItem(item.kind)}
                evidence={trip ? captureSourceLabel(trip.source) : provenanceForItem(item.kind)}
                vehicle={vehicleLabel}
                onPress={() => {
                  if (item.kind === 'possible_missing_trip') {
                    navigation.navigate('MissingTripRecovery', { reviewId: item.id });
                  } else {
                    navigation.navigate('TripDetails', { tripId: item.tripId });
                  }
                }}
                onWork={() => decide(item, 'work')}
                onPersonal={() => decide(item, 'personal')}
                onEdit={() => {
                  if (item.kind === 'possible_missing_trip') {
                    navigation.navigate('MissingTripRecovery', { reviewId: item.id });
                  } else {
                    navigation.navigate('TripDetails', { tripId: item.tripId });
                  }
                }}
                onNotSure={insufficientEvidence ? () => decide(item, 'not_sure') : undefined}
                onNotDrive={() => decide(item, 'not_drive')}
              />
            );
          })
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
