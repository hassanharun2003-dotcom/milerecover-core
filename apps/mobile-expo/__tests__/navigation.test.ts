import { ROOT_TAB_ROUTE_NAMES, ROOT_STACK_ROUTE_NAMES } from '../src/navigation/types';

describe('MileRecover navigation IA', () => {
  it('defines exactly four bottom-tab routes', () => {
    expect(ROOT_TAB_ROUTE_NAMES).toHaveLength(4);
  });

  it('uses locked tab names Home, Review, Proof, Profile', () => {
    expect(ROOT_TAB_ROUTE_NAMES).toEqual(['Home', 'Review', 'Proof', 'Profile']);
  });

  it('does not include Manual Trip as a bottom tab', () => {
    expect(ROOT_TAB_ROUTE_NAMES).not.toContain('Add');
    expect(ROOT_TAB_ROUTE_NAMES).not.toContain('ManualTrip');
    expect(ROOT_TAB_ROUTE_NAMES).not.toContain('Manual Trip');
  });

  it('keeps Manual Trip on the root stack, not tabs', () => {
    expect(ROOT_STACK_ROUTE_NAMES).toEqual(['MainTabs', 'ManualTrip']);
    expect(ROOT_TAB_ROUTE_NAMES.includes('ManualTrip' as never)).toBe(false);
  });

  it('exposes Manual Trip as a stack route for supporting navigation', () => {
    expect(ROOT_STACK_ROUTE_NAMES).toContain('ManualTrip');
  });
});
