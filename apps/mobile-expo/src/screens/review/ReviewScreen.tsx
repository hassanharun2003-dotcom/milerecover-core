import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing } from '@milerecover/config';
import {
  EmptyState,
  ReviewCard,
  ScrollScreen,
  SectionHeader,
  SegmentedControl,
  text,
} from '../../design-system';
import { selectProductExperience } from '../../product/selectors';
import { useApp } from '../../store/AppContext';
import { useProduct } from '../../product/ProductContext';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const { state, permissions } = useApp();
  const { product, setReviewDecision, undoReviewDecision } = useProduct();
  const experience = selectProductExperience(state, product, permissions);
  const [segment, setSegment] = useState<'needs' | 'reviewed'>('needs');

  const pending = experience.activeReviewItems;
  const reviewedIds = product.reviewedHistory;

  return (
    <ScrollScreen>
      <SectionHeader title="Review" />
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
              onWork={() => setReviewDecision(item.id, 'work')}
              onPersonal={() => setReviewDecision(item.id, 'personal')}
              onNotDrive={() => setReviewDecision(item.id, 'not_drive')}
            />
          ))
        )
      ) : (
        reviewedIds.length === 0 ? (
          <EmptyState title="No reviewed items yet" body="Decisions you make will appear here with the option to undo." />
        ) : (
          reviewedIds.map((id) => (
            <ReviewCard
              key={id}
              title="Reviewed item"
              subtitle={`Decision: ${product.reviewDecisions[id] ?? 'saved'}`}
              distance="—"
              reason="Tap undo if you changed your mind"
              onWork={() => undoReviewDecision(id)}
              onPersonal={() => undoReviewDecision(id)}
              onNotDrive={() => undoReviewDecision(id)}
            />
          ))
        )
      )}
    </ScrollScreen>
  );
}
