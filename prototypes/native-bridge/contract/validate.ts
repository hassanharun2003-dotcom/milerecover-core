import {
  ACKNOWLEDGMENT_STATES,
  CONTRACT_MAJOR_VERSION,
  JS_SUPPORTED_SCHEMA_VERSIONS,
  PROTOTYPE_EVENT_TYPES,
} from './constants';
import { createBridgeError } from './errors';
import type { NativeEventEnvelope, ValidationResult } from './types';

const REQUIRED_STRING_FIELDS = [
  'eventId',
  'eventType',
  'sessionId',
  'sourcePlatform',
  'sourceComponent',
  'acknowledgmentState',
] as const;

const REQUIRED_NUMBER_FIELDS = [
  'schemaVersion',
  'sequenceNumber',
  'wallClockTimestamp',
  'elapsedRealtimeMs',
  'persistenceTimestamp',
  'deliveryAttemptCount',
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function majorVersion(schemaVersion: number): number {
  return Math.trunc(schemaVersion);
}

export function parseNativeEvent(raw: unknown): ValidationResult {
  if (!isPlainObject(raw)) {
    return {
      ok: false,
      code: 'malformed_event',
      message: 'Event must be a plain object',
    };
  }

  const eventId = raw.eventId;
  if (typeof eventId !== 'string' || eventId.length === 0) {
    return {
      ok: false,
      code: 'malformed_event',
      message: 'Missing or invalid eventId',
    };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = raw[field];
    if (typeof value !== 'string' || value.length === 0) {
      return {
        ok: false,
        code: 'malformed_event',
        message: `Missing required field: ${field}`,
        eventId,
      };
    }
  }

  for (const field of REQUIRED_NUMBER_FIELDS) {
    const value = raw[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return {
        ok: false,
        code: 'malformed_event',
        message: `Missing or invalid numeric field: ${field}`,
        eventId,
      };
    }
  }

  const schemaVersion = raw.schemaVersion as number;
  if (majorVersion(schemaVersion) !== CONTRACT_MAJOR_VERSION) {
    return {
      ok: false,
      code: 'unsupported_schema',
      message: `Unsupported schema major version: ${majorVersion(schemaVersion)}`,
      eventId,
    };
  }

  if (!(JS_SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(schemaVersion)) {
    return {
      ok: false,
      code: 'unsupported_schema',
      message: `Schema version ${schemaVersion} not supported by JavaScript`,
      eventId,
    };
  }

  if (!(ACKNOWLEDGMENT_STATES as readonly string[]).includes(raw.acknowledgmentState as string)) {
    return {
      ok: false,
      code: 'malformed_event',
      message: 'Invalid acknowledgmentState',
      eventId,
    };
  }

  if (!isPlainObject(raw.payload)) {
    return {
      ok: false,
      code: 'malformed_event',
      message: 'payload must be an object',
      eventId,
    };
  }

  if (!isPlainObject(raw.diagnosticMetadata)) {
    return {
      ok: false,
      code: 'malformed_event',
      message: 'diagnosticMetadata must be an object',
      eventId,
    };
  }

  const eventType = raw.eventType as string;
  if (!(PROTOTYPE_EVENT_TYPES as readonly string[]).includes(eventType)) {
    // Unknown event types tolerated when envelope is otherwise valid
  }

  const event: NativeEventEnvelope = {
    eventId,
    schemaVersion,
    eventType,
    sessionId: raw.sessionId as string,
    sequenceNumber: raw.sequenceNumber as number,
    sourcePlatform: raw.sourcePlatform as NativeEventEnvelope['sourcePlatform'],
    sourceComponent: raw.sourceComponent as string,
    wallClockTimestamp: raw.wallClockTimestamp as number,
    elapsedRealtimeMs: raw.elapsedRealtimeMs as number,
    persistenceTimestamp: raw.persistenceTimestamp as number,
    payload: { ...raw.payload },
    diagnosticMetadata: Object.fromEntries(
      Object.entries(raw.diagnosticMetadata).map(([k, v]) => [k, String(v)]),
    ),
    deliveryAttemptCount: raw.deliveryAttemptCount as number,
    acknowledgmentState: raw.acknowledgmentState as NativeEventEnvelope['acknowledgmentState'],
  };

  return { ok: true, event };
}

export function validateBatchSize(requested: number, maxBatchSize: number): ValidationResult | null {
  if (!Number.isInteger(requested) || requested < 1) {
    return {
      ok: false,
      code: 'invalid_batch_size',
      message: 'Batch size must be a positive integer',
    };
  }
  if (requested > maxBatchSize) {
    return {
      ok: false,
      code: 'invalid_batch_size',
      message: `Batch size ${requested} exceeds prototype maximum ${maxBatchSize}`,
    };
  }
  return null;
}

export function validationToBridgeError(result: Extract<ValidationResult, { ok: false }>) {
  return createBridgeError(result.code, result.message, {
    affectedEventIds: result.eventId ? [result.eventId] : [],
  });
}

export function detectSequenceGap(events: NativeEventEnvelope[]): boolean {
  if (events.length < 2) return false;
  const bySession = new Map<string, NativeEventEnvelope[]>();
  for (const e of events) {
    const list = bySession.get(e.sessionId) ?? [];
    list.push(e);
    bySession.set(e.sessionId, list);
  }
  for (const list of bySession.values()) {
    const sorted = [...list].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].sequenceNumber - sorted[i - 1].sequenceNumber > 1) {
        return true;
      }
    }
  }
  return false;
}
