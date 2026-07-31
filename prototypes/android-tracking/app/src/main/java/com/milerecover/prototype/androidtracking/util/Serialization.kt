package com.milerecover.prototype.androidtracking.util

import com.milerecover.prototype.androidtracking.model.NativeEvent
import org.json.JSONObject
import java.security.MessageDigest

object NativeEventSerializer {
  fun serialize(event: NativeEvent): String = event.toJson().toString()

  fun deserialize(raw: String): NativeEvent = NativeEvent.fromJson(JSONObject(raw))
}

object IdempotencyKeys {
  fun serviceStart(sessionId: String, startGeneration: Int): String =
    "svc_start:$sessionId:$startGeneration"

  fun serviceStop(sessionId: String): String = "svc_stop:$sessionId"

  fun bootEvaluation(bootCount: Long): String = "boot_eval:$bootCount"

  fun locationSample(sessionId: String, providerTimeMs: Long, sequence: Long): String =
    "loc:$sessionId:$providerTimeMs:$sequence"

  fun permissionTransition(from: String, to: String): String = "perm:$from->$to"
}

object CoordinateRedaction {
  /** Irreversible bucket for sanitized diagnostics (~1km grid) */
  fun bucketCoordinate(value: Double): String {
    val bucket = (value * 100).toLong() // ~0.01 degree
    return "bucket_$bucket"
  }

  fun hashCoordinate(value: Double): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(value.toString().toByteArray())
    return hash.take(8).joinToString("") { "%02x".format(it) }
  }
}

object PrototypeLog {
  /** Never log coordinates — diagnostic enums and counts only */
  fun d(tag: String, message: String) {
    android.util.Log.d(tag, message)
  }

  fun w(tag: String, message: String) {
    android.util.Log.w(tag, message)
  }
}
