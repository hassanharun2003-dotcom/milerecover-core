package com.milerecover.prototype.androidtracking.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.milerecover.prototype.androidtracking.PrototypeApp
import com.milerecover.prototype.androidtracking.model.EventTypes
import com.milerecover.prototype.androidtracking.model.SourceComponent
import com.milerecover.prototype.androidtracking.permission.PermissionHelper
import com.milerecover.prototype.androidtracking.service.TrackingForegroundService
import com.milerecover.prototype.androidtracking.util.PrototypeLog

/**
 * Evaluates whether to resume validation after BOOT_COMPLETED.
 *
 * Limitations:
 * - User force-stop prevents delivery until app is opened again.
 * - Android 12+ restricts starting FGS from background — restart may fail; event recorded.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return

    val sessionManager = PrototypeApp.sessionManager(context)
    val requested = sessionManager.isSessionRequested()
    val sessionId = sessionManager.currentSessionId()
    val permissions = PermissionHelper.snapshot(context)

    when {
      !requested || sessionId == null -> {
        sessionManager.recordBootEvaluation(
          decision = "no_resume",
          detail = "no_active_session_requested",
        )
      }
      !permissions.canTrackInForeground() -> {
        sessionManager.recordBootEvaluation(
          decision = "no_resume",
          detail = "permission_not_granted_after_boot",
        )
        sessionManager.appendEvent(
          EventTypes.PROTOTYPE_FAULT,
          SourceComponent.BOOT_RECEIVER,
          mapOf("category" to "boot_permission_missing"),
          sessionId = sessionId,
        )
      }
      else -> {
        sessionManager.recordBootEvaluation(
          decision = "attempt_resume",
          detail = "sdk_${Build.VERSION.SDK_INT}",
        )
        try {
          context.startForegroundService(
            TrackingForegroundService.startIntent(context, sessionId),
          )
          PrototypeLog.d(TAG, "Boot resume attempted session=$sessionId")
        } catch (e: Exception) {
          sessionManager.appendEvent(
            EventTypes.PROTOTYPE_FAULT,
            SourceComponent.BOOT_RECEIVER,
            mapOf(
              "category" to "boot_fgs_restricted",
              "detail" to (e.javaClass.simpleName),
            ),
            sessionId = sessionId,
          )
          PrototypeLog.w(TAG, "Boot resume failed: ${e.javaClass.simpleName}")
        }
      }
    }
  }

  companion object {
    private const val TAG = "ProtoB.Boot"
  }
}
