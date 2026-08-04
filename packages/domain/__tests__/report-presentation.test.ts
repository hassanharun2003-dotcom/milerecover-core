import {
  formatReportRouteSummary,
  reportTitleForGoal,
  buildMileageReportData,
  localeProfileFromCountry,
  resolveReportPeriod,
  type CountryCode,
  type TripRecord,
} from '../src';

describe('Report presentation polish', () => {
  it('maps goals to report headings without reimbursement unless selected', () => {
    expect(reportTitleForGoal('employee_reimbursement')).toBe('Mileage reimbursement report');
    expect(reportTitleForGoal('gig_delivery')).toBe('Driving earnings report');
    expect(reportTitleForGoal('self_employed_business')).toBe('Business mileage report');
    expect(reportTitleForGoal('mixed')).toBe('Mileage report');
    expect(reportTitleForGoal(null)).toBe('Mileage report');
  });

  it('formats missing routes without dash placeholders', () => {
    expect(formatReportRouteSummary(12.4, null, null)).toBe('12.4 mi · Route not added');
    expect(formatReportRouteSummary(12.4, 'Home', 'Office')).toBe('12.4 mi · Home to Office');
    expect(formatReportRouteSummary(3, 'Depot', '')).toBe('3.0 mi · From Depot');
  });

  it('applies gig title and empty place labels in report data', () => {
    const period = resolveReportPeriod('ytd', Date.UTC(2026, 7, 3));
    const trip: TripRecord = {
      id: 't1',
      source: 'manual',
      status: 'confirmed',
      classification: 'business',
      startAt: period.startAt + 1000,
      endAt: period.startAt + 2000,
      distanceMiles: 8.25,
      purpose: 'Delivery',
      notes: null,
      hasRouteCoordinates: false,
      confidence: 'high',
    };
    const data = buildMileageReportData({
      trips: [trip],
      period,
      primaryGoal: 'gig_delivery',
    });
    expect(data.title).toBe('Driving earnings report');
    expect(data.lineItems[0].startLabel).toBe('');
    expect(data.lineItems[0].endLabel).toBe('');
    expect(formatReportRouteSummary(data.lineItems[0].distanceMiles, data.lineItems[0].startLabel, data.lineItems[0].endLabel)).toBe(
      '8.3 mi · Route not added',
    );
    expect(data.estimatedValueCents).toBeNull();
  });

  it('builds country-aware report fixtures for launch markets and Other', () => {
    const period = resolveReportPeriod('this_month', Date.UTC(2026, 7, 3));
    const trip: TripRecord = {
      id: 't-country',
      source: 'manual',
      status: 'confirmed',
      classification: 'business',
      startAt: period.startAt + 1000,
      endAt: period.startAt + 2000,
      distanceMiles: 10,
      purpose: 'Client visit',
      notes: null,
      hasRouteCoordinates: false,
      confidence: 'high',
      startLabel: 'A',
      endLabel: 'B',
    };
    const countries: CountryCode[] = ['US', 'CA', 'GB', 'AU', 'OTHER'];
    for (const code of countries) {
      const locale =
        code === 'OTHER'
          ? localeProfileFromCountry('OTHER', {
              distanceUnit: 'km',
              currencyCode: 'EUR',
              centsPerMile: 40,
              now: period.startAt - 1000,
            })
          : localeProfileFromCountry(code, { now: period.startAt - 1000 });
      const data = buildMileageReportData({
        trips: [trip],
        period,
        localeProfile: locale,
      });
      expect(data.countryCode).toBe(code);
      expect(data.disclaimer.length).toBeGreaterThan(20);
      expect(data.disclaimer).not.toMatch(/IRS-approved|guaranteed filing/i);
      expect(data.estimatedValueCents).toBeGreaterThan(0);
      expect(data.lineItems[0].rateCentsPerMile).toBe(locale.rates[0]?.centsPerMile);
      // Later rate change must not rewrite this report snapshot.
      const newer = localeProfileFromCountry(code === 'OTHER' ? 'OTHER' : code, {
        centsPerMile: 999,
        distanceUnit: locale.distanceUnit,
        currencyCode: locale.currencyCode,
        now: period.endAt + 10_000,
      });
      const afterChange = buildMileageReportData({
        trips: [trip],
        period,
        localeProfile: {
          ...locale,
          rates: [
            { ...locale.rates[0]!, effectiveTo: period.endAt + 5_000 },
            ...newer.rates,
          ],
        },
      });
      expect(afterChange.estimatedValueCents).toBe(data.estimatedValueCents);
    }
  });
});
