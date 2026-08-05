import { useEffect } from 'react';
import { createManualTripRecord } from '@milerecover/domain';
import { useApp } from '../store/AppContext';
import { useProduct } from '../product/ProductContext';

/** One-time migrate legacy product.manualTrips into domain TripRecords. */
export function ManualTripMigration() {
  const { state, upsertTrip } = useApp();
  const { product, hydrated, markManualTripsMigrated } = useProduct();

  useEffect(() => {
    if (!hydrated || product.manualTripsMigrated) return;
    if (product.manualTrips.length === 0) {
      markManualTripsMigrated();
      return;
    }
    for (const draft of product.manualTrips) {
      if (state.trips.some((t) => t.id === draft.id)) continue;
      const start = Date.parse(draft.date);
      const startAt = Number.isNaN(start) ? draft.createdAt : start;
      upsertTrip(
        createManualTripRecord({
          id: draft.id,
          startAt,
          endAt: startAt + 3600000,
          distanceMiles: draft.distanceMiles,
          purpose: draft.purpose,
          evidenceMethod: 'user_estimate',
          confirmAsWork: true,
        }),
      );
    }
    markManualTripsMigrated();
  }, [hydrated, product.manualTripsMigrated, product.manualTrips, state.trips, upsertTrip, markManualTripsMigrated]);

  return null;
}
