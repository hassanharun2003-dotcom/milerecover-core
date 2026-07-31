package com.milerecover.prototype.androidtracking.diagnostics

import android.content.Context
import android.os.Build
import com.milerecover.prototype.androidtracking.activity.PlatformActivityRecognitionStub
import com.milerecover.prototype.androidtracking.battery.BatteryOptimizationHelper
import com.milerecover.prototype.androidtracking.buffer.EventBuffer
import com.milerecover.prototype.androidtracking.config.PrototypeConfig
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.NativeEvent
import com.milerecover.prototype.androidtracking.permission.PermissionHelper
import com.milerecover.prototype.androidtracking.session.SessionManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

object SanitizedDiagnosticBuilder {
  fun build(context: Context, buffer: EventBuffer, sessionManager: SessionManager): JSONObject {
    val permissions = PermissionHelper.snapshot(context)
    val battery = BatteryOptimizationHelper.snapshot(context)
    val activity = PlatformActivityRecognitionStub(context).probe()
    val events = buffer.fetchOrderedAll(limit = 500)

    val accuracyBuckets = mutableMapOf<String, Int>()
    var locationSamples = 0
    var sequenceGaps = 0
    var lastSeq: Long? = null
    val eventTypeCounts = mutableMapOf<String, Int>()

    for (event in events) {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] ?: 0) + 1
      if (event.eventType == EventTypes.LOCATION_SAMPLE_RECORDED) {
        locationSamples++
        val acc = event.sanitizedMetadata["accuracy_m"] ?: "unknown"
        accuracyBuckets[acc] = (accuracyBuckets[acc] ?: 0) + 1
      }
      if (lastSeq != null && event.sequenceNumber > lastSeq!! + 1) {
        sequenceGaps++
      }
      lastSeq = event.sequenceNumber
      assertNoCoordinatesInMetadata(event)
    }

    return JSONObject().apply {
      put("prototypeVersion", PrototypeConfig.PROTOTYPE_VERSION)
      put("schemaVersion", PrototypeConfig.SCHEMA_VERSION)
      put("androidSdk", Build.VERSION.SDK_INT)
      put("androidRelease", Build.VERSION.RELEASE)
      put("manufacturer", Build.MANUFACTURER)
      put("model", Build.MODEL)
      put("permissionSummary", permissions.summary)
      put("permissionFine", permissions.fineLocation)
      put("permissionBackground", permissions.backgroundLocation)
      put("batterySummary", battery.summary)
      put("batteryPowerSave", battery.powerSaveMode)
      put("trackingState", sessionManager.trackingState().name)
      put("sessionRequested", sessionManager.isSessionRequested())
      put("bufferPendingCount", buffer.countPending())
      put("bufferTotalCount", buffer.countAll())
      put("duplicateRejectedCount", buffer.countDuplicatesRejected())
      put("locationSampleCount", locationSamples)
      put("sequenceGapCount", sequenceGaps)
      put("eventTypeCounts", JSONObject(eventTypeCounts as Map<*, *>))
      put("accuracyDistribution", JSONObject(accuracyBuckets as Map<*, *>))
      put("activitySignal", JSONObject().apply {
        put("available", activity.available)
        put("signalType", activity.signalType)
        put("detail", activity.detail)
      })
      put("exportedAtMs", System.currentTimeMillis())
      put("containsExactCoordinates", false)
    }
  }

  private fun assertNoCoordinatesInMetadata(event: NativeEvent) {
    val forbidden = listOf("lat", "lng", "latitude", "longitude", "route")
    for (key in event.sanitizedMetadata.keys) {
      require(forbidden.none { key.contains(it, ignoreCase = true) }) {
        "Sanitized metadata must not contain coordinate keys: $key"
      }
    }
  }
}

class DiagnosticExporter(
  private val context: Context,
  private val buffer: EventBuffer,
  private val sessionManager: SessionManager,
) {
  fun exportSanitized(): File {
    val json = SanitizedDiagnosticBuilder.build(context, buffer, sessionManager)
    val dir = File(context.filesDir, "diagnostics")
    dir.mkdirs()
    val file = File(dir, "sanitized_diagnostics_${System.currentTimeMillis()}.json")
    file.writeText(json.toString(2))
    return file
  }

  /**
   * Sensitive research export — disabled by default path, local only, never for Git.
   */
  fun exportSensitiveResearchConfirmed(): File {
    val events = buffer.fetchOrderedAll()
    val array = JSONArray()
    for (event in events) {
      array.put(event.toJson())
    }
    val dir = File(context.filesDir, "research-export")
    dir.mkdirs()
    val file = File(dir, "sensitive_research_${System.currentTimeMillis()}.json")
    file.writeText(
      JSONObject().apply {
        put("warning", "Contains controlled prototype evidence. Do not commit or upload.")
        put("events", array)
      }.toString(2),
    )
    return file
  }

  fun deleteAllPrototypeData() {
    buffer.clearAll()
    context.deleteDatabase("prototype_b_events.db")
    context.getSharedPreferences(PrototypeConfig.PREFS_NAME, Context.MODE_PRIVATE).edit().clear().apply()
    File(context.filesDir, "diagnostics").deleteRecursively()
    File(context.filesDir, "research-export").deleteRecursively()
  }
}
