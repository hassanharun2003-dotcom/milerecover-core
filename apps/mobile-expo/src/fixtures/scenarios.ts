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
  primaryActionRoute?: 'Review' | 'Profile' | 'Proof' | 'ProtectionAlert' | 'ManualTrip';
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
  subtitle: 'Your phone was quiet for part of this stretch.',
  distanceMiles: 14.2,
  confidence: 'medium',
  reason: 'We noticed a quiet stretch when you might have been driving.',
};

export const DEMO_SCENARIOS: Record<DemoScenario, ScenarioPresentation> = {
  new_user: {
    id: 'new_user',
    label: 'New user',
    homeState: 'healthy',
    homeTitle: "You're protected.",
    homeDetail: 'Nothing needs you right now. Drive as usual—we’ll ask if something needs a quick look.',
    primaryAction: null,
    weekSummary: { milesProtected: 0, recoveredMiles: 0, milesReadyForProof: 0 },
    activity: [],
    trips: [],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Add or confirm a few drives and your report will be ready.',
    periodMiles: 0,
    tripsToday: 0,
  },
  fully_protected: {
    id: 'fully_protected',
    label: 'Fully protected',
    homeState: 'healthy',
    homeTitle: "You're protected.",
    homeDetail: 'Nothing needs you right now. Your work miles are quietly watched.',
    primaryAction: null,
    weekSummary: { milesProtected: 87.6, recoveredMiles: 2.0, milesReadyForProof: 12.0 },
    activity: [
      { id: 'a1', kind: 'drive_recorded', title: 'Saved a drive', subtitle: 'Airport pickup · 18.4 mi', timestamp: NOW - 3600000 },
      { id: 'a2', kind: 'work_confirmed', title: 'Marked as work', subtitle: 'Downtown client visit', timestamp: NOW - 86400000 },
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
    homeTitle: "You're protected.",
    homeDetail: 'Your first drive is saved. Take a quick look when you have a moment.',
    primaryAction: 'Review drive',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 6.2, recoveredMiles: 0, milesReadyForProof: 0 },
    activity: [{ id: 'a1', kind: 'drive_recorded', title: 'Saved a drive', subtitle: 'Morning commute · 6.2 mi', timestamp: NOW - 7200000 }],
    trips: [trip('t1', 6.2, 'pending', 0)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Confirm your first drive and you’ll be ready to share.',
    periodMiles: 0,
    tripsToday: 1,
  },
  recovery_available: {
    id: 'recovery_available',
    label: 'Recovery available',
    homeState: 'recovery_available',
    homeTitle: 'One drive may need a look',
    homeDetail: 'Your phone was quiet for part of this stretch. Ten seconds and you’re done.',
    primaryAction: 'Review drive',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 28.4, recoveredMiles: 0, milesReadyForProof: 22.1 },
    activity: [{ id: 'a1', kind: 'gap_found', title: 'Might have missed a drive', subtitle: 'Tuesday afternoon · quick look', timestamp: NOW - 172800000 }],
    trips: [trip('t1', 11.2), trip('t2', 10.9)],
    reviewItems: [baseReviewItem],
    proofReady: false,
    proofBlockReason: 'One quick decision and your report can be ready.',
    periodMiles: 22.1,
    tripsToday: 0,
  },
  protection_limited: {
    id: 'protection_limited',
    label: 'Protection limited',
    homeState: 'protection_limited',
    homeTitle: 'Background access is limited',
    homeDetail: 'We may miss new drives until it’s back on. What’s already saved stays put.',
    primaryAction: 'Fix protection',
    primaryActionRoute: 'ProtectionAlert',
    weekSummary: { milesProtected: 15.0, recoveredMiles: 0, milesReadyForProof: 12.0 },
    activity: [],
    trips: [trip('t1', 12.0)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Turn background access back on when you can so new miles stay covered.',
    periodMiles: 12.0,
    tripsToday: 0,
  },
  offline_sync: {
    id: 'offline_sync',
    label: 'Offline / sync pending',
    homeState: 'offline',
    homeTitle: 'Saved safely offline',
    homeDetail: 'Your recent drives are safe on this device. They’ll sync when you’re back online.',
    primaryAction: null,
    weekSummary: { milesProtected: 20.1, recoveredMiles: 1.5, milesReadyForProof: 18.0 },
    activity: [{ id: 'a1', kind: 'drive_recorded', title: 'Saved offline', subtitle: 'Will sync when online', timestamp: NOW - 1800000 }],
    trips: [trip('t1', 9.5), trip('t2', 8.5)],
    reviewItems: [],
    proofReady: false,
    proofBlockReason: 'Your miles are safe. Wait for sync before sharing a report.',
    periodMiles: 18.0,
    tripsToday: 0,
  },
  imported_history: {
    id: 'imported_history',
    label: 'Imported history',
    homeState: 'healthy',
    homeTitle: "You're protected.",
    homeDetail: 'Your imported history is organized. Flagged rows are waiting only if you want them.',
    primaryAction: null,
    weekSummary: { milesProtected: 120.4, recoveredMiles: 8.2, milesReadyForProof: 95.0 },
    activity: [{ id: 'a1', kind: 'history_imported', title: 'History brought in', subtitle: '214 trips organized · 12 need a look', timestamp: NOW - 604800000 }],
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
    homeTitle: "You're protected.",
    homeDetail: 'Most of your import looks good. A few rows need a quick look.',
    primaryAction: 'Review imports',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 88.0, recoveredMiles: 4.0, milesReadyForProof: 70.0 },
    activity: [{ id: 'a1', kind: 'history_imported', title: 'Import needs a look', subtitle: '8 rows weren’t clear', timestamp: NOW - 259200000 }],
    trips: [trip('t1', 14.0)],
    reviewItems: [{ ...baseReviewItem, id: 'review-import-1', title: 'Imported row needs a look', subtitle: 'Spreadsheet row 42 · distance unclear' }],
    proofReady: false,
    proofBlockReason: 'A few imported rows still need a quick yes or no.',
    periodMiles: 70.0,
    tripsToday: 0,
  },
  proof_ready: {
    id: 'proof_ready',
    label: 'Proof ready',
    homeState: 'healthy',
    homeTitle: "You're protected.",
    homeDetail: 'Your report is ready whenever work asks.',
    primaryAction: 'View proof',
    primaryActionRoute: 'Proof',
    weekSummary: { milesProtected: 64.2, recoveredMiles: 6.0, milesReadyForProof: 58.0 },
    activity: [{ id: 'a1', kind: 'report_prepared', title: 'Report draft ready', subtitle: 'July mileage log', timestamp: NOW - 43200000 }],
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
    homeTitle: "You're protected.",
    homeDetail: 'Most miles look good. A couple of drives still need a glance.',
    primaryAction: 'Review drives',
    primaryActionRoute: 'Review',
    weekSummary: { milesProtected: 40.0, recoveredMiles: 2.0, milesReadyForProof: 30.0 },
    activity: [],
    trips: [trip('t1', 15.0), trip('t2', 15.0, 'pending')],
    reviewItems: [baseReviewItem],
    proofReady: false,
    proofBlockReason: 'Two drives still need a quick review.',
    periodMiles: 30.0,
    tripsToday: 0,
  },
  free_plan: {
    id: 'free_plan',
    label: 'Free plan',
    homeState: 'healthy',
    homeTitle: "You're protected.",
    homeDetail: 'Nothing needs you right now on Free.',
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
    homeTitle: "You're protected.",
    homeDetail: 'Plus is watching quietly. Nothing needs you right now.',
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
    homeTitle: "You're protected.",
    homeDetail: 'Pro is ready when you need stronger reports.',
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
