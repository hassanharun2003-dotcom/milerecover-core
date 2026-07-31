import type { NativeEventEnvelope } from '../../contract/types';

export type InsertResult = 'inserted' | 'duplicate_rejected';

/**
 * Prototype-only in-memory buffer mirroring native Kotlin/Swift semantics.
 * Not production storage — validates delivery/ack model in Jest.
 */
export class PrototypeEventBuffer {
  private events = new Map<string, NativeEventEnvelope>();
  private idempotencyIndex = new Map<string, string>();
  private duplicateRejectedCount = 0;
  private rejectedCount = 0;
  private deliveredCount = 0;

  insert(event: NativeEventEnvelope, idempotencyKey?: string): InsertResult {
    if (idempotencyKey && this.idempotencyIndex.has(idempotencyKey)) {
      this.duplicateRejectedCount++;
      return 'duplicate_rejected';
    }
    const sessionDup = [...this.events.values()].some(
      (e) =>
        e.sessionId === event.sessionId &&
        e.sequenceNumber === event.sequenceNumber &&
        e.acknowledgmentState !== 'acknowledged',
    );
    if (sessionDup) {
      this.duplicateRejectedCount++;
      return 'duplicate_rejected';
    }

    const persisted: NativeEventEnvelope = {
      ...event,
      persistenceTimestamp: Date.now(),
      acknowledgmentState: 'pending',
      deliveryAttemptCount: event.deliveryAttemptCount ?? 0,
    };
    this.events.set(persisted.eventId, persisted);
    if (idempotencyKey) {
      this.idempotencyIndex.set(idempotencyKey, persisted.eventId);
    }
    return 'inserted';
  }

  fetchPendingBatch(limit: number): NativeEventEnvelope[] {
    const pending = [...this.events.values()]
      .filter((e) => e.acknowledgmentState === 'pending')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .slice(0, limit);

    for (const event of pending) {
      const updated: NativeEventEnvelope = {
        ...event,
        deliveryAttemptCount: event.deliveryAttemptCount + 1,
        acknowledgmentState: 'delivered',
      };
      this.events.set(event.eventId, updated);
      this.deliveredCount++;
    }
    return pending.map((e) => this.events.get(e.eventId)!);
  }

  acknowledgeOne(eventId: string): 'acknowledged' | 'already_acknowledged' | 'unknown' {
    const existing = this.events.get(eventId);
    if (!existing) return 'unknown';
    if (existing.acknowledgmentState === 'acknowledged') return 'already_acknowledged';
    this.events.set(eventId, { ...existing, acknowledgmentState: 'acknowledged' });
    return 'acknowledged';
  }

  acknowledgeBatch(eventIds: string[]): {
    acknowledged: string[];
    alreadyAcknowledged: string[];
    unknown: string[];
    failed: string[];
  } {
    const acknowledged: string[] = [];
    const alreadyAcknowledged: string[] = [];
    const unknown: string[] = [];
    for (const id of eventIds) {
      const result = this.acknowledgeOne(id);
      if (result === 'acknowledged') acknowledged.push(id);
      else if (result === 'already_acknowledged') alreadyAcknowledged.push(id);
      else unknown.push(id);
    }
    return { acknowledged, alreadyAcknowledged, unknown, failed: [] };
  }

  countPending(): number {
    return [...this.events.values()].filter((e) => e.acknowledgmentState === 'pending').length;
  }

  countDelivered(): number {
    return [...this.events.values()].filter((e) => e.acknowledgmentState === 'delivered').length;
  }

  countAcknowledged(): number {
    return [...this.events.values()].filter((e) => e.acknowledgmentState === 'acknowledged').length;
  }

  countDuplicateRejected(): number {
    return this.duplicateRejectedCount;
  }

  countRejected(): number {
    return this.rejectedCount;
  }

  incrementRejected(): void {
    this.rejectedCount++;
  }

  replayUnacknowledged(): NativeEventEnvelope[] {
    return [...this.events.values()]
      .filter((e) => e.acknowledgmentState !== 'acknowledged')
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  clearAll(): void {
    this.events.clear();
    this.idempotencyIndex.clear();
    this.duplicateRejectedCount = 0;
    this.rejectedCount = 0;
    this.deliveredCount = 0;
  }

  getAll(): NativeEventEnvelope[] {
    return [...this.events.values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  lastSequence(): number | null {
    const nums = [...this.events.values()].map((e) => e.sequenceNumber);
    return nums.length ? Math.max(...nums) : null;
  }
}
