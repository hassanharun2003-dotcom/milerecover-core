import { APP_BUILD_LABEL, PREVIEW_CHANNEL_MARKER, isStandaloneBuild } from '../src/constants/buildInfo';
import { updatesEnabled } from '../src/updates/appUpdates';

describe('Preview update workflow constants', () => {
  it('exposes build label and optional preview marker', () => {
    expect(APP_BUILD_LABEL).toMatch(/mvp|preview|final|product-lock|product-recovery|continuous-pass/);
    expect(typeof PREVIEW_CHANNEL_MARKER).toBe('string');
  });

  it('treats preview and production as standalone OTA builds', () => {
    expect(isStandaloneBuild('preview')).toBe(true);
    expect(isStandaloneBuild('production')).toBe(true);
    expect(isStandaloneBuild('development')).toBe(false);
  });

  it('disables updates in Jest dev environment', () => {
    expect(updatesEnabled()).toBe(false);
  });
});

describe('Navigation includes About for update checks', () => {
  it('registers About route', () => {
    const { SUPPORTING_STACK_ROUTES } = require('../src/navigation/types');
    expect(SUPPORTING_STACK_ROUTES).toContain('About');
  });
});
