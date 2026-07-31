import { BRIDGE_API_VERSION, CONTRACT_MAJOR_VERSION } from './constants';
import type { BridgeBufferStats, NativeEventEnvelope, SanitizedDiagnostics } from './types';
import { detectSequenceGap } from './validate';

const COORDINATE_KEY_PATTERN =
  /^(lat(itude)?|lng|lon(gitude)?|coord|coordinates|route|polyline|address|location)$/i;

const SENSITIVE_KEY_PATTERN =
  /^(password|token|auth|billing|calendar|note|client|business|advertising|idfa|payload_raw)$/i;

function redactValue(key: string, value: unknown): unknown {
  if (COORDINATE_KEY_PATTERN.test(key) || SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => redactValue(String(i), item));
  }
  return value;
}

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

export function sanitizeEventForDisplay(event: NativeEventEnvelope): Record<string, unknown> {
  return {
    eventId: event.eventId,
    schemaVersion: event.schemaVersion,
    eventType: event.eventType,
    sessionId: event.sessionId,
    sequenceNumber: event.sequenceNumber,
    sourcePlatform: event.sourcePlatform,
    sourceComponent: event.sourceComponent,
    wallClockTimestamp: event.wallClockTimestamp,
    elapsedRealtimeMs: event.elapsedRealtimeMs,
    persistenceTimestamp: event.persistenceTimestamp,
    deliveryAttemptCount: event.deliveryAttemptCount,
    acknowledgmentState: event.acknowledgmentState,
    payload: redactObject(event.payload),
    diagnosticMetadata: redactObject(event.diagnosticMetadata as Record<string, unknown>),
  };
}

export function buildSanitizedDiagnostics(
  stats: BridgeBufferStats,
  recentEvents: NativeEventEnvelope[],
  platform: string,
): SanitizedDiagnostics {
  return {
    exportedAt: new Date().toISOString(),
    bridgeApiVersion: BRIDGE_API_VERSION,
    contractVersion: String(CONTRACT_MAJOR_VERSION),
    bufferStats: stats,
    recentEventSummaries: recentEvents.map((e) => ({
      eventId: e.eventId,
      eventType: String(e.eventType),
      sessionId: e.sessionId,
      sequenceNumber: e.sequenceNumber,
      acknowledgmentState: e.acknowledgmentState,
    })),
    sequenceGapDetected: detectSequenceGap(recentEvents),
    platform,
  };
}

export function diagnosticsJsonExcludesCoordinates(json: string): boolean {
  const forbidden = [
    '"latitude"',
    '"longitude"',
    '"lat":',
    '"lng":',
    '"lon":',
    '"coordinates"',
    '"polyline"',
    '"address"',
  ];
  const lower = json.toLowerCase();
  return !forbidden.some((token) => lower.includes(token));
}

export function safeLogMessage(message: string, context?: Record<string, unknown>): string {
  const base = `[PrototypeC] ${message}`;
  if (!context) return base;
  return `${base} ${JSON.stringify(redactObject(context))}`;
}
