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
    expect(plus.features.join(' ')).not.toMatch(
      /Never lose another reimbursable mile\..*Never lose another reimbursable mile\./,
    );
  });

  it('renders image-lock Go Pro paywall with real Pro pricing', async () => {
    const { copy } = await renderStackScreen('PlanSelection', { source: 'profile' });
    expect(copy).toMatch(/Go Pro/i);
    expect(copy).toMatch(/Recover more miles/i);
    expect(copy).toMatch(/Monthly/i);
    expect(copy).toMatch(/Yearly/i);
    expect(copy).toMatch(/Pro/i);
    expect(copy).toMatch(/\$14\.99/);
    expect(copy).toMatch(/Start Free 7-Day Trial/i);
    expect(copy).toMatch(/Compare all plans/i);
    expect(copy).toMatch(/Unlimited automatic tracking/i);
    expect(copy).toMatch(/Missing drive recovery/i);
    expect(copy).toMatch(/Priority support/i);
    expect(copy).toMatch(/Free/i);
    expect(copy).toMatch(/recover older mileage|Rescue/i);
    expect(copy).not.toMatch(/RevenueCat/i);
  });
});
