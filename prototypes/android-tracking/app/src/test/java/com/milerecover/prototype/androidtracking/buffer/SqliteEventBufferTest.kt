package com.milerecover.prototype.androidtracking.buffer

import android.content.Context
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.model.ProcessingState
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import androidx.test.core.app.ApplicationProvider

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class SqliteEventBufferTest {
  private lateinit var context: Context
  private lateinit var buffer: SqliteEventBuffer

  @Before
  fun setup() {
    context = ApplicationProvider.getApplicationContext()
    buffer = SqliteEventBuffer(context)
    buffer.clearAll()
  }

  @After
  fun teardown() {
    buffer.close()
  }

  private fun event(
    seq: Long,
    session: String = "s1",
    idempotencyKey: String? = null,
    schemaVersion: Int = PrototypeConfig.SCHEMA_VERSION,
  ) = NativeEvent(
    eventId = "e-$seq",
    schemaVersion = schemaVersion,
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
  fun insert_preservesSequenceOrderingOnFetch() {
    buffer.insert(event(3))
    buffer.insert(event(1))
    buffer.insert(event(2))

    val ordered = buffer.fetchOrderedAll()
    assertEquals(listOf(1L, 2L, 3L), ordered.map { it.sequenceNumber })
  }

  @Test
  fun fetchOrderedPending_respectsLimit() {
    buffer.insert(event(1))
    buffer.insert(event(2))
    buffer.insert(event(3))

    val batch = buffer.fetchOrderedPending(limit = 2)
    assertEquals(2, batch.size)
    assertEquals(listOf(1L, 2L), batch.map { it.sequenceNumber })
    assertEquals(3, buffer.countPending())
  }

  @Test
  fun acknowledge_partialBatch_leavesRemainingPending() {
    buffer.insert(event(1))
    buffer.insert(event(2))
    buffer.insert(event(3))

    val first = buffer.fetchOrderedPending(limit = 1).first()
    assertTrue(buffer.acknowledge(first.eventId))

    assertEquals(2, buffer.countPending())
    val remaining = buffer.fetchOrderedPending()
    assertEquals(listOf(2L, 3L), remaining.map { it.sequenceNumber })
  }

  @Test
  fun failedProcessing_doesNotAcknowledge() {
    buffer.insert(event(1))
    val pending = buffer.fetchOrderedPending().first()

    assertTrue(buffer.markFailed(pending.eventId))
    assertFalse(buffer.acknowledge(pending.eventId))
    assertEquals(0, buffer.countPending())
    assertEquals(1, buffer.countAll())

    val stored = buffer.fetchOrderedAll().first()
    assertEquals(ProcessingState.FAILED, stored.processingState)
  }

  @Test
  fun duplicateIdempotencyKey_rejected() {
    assertEquals(InsertResult.INSERTED, buffer.insert(event(1, idempotencyKey = "dup-key")))
    assertEquals(InsertResult.DUPLICATE_REJECTED, buffer.insert(event(2, idempotencyKey = "dup-key")))
    assertEquals(1, buffer.countAll())
    assertTrue(buffer.countDuplicatesRejected() >= 1)
  }

  @Test
  fun duplicateSessionSequence_rejected() {
    assertEquals(InsertResult.INSERTED, buffer.insert(event(5)))
    assertEquals(InsertResult.DUPLICATE_REJECTED, buffer.insert(event(5)))
  }

  @Test
  fun unsupportedSchema_rejectedByIngestGate() {
    val result = buffer.insert(event(1, schemaVersion = PrototypeConfig.SCHEMA_VERSION + 99))
    assertEquals(InsertResult.SCHEMA_REJECTED, result)
    assertEquals(0, buffer.countAll())
  }

  @Test
  fun persistence_survivesBufferRecreation() {
    buffer.insert(event(1))
    buffer.insert(event(2))
    buffer.close()

    val reopened = SqliteEventBuffer(context)
    assertEquals(2, reopened.countAll())
    assertEquals(listOf(1L, 2L), reopened.fetchOrderedAll().map { it.sequenceNumber })
    reopened.close()
  }
}
