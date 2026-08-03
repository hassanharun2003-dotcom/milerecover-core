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
        title: 'Next, look for recoverable mileage',
        body: 'Start with a period you remember driving. We will help you review quiet stretches without inventing miles.',
        cta: 'Start recovery',
        route: 'MissingTripRecovery',
      };
    case 'import_mileage':
      return {
        id: action,
        title: 'Next, choose a file or source',
        body: 'Bring what you already have. We will organize what we can and show anything that needs review.',
        cta: 'Bring mileage',
        route: 'BringExistingMileage',
      };
    case 'add_workplace':
      return {
        id: action,
        title: 'Next, add a regular work place',
        body: 'A simple label can make routine drives easier to recognize and explain later.',
        cta: 'Add work place',
        route: 'ProtectionAlert',
      };
    case 'add_first_drive':
      return {
        id: action,
        title: 'Next, add or confirm a drive',
        body: 'A report needs confirmed work drives first. Add one now or import history when you are ready.',
        cta: 'Add a drive',
        route: 'ManualTrip',
      };
    case 'start_protection':
    default:
      return {
        id: 'start_protection',
        title: 'Next, turn on protection',
        body: 'One step remains before MileRecover can watch future drives. We will explain each permission first.',
        cta: 'Continue setup',
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
      return { label: 'Prepare a reimbursement report', route: 'Proof' };
    case 'gig_delivery':
      return { label: 'Check protection', route: 'ProtectionAlert' };
    case 'self_employed_business':
      return { label: 'Add a business drive', route: 'ManualTrip' };
    case 'mixed':
      return { label: 'Bring existing history', route: 'BringExistingMileage' };
    default:
      return null;
  }
}

export function protectionLabel(state: ProtectionSetupState): string {
  switch (state) {
    case 'healthy':
      return 'Watching';
    case 'configured':
      return 'Configured';
    case 'limited':
      return 'Needs attention';
    case 'educated':
      return 'Not finished';
    default:
      return 'Not set up';
  }
}

export function greetingForName(name: string | null, hour = new Date().getHours()): string | null {
  if (!name || !name.trim()) return null;
  const first = name.trim().split(/\s+/)[0];
  if (hour < 12) return `Good morning, ${first}.`;
  if (hour < 17) return `Good afternoon, ${first}.`;
  return `Good evening, ${first}.`;
}
