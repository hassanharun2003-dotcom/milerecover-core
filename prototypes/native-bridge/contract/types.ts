import type { AcknowledgmentState, PrototypeEventType } from './constants';

/** Versioned native event envelope — evidence only, not Trip records. */
export interface NativeEventEnvelope {
  eventId: string;
  schemaVersion: number;
  eventType: PrototypeEventType | string;
  sessionId: string;
  sequenceNumber: number;
  sourcePlatform: 'android' | 'ios' | 'unknown';
  sourceComponent: string;
  wallClockTimestamp: number;
  /** Monotonic / elapsed realtime in milliseconds where available. */
  elapsedRealtimeMs: number;
  persistenceTimestamp: number;
  payload: Record<string, unknown>;
  diagnosticMetadata: Record<string, string>;
  deliveryAttemptCount: number;
  acknowledgmentState: AcknowledgmentState;
}

export interface BridgeBufferStats {
  pendingCount: number;
  deliveredCount: number;
  acknowledgedCount: number;
  duplicateRejectedCount: number;
  rejectedCount: number;
  lastSequenceReceived: number | null;
  contractVersion: string;
  bridgeApiVersion: string;
}

export interface FetchPendingResult {
  events: NativeEventEnvelope[];
  hasMore: boolean;
  fetchedCount: number;
}

export interface AcknowledgeResult {
  acknowledged: string[];
  alreadyAcknowledged: string[];
  unknown: string[];
  failed: string[];
}

export interface BridgeErrorEnvelope {
  code: BridgeErrorCode;
  message: string;
  retryable: boolean;
  affectedEventIds: string[];
  nativeComponent: string;
  contractVersion: string;
}

export type BridgeErrorCode =
  | 'unsupported_schema'
  | 'malformed_event'
  | 'buffer_unavailable'
  | 'persistence_failure'
  | 'fetch_failure'
  | 'acknowledgment_failure'
  | 'unknown_event'
  | 'invalid_batch_size'
  | 'serialization_failure'
  | 'bridge_unavailable'
  | 'prototype_fault';

export interface ValidationSuccess {
  ok: true;
  event: NativeEventEnvelope;
}

export interface ValidationFailure {
  ok: false;
  code: BridgeErrorCode;
  message: string;
  eventId?: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export interface SanitizedDiagnostics {
  exportedAt: string;
  bridgeApiVersion: string;
  contractVersion: string;
  bufferStats: BridgeBufferStats;
  recentEventSummaries: Array<{
    eventId: string;
    eventType: string;
    sessionId: string;
    sequenceNumber: number;
    acknowledgmentState: AcknowledgmentState;
  }>;
  sequenceGapDetected: boolean;
  platform: string;
}

/** Push hint — wake-up only; durable pull remains authoritative. */
export interface EventsAvailableHint {
  hintId: string;
  pendingCountEstimate: number;
  emittedAt: number;
}
