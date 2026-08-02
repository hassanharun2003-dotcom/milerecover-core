import type { ReviewItem, TripRecord } from '@milerecover/domain';

export type DemoScenario =
  | 'new_user'
  | 'fully_protected'
  | 'first_recorded_drive'
  | 'recovery_available'
  | 'protection_limited'
  | 'offline_sync'
  | 'imported_history'
  | 'import_exceptions'
  | 'proof_ready'
  | 'proof_blocked'
  | 'free_plan'
  | 'plus_plan'
  | 'pro_plan';

export type HomeProtectionPresentation =
  | 'healthy'
  | 'recovery_available'
  | 'protection_limited'
  | 'offline';

export type ActivityEventKind =
  | 'drive_recorded'
  | 'work_confirmed'
  | 'gap_found'
  | 'report_prepared'
  | 'history_imported';

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  title: string;
  subtitle: string;
  timestamp: number;
}

export interface WeekSummary {
  milesProtected: number;
  recoveredMiles: number;
  milesReadyForProof: number;
}

export interface ScenarioPresentation {
  id: DemoScenario;
  label: string;
  homeState: HomeProtectionPresentation;
  homeTitle: string;
  homeDetail: string;
  primaryAction: string | null;
  primaryActionRoute?: 'Review' | 'Profile' | 'Proof';
  weekSummary: WeekSummary;
  activity: ActivityEvent[];
  trips: TripRecord[];
  reviewItems: ReviewItem[];
  proofReady: boolean;
  proofBlockReason: string | null;
  periodMiles: number;
  tripsToday: number;
}

const NOW = Date.UTC(2026, 7, 2, 16, 0, 0);

function trip(
  id: string,
  miles: number,
  status: TripRecord['status'] = 'confirmed',
  daysAgo = 1
): TripRecord {
  const start = NOW - daysAgo * 86400000;
  const classification =
    status === 'confirmed' ? 'business' : status === 'personal' ? 'personal' : 'unclassified';
  return {
    id,
    startAt: start,
    endAt: start + 3600000,
    distanceMiles: miles,
    status,
    classification,
    confidence: status === 'pending' ? 'low' : 'high',
    source: 'auto_detected',
    purpose: null,
    notes: null,
    hasRouteCoordinates: true,
  };
}

const baseReviewItem: ReviewItem = {
  id: 'review-recovery-1',
  kind: 'possible_missing_trip',
  recoveryCandidateId: 'recovery-1',
  priority: 100,
  createdAt: NOW - 86400000,
  title: 'Client site visit',
  subtitle: 'Your phone was unavailable during part of this period.',
  distanceMiles: 14.2,
  confidence: 'medium',
  reason: 'Gap detected between calendar block and last known location.',
};

