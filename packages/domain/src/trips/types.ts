export type TripClassification = 'business' | 'personal' | 'unclassified';

export type TripRecordStatus = 'draft' | 'pending' | 'confirmed' | 'personal' | 'rejected';

export type TripSource = 'auto_detected' | 'manual' | 'recovered' | 'imported';

export type TripEvidenceMethod =
  | 'odometer'
  | 'map_estimate'
  | 'calendar_receipt_note'
  | 'user_estimate';

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
  /** Optional MVP fields — absent on older persisted records */
  startLabel?: string | null;
  endLabel?: string | null;
  vehicleId?: string | null;
  evidenceMethod?: TripEvidenceMethod | null;
  /** Lightweight expense proof — parking amount in minor currency units (cents). */
  parkingCents?: number | null;
  /** Lightweight expense proof — tolls amount in minor currency units (cents). */
  tollsCents?: number | null;
  /** Optional local receipt attachment URI (no OCR / bank linking). */
  receiptUri?: string | null;
  /**
   * Snapshot of rate/locale at save time — historical reports must not silently
   * recalculate when the user later changes country, unit, or active rate.
   */
  rateSnapshot?: {
    centsPerMile: number | null;
    currencyCode: string;
    distanceUnit: 'mi' | 'km';
    countryCode: string;
    effectiveAt: number;
    label?: string | null;
  } | null;
  createdAt?: number;
  updatedAt?: number;
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
  return { ...trip, classification, status, updatedAt: Date.now() };
}

export function rejectTrip(trip: TripRecord): TripRecord {
  return {
    ...trip,
    status: 'rejected',
    classification: 'unclassified',
    updatedAt: Date.now(),
  };
}

export function confirmedBusinessMiles(trips: TripRecord[]): number {
  return trips
    .filter((t) => t.status === 'confirmed' && t.classification === 'business')
    .reduce((sum, t) => sum + t.distanceMiles, 0);
}

export function isConfirmedWorkTrip(trip: TripRecord): boolean {
  return trip.status === 'confirmed' && trip.classification === 'business';
}

export function needsReviewTrip(trip: TripRecord): boolean {
  return trip.status === 'pending' || trip.classification === 'unclassified';
}

/** Reasonable upper bound for a single drive in the MVP (miles). */
export const MAX_TRIP_DISTANCE_MILES = 2000;

export interface ManualTripInput {
  id?: string;
  startAt: number;
  endAt: number;
  distanceMiles: number;
  purpose: string;
  startLabel?: string;
  endLabel?: string;
  vehicleId?: string | null;
  notes?: string;
  evidenceMethod: TripEvidenceMethod;
  /** When true, trip is saved as confirmed work. */
  confirmAsWork: boolean;
}

export interface ManualTripValidationError {
  field: string;
  message: string;
}

export function validateManualTripInput(input: ManualTripInput): ManualTripValidationError[] {
  const errors: ManualTripValidationError[] = [];
  if (!Number.isFinite(input.distanceMiles) || input.distanceMiles <= 0) {
    errors.push({ field: 'distanceMiles', message: 'Distance must be greater than zero.' });
  } else if (input.distanceMiles > MAX_TRIP_DISTANCE_MILES) {
    errors.push({
      field: 'distanceMiles',
      message: `Distance must be ${MAX_TRIP_DISTANCE_MILES} miles or less.`,
    });
  }
  if (!Number.isFinite(input.startAt) || !Number.isFinite(input.endAt)) {
    errors.push({ field: 'time', message: 'Start and end times are required.' });
  } else if (input.endAt < input.startAt) {
    errors.push({ field: 'endAt', message: 'End time cannot be before start time.' });
  }
  if (input.confirmAsWork && !input.purpose.trim()) {
    errors.push({ field: 'purpose', message: 'Purpose is required for a confirmed work drive.' });
  }
  if (!input.evidenceMethod) {
    errors.push({ field: 'evidenceMethod', message: 'Choose how you know this distance.' });
  }
  return errors;
}

export function createManualTripRecord(input: ManualTripInput, now = Date.now()): TripRecord {
  const id = input.id ?? `trip-manual-${now}`;
  return {
    id,
    source: 'manual',
    status: input.confirmAsWork ? 'confirmed' : 'pending',
    classification: input.confirmAsWork ? 'business' : 'unclassified',
    startAt: input.startAt,
    endAt: input.endAt,
    distanceMiles: input.distanceMiles,
    purpose: input.purpose.trim() || null,
    notes: input.notes?.trim() || null,
    hasRouteCoordinates: false,
    confidence: input.confirmAsWork ? 'high' : 'medium',
    startLabel: input.startLabel?.trim() || null,
    endLabel: input.endLabel?.trim() || null,
    vehicleId: input.vehicleId ?? null,
    evidenceMethod: input.evidenceMethod,
    createdAt: now,
    updatedAt: now,
  };
}
