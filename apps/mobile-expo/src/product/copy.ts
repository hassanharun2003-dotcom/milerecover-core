import type { DrivingPattern, MileageGoal, NextActionId } from '@milerecover/domain';
import type { PostOnboardingRoute, ProtectionSetupState } from './types';

export interface VoiceCopy {
  workNoun: string;
  shareVerb: string;
  audience: string;
  reportNoun: string;
}

export interface NextActionCopy {
  id: NextActionId;
  title: string;
  body: string;
  cta: string;
  route: PostOnboardingRoute;
}

export function voiceForDrivingType(type: DrivingPattern | null): VoiceCopy {
  switch (type) {
    case 'regular_locations':
      return {
        workNoun: 'work',
        shareVerb: 'share',
        audience: 'your manager',
        reportNoun: 'reimbursement report',
      };
    case 'delivery_rideshare':
      return {
        workNoun: 'delivery',
        shareVerb: 'organize',
        audience: 'your records',
        reportNoun: 'earnings record',
      };
    case 'client_visits':
      return {
        workNoun: 'client',
        shareVerb: 'share',
        audience: 'clients',
        reportNoun: 'professional mileage record',
      };
    case 'different_places':
      return {
        workNoun: 'work',
        shareVerb: 'organize',
        audience: 'whoever needs it',
        reportNoun: 'work mileage log',
      };
    case 'not_sure':
    default:
      return {
        workNoun: 'work',
        shareVerb: 'share',
        audience: 'whoever needs it',
        reportNoun: 'mileage report',
      };
  }
}

export function nextActionCopy(action: NextActionId): NextActionCopy {
  switch (action) {
    case 'begin_rescue':
      return {
        id: action,
        title: 'Look for recoverable mileage',
        body: 'Start with a period you remember driving. Nothing is added without your confirmation.',
        cta: 'Start recovery',
        route: 'MissingTripRecovery',
      };
    case 'import_mileage':
      return {
        id: action,
        title: 'Bring what you already have',
        body: 'We’ll organize what we can and show anything that needs a quick look.',
        cta: 'Bring mileage',
        route: 'BringExistingMileage',
      };
    case 'add_workplace':
      return {
        id: action,
        title: 'Add a regular place',
        body: 'A simple label makes routine drives easier to recognize later.',
        cta: 'Add a place',
        route: 'ProtectionAlert',
      };
    case 'add_first_drive':
      return {
        id: action,
        title: 'Add your first drive',
        body: 'A few taps. Enter the miles you know — we won’t invent a route.',
        cta: 'Add a drive',
        route: 'ManualTrip',
      };
    case 'start_protection':
    default:
      return {
        id: 'start_protection',
        title: 'Turn on drive protection',
        body: 'So future drives aren’t missed. We’ll explain each permission first.',
        cta: 'Turn on protection',
        route: 'ProtectionAlert',
      };
  }
}

export function nextActionForGoal(goal: MileageGoal | null): NextActionCopy {
  switch (goal) {
    case 'employee_reimbursement':
    case 'gig_delivery':
      return nextActionCopy('start_protection');
    case 'self_employed_business':
      return nextActionCopy('add_first_drive');
    case 'mixed':
      return nextActionCopy('import_mileage');
    default:
      return nextActionCopy('start_protection');
  }
}

export function secondaryHomeActionForGoal(goal: MileageGoal | null): {
  label: string;
  route: 'ProtectionAlert' | 'BringExistingMileage' | 'ManualTrip' | 'Proof' | 'Review';
} | null {
  switch (goal) {
    case 'employee_reimbursement':
      return { label: 'See your report', route: 'Proof' };
    case 'gig_delivery':
    case 'self_employed_business':
      return { label: 'Add a drive', route: 'ManualTrip' };
    case 'mixed':
      return { label: 'Bring existing history', route: 'BringExistingMileage' };
    default:
      return null;
  }
}

export function protectionLabel(state: ProtectionSetupState): string {
  switch (state) {
    case 'healthy':
      return 'Protected';
    case 'configured':
      return 'Ready';
    case 'limited':
      return 'Needs attention';
    case 'educated':
      return 'Not finished';
    default:
      return 'Not set up';
  }
}

export function tripSourceLabel(source: string): string {
  switch (source) {
    case 'manual':
      return 'Added by you';
    case 'recovered':
      return 'Recovered';
    case 'imported':
      return 'Imported';
    case 'automatic':
    case 'auto':
      return 'Tracked';
    default:
      return source;
  }
}

export function greetingForName(name: string | null, hour = new Date().getHours()): string | null {
  if (!name || !name.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  if (hour < 12) return `Good morning, ${first}.`;
  if (hour < 17) return `Good afternoon, ${first}.`;
  return `Good evening, ${first}.`;
}
