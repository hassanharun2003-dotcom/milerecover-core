import type { ReviewItem } from '@milerecover/domain';
import type { MileRecoverAppState } from '../store/types';

export interface ReviewViewModel {
  items: ReviewItem[];
  emptyMessage: string;
  isEmpty: boolean;
}

export function selectReviewViewModel(state: MileRecoverAppState): ReviewViewModel {
  const items = state.reviewItems;
  return {
    items,
    isEmpty: items.length === 0,
    emptyMessage: 'Nothing needs your attention right now.',
  };
}
