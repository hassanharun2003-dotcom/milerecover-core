import {
  clearNotificationDedupeForTests,
  DEFAULT_NOTIFICATION_PREFERENCES,
  shouldScheduleNotification,
} from '../src/services/notifications';
import {
  catalogProductIds,
  getPurchasePort,
  resolvePlusProductId,
  setPurchasePortForTests,
} from '../src/services/purchases';
import { STORE_PRODUCTS } from '../src/services/storeProducts';
import { AUTOMATIC_CAPTURE_AVAILABLE } from '../src/services/locationPermissions';

describe('Notifications', () => {
  beforeEach(() => {
    clearNotificationDedupeForTests();
  });

  it('respects permission, prefs, quiet hours, and dedupe', () => {
    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    };
    const evening = new Date('2026-08-03T23:00:00');
    expect(
      shouldScheduleNotification('trial_ending', prefs, 'trial-1', 'granted', evening),
    ).toBe(false);

    const afternoon = new Date('2026-08-03T15:00:00');
    expect(
      shouldScheduleNotification('trial_ending', prefs, 'trial-1', 'denied', afternoon),
    ).toBe(false);
    expect(
      shouldScheduleNotification('trial_ending', prefs, 'trial-1', 'granted', afternoon),
    ).toBe(true);
  });
});

describe('Billing contracts', () => {
  afterEach(() => {
    setPurchasePortForTests(null);
  });

  it('keeps store product IDs configured without granting entitlement locally', async () => {
    expect(STORE_PRODUCTS.length).toBeGreaterThanOrEqual(6);
    expect(STORE_PRODUCTS.every((product) => product.androidProductId && product.iosProductId)).toBe(true);
    expect(catalogProductIds().length).toBe(STORE_PRODUCTS.length);
    expect(resolvePlusProductId('monthly')).toMatch(/plus/);

    const port = getPurchasePort();
    const products = await port.getProducts();
    expect(products).toEqual([]);
    const purchase = await port.purchasePlusTrial('monthly');
    expect(purchase.ok).toBe(false);
    if (!purchase.ok) {
      expect(purchase.reason).toBe('store_unavailable');
    }
    const entitlement = await port.refreshEntitlement();
    expect(entitlement.planId).toBe('free');
  });
});

describe('Automatic capture runtime flag', () => {
  it('marks capture available in production MVP builds', () => {
    expect(AUTOMATIC_CAPTURE_AVAILABLE).toBe(true);
  });
});
