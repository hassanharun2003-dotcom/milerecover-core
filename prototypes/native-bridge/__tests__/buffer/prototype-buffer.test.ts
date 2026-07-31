import { PrototypeEventBuffer } from '../../src/buffer/PrototypeEventBuffer';
import { createSyntheticEvent } from '../helpers/synthetic';

describe('native buffer semantics', () => {
  let buffer: PrototypeEventBuffer;

  beforeEach(() => {
    buffer = new PrototypeEventBuffer();
  });

  it('inserts and fetches in order', () => {
    buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 2 }));
    buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 }));
    const batch = buffer.fetchPendingBatch(10);
    expect(batch.map((e) => e.sequenceNumber)).toEqual([1, 2]);
  });

  it('rejects duplicate session+sequence', () => {
    const e = createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 });
    expect(buffer.insert(e)).toBe('inserted');
    expect(buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 }))).toBe(
      'duplicate_rejected',
    );
  });

  it('replays unacknowledged after fetch', () => {
    buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 }));
    buffer.fetchPendingBatch(10);
    expect(buffer.replayUnacknowledged()).toHaveLength(1);
  });

  it('acknowledges one event', () => {
    const e = createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 });
    buffer.insert(e);
    buffer.fetchPendingBatch(10);
    expect(buffer.acknowledgeOne(e.eventId)).toBe('acknowledged');
    expect(buffer.countPending()).toBe(0);
  });

  it('acknowledges batch partially', () => {
    const e1 = createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 });
    const e2 = createSyntheticEvent({ sessionId: 's1', sequenceNumber: 2 });
    buffer.insert(e1);
    buffer.insert(e2);
    buffer.fetchPendingBatch(10);
    const result = buffer.acknowledgeBatch([e1.eventId, 'unknown-id']);
    expect(result.acknowledged).toEqual([e1.eventId]);
    expect(result.unknown).toEqual(['unknown-id']);
    expect(buffer.replayUnacknowledged()).toHaveLength(1);
  });

  it('handles repeated acknowledgment', () => {
    const e = createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 });
    buffer.insert(e);
    buffer.fetchPendingBatch(10);
    buffer.acknowledgeOne(e.eventId);
    expect(buffer.acknowledgeOne(e.eventId)).toBe('already_acknowledged');
  });

  it('does not delete on delivery', () => {
    buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 }));
    buffer.fetchPendingBatch(10);
    expect(buffer.getAll()).toHaveLength(1);
  });

  it('clears all data', () => {
    buffer.insert(createSyntheticEvent({ sessionId: 's1', sequenceNumber: 1 }));
    buffer.clearAll();
    expect(buffer.getAll()).toHaveLength(0);
  });
});
