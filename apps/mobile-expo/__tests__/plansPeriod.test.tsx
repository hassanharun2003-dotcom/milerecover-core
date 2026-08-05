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
    expect(copy).toMatch(/7 days free/i);
    expect(copy).toMatch(/Try Plus features\. Cancel anytime\./i);
    expect(copy).toMatch(/Plus/i);
    expect(copy).toMatch(/Pro/i);
    expect(copy).toMatch(/40 automatic trips\/month/i);
    expect(copy).toMatch(/1 vehicle/i);
    expect(copy).toMatch(/1 missing scan\/month/i);
    expect(copy).toMatch(/Then \$8\.99\/month unless cancelled/i);
    expect(copy).toMatch(/Continue with Free|Free/i);
    expect(copy).toMatch(/recover older mileage|Rescue/i);
    expect(copy).not.toMatch(/RevenueCat/i);
    expect(copy).toMatch(/Automatic|missed|PDF|tracking health/i);
  });
});
