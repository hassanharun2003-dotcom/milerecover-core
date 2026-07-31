import {
  buildSanitizedDiagnostics,
  diagnosticsJsonExcludesCoordinates,
  redactObject,
  safeLogMessage,
  sanitizeEventForDisplay,
} from '../../contract/sanitize';
import { createBridgeError } from '../../contract/errors';
import { createSyntheticEvent } from '../helpers/synthetic';
import { BRIDGE_API_VERSION } from '../../contract/constants';

describe('privacy controls', () => {
  it('redacts coordinate keys in objects', () => {
    const redacted = redactObject({
      latitude: 10.5,
      longitude: 20.1,
      synthetic: true,
    });
    expect(redacted.latitude).toBe('[REDACTED]');
    expect(redacted.longitude).toBe('[REDACTED]');
    expect(redacted.synthetic).toBe(true);
  });

  it('sanitized event display excludes raw coordinates', () => {
    const event = createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 });
    const display = sanitizeEventForDisplay(event);
    expect(display.payload).toMatchObject({
      latitude: '[REDACTED]',
      longitude: '[REDACTED]',
    });
  });

  it('diagnostics export excludes coordinate tokens', () => {
    const event = createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 });
    const diag = buildSanitizedDiagnostics(
      {
        pendingCount: 1,
        deliveredCount: 0,
        acknowledgedCount: 0,
        duplicateRejectedCount: 0,
        rejectedCount: 0,
        lastSequenceReceived: 1,
        contractVersion: '1',
        bridgeApiVersion: BRIDGE_API_VERSION,
      },
      [event],
      'jest',
    );
    const json = JSON.stringify(diag);
    expect(diagnosticsJsonExcludesCoordinates(json)).toBe(true);
  });

  it('errors exclude raw payloads', () => {
    const err = createBridgeError('malformed_event', 'Invalid envelope');
    expect(JSON.stringify(err).includes('latitude')).toBe(false);
  });

  it('safe log message redacts context', () => {
    const msg = safeLogMessage('event', { latitude: 1.0, eventId: 'x' });
    expect(msg).toContain('[REDACTED]');
    expect(msg).not.toContain('1.0');
  });
});
