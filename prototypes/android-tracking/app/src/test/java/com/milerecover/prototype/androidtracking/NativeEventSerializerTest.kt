package com.milerecover.prototype.androidtracking

import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.model.ProcessingState
import com.milerecover.prototype.androidtracking.util.NativeEventSerializer
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class NativeEventSerializerTest {
  @Test
  fun roundTrip_preservesFields() {
    val event = NativeEvent(
      eventId = "id-1",
      schemaVersion = 1,
      eventType = "service_active",
      wallClockMs = 1000L,
      elapsedRealtimeMs = 2000L,
      sequenceNumber = 3L,
      sessionId = "session-a",
      sourceComponent = "FOREGROUND_SERVICE",
      sanitizedMetadata = mapOf("reason" to "test"),
      persistenceWallClockMs = 1001L,
      processingState = ProcessingState.PENDING,
      idempotencyKey = "key-1",
    )
    val parsed = NativeEventSerializer.deserialize(NativeEventSerializer.serialize(event))
    assertEquals(event.eventId, parsed.eventId)
    assertEquals(event.eventType, parsed.eventType)
    assertEquals(event.sequenceNumber, parsed.sequenceNumber)
    assertEquals("test", parsed.sanitizedMetadata["reason"])
  }
}
