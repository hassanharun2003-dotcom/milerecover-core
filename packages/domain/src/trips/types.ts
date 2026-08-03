export type TripClassification = 'business' | 'personal' | 'unclassified';

export type TripRecordStatus = 'draft' | 'pending' | 'confirmed' | 'personal' | 'rejected';

export type TripSource = 'auto_detected' | 'manual' | 'recovered' | 'imported';

export interface TripRecord {
  id: string;
  source: TripSource;
  status: TripRecordStatus;
  classification: TripClassification;
  startAt: number;
  endAt: number;
  distanceMiles: number;
  purpose: string | null;
  notes: string | null;
  hasRouteCoordinates: boolean;
  confidence: 'high' | 'medium' | 'low' | null;
}

export function applyClassification(
  trip: TripRecord,
  classification: TripClassification
): TripRecord {
  if (trip.status === 'rejected') {
    return trip;
  }
  const status: TripRecordStatus =
    classification === 'business'
      ? 'confirmed'
      : classification === 'personal'
        ? 'personal'
        : 'pending';
  return { ...trip, classification, status };
}

export function rejectTrip(trip: TripRecord): TripRecord {
  return { ...trip, status: 'rejected', classification: 'unclassified' };
}

export function confirmedBusinessMiles(trips: TripRecord[]): number {
  return trips
    .filter((t) => t.status === 'confirmed' && t.classification === 'business')
    .reduce((sum, t) => sum + t.distanceMiles, 0);
}
