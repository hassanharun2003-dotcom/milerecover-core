import type { TripEvidenceMethod, TripRecord } from '../trips/types';

export type CompetitorImportFormat =
  | 'generic'
  | 'mileiq'
  | 'everlance'
  | 'driversnote'
  | 'triplog'
  | 'stride';

export interface CsvImportRowIssue {
  rowNumber: number;
  message: string;
}

export interface ParsedImportRow {
  rowNumber: number;
  date: string;
  purpose: string;
  distanceMiles: number;
  startLabel: string;
  endLabel: string;
  notes: string;
  vehicle: string;
  classification: 'business' | 'personal' | 'unclassified';
  startAt: number;
  endAt: number;
  /** Historical rate in cents/mile when present in export — never invent. */
  rateCentsPerMile: number | null;
}

export interface CsvImportResult {
  headers: string[];
  validRows: ParsedImportRow[];
  issues: CsvImportRowIssue[];
  skipped: number;
  detectedFormat: CompetitorImportFormat;
  formatLabel: string;
  totalRows: number;
  readyCount: number;
  duplicateHints: number;
  attentionCount: number;
}

const HEADER_ALIASES: Record<string, string> = {
  date: 'date',
  day: 'date',
  'start date': 'date',
  'trip date': 'date',
  'drive date': 'date',
  start: 'start',
  origin: 'start',
  from: 'start',
  'start location': 'start',
  'start address': 'start',
  'start name': 'start',
  destination: 'destination',
  dest: 'destination',
  to: 'destination',
  end: 'destination',
  'end location': 'destination',
  'end address': 'destination',
  'end name': 'destination',
  purpose: 'purpose',
  reason: 'purpose',
  category: 'purpose',
  'trip purpose': 'purpose',
  miles: 'miles',
  distance: 'miles',
  'distance miles': 'miles',
  'distance (mi)': 'miles',
  'distance (miles)': 'miles',
  mileage: 'miles',
  kilometres: 'km',
  kilometers: 'km',
  'distance km': 'km',
  'distance (km)': 'km',
  notes: 'notes',
  note: 'notes',
  comment: 'notes',
  comments: 'notes',
  vehicle: 'vehicle',
  car: 'vehicle',
  classification: 'classification',
  type: 'classification',
  'trip type': 'classification',
  status: 'classification',
  rate: 'rate',
  'rate per mile': 'rate',
  'mileage rate': 'rate',
  'cents per mile': 'rate',
  'start time': 'start_time',
  'end time': 'end_time',
  duration: 'duration',
};

const FORMAT_SIGNATURES: Array<{
  id: CompetitorImportFormat;
  label: string;
  tokens: string[];
}> = [
  {
    id: 'mileiq',
    label: 'MileIQ',
    tokens: ['mileiq', 'parking', 'tolls', 'classification', 'start location', 'end location'],
  },
  {
    id: 'everlance',
    label: 'Everlance',
    tokens: ['everlance', 'tax category', 'reimbursement', 'odometer'],
  },
  {
    id: 'driversnote',
    label: 'Driversnote',
    tokens: ['driversnote', 'drivers note', 'logbook', 'vehicle name'],
  },
  {
    id: 'triplog',
    label: 'TripLog',
    tokens: ['triplog', 'trip log', 'business miles', 'personal miles'],
  },
  {
    id: 'stride',
    label: 'Stride',
    tokens: ['stride', 'tax deduction', 'commute'],
  },
];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ');
}

/** Minimal CSV line parser supporting quotes. */
export function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch === '\r') continue;
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function detectCompetitorFormat(headers: string[], fileLabel?: string | null): {
  detectedFormat: CompetitorImportFormat;
  formatLabel: string;
} {
  const joined = [
    ...(fileLabel ? [fileLabel.toLowerCase()] : []),
    ...headers.map(normalizeHeader),
  ].join(' | ');
  let best: { id: CompetitorImportFormat; label: string; score: number } | null = null;
  for (const sig of FORMAT_SIGNATURES) {
    const score = sig.tokens.reduce((sum, token) => (joined.includes(token) ? sum + 1 : sum), 0);
    if (score >= 2 && (!best || score > best.score)) {
      best = { id: sig.id, label: sig.label, score };
    }
  }
  if (best) return { detectedFormat: best.id, formatLabel: best.label };
  return { detectedFormat: 'generic', formatLabel: 'CSV export' };
}

