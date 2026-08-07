import { calculateProtectionHealth } from '../../../packages/domain/src/protection-health/calculate';
import { colors } from '../../../packages/config/src/tokens';
import { createInitialAppState } from '../src/store/types';
import { selectHomeViewModel } from '../src/selectors/homeSelectors';

describe('MileRecover Expo foundation', () => {
  it('imports domain package (protection health)', () => {
    const result = calculateProtectionHealth({
      permissions: {
        location: 'not_determined',
        backgroundLocation: 'not_determined',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      },
      trackingEngineState: 'idle',
      lastConfirmedCaptureAt: null,
      lastSyncAt: null,
      now: Date.now(),
      pendingReviewCount: 0,
    });
    expect(result.level).toBeDefined();
  });

  it('imports config design tokens', () => {
    expect(colors.forest[700]).toBe('#1F8A5B');
  });

  it('builds home view model from initial app state', () => {
    const state = createInitialAppState();
    const vm = selectHomeViewModel(state, {
      location: 'not_determined',
      backgroundLocation: 'not_determined',
      motion: 'not_applicable',
      batteryOptimizationRestricted: false,
    });
    expect(vm.periodProtectedMiles).toBe(0);
  });

  it('aligns with four-tab navigation constants', () => {
    const { ROOT_TAB_ROUTE_NAMES } = require('../src/navigation/types');
    expect(ROOT_TAB_ROUTE_NAMES).toHaveLength(4);
    expect(ROOT_TAB_ROUTE_NAMES).toContain('Home');
    expect(ROOT_TAB_ROUTE_NAMES).toContain('Proof');
  });
});
