package com.milerecover.prototype.androidtracking.activity

import android.content.Context
import com.milerecover.prototype.androidtracking.permission.PermissionHelper

/**
 * Replaceable activity signal provider.
 * Prototype uses platform capability probe — not proof of driving.
 */
interface ActivitySignalProvider {
  fun probe(): ActivitySignalSnapshot
}

data class ActivitySignalSnapshot(
  val available: Boolean,
  val permissionGranted: Boolean,
  val signalType: String,
  val confidenceBucket: String,
  val detail: String,
)

/**
 * Validation stub: records permission/capability without creating trips.
 * Full ActivityRecognitionClient (Play Services) may replace this in device tests.
 */
class PlatformActivityRecognitionStub(private val context: Context) : ActivitySignalProvider {
  override fun probe(): ActivitySignalSnapshot {
    val perm = PermissionHelper.snapshot(context)
    val granted = perm.activityRecognition
    return ActivitySignalSnapshot(
      available = granted,
      permissionGranted = granted,
      signalType = if (granted) "stub_permission_ready" else "unavailable_no_permission",
      confidenceBucket = "n/a",
      detail = "Activity recognition is a signal only — not a trip. Replace stub after device evaluation.",
    )
  }
}
