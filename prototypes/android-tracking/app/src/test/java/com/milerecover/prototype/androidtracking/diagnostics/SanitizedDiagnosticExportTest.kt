package com.milerecover.prototype.androidtracking.diagnostics

import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.NativeEvent
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import com.milerecover.prototype.androidtracking.buffer.InMemoryEventBuffer
import com.milerecover.prototype.androidtracking.session.SessionManager

@RunWith(RobolectricTestRunner::class)
class SanitizedDiagnosticExportTest {

  @Test
  fun sanitizedExport_excludesExactCoordinates() {
    val context = RuntimeEnvironment.getApplication()
    val buffer = InMemoryEventBuffer()
    val sessionManager = SessionManager(context, buffer)
    sessionManager.startValidationSession()

    buffer.insert(
      NativeEvent(
        schemaVersion = PrototypeConfig.SCHEMA_VERSION,
        eventType = EventTypes.LOCATION_SAMPLE_RECORDED,
        wallClockMs = 1L,
        elapsedRealtimeMs = 1L,
        sequenceNumber = 1L,
        sessionId = sessionManager.currentSessionId()!!,
        sourceComponent = "TEST",
        sanitizedMetadata = mapOf(
          "lat_bucket" to "bucket_3777",
          "accuracy_m" to "12.0",
        ),
        controlledEvidenceJson = """{"lat":37.7,"lng":-122.4}""",
      ),
    )

    val json = SanitizedDiagnosticBuilder.build(context, buffer, sessionManager)
    assertFalse(json.getBoolean("containsExactCoordinates"))
    val text = json.toString()
    assertFalse(text.contains("37.7"))
    assertFalse(text.contains("-122.4"))
  }
}
