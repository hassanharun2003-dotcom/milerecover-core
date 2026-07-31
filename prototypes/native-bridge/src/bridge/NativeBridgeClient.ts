import {
  BRIDGE_API_VERSION,
  CONTRACT_MAJOR_VERSION,
  JS_SUPPORTED_SCHEMA_VERSIONS,
  MAX_BATCH_SIZE,
} from '../../contract/constants';
import type {
  AcknowledgeResult,
  BridgeBufferStats,
  BridgeErrorEnvelope,
  FetchPendingResult,
  NativeEventEnvelope,
  SanitizedDiagnostics,
} from '../../contract/types';
import { buildSanitizedDiagnostics } from '../../contract/sanitize';
import { validateBatchSize } from '../../contract/validate';

/** Native module interface — implemented by Android/iOS or mock in tests. */
export interface NativeBridgeModule {
  getBridgeApiVersion(): Promise<string>;
  getContractVersion(): Promise<string>;
  getSupportedSchemaVersions(): Promise<number[]>;
  generateSyntheticEvents(count: number, sessionId: string): Promise<{ inserted: number; duplicateRejected: number }>;
  fetchPendingEvents(batchSize: number): Promise<FetchPendingResult>;
  acknowledgeEvents(eventIds: string[]): Promise<AcknowledgeResult>;
  getBufferStats(): Promise<BridgeBufferStats>;
  exportSanitizedDiagnostics(): Promise<SanitizedDiagnostics>;
  clearPrototypeData(): Promise<void>;
  simulateUnsupportedSchemaEvent(): Promise<{ rejected: boolean }>;
  simulateDuplicateInsertion(): Promise<{ duplicateRejected: boolean }>;
}

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class NativeBridgeClient {
  private listenerCount = 0;
  private jsHandledEventIds = new Set<string>();
  connectionState: BridgeConnectionState = 'disconnected';
  lastError: BridgeErrorEnvelope | null = null;

  constructor(private readonly nativeModule: NativeBridgeModule | null) {}

  async connect(): Promise<void> {
    this.connectionState = 'connecting';
    if (!this.nativeModule) {
      this.connectionState = 'error';
      this.lastError = {
        code: 'bridge_unavailable',
        message: 'Native bridge module not linked',
        retryable: true,
        affectedEventIds: [],
        nativeComponent: 'js-client',
        contractVersion: String(CONTRACT_MAJOR_VERSION),
      };
      return;
    }
    try {
      const version = await this.nativeModule.getBridgeApiVersion();
      if (version !== BRIDGE_API_VERSION) {
        // Prototype tolerates version mismatch with warning — not auto-fail
      }
      this.connectionState = 'connected';
      this.lastError = null;
    } catch {
      this.connectionState = 'error';
    }
  }

  registerPushListener(_onHint: () => void): () => void {
    this.listenerCount++;
    return () => {
      this.listenerCount = Math.max(0, this.listenerCount - 1);
    };
  }

  get listenerRegistrationCount(): number {
    return this.listenerCount;
  }

  /** Register an event ID after successful JS handling — required before native ack. */
  markJsHandled(eventId: string): void {
    this.jsHandledEventIds.add(eventId);
  }

  clearJsHandledRegistry(): void {
    this.jsHandledEventIds.clear();
  }

  async pullPending(batchSize = MAX_BATCH_SIZE): Promise<FetchPendingResult | BridgeErrorEnvelope> {
    if (!this.nativeModule) {
      return {
        code: 'bridge_unavailable',
        message: 'Native module unavailable',
        retryable: true,
        affectedEventIds: [],
        nativeComponent: 'js-client',
        contractVersion: String(CONTRACT_MAJOR_VERSION),
      };
    }
    const batchErr = validateBatchSize(batchSize, MAX_BATCH_SIZE);
    if (batchErr && !batchErr.ok) {
      return {
        code: batchErr.code,
        message: batchErr.message,
        retryable: false,
        affectedEventIds: batchErr.eventId ? [batchErr.eventId] : [],
        nativeComponent: 'js-client',
        contractVersion: String(CONTRACT_MAJOR_VERSION),
      };
    }
    return this.nativeModule.fetchPendingEvents(batchSize);
  }

  async acknowledgeHandled(eventIds: string[]): Promise<AcknowledgeResult | BridgeErrorEnvelope> {
    if (!this.nativeModule) {
      return {
        code: 'bridge_unavailable',
        message: 'Native module unavailable',
        retryable: true,
        affectedEventIds: eventIds,
        nativeComponent: 'js-client',
        contractVersion: String(CONTRACT_MAJOR_VERSION),
      };
    }
    const eligible: string[] = [];
    const notJsHandled: string[] = [];
    for (const id of eventIds) {
      if (this.jsHandledEventIds.has(id)) eligible.push(id);
      else notJsHandled.push(id);
    }
    if (eligible.length === 0) {
      return {
        acknowledged: [],
        alreadyAcknowledged: [],
        unknown: notJsHandled,
        failed: [],
      };
    }
    const nativeResult = await this.nativeModule.acknowledgeEvents(eligible);
    if ('code' in nativeResult) {
      return nativeResult;
    }
    return {
      ...nativeResult,
      unknown: [...nativeResult.unknown, ...notJsHandled],
    };
  }

  get jsSupportedVersions(): readonly number[] {
    return JS_SUPPORTED_SCHEMA_VERSIONS;
  }

  get contractMajorVersion(): number {
    return CONTRACT_MAJOR_VERSION;
  }
}

