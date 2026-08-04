import {
  formatReportRouteSummary,
  reportTitleForGoal,
  buildMileageReportData,
  resolveReportPeriod,
  type TripRecord,
} from '../src';

describe('Report presentation polish', () => {
  it('maps goals to report headings without reimbursement unless selected', () => {
    expect(reportTitleForGoal('employee_reimbursement')).toBe('Mileage reimbursement report');
    expect(reportTitleForGoal('gig_delivery')).toBe('Work mileage record');
    expect(reportTitleForGoal('self_employed_business')).toBe('Business mileage report');
    expect(reportTitleForGoal('mixed')).toBe('Work mileage report');
    expect(reportTitleForGoal(null)).toBe('Work mileage report');
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
    expect(data.title).toBe('Work mileage record');
    expect(data.lineItems[0].startLabel).toBe('');
    expect(data.lineItems[0].endLabel).toBe('');
    expect(formatReportRouteSummary(data.lineItems[0].distanceMiles, data.lineItems[0].startLabel, data.lineItems[0].endLabel)).toBe(
      '8.3 mi · Route not added',
    );
  });
});
