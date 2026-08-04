import {
  COUNTRY_PRESETS,
  displayToMiles,
  estimatedValueCents,
  formatCurrencyCents,
  formatDistance,
  localeProfileFromCountry,
  migrateLocaleProfile,
  milesToDisplay,
  rateForTimestamp,
  recommendCountryFromLocale,
  reportDisclaimerForTone,
  reportTitleForTone,
} from '../src';

describe('International localization foundation', () => {
  it('converts miles and kilometers only at display boundaries', () => {
    expect(milesToDisplay(10, 'mi')).toBe(10);
    expect(milesToDisplay(10, 'km')).toBeCloseTo(16.09344, 5);
    expect(displayToMiles(16.09344, 'km')).toBeCloseTo(10, 5);
    expect(displayToMiles(10, 'mi')).toBe(10);
  });

  it('formats distance and currency with locale tags', () => {
    expect(formatDistance(12.34, 'mi', 'en-US')).toBe('12.3 mi');
    expect(formatDistance(10, 'km', 'en-CA')).toMatch(/16\.1 km/);
    expect(formatCurrencyCents(1234, 'USD', 'en-US')).toMatch(/\$12\.34/);
    expect(formatCurrencyCents(1234, 'GBP', 'en-GB')).toMatch(/£12\.34|GBP/);
    expect(formatCurrencyCents(500, 'OTHER', 'en')).toBe('5.00');
  });

  it('builds presets for launch markets and Other country', () => {
    expect(COUNTRY_PRESETS.map((p) => p.countryCode)).toEqual(['US', 'CA', 'GB', 'AU']);
    const us = localeProfileFromCountry('US', { now: 1_700_000_000_000 });
    expect(us.distanceUnit).toBe('mi');
    expect(us.currencyCode).toBe('USD');
    expect(us.reportTone).toBe('us_tax_record');
    expect(us.rates[0]?.source).toBe('user_custom');

    const ca = localeProfileFromCountry('CA');
    expect(ca.distanceUnit).toBe('km');
    expect(ca.currencyCode).toBe('CAD');

    const other = localeProfileFromCountry('OTHER', {
      distanceUnit: 'km',
      currencyCode: 'EUR',
      centsPerMile: 40,
      now: 1_700_000_000_000,
    });
    expect(other.countryCode).toBe('OTHER');
    expect(other.reportTone).toBe('generic_mileage_record');
    expect(other.rates[0]?.centsPerMile).toBe(40);
    expect(other.rates[0]?.currencyCode).toBe('EUR');
  });

  it('selects effective-dated rates without rewriting history', () => {
    const profile = localeProfileFromCountry('US', { centsPerMile: 65, now: 1000 });
    const closed = {
      ...profile.rates[0],
      effectiveTo: 2000,
    };
    const newer = {
      id: 'rate-2',
      effectiveFrom: 2000,
      effectiveTo: null,
      centsPerMile: 70,
      source: 'employer_provided' as const,
      label: 'Employer rate',
      currencyCode: 'USD' as const,
    };
    const rates = [closed, newer];
    expect(rateForTimestamp(rates, 1500)?.centsPerMile).toBe(65);
    expect(rateForTimestamp(rates, 2500)?.centsPerMile).toBe(70);
    const oldValue = estimatedValueCents(10, rateForTimestamp(rates, 1500)!.centsPerMile);
    const newValue = estimatedValueCents(10, rateForTimestamp(rates, 2500)!.centsPerMile);
    expect(oldValue).toBe(650);
    expect(newValue).toBe(700);
  });

  it('migrates missing locale profiles to US defaults', () => {
    const migrated = migrateLocaleProfile(undefined, 123);
    expect(migrated.countryCode).toBe('US');
    expect(migrated.rates.length).toBeGreaterThan(0);

    const kept = migrateLocaleProfile(
      {
        countryCode: 'GB',
        countryDisplayName: 'United Kingdom',
        distanceUnit: 'mi',
        currencyCode: 'GBP',
        localeTag: 'en-GB',
        reportTone: 'reimbursement_record',
        rates: [
          {
            id: 'kept',
            effectiveFrom: 1,
            effectiveTo: null,
            centsPerMile: 45,
            source: 'user_custom',
            label: 'Custom',
            currencyCode: 'GBP',
          },
        ],
      },
      999,
    );
    expect(kept.countryCode).toBe('GB');
    expect(kept.rates[0]?.id).toBe('kept');
  });

  it('recommends country from device locale tags', () => {
    expect(recommendCountryFromLocale('en-US')).toBe('US');
    expect(recommendCountryFromLocale('en-CA')).toBe('CA');
    expect(recommendCountryFromLocale('en-GB')).toBe('GB');
    expect(recommendCountryFromLocale('en-AU')).toBe('AU');
    expect(recommendCountryFromLocale('fr-FR')).toBe('US');
  });

  it('uses country-appropriate report wording without compliance claims', () => {
    expect(reportTitleForTone('us_tax_record', 'This month')).toMatch(/Tax record summary/);
    expect(reportTitleForTone('reimbursement_record', 'This month')).toMatch(/reimbursement/i);
    expect(reportTitleForTone('generic_mileage_record', 'This month')).toMatch(/Mileage record/);
    expect(reportDisclaimerForTone('us_tax_record')).not.toMatch(/IRS-approved|guaranteed/i);
    expect(reportDisclaimerForTone('generic_mileage_record')).toMatch(/Not compliance advice/);
  });
});
