package com.milerecover.prototype.androidtracking.buffer

import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.NativeEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class EventIngestGateTest {

  private fun event(schemaVersion: Int) = NativeEvent(
    schemaVersion = schemaVersion,
    eventType = "test_event",
    wallClockMs = 1L,
    elapsedRealtimeMs = 1L,
    sequenceNumber = 1L,
    sessionId = "session-a",
    sourceComponent = "TEST",
    sanitizedMetadata = emptyMap(),
  )

  @Test
  fun validateForInsert_matchingSchema_returnsNull() {
    assertNull(EventIngestGate.validateForInsert(event(PrototypeConfig.SCHEMA_VERSION)))
  }

  @Test
  fun validateForInsert_unsupportedSchema_returnsRejected() {
    assertEquals(
      InsertResult.SCHEMA_REJECTED,
      EventIngestGate.validateForInsert(event(PrototypeConfig.SCHEMA_VERSION + 99)),
    )
  }
}
