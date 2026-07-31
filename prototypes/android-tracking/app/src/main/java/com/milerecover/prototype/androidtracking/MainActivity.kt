package com.milerecover.prototype.androidtracking

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.milerecover.prototype.androidtracking.activity.PlatformActivityRecognitionStub
import com.milerecover.prototype.androidtracking.battery.BatteryOptimizationHelper
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.model.TrackingState
import com.milerecover.prototype.androidtracking.permission.PermissionHelper
import com.milerecover.prototype.androidtracking.service.TrackingForegroundService
import com.milerecover.prototype.androidtracking.util.IdempotencyKeys

/**
 * Minimal prototype operator UI — not MileRecover product interface.
 */
class MainActivity : AppCompatActivity() {

  private lateinit var statusView: TextView
  private lateinit var sessionManager: com.milerecover.prototype.androidtracking.session.SessionManager
  private lateinit var buffer: com.milerecover.prototype.androidtracking.buffer.EventBuffer
  private lateinit var exporter: com.milerecover.prototype.androidtracking.diagnostics.DiagnosticExporter

  private var lastPermissionSummary: String? = null

  private val permissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestMultiplePermissions(),
  ) { results ->
    recordPermissionTransition(results)
    refreshStatus()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    buffer = PrototypeApp.buffer(this)
    sessionManager = PrototypeApp.sessionManager(this)
    exporter = PrototypeApp.diagnosticExporter(this)

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      val pad = (16 * resources.displayMetrics.density).toInt()
      setPadding(pad, pad, pad, pad)
    }

    statusView = TextView(this)
    root.addView(statusView)

    fun addButton(label: String, action: () -> Unit) {
      root.addView(Button(this).apply {
        text = label
        setOnClickListener { action() }
      })
    }

    addButton("Explain & request foreground permissions") { requestForegroundPermissions() }
    addButton("Request background location (optional)") { requestBackgroundPermission() }
    addButton("Request activity recognition (optional)") { requestActivityPermission() }
    addButton("Start validation session") { startSession() }
    addButton("Stop validation session") { stopSession() }
    addButton("Acknowledge all pending events") { acknowledgePending() }
    addButton("Export sanitized diagnostics") { exportSanitized() }
    addButton("Export sensitive research data (confirmed)") { exportSensitiveConfirmed() }
    addButton("Clear all prototype data") { clearDataConfirmed() }
    addButton("Open app settings") { openAppSettings() }
    addButton("Open battery optimization settings") {
      BatteryOptimizationHelper.openBatterySettings(this)
    }
    addButton("Request ignore battery optimizations") {
      BatteryOptimizationHelper.requestIgnoreOptimizations(this)
    }

    setContentView(ScrollView(this).apply { addView(root) })
    refreshStatus()
  }

  override fun onResume() {
    super.onResume()
    refreshStatus()
  }

  private fun refreshStatus() {
    val permissions = PermissionHelper.snapshot(this)
    val battery = BatteryOptimizationHelper.snapshot(this)
    val activity = PlatformActivityRecognitionStub(this).probe()
    val events = buffer.fetchOrderedAll(limit = 1).lastOrNull()
    val text = buildString {
      appendLine(getString(R.string.prototype_warning))
      appendLine()
      appendLine("Permission: ${permissions.summary}")
      appendLine("FGS session requested: ${sessionManager.isSessionRequested()}")
      appendLine("Tracking state: ${sessionManager.trackingState().name}")
      appendLine("Battery: ${battery.summary}")
      appendLine("Activity signal: ${activity.signalType}")
      appendLine("Buffered events (total): ${buffer.countAll()}")
      appendLine("Pending events: ${buffer.countPending()}")
      appendLine("Duplicates rejected: ${buffer.countDuplicatesRejected()}")
      appendLine("Last event: ${events?.eventType ?: "none"} @ seq ${events?.sequenceNumber ?: "-"}")
      appendLine("Last event time: ${events?.wallClockMs ?: "-"}")
    }
    statusView.text = text
  }

  private fun requestForegroundPermissions() {
    AlertDialog.Builder(this)
      .setTitle("Foreground location permission")
      .setMessage(
        "Prototype B needs location while a validation session runs. " +
          "Background location is requested separately for background tests. " +
          "Deny if you do not want to run validation.",
      )
      .setPositiveButton("Continue") { _, _ ->
        permissionLauncher.launch(PermissionHelper.requiredForForegroundService())
      }
      .setNegativeButton("Cancel", null)
      .show()
  }

  private fun requestBackgroundPermission() {
    val bg = PermissionHelper.backgroundPermission() ?: return
    AlertDialog.Builder(this)
      .setTitle("Background location")
      .setMessage(
        "Optional for Prototype B background validation. Not required for foreground-only tests.",
      )
      .setPositiveButton("Request") { _, _ ->
        permissionLauncher.launch(arrayOf(bg))
      }
      .setNegativeButton("Cancel", null)
      .show()
  }

  private fun requestActivityPermission() {
    val ar = PermissionHelper.activityPermission() ?: return
    permissionLauncher.launch(arrayOf(ar))
  }

  private fun recordPermissionTransition(results: Map<String, Boolean>) {
    val snap = PermissionHelper.snapshot(this)
    val from = lastPermissionSummary ?: "unknown"
    val to = snap.summary
    lastPermissionSummary = to
    sessionManager.appendEvent(
      EventTypes.PERMISSION_CHANGED,
      SourceComponent.UI,
      mapOf("from" to from, "to" to to, "results" to results.toString()),
      sessionId = sessionManager.currentSessionId() ?: "no_session",
      idempotencyKey = IdempotencyKeys.permissionTransition(from, to),
    )
  }

  private fun startSession() {
    val permissions = PermissionHelper.snapshot(this)
    if (!permissions.canTrackInForeground()) {
      Toast.makeText(this, "Location permission required before starting.", Toast.LENGTH_LONG).show()
      return
    }
    if (sessionManager.isSessionRequested()) {
      Toast.makeText(this, "Session already active.", Toast.LENGTH_SHORT).show()
      return
    }
    val sessionId = sessionManager.startValidationSession()
    startForegroundService(TrackingForegroundService.startIntent(this, sessionId))
    refreshStatus()
  }

  private fun stopSession() {
    if (!sessionManager.isSessionRequested()) {
      Toast.makeText(this, "No active session.", Toast.LENGTH_SHORT).show()
      return
    }
    startService(TrackingForegroundService.stopIntent(this))
    sessionManager.stopValidationSession()
    refreshStatus()
  }

  private fun acknowledgePending() {
    buffer.fetchOrderedPending().forEach { buffer.acknowledge(it.eventId) }
    Toast.makeText(this, "Pending events acknowledged.", Toast.LENGTH_SHORT).show()
    refreshStatus()
  }

  private fun exportSanitized() {
    val file = exporter.exportSanitized()
    Toast.makeText(this, "Sanitized export: ${file.name}", Toast.LENGTH_LONG).show()
    refreshStatus()
  }

  private fun exportSensitiveConfirmed() {
    AlertDialog.Builder(this)
      .setTitle("Sensitive research export")
      .setMessage(
        "This export may contain exact prototype coordinates for on-device validation only. " +
          "Do not commit, upload, or share. Continue?",
      )
      .setPositiveButton("Export locally") { _, _ ->
        val file = exporter.exportSensitiveResearchConfirmed()
        Toast.makeText(this, "Sensitive export: ${file.name}", Toast.LENGTH_LONG).show()
      }
      .setNegativeButton("Cancel", null)
      .show()
  }

  private fun clearDataConfirmed() {
    AlertDialog.Builder(this)
      .setTitle("Delete all prototype data")
      .setMessage("Removes buffered events, session state, and local exports from this app.")
      .setPositiveButton("Delete") { _, _ ->
        startService(TrackingForegroundService.stopIntent(this))
        exporter.deleteAllPrototypeData()
        PrototypeApp.resetForTests()
        buffer = PrototypeApp.buffer(this)
        sessionManager = PrototypeApp.sessionManager(this)
        exporter = PrototypeApp.diagnosticExporter(this)
        Toast.makeText(this, "Prototype data cleared.", Toast.LENGTH_SHORT).show()
        refreshStatus()
      }
      .setNegativeButton("Cancel", null)
      .show()
  }

  private fun openAppSettings() {
    startActivity(
      Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", packageName, null)
      },
    )
  }
}
