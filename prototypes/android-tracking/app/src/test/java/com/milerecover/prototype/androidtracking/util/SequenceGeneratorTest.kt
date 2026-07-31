package com.milerecover.prototype.androidtracking.util

import org.junit.Assert.assertEquals
import org.junit.Test

class SequenceGeneratorTest {
  @Test
  fun sequencesAreMonotonic() {
    val gen = SequenceGenerator()
    assertEquals(1L, gen.nextSequence())
    assertEquals(2L, gen.nextSequence())
    assertEquals(3L, gen.nextSequence())
  }

  @Test
  fun resetRestartsSequence() {
    val gen = SequenceGenerator()
    gen.nextSequence()
    gen.nextSequence()
    gen.reset(10)
    assertEquals(11L, gen.nextSequence())
  }
}
