package com.milerecover.prototype.nativebridge

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.milerecover.prototype.nativebridge.buffer.PrototypeEventBuffer
import com.milerecover.prototype.nativebridge.diagnostics.DiagnosticSanitizer
import com.milerecover.prototype.nativebridge.model.NativeEventEnvelope
import com.milerecover.prototype.nativebridge.synthetic.SyntheticEventGenerator
import org.json.JSONObject

/**
 * Legacy Native Module (Prototype C choice) — push hint via DeviceEventManager, pull authoritative.
 * NOT production bridge — validates delivery/ack boundary only.
 */
class PrototypeBridgeModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  private val buffer: PrototypeEventBuffer by lazy {
    PrototypeEventBuffer(reactContext.applicationContext)
  }

  override fun getName(): String = MODULE_NAME

  @ReactMethod
  fun getBridgeApiVersion(promise: Promise) {
    promise.resolve(NativeEventEnvelope.BRIDGE_API_VERSION)
  }

  @ReactMethod
  fun getContractVersion(promise: Promise) {
    promise.resolve(NativeEventEnvelope.CONTRACT_MAJOR.toString())
  }

  @ReactMethod
  fun getSupportedSchemaVersions(promise: Promise) {
    val arr = Arguments.createArray()
    arr.pushInt(1)
    promise.resolve(arr)
  }

  @ReactMethod
  fun generateSyntheticEvents(count: Int, sessionId: String, promise: Promise) {
    try {
      var inserted = 0
      var duplicateRejected = 0
      val events = SyntheticEventGenerator.createBurst(count.coerceIn(1, 5000), sessionId)
      for (event in events) {
        when (buffer.insert(event)) {
          com.milerecover.prototype.nativebridge.buffer.InsertResult.INSERTED -> inserted++
          com.milerecover.prototype.nativebridge.buffer.InsertResult.DUPLICATE_REJECTED -> duplicateRejected++
        }
      }
      emitEventsAvailableHint(buffer.countPending())
      val result = Arguments.createMap()
      result.putInt("inserted", inserted)
      result.putInt("duplicateRejected", duplicateRejected)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("persistence_failure", "Failed to generate events", e)
    }
  }

  @ReactMethod
  fun fetchPendingEvents(batchSize: Int, promise: Promise) {
    try {
      if (batchSize < 1 || batchSize > NativeEventEnvelope.MAX_BATCH_SIZE) {
        promise.reject("invalid_batch_size", "Batch size must be 1..${NativeEventEnvelope.MAX_BATCH_SIZE}")
        return
      }
      val events = buffer.fetchPendingBatch(batchSize)
      val arr = Arguments.createArray()
      for (event in events) {
        arr.pushMap(envelopeToMap(event))
      }
      val result = Arguments.createMap()
      result.putArray("events", arr)
      result.putBoolean("hasMore", buffer.countPending() > 0)
      result.putInt("fetchedCount", events.size)
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("fetch_failure", "Fetch failed", e)
    }
  }

  @ReactMethod
  fun acknowledgeEvents(eventIds: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    try {
      val ids = mutableListOf<String>()
      for (i in 0 until eventIds.size()) {
        eventIds.getString(i)?.let { ids.add(it) }
      }
      val ack = buffer.acknowledge(ids)
      val result = Arguments.createMap()
      result.putArray("acknowledged", toWritableArray(ack.acknowledged))
      result.putArray("alreadyAcknowledged", toWritableArray(ack.alreadyAcknowledged))
      result.putArray("unknown", toWritableArray(ack.unknown))
      result.putArray("failed", Arguments.createArray())
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("acknowledgment_failure", "Ack failed", e)
    }
  }

  @ReactMethod
  fun getBufferStats(promise: Promise) {
    val map = Arguments.createMap()
    map.putInt("pendingCount", buffer.countPending())
    map.putInt("deliveredCount", 0)
    map.putInt("acknowledgedCount", buffer.countAcknowledged())
    map.putInt("duplicateRejectedCount", buffer.countDuplicateRejected())
    map.putInt("rejectedCount", buffer.countRejected())
    map.putInt("lastSequenceReceived", buffer.lastSequence()?.toInt() ?: 0)
    map.putString("contractVersion", NativeEventEnvelope.CONTRACT_MAJOR.toString())
    map.putString("bridgeApiVersion", NativeEventEnvelope.BRIDGE_API_VERSION)
    promise.resolve(map)
  }

  @ReactMethod
  fun exportSanitizedDiagnostics(promise: Promise) {
    try {
      val json = DiagnosticSanitizer.exportDiagnostics(buffer)
      promise.resolve(jsonToMap(JSONObject(json)))
    } catch (e: Exception) {
      promise.reject("serialization_failure", "Export failed", e)
    }
  }

  @ReactMethod
  fun clearPrototypeData(promise: Promise) {
    buffer.clearAll()
    promise.resolve(null)
  }

  @ReactMethod
  fun simulateUnsupportedSchemaEvent(promise: Promise) {
    val bad = SyntheticEventGenerator.create("bad-schema", 1, schemaVersion = 99)
    buffer.incrementRejected()
    val result = Arguments.createMap()
    result.putBoolean("rejected", bad.schemaVersion / 100 != NativeEventEnvelope.CONTRACT_MAJOR)
    promise.resolve(result)
  }

  @ReactMethod
  fun simulateDuplicateInsertion(promise: Promise) {
    val event = SyntheticEventGenerator.create("dup-session", 42)
    buffer.insert(event)
    val second = buffer.insert(event.copy(eventId = java.util.UUID.randomUUID().toString()))
    val result = Arguments.createMap()
    result.putBoolean(
      "duplicateRejected",
      second == com.milerecover.prototype.nativebridge.buffer.InsertResult.DUPLICATE_REJECTED,
    )
    emitEventsAvailableHint(buffer.countPending())
    promise.resolve(result)
  }

  private fun emitEventsAvailableHint(pendingEstimate: Int) {
    if (!reactContext.hasActiveReactInstance()) return
    val params = Arguments.createMap()
    params.putString("hintId", java.util.UUID.randomUUID().toString())
    params.putInt("pendingCountEstimate", pendingEstimate)
    params.putDouble("emittedAt", System.currentTimeMillis().toDouble())
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("PrototypeEventsAvailable", params)
  }

  private fun envelopeToMap(event: NativeEventEnvelope): WritableMap {
    val map = Arguments.createMap()
    event.toBridgeMap().forEach { (k, v) ->
      when (v) {
        is String -> map.putString(k, v)
        is Int -> map.putInt(k, v)
        is Long -> map.putDouble(k, v.toDouble())
        is Double -> map.putDouble(k, v)
        is Boolean -> map.putBoolean(k, v)
        is Map<*, *> -> map.putMap(k, mapFromAny(v))
        else -> map.putString(k, v?.toString())
      }
    }
    return map
  }

  private fun mapFromAny(v: Map<*, *>): WritableMap {
    val wm = Arguments.createMap()
    v.forEach { (k, value) ->
      val key = k.toString()
      when (value) {
        is String -> wm.putString(key, value)
        is Int -> wm.putInt(key, value)
        is Long -> wm.putDouble(key, value.toDouble())
        is Double -> wm.putDouble(key, value)
        is Boolean -> wm.putBoolean(key, value)
        else -> wm.putString(key, value?.toString())
      }
    }
    return wm
  }

  private fun jsonToMap(obj: JSONObject): WritableMap {
    val map = Arguments.createMap()
    obj.keys().forEach { key ->
      when (val v = obj.get(key)) {
        is String -> map.putString(key, v)
        is Int -> map.putInt(key, v)
        is Long -> map.putDouble(key, v.toDouble())
        is JSONObject -> map.putMap(key, jsonToMap(v))
        else -> map.putString(key, v.toString())
      }
    }
    return map
  }

  private fun toWritableArray(items: List<String>): WritableArray {
    val arr = Arguments.createArray()
    items.forEach { arr.pushString(it) }
    return arr
  }

  companion object {
    const val MODULE_NAME = "PrototypeBridgeModule"
  }
}