function parseDateToStart(dateStr: string): number | null {
  const trimmed = dateStr.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const t = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 9, 0, 0, 0).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (us) {
    const year = Number(us[3]) < 100 ? 2000 + Number(us[3]) : Number(us[3]);
    const t = new Date(year, Number(us[1]) - 1, Number(us[2]), 9, 0, 0, 0).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const t = Date.parse(trimmed);
  return Number.isNaN(t) ? null : t;
}

function parseClockMinutes(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([ap]m))?$/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const ampm = m[3]?.toLowerCase();
  if (ampm === 'pm' && hours < 12) hours += 12;
  if (ampm === 'am' && hours === 12) hours = 0;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function applyClock(base: number, clock: string | null | undefined): number {
  if (!clock) return base;
  const mins = parseClockMinutes(clock);
  if (mins == null) return base;
  const d = new Date(base);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d.getTime();
}

function parseClassification(raw: string): 'business' | 'personal' | 'unclassified' {
  const value = raw.trim().toLowerCase();
  if (!value) return 'unclassified';
  if (
    value.includes('work') ||
    value.includes('business') ||
    value.includes('deduct') ||
    value === 'b' ||
    value === 'w'
  ) {
    return 'business';
  }
  if (value.includes('personal') || value === 'p' || value.includes('commute')) {
    return 'personal';
  }
  return 'unclassified';
}

function parseRateCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/[$,]/g, '');
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Values like 0.70 mean dollars; 70 often means cents for IRS-style exports.
  if (n < 10) return Math.round(n * 100);
  return Math.round(n);
}

export function analyzeCsvImport(text: string, fileLabel?: string | null): CsvImportResult {
  const empty = (message: string): CsvImportResult => ({
    headers: [],
    validRows: [],
    issues: [{ rowNumber: 0, message }],
    skipped: 0,
    detectedFormat: 'generic',
    formatLabel: 'CSV export',
    totalRows: 0,
    readyCount: 0,
    duplicateHints: 0,
    attentionCount: 1,
  });

  const grid = parseCsvLines(text);
  if (grid.length === 0) return empty('File is empty.');

  const rawHeaders = grid[0];
  const mapped = rawHeaders.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));
  const idx = (key: string) => mapped.indexOf(key);
  const { detectedFormat, formatLabel } = detectCompetitorFormat(rawHeaders, fileLabel);

  const dateIdx = idx('date');
  const milesIdx = idx('miles');
  const kmIdx = idx('km');
  const purposeIdx = idx('purpose');
  if (dateIdx < 0 || (milesIdx < 0 && kmIdx < 0)) {
    return {
      headers: rawHeaders,
      validRows: [],
      issues: [
        {
          rowNumber: 1,
          message: 'Could not find required columns for date and miles/distance.',
        },
      ],
      skipped: Math.max(0, grid.length - 1),
      detectedFormat,
      formatLabel,
      totalRows: Math.max(0, grid.length - 1),
      readyCount: 0,
      duplicateHints: 0,
      attentionCount: 1,
    };
  }

  const validRows: ParsedImportRow[] = [];
  const issues: CsvImportRowIssue[] = [];
  let skipped = 0;
  const seenKeys = new Set<string>();
  let duplicateHints = 0;

  for (let r = 1; r < grid.length; r += 1) {
    const row = grid[r];
    const rowNumber = r + 1;
    const date = (row[dateIdx] ?? '').trim();
    const milesRaw = milesIdx >= 0 ? (row[milesIdx] ?? '').trim() : '';
    const kmRaw = kmIdx >= 0 ? (row[kmIdx] ?? '').trim() : '';
    const purpose = purposeIdx >= 0 ? (row[purposeIdx] ?? '').trim() : '';
    const startLabel = idx('start') >= 0 ? (row[idx('start')] ?? '').trim() : '';
    const endLabel = idx('destination') >= 0 ? (row[idx('destination')] ?? '').trim() : '';
    const notes = idx('notes') >= 0 ? (row[idx('notes')] ?? '').trim() : '';
    const vehicle = idx('vehicle') >= 0 ? (row[idx('vehicle')] ?? '').trim() : '';
    const classificationRaw =
      idx('classification') >= 0 ? (row[idx('classification')] ?? '').trim() : '';
    const rateRaw = idx('rate') >= 0 ? (row[idx('rate')] ?? '').trim() : '';
    const startTimeRaw = idx('start_time') >= 0 ? (row[idx('start_time')] ?? '').trim() : '';
    const endTimeRaw = idx('end_time') >= 0 ? (row[idx('end_time')] ?? '').trim() : '';

    let miles = Number.parseFloat(milesRaw);
    if ((!Number.isFinite(miles) || miles <= 0) && kmRaw) {
      const km = Number.parseFloat(kmRaw);
      if (Number.isFinite(km) && km > 0) miles = km / 1.609344;
    }
    const dayStart = parseDateToStart(date);
    if (!date || dayStart == null) {
      issues.push({ rowNumber, message: 'Invalid or missing date.' });
      skipped += 1;
      continue;
    }
    if (!Number.isFinite(miles) || miles <= 0) {
      issues.push({ rowNumber, message: 'Distance must be a number greater than zero.' });
      skipped += 1;
      continue;
    }
    const startAt = applyClock(dayStart, startTimeRaw);
    let endAt = applyClock(dayStart, endTimeRaw);
    if (endAt <= startAt) endAt = startAt + 3600000;
    const key = `${startAt}|${miles.toFixed(2)}|${purpose.toLowerCase()}`;
    if (seenKeys.has(key)) {
      duplicateHints += 1;
      issues.push({ rowNumber, message: 'Possible duplicate of another row in this file.' });
      continue;
    }
    seenKeys.add(key);
    validRows.push({
      rowNumber,
      date,
      purpose: purpose || 'Imported drive',
      distanceMiles: miles,
      startLabel,
      endLabel,
      notes,
      vehicle,
      classification: parseClassification(classificationRaw),
      startAt,
      endAt,
      rateCentsPerMile: parseRateCents(rateRaw),
    });
  }

  const attentionCount = issues.length;
  return {
    headers: rawHeaders,
    validRows,
    issues,
    skipped,
    detectedFormat,
    formatLabel,
    totalRows: Math.max(0, grid.length - 1),
    readyCount: validRows.length,
    duplicateHints,
    attentionCount,
  };
}

