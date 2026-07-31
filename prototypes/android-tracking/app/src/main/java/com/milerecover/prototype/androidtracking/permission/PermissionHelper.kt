package com.milerecover.prototype.androidtracking.permission

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

data class PermissionSnapshot(
  val fineLocation: Boolean,
  val coarseLocation: Boolean,
  val backgroundLocation: Boolean,
  val activityRecognition: Boolean,
  val notifications: Boolean,
  val summary: String,
) {
  fun canTrackInForeground(): Boolean = fineLocation || coarseLocation

  fun canTrackInBackground(): Boolean =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      backgroundLocation && canTrackInForeground()
    } else {
      canTrackInForeground()
    }
}

object PermissionHelper {
  fun snapshot(context: Context): PermissionSnapshot {
    val fine = granted(context, Manifest.permission.ACCESS_FINE_LOCATION)
    val coarse = granted(context, Manifest.permission.ACCESS_COARSE_LOCATION)
    val background = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      granted(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } else {
      true
    }
    val activity = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      granted(context, Manifest.permission.ACTIVITY_RECOGNITION)
    } else {
      true
    }
    val notifications = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      granted(context, Manifest.permission.POST_NOTIFICATIONS)
    } else {
      true
    }
    val summary = when {
      !fine && !coarse -> "denied"
      fine && background -> "always_or_background"
      fine || coarse -> "foreground_only"
      else -> "partial"
    }
    return PermissionSnapshot(fine, coarse, background, activity, notifications, summary)
  }

  fun requiredForForegroundService(): Array<String> {
    val list = mutableListOf(Manifest.permission.ACCESS_FINE_LOCATION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      list.add(Manifest.permission.POST_NOTIFICATIONS)
    }
    return list.toTypedArray()
  }

  fun backgroundPermission(): String? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Manifest.permission.ACCESS_BACKGROUND_LOCATION
    } else {
      null
    }

  fun activityPermission(): String? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Manifest.permission.ACTIVITY_RECOGNITION
    } else {
      null
    }

  private fun granted(context: Context, permission: String): Boolean =
    ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
}
