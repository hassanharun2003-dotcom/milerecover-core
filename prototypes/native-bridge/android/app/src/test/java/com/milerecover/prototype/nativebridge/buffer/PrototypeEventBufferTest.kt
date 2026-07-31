package com.milerecover.prototype.nativebridge.buffer

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.milerecover.prototype.nativebridge.synthetic.SyntheticEventGenerator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class PrototypeEventBufferTest {

  private lateinit var buffer: PrototypeEventBuffer

  @Before
  fun setup() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    buffer = PrototypeEventBuffer(context)
    buffer.clearAll()
  }

  @Test
  fun insertAndFetchOrdered() {
    buffer.insert(SyntheticEventGenerator.create("s1", 2))
    buffer.insert(SyntheticEventGenerator.create("s1", 1))
    val batch = buffer.fetchPendingBatch(10)
    assertEquals(listOf(1L, 2L), batch.map { it.sequenceNumber })
  }

  @Test
  fun duplicateRejected() {
    val e = SyntheticEventGenerator.create("s1", 1)
    assertEquals(InsertResult.INSERTED, buffer.insert(e))
    val dup = e.copy(eventId = java.util.UUID.randomUUID().toString())
    assertEquals(InsertResult.DUPLICATE_REJECTED, buffer.insert(dup))
  }

  @Test
  fun replayBeforeAck() {
    buffer.insert(SyntheticEventGenerator.create("s1", 1))
    buffer.fetchPendingBatch(10)
    assertEquals(1, buffer.countPending() + buffer.countAcknowledged())
  }

  @Test
  fun acknowledgeBatchPartial() {
    val e1 = SyntheticEventGenerator.create("s1", 1)
    val e2 = SyntheticEventGenerator.create("s1", 2)
    buffer.insert(e1)
    buffer.insert(e2)
    buffer.fetchPendingBatch(10)
    val result = buffer.acknowledge(listOf(e1.eventId, "unknown"))
    assertEquals(listOf(e1.eventId), result.acknowledged)
    assertEquals(listOf("unknown"), result.unknown)
  }

  @Test
  fun repeatedAcknowledgment() {
    val e = SyntheticEventGenerator.create("s1", 1)
    buffer.insert(e)
    buffer.fetchPendingBatch(10)
    buffer.acknowledge(listOf(e.eventId))
    val again = buffer.acknowledge(listOf(e.eventId))
    assertEquals(listOf(e.eventId), again.alreadyAcknowledged)
  }
}
