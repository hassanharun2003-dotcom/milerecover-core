import { createInitialProductUiState } from '../src/product/types';
import { earnedTrialMoment, isWithinFirstWeek } from '../src/product/trialValue';

describe('earnedTrialMoment', () => {
  it('does not offer trial before a real value moment', () => {
    const product = createInitialProductUiState();
    expect(earnedTrialMoment(product, 1)).toBeNull();
    expect(earnedTrialMoment(product, 4)).toBeNull();
  });

  it('earns trial after five confirmed work drives', () => {
    const product = createInitialProductUiState();
    expect(earnedTrialMoment(product, 5)).toBe('five_confirmed_work_drives');
  });

  it('earns trial after export, recovery, or missing-trip moments', () => {
    const base = createInitialProductUiState();
    expect(earnedTrialMoment({ ...base, firstExportAt: 1 }, 0)).toBe('first_exported_report');
    expect(earnedTrialMoment({ ...base, firstRecoveredDriveAt: 1 }, 0)).toBe('first_recovered_drive');
    expect(earnedTrialMoment({ ...base, firstMissingTripSeenAt: 1 }, 0)).toBe(
      'first_possible_missing_trip',
    );
  });

  it('treats first week as seven days', () => {
    const now = Date.now();
    expect(isWithinFirstWeek(now - 2 * 86400000, now)).toBe(true);
    expect(isWithinFirstWeek(now - 8 * 86400000, now)).toBe(false);
    expect(isWithinFirstWeek(null, now)).toBe(false);
  });
});
