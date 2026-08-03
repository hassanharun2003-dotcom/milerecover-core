import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { motion } from '@milerecover/config';
import {
  EmptyState,
  ReviewCard,
  ReviewedItemCard,
  ScrollScreen,
  SegmentedControl,
  UndoSnackbar,
} from '../../design-system';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { ReviewDecision } from '../../product/types';
import type { RootStackParamList, RootTabParamList } from '../../navigation/types';

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
  if (kind === 'possible_missing_trip') return 'Might have missed';
  if (kind === 'uncertain_classification') return "We're not sure yet";
  return 'Needs a look';
}

export function ReviewScreen() {
  const navigation = useNavigation<ReviewNav>();
  const { state, permissions } = useApp();
  const { product, setReviewDecision, undoReviewDecision } = useProduct();
  const experience = selectProductExperience(state, product, permissions);
  const [segment, setSegment] = useState<'needs' | 'reviewed'>('needs');
  const [undoItem, setUndoItem] = useState<{ id: string; label: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const pending = experience.activeReviewItems;
  const reviewedIds = product.reviewedHistory;

  const classify = (id: string, decision: Exclude<ReviewDecision, null>) => {
    setReviewDecision(id, decision);
    setUndoItem({ id, label: decisionLabel(decision) });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoItem(null), motion.undoSnackbarMs);
  };

  return (
    <ScrollScreen>
      <SegmentedControl
        options={[
          { label: `Needs you (${pending.length})`, value: 'needs' },
          { label: `Done (${reviewedIds.length})`, value: 'reviewed' },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {segment === 'needs' ? (
        pending.length === 0 ? (
          <EmptyState
            title="All clear"
            body="Nothing needs a decision right now. We’ll bring uncertain drives here—one at a time, ten seconds and done."
            actionLabel="Add a drive"
            onAction={() => navigation.navigate('ManualTrip')}
          />
        ) : (
          pending.map((item) => (
            <ReviewCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              distance={
                item.distanceMiles != null
                  ? `About ${item.distanceMiles.toFixed(1)} mi`
                  : 'Distance unclear'
              }
              reason={item.reason}
              provenance={provenanceForItem(item.kind)}
              onPress={() => {
                if (item.kind === 'possible_missing_trip') {
                  navigation.navigate('MissingTripRecovery', { reviewId: item.id });
                } else {
                  navigation.navigate('TripDetails', { tripId: item.id });
                }
              }}
              onWork={() => classify(item.id, 'work')}
              onPersonal={() => classify(item.id, 'personal')}
              onNotDrive={() => classify(item.id, 'not_drive')}
            />
          ))
        )
      ) : reviewedIds.length === 0 ? (
        <EmptyState
          title="No decisions yet"
          body="Choices you make show up here so you can undo if you change your mind."
        />
      ) : (
        reviewedIds.map((id) => {
          const item = experience.scenario.reviewItems.find((r) => r.id === id);
          return (
            <ReviewedItemCard
              key={id}
              title={item?.title ?? 'Reviewed drive'}
              subtitle={item?.subtitle ?? 'Your choice is saved'}
              decisionLabel={decisionLabel(product.reviewDecisions[id])}
              onUndo={() => undoReviewDecision(id)}
            />
          );
        })
      )}

      {undoItem ? (
        <UndoSnackbar
          message={`Marked as ${undoItem.label}`}
          onUndo={() => {
            undoReviewDecision(undoItem.id);
            setUndoItem(null);
            if (undoTimer.current) clearTimeout(undoTimer.current);
          }}
          onDismiss={() => setUndoItem(null)}
        />
      ) : null}
    </ScrollScreen>
  );
}
