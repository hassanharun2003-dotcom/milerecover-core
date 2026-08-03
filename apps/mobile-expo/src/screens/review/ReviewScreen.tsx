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
  SectionHeader,
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
  if (kind === 'possible_missing_trip') return 'Suggested recovery';
  if (kind === 'uncertain_classification') return 'Uncertain route';
  return 'Needs review';
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
      <SectionHeader title={`Needs review${pending.length > 0 ? ` · ${pending.length}` : ''}`} />
      <SegmentedControl
        options={[
          { label: `Needs review (${pending.length})`, value: 'needs' },
          { label: `Reviewed (${reviewedIds.length})`, value: 'reviewed' },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {segment === 'needs' ? (
        pending.length === 0 ? (
          <EmptyState
            title="All clear"
            body="Nothing needs your attention right now. MileRecover will surface uncertain trips here—one decision at a time."
            actionLabel="Add manual trip"
            onAction={() => navigation.navigate('ManualTrip')}
          />
        ) : (
          pending.map((item) => (
            <ReviewCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              distance={item.distanceMiles != null ? `${item.distanceMiles.toFixed(1)} mi approximate` : 'Distance uncertain'}
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
        <EmptyState title="No reviewed items yet" body="Decisions you make will appear here with the option to undo." />
      ) : (
        reviewedIds.map((id) => {
          const item = experience.scenario.reviewItems.find((r) => r.id === id);
          return (
            <ReviewedItemCard
              key={id}
              title={item?.title ?? 'Reviewed item'}
              subtitle={item?.subtitle ?? 'Your decision is saved'}
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
