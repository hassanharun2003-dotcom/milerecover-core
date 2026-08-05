import type { RecoveryCandidate } from '../recovery/types';
import type { TripRecord } from '../trips/types';

/** Read-only snapshot consumed by selectors — persistence adapter implements this. */
export interface MileRecoverDataSnapshot {
  trips: TripRecord[];
  recoveryCandidates: RecoveryCandidate[];
  lastLoadedAt: number | null;
  loadError: string | null;
}

export type DataFreshness = 'fresh' | 'stale' | 'empty' | 'error';

export function assessDataFreshness(
  snapshot: MileRecoverDataSnapshot,
  now: number,
  staleMs: number
): DataFreshness {
  if (snapshot.loadError) return 'error';
  if (snapshot.lastLoadedAt == null) return 'empty';
  if (now - snapshot.lastLoadedAt > staleMs) return 'stale';
  return 'fresh';
}