export function importRowsToTrips(
  rows: ParsedImportRow[],
  existing: TripRecord[],
  now = Date.now(),
  options?: {
    /** Resolve imported vehicle label → existing vehicle id. Never invents vehicles. */
    resolveVehicleId?: (label: string) => string | null;
  },
): { trips: TripRecord[]; duplicatesSkipped: number } {
  const trips: TripRecord[] = [];
  let duplicatesSkipped = 0;
  for (const row of rows) {
    const dup =
      existing.some(
        (t) =>
          t.source === 'imported' &&
          Math.abs(t.startAt - row.startAt) < 60000 &&
          Math.abs(t.distanceMiles - row.distanceMiles) < 0.05 &&
          (t.purpose ?? '') === row.purpose,
      ) ||
      trips.some(
        (t) =>
          Math.abs(t.startAt - row.startAt) < 60000 &&
          Math.abs(t.distanceMiles - row.distanceMiles) < 0.05 &&
          (t.purpose ?? '') === row.purpose,
      );
    if (dup) {
      duplicatesSkipped += 1;
      continue;
    }
    const uncertain =
      row.classification === 'unclassified' || !row.purpose || row.purpose === 'Imported drive';
    const vehicleId =
      row.vehicle && options?.resolveVehicleId ? options.resolveVehicleId(row.vehicle) : null;
    const notesParts = [
      row.notes || null,
      row.vehicle && !vehicleId ? `Vehicle label: ${row.vehicle}` : null,
      row.rateCentsPerMile != null
        ? `Historical rate snapshot: ${(row.rateCentsPerMile / 100).toFixed(2)}/mi`
        : null,
    ].filter(Boolean);
    trips.push({
      id: `trip-import-${now}-${row.rowNumber}`,
      source: 'imported',
      status: uncertain ? 'pending' : 'confirmed',
      classification:
        row.classification === 'personal'
          ? 'personal'
          : uncertain
            ? 'unclassified'
            : 'business',
      startAt: row.startAt,
      endAt: row.endAt,
      distanceMiles: row.distanceMiles,
      purpose: row.purpose,
      notes: notesParts.length > 0 ? notesParts.join(' · ') : null,
      hasRouteCoordinates: false,
      confidence: uncertain ? 'low' : 'medium',
      startLabel: row.startLabel || null,
      endLabel: row.endLabel || null,
      vehicleId,
      evidenceMethod: 'user_estimate' as TripEvidenceMethod,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { trips, duplicatesSkipped };
}
