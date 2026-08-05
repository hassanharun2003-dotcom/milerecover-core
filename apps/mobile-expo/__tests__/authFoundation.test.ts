import {
  AUTH_BACKEND_CONNECTED,
  AUTH_UNAVAILABLE_MESSAGE,
  getAuthPort,
  isAuthConfigured,
  setAuthPortForTests,
} from '../src/services/auth';

describe('Optional account foundation', () => {
  afterEach(() => {
    setAuthPortForTests(null);
  });

  it('never invents a successful login without a provider response', async () => {
    expect(AUTH_BACKEND_CONNECTED).toBe(false);
    const port = getAuthPort();
    // Without client IDs in this environment, Google is not configured.
    expect(port.isProviderAvailable('google')).toBe(false);
    // Email stays behind the backend flag.
    expect(port.isProviderAvailable('email')).toBe(false);
    // Apple may report available on iOS Jest env; still must not fake a session.
    expect(await port.getSession()).toBeNull();
    const result = await port.signIn('google');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(['not_configured', 'unavailable', 'failed']).toContain(result.reason);
      expect(result.message.length).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toMatch(/fake|mock session/i);
    }
    // Configured means at least one native provider can be offered — never invents login alone.
    expect(typeof isAuthConfigured()).toBe('boolean');
  });

  it('keeps email behind backend flag', async () => {
    const result = await getAuthPort().signIn('email');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('not_configured');
      expect(result.message).toMatch(/email|account service/i);
    }
  });

  it('exposes calm unavailable copy for unconfigured builds', () => {
    expect(AUTH_UNAVAILABLE_MESSAGE).toMatch(/continue without an account/i);
  });
});
