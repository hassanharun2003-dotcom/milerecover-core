package com.milerecover.prototype.androidtracking.buffer

import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.model.ProcessingState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class InMemoryEventBufferTest {
  private lateinit var buffer: InMemoryEventBuffer

  @Before
  fun setup() {
    buffer = InMemoryEventBuffer()
  }

  private fun event(
    seq: Long,
    session: String = "s1",
    idempotencyKey: String? = null,
  ) = NativeEvent(
    eventId = "e-$seq",
    schemaVersion = PrototypeConfig.SCHEMA_VERSION,
    eventType = "test",
    wallClockMs = 1000L + seq,
    elapsedRealtimeMs = 2000L + seq,
    sequenceNumber = seq,
    sessionId = session,
    sourceComponent = "TEST",
    sanitizedMetadata = emptyMap(),
    idempotencyKey = idempotencyKey,
  )

  @Test
  fun insert_incrementsCount() {
    assertEquals(InsertResult.INSERTED, buffer.insert(event(1)))
    assertEquals(1, buffer.countAll())
    assertEquals(1, buffer.countPending())
  }

  @Test
  fun duplicateIdempotencyKey_rejected() {
    buffer.insert(event(1, idempotencyKey = "dup-key"))
    val result = buffer.insert(event(2, idempotencyKey = "dup-key"))
    assertEquals(InsertResult.DUPLICATE_REJECTED, result)
    assertEquals(1, buffer.countAll())
    assertTrue(buffer.countDuplicatesRejected() >= 1)
  }

  @Test
  fun duplicateSessionSequence_rejected() {
    buffer.insert(event(5))
    assertEquals(InsertResult.DUPLICATE_REJECTED, buffer.insert(event(5)))
  }

  @Test
  fun orderedRetrieval_bySequence() {
    buffer.insert(event(3))
    buffer.insert(event(1))
    buffer.insert(event(2))
    val ordered = buffer.fetchOrderedAll()
    assertEquals(listOf(1L, 2L, 3L), ordered.map { it.sequenceNumber })
  }

  @Test
  fun acknowledge_marksProcessed() {
    buffer.insert(event(1))
    val id = buffer.fetchOrderedPending().first().eventId
    assertTrue(buffer.acknowledge(id))
    assertEquals(0, buffer.countPending())
  }

  @Test
  fun clearAll_removesEvents() {
    buffer.insert(event(1))
    buffer.clearAll()
    assertEquals(0, buffer.countAll())
  }
}
