import { validateManualTripInput } from '../src';

const baseInput = {
  startAt: 1_000,
  endAt: 2_000,
  distanceMiles: 12,
  purpose: '',
  evidenceMethod: 'user_estimate' as const,
  confirmAsWork: true,
};

describe('manual trip validation', () => {
  it('rejects zero and negative distance', () => {
    expect(
      validateManualTripInput({ ...baseInput, distanceMiles: 0 }).map((error) => error.field),
    ).toContain('distanceMiles');
    expect(
      validateManualTripInput({ ...baseInput, distanceMiles: -4 }).map((error) => error.field),
    ).toContain('distanceMiles');
  });

  it('allows purpose to be filled later for confirmed work drives', () => {
    expect(validateManualTripInput(baseInput).map((error) => error.field)).not.toContain('purpose');
  });

  it('rejects start times after end times until the caller confirms overnight', () => {
    expect(
      validateManualTripInput({ ...baseInput, startAt: 2_000, endAt: 1_000 }).map((error) => error.field),
    ).toContain('endAt');
  });
});
