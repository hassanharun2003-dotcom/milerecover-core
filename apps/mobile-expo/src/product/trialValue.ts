import type { TrialOfferTrigger } from '@milerecover/domain';
import type { ProductUiState } from './types';

/** Value moments that earn a calm Plus trial offer (never on install). */
export type EarnedTrialMoment =
  | 'first_recovered_drive'
  | 'first_exported_report'
  | 'five_confirmed_work_drives'
  | 'first_possible_missing_trip';

export function earnedTrialMoment(
  product: ProductUiState,
  confirmedWorkDriveCount: number,
): EarnedTrialMoment | null {
  if (product.firstRecoveredDriveAt != null) return 'first_recovered_drive';
  if (product.firstExportAt != null) return 'first_exported_report';
  if (product.firstMissingTripSeenAt != null) return 'first_possible_missing_trip';
  if (confirmedWorkDriveCount >= 5) return 'five_confirmed_work_drives';
  return null;
}

export function earnedTrialTrigger(moment: EarnedTrialMoment): TrialOfferTrigger {
  switch (moment) {
    case 'first_recovered_drive':
      return 'first_recovery_candidate';
    case 'first_exported_report':
      return 'first_report_preview';
    case 'five_confirmed_work_drives':
      return 'first_confirmed_work_drive';
    case 'first_possible_missing_trip':
      return 'first_recovery_candidate';
    default:
      return 'plus_only_capability';
  }
}

export function isWithinFirstWeek(sinceMs: number | null, now = Date.now()): boolean {
  if (sinceMs == null) return false;
  return now - sinceMs < 7 * 86400000;
}
