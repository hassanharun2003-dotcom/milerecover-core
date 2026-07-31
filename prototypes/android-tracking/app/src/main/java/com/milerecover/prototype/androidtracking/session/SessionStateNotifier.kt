package com.milerecover.prototype.androidtracking.session

import android.content.Context
import android.content.Intent

/** Notifies UI when session prefs change — prototype-only sync helper. */
object SessionStateNotifier {
  const val ACTION_SESSION_STATE_CHANGED =
    "com.milerecover.prototype.androidtracking.SESSION_STATE_CHANGED"

  fun notify(context: Context) {
    context.applicationContext.sendBroadcast(
      Intent(ACTION_SESSION_STATE_CHANGED).setPackage(context.packageName),
    )
  }
}
