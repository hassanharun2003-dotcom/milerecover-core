import { PLAN_FIXTURES } from '../src/fixtures/subscription';
import { renderStackScreen } from '../src/testing/ScreenTestHarness';

describe('Plans monthly/annual rendering', () => {
  it('keeps Figma-locked Plus and Pro fixtures for both intervals', () => {
    const plus = PLAN_FIXTURES.find((plan) => plan.id === 'plus')!;
    const pro = PLAN_FIXTURES.find((plan) => plan.id === 'pro')!;
    expect(plus.monthlyPrice).toBe('$9.99');
    expect(plus.annualPrice).toBe('$95.90');
    expect(pro.monthlyPrice).toBe('$19.99');
    expect(pro.annualPrice).toBe('$191.90');
    expect(plus.highlighted).toBe(true);
  });

  it('renders compact Free/Plus/Pro comparison with preview-safe CTAs', async () => {
    const { copy } = await renderStackScreen('PlanSelection', { source: 'profile' });
    expect(copy).toMatch(/^Plans\b|Plans Free stays useful/i);
    expect(copy).toMatch(/Free stays useful/i);
    expect(copy).toMatch(/Monthly/i);
    expect(copy).toMatch(/Yearly/i);
    expect(copy).toMatch(/Recommended/i);
    expect(copy).toMatch(/Plus/i);
    expect(copy).toMatch(/Pro/i);
    expect(copy).toMatch(/\$9\.99/);
    expect(copy).toMatch(/\$19\.99/);
    expect(copy).toMatch(/Unavailable in preview|Start free 7-day trial|Start Plus/i);
    expect(copy).toMatch(/Current plan: Free/i);
    expect(copy).toMatch(/Purchases unavailable in this preview|Purchases are disabled/i);
    expect(copy).not.toMatch(/RevenueCat/i);
  });
});
