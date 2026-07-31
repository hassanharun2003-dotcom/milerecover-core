package com.milerecover.prototype.androidtracking

import android.content.Context
import com.milerecover.prototype.androidtracking.buffer.EventBuffer
import com.milerecover.prototype.androidtracking.buffer.SqliteEventBuffer
import com.milerecover.prototype.androidtracking.diagnostics.DiagnosticExporter
import com.milerecover.prototype.androidtracking.session.SessionManager

/**
 * Prototype composition root — not a production DI framework.
 */
object PrototypeApp {
  @Volatile
  private var buffer: EventBuffer? = null
  @Volatile
  private var sessionManager: SessionManager? = null
  @Volatile
  private var diagnosticExporter: DiagnosticExporter? = null

  fun buffer(context: Context): EventBuffer =
    buffer ?: synchronized(this) {
      buffer ?: SqliteEventBuffer(context.applicationContext).also { buffer = it }
    }

  fun sessionManager(context: Context): SessionManager =
    sessionManager ?: synchronized(this) {
      sessionManager ?: SessionManager(context.applicationContext, buffer(context)).also {
        sessionManager = it
      }
    }

  fun diagnosticExporter(context: Context): DiagnosticExporter =
    diagnosticExporter ?: synchronized(this) {
      diagnosticExporter ?: DiagnosticExporter(
        context.applicationContext,
        buffer(context),
        sessionManager(context),
      ).also { diagnosticExporter = it }
    }

  /** Test-only reset */
  internal fun resetForTests() {
    synchronized(this) {
      buffer = null
      sessionManager = null
      diagnosticExporter = null
    }
  }
}
