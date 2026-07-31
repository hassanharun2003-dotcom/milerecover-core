package com.milerecover.prototype.androidtracking.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.milerecover.prototype.androidtracking.MainActivity
import com.milerecover.prototype.androidtracking.PrototypeApp
import com.milerecover.prototype.androidtracking.R
import com.milerecover.prototype.androidtracking.activity.PlatformActivityRecognitionStub
import com.milerecover.prototype.androidtracking.battery.BatteryOptimizationHelper
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.model.TrackingState
import com.milerecover.prototype.androidtracking.location.LocationCollector
import com.milerecover.prototype.androidtracking.permission.PermissionHelper
import com.milerecover.prototype.androidtracking.util.PrototypeLog

/**
 * Minimal foreground service for Prototype B validation.
 *
 * START_STICKY: If the system kills the service after a crash, Android may restart it
 * with a null intent. We re-evaluate session state and permissions rather than silently
 * creating a new logical session. This does NOT apply after user force-stop (documented
 * in VALIDATION_RUNBOOK.md).
 */
class TrackingForegroundService : Service() {

  private lateinit var sessionManager: com.milerecover.prototype.androidtracking.session.SessionManager
  private var locationCollector: LocationCollector? = null
  private var activeSessionId: String? = null
  private var startGeneration: Int = 0

  override fun onCreate() {
    super.onCreate()
    sessionManager = PrototypeApp.sessionManager(this)
    createNotificationChannel()
    PrototypeLog.d(TAG, "Service created")
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopSessionInternal("stop_command")
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_START, null -> {
        handleStart(intent?.getStringExtra(EXTRA_SESSION_ID))
      }
    }
    // START_STICKY documented: system may restart after crash; we validate session on redelivery
    return START_STICKY
  }

  private fun handleStart(explicitSessionId: String?) {
    val permissions = PermissionHelper.snapshot(this)
    if (!permissions.canTrackInForeground()) {
      sessionManager.appendEvent(
        EventTypes.PROTOTYPE_FAULT,
        SourceComponent.FOREGROUND_SERVICE,
        mapOf("category" to "permission_denied", "summary" to permissions.summary),
        sessionId = explicitSessionId ?: sessionManager.currentSessionId() ?: "orphan",
      )
      stopSelf()
      return
    }

    val sessionId = explicitSessionId ?: sessionManager.currentSessionId()
    if (sessionId == null) {
      PrototypeLog.w(TAG, "Start ignored — no active session")
      stopSelf()
      return
    }

    if (activeSessionId == sessionId && locationCollector != null) {
      PrototypeLog.d(TAG, "Duplicate start ignored session=$sessionId")
      return
    }

    activeSessionId = sessionId
    sessionManager.restoreSequenceFromBuffer(sessionId)
    startGeneration = sessionManager.markServiceStarting(sessionId)

    startForeground(NOTIFICATION_ID, buildNotification())
    sessionManager.markServiceActive(sessionId)

    recordBatteryState(sessionId)
    recordActivitySignal(sessionId)

    locationCollector = LocationCollector(this, sessionManager).also { it.start(sessionId) }

    if (intentIsRedelivery()) {
      sessionManager.markRecovering(sessionId, "service_redelivery")
    }
  }

  private fun intentIsRedelivery(): Boolean {
    // Heuristic: if service active but collector was recreated
    return locationCollector != null
  }

  private fun recordBatteryState(sessionId: String) {
    val snap = BatteryOptimizationHelper.snapshot(this)
    sessionManager.appendEvent(
      EventTypes.BATTERY_STATUS_CHANGED,
      SourceComponent.FOREGROUND_SERVICE,
      mapOf(
        "summary" to snap.summary,
        "power_save" to snap.powerSaveMode.toString(),
        "manufacturer" to snap.manufacturer,
      ),
      sessionId = sessionId,
    )
  }

  private fun recordActivitySignal(sessionId: String) {
    val signal = PlatformActivityRecognitionStub(this).probe()
    sessionManager.appendEvent(
      EventTypes.ACTIVITY_SIGNAL,
      SourceComponent.ACTIVITY_RECOGNITION,
      mapOf(
        "signal_type" to signal.signalType,
        "available" to signal.available.toString(),
        "detail" to signal.detail,
      ),
      sessionId = sessionId,
    )
  }

  private fun stopSessionInternal(reason: String) {
    locationCollector?.stop()
    locationCollector = null
    activeSessionId?.let { sid ->
      sessionManager.appendEvent(
        EventTypes.SERVICE_STOPPED,
        SourceComponent.FOREGROUND_SERVICE,
        mapOf("reason" to reason),
        sessionId = sid,
        idempotencyKey = com.milerecover.prototype.androidtracking.util.IdempotencyKeys.serviceStop(sid),
      )
    }
    activeSessionId = null
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  override fun onDestroy() {
    stopSessionInternal("service_destroy")
    PrototypeLog.d(TAG, "Service destroyed")
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun buildNotification(): Notification {
    val pending = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(getString(R.string.notification_title))
      .setContentText(getString(R.string.notification_text))
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setContentIntent(pending)
      .setOngoing(true)
      .build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        getString(R.string.notification_channel_name),
        NotificationManager.IMPORTANCE_LOW,
      )
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      nm.createNotificationChannel(channel)
    }
  }

  companion object {
    private const val TAG = "ProtoB.FGS"
    const val ACTION_START = "com.milerecover.prototype.androidtracking.action.START"
    const val ACTION_STOP = "com.milerecover.prototype.androidtracking.action.STOP"
    const val EXTRA_SESSION_ID = "session_id"
    private const val CHANNEL_ID = "prototype_b_location"
    private const val NOTIFICATION_ID = 1001

    fun startIntent(context: Context, sessionId: String): Intent =
      Intent(context, TrackingForegroundService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_SESSION_ID, sessionId)
      }

    fun stopIntent(context: Context): Intent =
      Intent(context, TrackingForegroundService::class.java).apply {
        action = ACTION_STOP
      }
  }
}
