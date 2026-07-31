package com.milerecover.prototype.nativebridge.diagnostics

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.milerecover.prototype.nativebridge.buffer.PrototypeEventBuffer
import com.milerecover.prototype.nativebridge.synthetic.SyntheticEventGenerator
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class DiagnosticSanitizerTest {

  private lateinit var buffer: PrototypeEventBuffer

  @Before
  fun setup() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    buffer = PrototypeEventBuffer(context)
    buffer.clearAll()
    buffer.insert(SyntheticEventGenerator.create("s1", 1))
  }

  @Test
  fun exportExcludesCoordinates() {
    val json = DiagnosticSanitizer.exportDiagnostics(buffer)
    assertTrue(DiagnosticSanitizer.jsonExcludesCoordinates(json))
  }
}
