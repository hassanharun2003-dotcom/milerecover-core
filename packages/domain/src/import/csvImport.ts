import type { TripEvidenceMethod, TripRecord } from '../trips/types';

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
  startAt: number;
  endAt: number;
}

export interface CsvImportResult {
  headers: string[];
  validRows: ParsedImportRow[];
  issues: CsvImportRowIssue[];
  skipped: number;
}

const HEADER_ALIASES: Record<string, string> = {
  date: 'date',
  day: 'date',
  start: 'start',
  origin: 'start',
  from: 'start',
  destination: 'destination',
  dest: 'destination',
  to: 'destination',
  end: 'destination',
  purpose: 'purpose',
  reason: 'purpose',
  miles: 'miles',
  distance: 'miles',
  'distance miles': 'miles',
  mileage: 'miles',
  notes: 'notes',
  note: 'notes',
  vehicle: 'vehicle',
  car: 'vehicle',
};

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

function parseDateToStart(dateStr: string): number | null {
  const trimmed = dateStr.trim();
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0, 0, 0).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const t = Date.parse(trimmed);
  return Number.isNaN(t) ? null : t;
}

export function analyzeCsvImport(text: string): CsvImportResult {
  const grid = parseCsvLines(text);
  if (grid.length === 0) {
    return { headers: [], validRows: [], issues: [{ rowNumber: 0, message: 'File is empty.' }], skipped: 0 };
  }
  const rawHeaders = grid[0];
  const mapped = rawHeaders.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? normalizeHeader(h));
  const idx = (key: string) => mapped.indexOf(key);

  const dateIdx = idx('date');
  const milesIdx = idx('miles');
  const purposeIdx = idx('purpose');
  if (dateIdx < 0 || milesIdx < 0) {
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
    };
  }

  const validRows: ParsedImportRow[] = [];
  const issues: CsvImportRowIssue[] = [];
  let skipped = 0;

  for (let r = 1; r < grid.length; r += 1) {
    const row = grid[r];
    const rowNumber = r + 1;
    const date = (row[dateIdx] ?? '').trim();
    const milesRaw = (row[milesIdx] ?? '').trim();
    const purpose = purposeIdx >= 0 ? (row[purposeIdx] ?? '').trim() : '';
    const startLabel = idx('start') >= 0 ? (row[idx('start')] ?? '').trim() : '';
    const endLabel = idx('destination') >= 0 ? (row[idx('destination')] ?? '').trim() : '';
    const notes = idx('notes') >= 0 ? (row[idx('notes')] ?? '').trim() : '';
    const vehicle = idx('vehicle') >= 0 ? (row[idx('vehicle')] ?? '').trim() : '';
    const miles = Number.parseFloat(milesRaw);
    const startAt = parseDateToStart(date);
    if (!date || startAt == null) {
      issues.push({ rowNumber, message: 'Invalid or missing date.' });
      skipped += 1;
      continue;
    }
    if (!Number.isFinite(miles) || miles <= 0) {
      issues.push({ rowNumber, message: 'Distance must be a number greater than zero.' });
      skipped += 1;
      continue;
    }
    validRows.push({
      rowNumber,
      date,
      purpose: purpose || 'Imported drive',
      distanceMiles: miles,
      startLabel,
      endLabel,
      notes,
      vehicle,
      startAt,
      endAt: startAt + 3600000,
    });
  }

  return { headers: rawHeaders, validRows, issues, skipped };
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
    const dup = existing.some(
      (t) =>
        t.source === 'imported' &&
        Math.abs(t.startAt - row.startAt) < 60000 &&
        Math.abs(t.distanceMiles - row.distanceMiles) < 0.05 &&
        (t.purpose ?? '') === row.purpose,
    ) || trips.some(
      (t) =>
        Math.abs(t.startAt - row.startAt) < 60000 &&
        Math.abs(t.distanceMiles - row.distanceMiles) < 0.05 &&
        (t.purpose ?? '') === row.purpose,
    );
    if (dup) {
      duplicatesSkipped += 1;
      continue;
    }
    const uncertain = !row.purpose || row.purpose === 'Imported drive';
    const vehicleId =
      row.vehicle && options?.resolveVehicleId
        ? options.resolveVehicleId(row.vehicle)
        : null;
    const notesParts = [row.notes || null, row.vehicle && !vehicleId ? `Vehicle label: ${row.vehicle}` : null].filter(
      Boolean,
    );
    trips.push({
      id: `trip-import-${now}-${row.rowNumber}`,
      source: 'imported',
      status: uncertain ? 'pending' : 'confirmed',
      classification: uncertain ? 'unclassified' : 'business',
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
