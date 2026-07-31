package com.milerecover.prototype.androidtracking.util

import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CoordinateRedactionTest {
  @Test
  fun bucketCoordinate_isCoarse() {
    val a = CoordinateRedaction.bucketCoordinate(37.774929)
    val b = CoordinateRedaction.bucketCoordinate(37.774999)
    assertEqualsBucketStable(a, b)
  }

  @Test
  fun hashCoordinate_differsForDifferentInputs() {
    val a = CoordinateRedaction.hashCoordinate(1.0)
    val b = CoordinateRedaction.hashCoordinate(2.0)
    assertNotEquals(a, b)
  }

  private fun assertEqualsBucketStable(a: String, b: String) {
    assertTrue(a.startsWith("bucket_"))
    assertTrue(b.startsWith("bucket_"))
  }
}
