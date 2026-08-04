import type { MileageGoal } from '../onboarding/completeness';
import { isConfirmedWorkTrip, type TripRecord } from '../trips/types';
import { filterExportableTrips } from './csv';

export type ReportPeriodKind = 'this_week' | 'this_month' | 'previous_month' | 'ytd' | 'custom';

/** Heading derived from the user’s selected mileage goal / report style. */
export function reportTitleForGoal(goal: MileageGoal | null | undefined): string {
  switch (goal) {
    case 'employee_reimbursement':
      return 'Mileage reimbursement report';
    case 'gig_delivery':
      return 'Work mileage record';
    case 'self_employed_business':
      return 'Business mileage report';
    case 'mixed':
      return 'Work mileage report';
    default:
      return 'Work mileage report';
  }
}

/** Calm route line for previews — never implies a verified route when places are missing. */
export function formatReportRouteSummary(
  distanceMiles: number,
  startLabel?: string | null,
  endLabel?: string | null,
): string {
  const miles = `${distanceMiles.toFixed(1)} mi`;
  const start = startLabel?.trim() ?? '';
  const end = endLabel?.trim() ?? '';
  if (!start && !end) return `${miles} · Route not added`;
  if (start && end) return `${miles} · ${start} to ${end}`;
  if (start) return `${miles} · From ${start}`;
  return `${miles} · To ${end}`;
}

export function displayPlaceOrRouteMissing(label?: string | null): string {
  const trimmed = label?.trim() ?? '';
  if (!trimmed || trimmed === '—') return 'Route not added';
  return trimmed;
}

export interface ReportPeriod {
  kind: ReportPeriodKind;
  label: string;
  startAt: number;
  endAt: number;
}

export interface ReportLineItem {
  id: string;
  dateLabel: string;
  purpose: string;
  startLabel: string;
  endLabel: string;
  distanceMiles: number;
  source: string;
  evidence: string;
  notes: string;
}

export interface MileageReportData {
  title: string;
  userName: string | null;
  mileageUseType: string | null;
  period: ReportPeriod;
  generatedAt: number;
  totalMiles: number;
  tripCount: number;
  recoveredMiles: number;
  importedMiles: number;
  manualMiles: number;
  unresolvedCount: number;
  lineItems: ReportLineItem[];
  disclaimer: string;
}

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dateLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function resolveReportPeriod(kind: ReportPeriodKind, now = Date.now(), custom?: { startAt: number; endAt: number }): ReportPeriod {
  const d = new Date(now);
  if (kind === 'custom' && custom) {
    return { kind, label: 'Custom range', startAt: custom.startAt, endAt: custom.endAt };
  }
  if (kind === 'this_week') {
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday start
    const start = startOfLocalDay(now - diff * 86400000);
    return { kind, label: 'This week', startAt: start, endAt: now };
  }
  if (kind === 'this_month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    return { kind, label: 'This month', startAt: start, endAt: now };
  }
  if (kind === 'previous_month') {
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime();
    return { kind, label: 'Previous month', startAt: start, endAt: end };
  }
  const start = new Date(d.getFullYear(), 0, 1).getTime();
  return { kind: 'ytd', label: `${d.getFullYear()} year to date`, startAt: start, endAt: now };
}

export function buildMileageReportData(input: {
  trips: TripRecord[];
  period: ReportPeriod;
  userName?: string | null;
  mileageUseType?: string | null;
  primaryGoal?: MileageGoal | null;
  reportTitle?: string | null;
  generatedAt?: number;
}): MileageReportData {
  const generatedAt = input.generatedAt ?? Date.now();
  const exportable = filterExportableTrips(input.trips, input.period.startAt, input.period.endAt);
  const unresolvedCount = input.trips.filter(
    (t) =>
      t.startAt >= input.period.startAt &&
      t.startAt <= input.period.endAt &&
      (t.status === 'pending' || t.classification === 'unclassified'),
  ).length;

  const sumBy = (source: TripRecord['source']) =>
    exportable.filter((t) => t.source === source).reduce((s, t) => s + t.distanceMiles, 0);

  const title =
    input.reportTitle?.trim() ||
    reportTitleForGoal(input.primaryGoal) ||
    'Work mileage report';

  return {
    title,
    userName: input.userName?.trim() || null,
    mileageUseType: input.mileageUseType ?? null,
    period: input.period,
    generatedAt,
    totalMiles: exportable.reduce((s, t) => s + t.distanceMiles, 0),
    tripCount: exportable.length,
    recoveredMiles: sumBy('recovered'),
    importedMiles: sumBy('imported'),
    manualMiles: sumBy('manual'),
    unresolvedCount,
    lineItems: exportable.map((t) => ({
      id: t.id,
      dateLabel: dateLabel(t.startAt),
      purpose: t.purpose?.trim() || 'Work drive',
      startLabel: t.startLabel?.trim() || '',
      endLabel: t.endLabel?.trim() || '',
      distanceMiles: t.distanceMiles,
      source: t.source,
      evidence: t.evidenceMethod ?? '—',
      notes: t.notes ?? '',
    })),
    disclaimer:
      'This report summarizes confirmed work drives you recorded or confirmed in MileRecover. It is not tax, legal, or employer advice. Unresolved and personal drives are excluded.',
  };
}

export function reportHasExportableTrips(trips: TripRecord[], period: ReportPeriod): boolean {
  return filterExportableTrips(trips, period.startAt, period.endAt).length > 0;
}

export { isConfirmedWorkTrip };
