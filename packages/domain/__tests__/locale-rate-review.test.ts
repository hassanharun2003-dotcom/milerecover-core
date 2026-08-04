import {
  createTripRateSnapshot,
  formatActiveRateLabel,
  localeProfileFromCountry,
  rateNeedsReviewAfterLocaleChange,
} from '../src';

describe('Locale rate review and snapshots', () => {
  it('defaults US/CA/GB/AU units and currencies', () => {
    expect(localeProfileFromCountry('US').distanceUnit).toBe('mi');
    expect(localeProfileFromCountry('US').currencyCode).toBe('USD');
    expect(localeProfileFromCountry('CA').distanceUnit).toBe('km');
    expect(localeProfileFromCountry('CA').currencyCode).toBe('CAD');
    expect(localeProfileFromCountry('GB').distanceUnit).toBe('mi');
    expect(localeProfileFromCountry('GB').currencyCode).toBe('GBP');
    expect(localeProfileFromCountry('AU').distanceUnit).toBe('km');
    expect(localeProfileFromCountry('AU').currencyCode).toBe('AUD');
  });

  it('marks rate review when country or unit changes', () => {
    const us = localeProfileFromCountry('US');
    const ca = localeProfileFromCountry('CA');
    expect(rateNeedsReviewAfterLocaleChange(us, ca)).toBe(true);
    expect(
      rateNeedsReviewAfterLocaleChange(us, { ...us, distanceUnit: 'km', currencyCode: 'USD', countryCode: 'US' }),
    ).toBe(true);
  });

  it('formats Canada active rate as cents per km, not ¢/mi stored', () => {
    const ca = localeProfileFromCountry('CA');
    const label = formatActiveRateLabel(ca);
    expect(label).toMatch(/¢\/km/);
    expect(label).not.toMatch(/stored/i);
  });

  it('shows Review mileage rate when flagged', () => {
    const ca = { ...localeProfileFromCountry('CA'), activeRateNeedsReview: true };
    expect(formatActiveRateLabel(ca)).toBe('Review mileage rate');
  });

  it('creates trip rate snapshots without inventing a rate', () => {
    const other = localeProfileFromCountry('OTHER', { distanceUnit: 'km', currencyCode: 'EUR' });
    const snap = createTripRateSnapshot(other, 1000);
    expect(snap.distanceUnit).toBe('km');
    expect(snap.currencyCode).toBe('EUR');
    expect(snap.countryCode).toBe('OTHER');
    expect(snap.effectiveAt).toBe(1000);
  });
});