export const DEMO_SCENARIOS: Record<DemoScenario, ScenarioPresentation> = {
  new_user: {
    id: 'new_user',
    label: 'New user',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Everything looks good. Nothing needs your attention.',
    primaryAction: null,
    weekSummary: { milesProtected: 0, recoveredMiles: 0, milesReadyForProof: 0 },
    activity: [],
    trips: [],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Add or confirm trips to prepare proof.',
    periodMiles: 0,
    tripsToday: 0,
  },
  fully_protected: {
    id: 'fully_protected',
    label: 'Fully protected',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Everything looks good. Nothing needs your attention.',
    primaryAction: null,
    weekSummary: { milesProtected: 42.6, recoveredMiles: 3.1, milesReadyForProof: 38.5 },
    activity: [
      { id: 'a1', kind: 'drive_recorded', title: 'Drive recorded', subtitle: 'Airport pickup · 18.4 mi', timestamp: NOW - 3600000 },
      { id: 'a2', kind: 'work_confirmed', title: 'Work trip confirmed', subtitle: 'Downtown client visit', timestamp: NOW - 86400000 },
    ],
    trips: [trip('t1', 18.4), trip('t2', 12.2), trip('t3', 8.0)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 38.5,
    tripsToday: 1,
  },
  first_recorded_drive: {
    id: 'first_recorded_drive',
    label: 'First recorded drive',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Your first drive was captured. Review when you are ready.',
    primaryAction: 'Review drive',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 6.2, recoveredMiles: 0, milesReadyForProof: 0 },
    activity: [{ id: 'a1', kind: 'drive_recorded', title: 'Drive recorded', subtitle: 'Morning commute · 6.2 mi', timestamp: NOW - 7200000 }],
    trips: [trip('t1', 6.2, 'pending', 0)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Confirm your first drive before exporting proof.',
    periodMiles: 0,
    tripsToday: 1,
  },
  recovery_available: {
    id: 'recovery_available',
    label: 'Recovery available',
    homeState: 'recovery_available',
    homeTitle: 'One drive may be missing',
    homeDetail: 'Your phone was unavailable during part of this period.',
    primaryAction: 'Review drive',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 28.4, recoveredMiles: 0, milesReadyForProof: 22.1 },
    activity: [{ id: 'a1', kind: 'gap_found', title: 'Possible gap found', subtitle: 'Tuesday afternoon · needs review', timestamp: NOW - 172800000 }],
    trips: [trip('t1', 11.2), trip('t2', 10.9)],
    reviewItems: [baseReviewItem],
    proofReady: false,
    proofBlockReason: 'One item needs review before proof is ready.',
    periodMiles: 22.1,
    tripsToday: 0,
  },
  protection_limited: {
    id: 'protection_limited',
    label: 'Protection limited',
    homeState: 'protection_limited',
    homeTitle: 'Protection needs attention',
    homeDetail: 'Background tracking may be restricted.',
    primaryAction: 'Restore protection',
    primaryActionRoute: 'Profile',
    weekSummary: { milesProtected: 15.0, recoveredMiles: 0, milesReadyForProof: 12.0 },
    activity: [],
    trips: [trip('t1', 12.0)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Restore protection to keep miles current.',
    periodMiles: 12.0,
    tripsToday: 0,
  },
  offline_sync: {
    id: 'offline_sync',
    label: 'Offline / sync pending',
    homeState: 'offline',
    homeTitle: 'Sync pending',
    homeDetail: 'Recent drives will appear when your connection returns.',
    primaryAction: null,
    weekSummary: { milesProtected: 20.1, recoveredMiles: 1.5, milesReadyForProof: 18.0 },
    activity: [{ id: 'a1', kind: 'drive_recorded', title: 'Drive queued offline', subtitle: 'Will sync when online', timestamp: NOW - 1800000 }],
    trips: [trip('t1', 9.5), trip('t2', 8.5)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Wait for sync to complete before exporting.',
    periodMiles: 18.0,
    tripsToday: 0,
  },
  imported_history: {
    id: 'imported_history',
    label: 'Imported history',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Imported history is organized. Review any flagged entries.',
    primaryAction: null,
    weekSummary: { milesProtected: 120.4, recoveredMiles: 8.2, milesReadyForProof: 95.0 },
    activity: [{ id: 'a1', kind: 'history_imported', title: 'History imported', subtitle: '214 trips organized · 12 need review', timestamp: NOW - 604800000 }],
    trips: [trip('t1', 22.0), trip('t2', 18.5), trip('t3', 15.2)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 95.0,
    tripsToday: 0,
  },
  import_exceptions: {
    id: 'import_exceptions',
    label: 'Import exceptions',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Most imports look good. Some rows need your review.',
    primaryAction: 'Review imports',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 88.0, recoveredMiles: 4.0, milesReadyForProof: 70.0 },
    activity: [{ id: 'a1', kind: 'history_imported', title: 'Import needs review', subtitle: '8 rows not fully understood', timestamp: NOW - 259200000 }],
    trips: [trip('t1', 14.0)],
    reviewItems: [{ ...baseReviewItem, id: 'review-import-1', title: 'Imported row needs review', subtitle: 'Spreadsheet row 42 · distance unclear' }],
    proofReady: false,
    proofBlockReason: 'Resolve import exceptions before final proof.',
    periodMiles: 70.0,
    tripsToday: 0,
  },
  proof_ready: {
    id: 'proof_ready',
    label: 'Proof ready',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Your records are ready for proof this period.',
    primaryAction: 'View proof',
    primaryActionRoute: 'Proof',
    weekSummary: { milesProtected: 64.2, recoveredMiles: 6.0, milesReadyForProof: 58.0 },
    activity: [{ id: 'a1', kind: 'report_prepared', title: 'Report prepared', subtitle: 'July mileage log draft ready', timestamp: NOW - 43200000 }],
    trips: [trip('t1', 20.0), trip('t2', 19.0), trip('t3', 19.0)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 58.0,
    tripsToday: 0,
  },
  proof_blocked: {
    id: 'proof_blocked',
    label: 'Proof blocked',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Most miles are protected. A few items still need review.',
    primaryAction: 'Resolve items',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 40.0, recoveredMiles: 2.0, milesReadyForProof: 30.0 },
    activity: [],
    trips: [trip('t1', 15.0), trip('t2', 15.0, 'pending')],
    reviewItems: [baseReviewItem],
    proofReady: false,
    proofBlockReason: '2 items need review before you can confidently submit proof.',
    periodMiles: 30.0,
    tripsToday: 0,
  },
  free_plan: {
    id: 'free_plan',
    label: 'Free plan',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Everything looks good on your Free plan.',
    primaryAction: null,
    weekSummary: { milesProtected: 18.0, recoveredMiles: 0, milesReadyForProof: 16.0 },
    activity: [],
    trips: [trip('t1', 16.0)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 16.0,
    tripsToday: 0,
  },
  plus_plan: {
    id: 'plus_plan',
    label: 'Plus plan',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Plus protection is active. Nothing needs your attention.',
    primaryAction: null,
    weekSummary: { milesProtected: 52.0, recoveredMiles: 4.5, milesReadyForProof: 48.0 },
    activity: [],
    trips: [trip('t1', 24.0), trip('t2', 24.0)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 48.0,
    tripsToday: 0,
  },
  pro_plan: {
    id: 'pro_plan',
    label: 'Pro plan',
    homeState: 'healthy',
    homeTitle: 'Protected',
    homeDetail: 'Pro proof tools are available for this period.',
    primaryAction: null,
    weekSummary: { milesProtected: 110.0, recoveredMiles: 12.0, milesReadyForProof: 105.0 },
    activity: [],
    trips: [trip('t1', 35.0), trip('t2', 35.0), trip('t3', 35.0)],
    reviewItems: [],
    proofReady: true,
    proofBlockReason: null,
    periodMiles: 105.0,
    tripsToday: 0,
  },
};

export const DEMO_SCENARIO_LIST = Object.values(DEMO_SCENARIOS);

export function scenarioForPlan(plan: 'free' | 'plus' | 'pro'): DemoScenario {
  if (plan === 'plus') return 'plus_plan';
  if (plan === 'pro') return 'pro_plan';
  return 'free_plan';
}
