package com.milerecover.prototype.androidtracking.battery

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

data class BatteryOptimizationSnapshot(
  val ignoringOptimizations: Boolean,
  val powerSaveMode: Boolean,
  val manufacturer: String,
  val summary: String,
)

object BatteryOptimizationHelper {
  fun snapshot(context: Context): BatteryOptimizationSnapshot {
    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val ignoring = pm.isIgnoringBatteryOptimizations(context.packageName)
    val powerSave = pm.isPowerSaveMode
    val manufacturer = Build.MANUFACTURER
    val summary = when {
      powerSave -> "power_save_active"
      ignoring -> "unrestricted_or_whitelisted"
      else -> "optimized_or_restricted"
    }
    return BatteryOptimizationSnapshot(ignoring, powerSave, manufacturer, summary)
  }

  fun openBatterySettings(context: Context) {
    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  fun requestIgnoreOptimizations(context: Context) {
    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
      data = Uri.parse("package:${context.packageName}")
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }
}
