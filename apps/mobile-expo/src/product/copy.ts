import type { DrivingType, PrimaryGoal, ProtectionSetupState } from './types';

export interface VoiceCopy {
  workNoun: string;
  shareVerb: string;
  audience: string;
  reportNoun: string;
}

export function voiceForDrivingType(type: DrivingType | null): VoiceCopy {
  switch (type) {
    case 'employee':
      return {
        workNoun: 'work',
        shareVerb: 'share',
        audience: 'your manager',
        reportNoun: 'reimbursement report',
      };
    case 'gig':
      return {
        workNoun: 'business',
        shareVerb: 'organize',
        audience: 'your records',
        reportNoun: 'earnings record',
      };
    case 'small_business':
      return {
        workNoun: 'client',
        shareVerb: 'share',
        audience: 'clients',
        reportNoun: 'professional record',
      };
    default:
      return {
        workNoun: 'work',
        shareVerb: 'share',
        audience: 'whoever needs it',
        reportNoun: 'mileage report',
      };
  }
}

export function nextActionForGoal(goal: PrimaryGoal | null): {
  title: string;
  body: string;
  cta: string;
  route: 'ProtectionAlert' | 'BringExistingMileage' | 'ManualTrip' | 'Proof';
} {
  switch (goal) {
    case 'bring_history':
      return {
        title: 'Next, choose a file or source',
        body: 'Bring what you already have. We’ll organize what we can and show you anything that needs a look.',
        cta: 'Bring mileage',
        route: 'BringExistingMileage',
      };
    case 'find_missing':
      return {
        title: 'Next, tell us which period to review',
        body: 'Start with a period you remember driving. We’ll help you look for quiet stretches—never invent miles.',
        cta: 'Add a drive to start',
        route: 'ManualTrip',
      };
    case 'prepare_report':
      return {
        title: 'Next, add or import confirmed drives',
        body: 'A report needs confirmed work drives first. Import history or add what you remember.',
        cta: 'Prepare records',
        route: 'Proof',
      };
    case 'protect_future':
    default:
      return {
        title: 'Next, turn on protection',
        body: 'One step remains before MileRecover can watch future drives. We’ll explain each permission first.',
        cta: 'Continue setup',
        route: 'ProtectionAlert',
      };
  }
}

export function secondaryHomeActionForGoal(goal: PrimaryGoal | null): {
  label: string;
  route: 'ProtectionAlert' | 'BringExistingMileage' | 'ManualTrip' | 'Proof' | 'Review';
} | null {
  switch (goal) {
    case 'bring_history':
      return { label: 'Bring existing history', route: 'BringExistingMileage' };
    case 'find_missing':
      return { label: 'Look for missing miles', route: 'ManualTrip' };
    case 'prepare_report':
      return { label: 'See report status', route: 'Proof' };
    case 'protect_future':
      return { label: 'Check protection', route: 'ProtectionAlert' };
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
