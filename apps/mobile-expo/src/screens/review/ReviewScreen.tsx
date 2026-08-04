import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { motion } from '@milerecover/config';
import {
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
              body="We’ll let you know when something needs a quick look. Nothing uncertain enters a report until you decide."
            />
            <CarRouteHero />
            <SoftPanel>
              <Text style={text.body}>
                Review is for uncertain drives only. Add known work drives from Home anytime.
              </Text>
            </SoftPanel>
          </>
        ) : (
          pending.map((item) => (
            <ReviewCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              distance={item.distanceMiles != null ? `${item.distanceMiles.toFixed(1)} mi` : 'Distance needed'}
              reason={item.reason}
              provenance={provenanceForItem(item.kind)}
              onPress={() => {
                if (item.kind === 'possible_missing_trip') {
                  navigation.navigate('MissingTripRecovery', { reviewId: item.id });
                } else {
                  navigation.navigate('TripDetails', { tripId: item.tripId });
                }
              }}
              onWork={() => decide(item, 'work')}
              onPersonal={() => decide(item, 'personal')}
              onNotDrive={() => decide(item, 'not_drive')}
            />
          ))
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
