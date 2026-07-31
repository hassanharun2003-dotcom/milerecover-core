import { PrototypeEventBuffer } from '../../src/buffer/PrototypeEventBuffer';
import {
  NativeBridgeClient,
  createMockNativeModule,
} from '../../src/bridge/NativeBridgeClient';
import { IdempotentEventHandler } from '../../src/bridge/EventHandler';
import { createSyntheticEvent } from '../helpers/synthetic';
import { MAX_BATCH_SIZE } from '../../contract/constants';

describe('bridge behavior', () => {
  it('empty fetch returns no events', async () => {
    const buffer = new PrototypeEventBuffer();
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    await client.connect();
    const result = await client.pullPending(10);
    expect('events' in result && result.events).toEqual([]);
  });

  it('validates batch size', async () => {
    const buffer = new PrototypeEventBuffer();
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    const result = await client.pullPending(MAX_BATCH_SIZE + 1);
    expect('code' in result && result.code).toBe('invalid_batch_size');
  });

  it('pull then acknowledge flow', async () => {
    const buffer = new PrototypeEventBuffer();
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 }));
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    const handler = new IdempotentEventHandler();
    const pull = await client.pullPending(10);
    expect('events' in pull && pull.events.length).toBe(1);
    if ('events' in pull) {
      const handled = handler.handle(pull.events[0]);
      expect(handled.ok).toBe(true);
      if (handled.ok) {
        client.markJsHandled(handled.result.event.eventId);
        const ack = await client.acknowledgeHandled([handled.result.event.eventId]);
        expect('acknowledged' in ack && ack.acknowledged.length).toBe(1);
      }
    }
  });

  it('failed JS handling does not acknowledge', async () => {
    const buffer = new PrototypeEventBuffer();
    const e = createSyntheticEvent({ sessionId: 's', sequenceNumber: 1, schemaVersion: 99 });
    buffer.insert(e);
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    const pull = await client.pullPending(10);
    const handler = new IdempotentEventHandler();
    if ('events' in pull) {
      const handled = handler.handle(pull.events[0]);
      expect(handled.ok).toBe(false);
      const ack = await client.acknowledgeHandled([e.eventId]);
      expect('unknown' in ack && ack.unknown).toContain(e.eventId);
      expect('acknowledged' in ack && ack.acknowledged).toEqual([]);
    }
  });

  it('markJsHandled is required before native acknowledgment', async () => {
    const buffer = new PrototypeEventBuffer();
    const e = createSyntheticEvent({ sessionId: 's', sequenceNumber: 2 });
    buffer.insert(e);
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    const pull = await client.pullPending(10);
    expect('events' in pull && pull.events.length).toBe(1);
    const ackWithoutMark = await client.acknowledgeHandled([e.eventId]);
    expect('unknown' in ackWithoutMark && ackWithoutMark.unknown).toContain(e.eventId);
    client.markJsHandled(e.eventId);
    const ackWithMark = await client.acknowledgeHandled([e.eventId]);
    expect('acknowledged' in ackWithMark && ackWithMark.acknowledged).toContain(e.eventId);
  });

  it('JS restart simulation clears handler idempotency only', async () => {
    const buffer = new PrototypeEventBuffer();
    buffer.insert(createSyntheticEvent({ sessionId: 's', sequenceNumber: 1 }));
    const handler = new IdempotentEventHandler();
    const client = new NativeBridgeClient(createMockNativeModule(buffer));
    const pull = await client.pullPending(10);
    if ('events' in pull && pull.events[0]) {
      handler.handle(pull.events[0]);
      handler.simulateRestart();
      const again = handler.handle(pull.events[0]);
      expect(again.ok).toBe(true);
      if (again.ok) expect(again.result.duplicateDetected).toBe(false);
    }
    expect(buffer.replayUnacknowledged().length).toBeGreaterThan(0);
  });

  it('duplicate listener registration tracked', () => {
    const client = new NativeBridgeClient(null);
    const off1 = client.registerPushListener(() => undefined);
    client.registerPushListener(() => undefined);
    expect(client.listenerRegistrationCount).toBe(2);
    off1();
    expect(client.listenerRegistrationCount).toBe(1);
  });

  it('bridge unavailable when native module missing', async () => {
    const client = new NativeBridgeClient(null);
    await client.connect();
    expect(client.connectionState).toBe('error');
  });
});
