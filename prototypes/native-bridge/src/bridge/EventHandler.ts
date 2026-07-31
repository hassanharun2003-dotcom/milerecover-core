import { parseNativeEvent } from '../../contract/validate';
import { createBridgeError } from '../../contract/errors';
import type { BridgeErrorEnvelope, NativeEventEnvelope } from '../../contract/types';
import { safeLogMessage } from '../../contract/sanitize';

export interface HandledEvent {
  event: NativeEventEnvelope;
  duplicateDetected: boolean;
}

export class IdempotentEventHandler {
  private processedKeys = new Set<string>();

  /** Idempotency key: sessionId + sequenceNumber */
  private key(event: NativeEventEnvelope): string {
    return `${event.sessionId}:${event.sequenceNumber}`;
  }

  handle(raw: unknown): { ok: true; result: HandledEvent } | { ok: false; error: BridgeErrorEnvelope } {
    const parsed = parseNativeEvent(raw);
    if (!parsed.ok) {
      return { ok: false, error: createBridgeError(parsed.code, parsed.message, {
        affectedEventIds: parsed.eventId ? [parsed.eventId] : [],
      }) };
    }

    const k = this.key(parsed.event);
    const duplicateDetected = this.processedKeys.has(k);
    if (!duplicateDetected) {
      this.processedKeys.add(k);
    }

    return {
      ok: true,
      result: { event: parsed.event, duplicateDetected },
    };
  }

  simulateRestart(): void {
    this.processedKeys.clear();
  }

  get processedCount(): number {
    return this.processedKeys.size;
  }
}

export function logHandling(message: string, event?: NativeEventEnvelope): string {
  return safeLogMessage(message, event
    ? {
        eventId: event.eventId,
        eventType: event.eventType,
        sequenceNumber: event.sequenceNumber,
      }
    : undefined);
}