export function createMockNativeModule(buffer: {
  fetchPendingBatch(limit: number): NativeEventEnvelope[];
  acknowledgeBatch(ids: string[]): AcknowledgeResult;
  countPending(): number;
  countAcknowledged(): number;
  countDuplicateRejected(): number;
  countRejected(): number;
  lastSequence(): number | null;
  getAll(): NativeEventEnvelope[];
  clearAll(): void;
  insert(event: NativeEventEnvelope): unknown;
}): NativeBridgeModule {
  return {
    getBridgeApiVersion: async () => BRIDGE_API_VERSION,
    getContractVersion: async () => String(CONTRACT_MAJOR_VERSION),
    getSupportedSchemaVersions: async () => [...JS_SUPPORTED_SCHEMA_VERSIONS],
    generateSyntheticEvents: async (count, sessionId) => {
      let inserted = 0;
      let duplicateRejected = 0;
      for (let i = 0; i < count; i++) {
        const result = buffer.insert({
          eventId: `mock-${sessionId}-${i + 1}`,
          schemaVersion: 1,
          eventType: 'location_evidence',
          sessionId,
          sequenceNumber: i + 1,
          sourcePlatform: 'unknown',
          sourceComponent: 'mock',
          wallClockTimestamp: Date.now(),
          elapsedRealtimeMs: i,
          persistenceTimestamp: Date.now(),
          payload: { synthetic: true },
          diagnosticMetadata: { synthetic: 'true' },
          deliveryAttemptCount: 0,
          acknowledgmentState: 'pending',
        } as NativeEventEnvelope);
        if (result === 'duplicate_rejected') duplicateRejected++;
        else inserted++;
      }
      return { inserted, duplicateRejected };
    },
    fetchPendingEvents: async (batchSize) => {
      const events = buffer.fetchPendingBatch(batchSize);
      const pendingLeft = buffer.countPending();
      return {
        events,
        hasMore: pendingLeft > 0,
        fetchedCount: events.length,
      };
    },
    acknowledgeEvents: async (eventIds) => buffer.acknowledgeBatch(eventIds),
    getBufferStats: async () => ({
      pendingCount: buffer.countPending(),
      deliveredCount: buffer.getAll().filter((e) => e.acknowledgmentState === 'delivered').length,
      acknowledgedCount: buffer.countAcknowledged(),
      duplicateRejectedCount: buffer.countDuplicateRejected(),
      rejectedCount: buffer.countRejected(),
      lastSequenceReceived: buffer.lastSequence(),
      contractVersion: String(CONTRACT_MAJOR_VERSION),
      bridgeApiVersion: BRIDGE_API_VERSION,
    }),
    exportSanitizedDiagnostics: async () =>
      buildSanitizedDiagnostics(
        {
          pendingCount: buffer.countPending(),
          deliveredCount: 0,
          acknowledgedCount: buffer.countAcknowledged(),
          duplicateRejectedCount: buffer.countDuplicateRejected(),
          rejectedCount: buffer.countRejected(),
          lastSequenceReceived: buffer.lastSequence(),
          contractVersion: String(CONTRACT_MAJOR_VERSION),
          bridgeApiVersion: BRIDGE_API_VERSION,
        },
        buffer.getAll().slice(-20),
        'mock',
      ),
    clearPrototypeData: async () => buffer.clearAll(),
    simulateUnsupportedSchemaEvent: async () => ({ rejected: true }),
    simulateDuplicateInsertion: async () => ({ duplicateRejected: true }),
  };
}
