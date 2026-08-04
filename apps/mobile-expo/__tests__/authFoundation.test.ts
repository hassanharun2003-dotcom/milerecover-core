import {
  AUTH_AVAILABLE,
  AUTH_UNAVAILABLE_MESSAGE,
  getAuthPort,
  isAuthConfigured,
  setAuthPortForTests,
  shouldShowAccountPreviewCopy,
} from '../src/services/auth';

describe('Optional account foundation', () => {
  afterEach(() => {
    setAuthPortForTests(null);
  });

  it('keeps auth unavailable in preview and does not invent sessions', async () => {
    expect(AUTH_AVAILABLE).toBe(false);
    expect(isAuthConfigured()).toBe(false);
    const port = getAuthPort();
    expect(port.isAvailable()).toBe(false);
    expect(await port.getSession()).toBeNull();
    const result = await port.signIn('google');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unavailable');
      expect(result.message).toBe(AUTH_UNAVAILABLE_MESSAGE);
    }
  });

  it('shows preview account copy in development/preview builds', () => {
    expect(shouldShowAccountPreviewCopy('preview')).toBe(true);
    expect(shouldShowAccountPreviewCopy('development')).toBe(true);
  });
});
