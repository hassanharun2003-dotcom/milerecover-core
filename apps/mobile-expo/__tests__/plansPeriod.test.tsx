import { PLAN_FIXTURES } from '../src/fixtures/subscription';
import { renderStackScreen } from '../src/testing/ScreenTestHarness';

describe('Plans monthly/annual rendering', () => {
  it('keeps Plus and Pro fixtures for both intervals', () => {
    const plus = PLAN_FIXTURES.find((plan) => plan.id === 'plus')!;
    const pro = PLAN_FIXTURES.find((plan) => plan.id === 'pro')!;
    expect(plus.monthlyPrice).toBe('$8.99');
    expect(plus.annualPrice).toBe('$89.99');
    expect(pro.monthlyPrice).toBe('$14.99');
    expect(pro.annualPrice).toBe('$119.99');
    expect(plus.features.join(' ')).not.toMatch(/Never lose another reimbursable mile\..*Never lose another reimbursable mile\./);
  });

  it('renders Plus and Pro on Plans screen', async () => {
    const { copy } = await renderStackScreen('PlanSelection', { source: 'profile' });
    expect(copy).toMatch(/Plus/i);
    expect(copy).toMatch(/Pro/i);
    expect(copy).toMatch(/Stay on Free|Free/i);
    expect(copy).toMatch(/90-Day Rescue|One-time catch-up/i);
    expect(copy).toMatch(/Protect future work drives|Keep the protection|Create reports ready to share/i);
    expect(copy).toMatch(/Automatic coverage for future drives/i);
    expect(copy).toMatch(/Everything in Plus/i);
  });
});
