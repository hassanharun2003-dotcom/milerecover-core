import { isConfirmedWorkTrip, type TripRecord } from '../trips/types';

export const CSV_HEADERS = [
  'Date',
  'Start Time',
  'End Time',
  'Start',
  'Destination',
  'Purpose',
  'Distance Miles',
  'Vehicle',
  'Source',
  'Evidence',
  'Notes',
] as const;

export interface CsvTripRowContext {
  vehicleNicknameById?: Record<string, string>;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateLocal(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTimeLocal(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** RFC4180-style CSV cell escaping. */
export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function tripToCsvCells(trip: TripRecord, ctx: CsvTripRowContext = {}): string[] {
  const vehicle =
    (trip.vehicleId && ctx.vehicleNicknameById?.[trip.vehicleId]) ||
    (trip.vehicleId ? trip.vehicleId : '');
  return [
    formatDateLocal(trip.startAt),
    formatTimeLocal(trip.startAt),
    formatTimeLocal(trip.endAt),
    trip.startLabel ?? '',
    trip.endLabel ?? '',
    trip.purpose ?? '',
    trip.distanceMiles.toFixed(1),
    vehicle,
    trip.source,
    trip.evidenceMethod ?? '',
    trip.notes ?? '',
  ];
}

export interface BuildCsvOptions extends CsvTripRowContext {
  periodStart: number;
  periodEnd: number;
}

export function filterExportableTrips(trips: TripRecord[], periodStart: number, periodEnd: number): TripRecord[] {
  return trips
    .filter(isConfirmedWorkTrip)
    .filter((t) => t.startAt >= periodStart && t.startAt <= periodEnd)
    .filter((t) => t.classification !== 'personal' && t.status !== 'rejected' && t.status !== 'pending')
    .slice()
    .sort((a, b) => a.startAt - b.startAt);
}

export function buildMileageCsv(trips: TripRecord[], options: BuildCsvOptions): string {
  const rows = filterExportableTrips(trips, options.periodStart, options.periodEnd);
  const lines = [
    CSV_HEADERS.join(','),
    ...rows.map((trip) => tripToCsvCells(trip, options).map(escapeCsvCell).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

export function csvFilename(periodLabel: string, generatedAt = Date.now()): string {
  const safe = periodLabel.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40);
  return `MileRecover_${safe}_${formatDateLocal(generatedAt)}.csv`;
}
