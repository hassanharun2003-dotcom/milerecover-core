import XCTest
@testable import MileRecoverProtoBridgeC

final class PrototypeEventBufferTests: XCTestCase {
  private var tempURL: URL!
  private var buffer: PrototypeEventBuffer!

  override func setUp() {
    super.setUp()
    tempURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("proto-buffer-test-\(UUID().uuidString).json")
    buffer = PrototypeEventBuffer(fileURL: tempURL)
    buffer.clearAll()
  }

  override func tearDown() {
    try? FileManager.default.removeItem(at: tempURL)
    buffer = nil
    tempURL = nil
    super.tearDown()
  }

  func testInsertAndFetchOrdered() {
    _ = buffer.insert(SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 2))
    _ = buffer.insert(SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1))
    let batch = buffer.fetchPendingBatch(limit: 10)
    XCTAssertEqual([1, 2], batch.map(\.sequenceNumber))
  }

  func testBatchLimit() {
    for seq in 1...5 {
      _ = buffer.insert(SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: Int64(seq)))
    }
    let batch = buffer.fetchPendingBatch(limit: 3)
    XCTAssertEqual(3, batch.count)
    XCTAssertEqual([1, 2, 3], batch.map(\.sequenceNumber))
  }

  func testDuplicateRejected() {
    let event = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    XCTAssertEqual(.inserted, buffer.insert(event))
    let duplicate = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    XCTAssertEqual(.duplicateRejected, buffer.insert(duplicate))
  }

  func testAcknowledgeBatchPartial() {
    let e1 = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    let e2 = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 2)
    _ = buffer.insert(e1)
    _ = buffer.insert(e2)
    _ = buffer.fetchPendingBatch(limit: 10)
    let result = buffer.acknowledge([e1.eventId, "unknown"])
    XCTAssertEqual([e1.eventId], result.acknowledged)
    XCTAssertEqual(["unknown"], result.unknown)
    XCTAssertTrue(result.alreadyAcknowledged.isEmpty)
  }

  func testRepeatedAcknowledgment() {
    let event = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    _ = buffer.insert(event)
    _ = buffer.fetchPendingBatch(limit: 10)
    _ = buffer.acknowledge([event.eventId])
    let again = buffer.acknowledge([event.eventId])
    XCTAssertEqual([event.eventId], again.alreadyAcknowledged)
  }

  func testPersistenceAcrossReinit() {
    let event = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    _ = buffer.insert(event)
    let reloaded = PrototypeEventBuffer(fileURL: tempURL)
    XCTAssertEqual(1, reloaded.countPending())
    let batch = reloaded.fetchPendingBatch(limit: 10)
    XCTAssertEqual([1], batch.map(\.sequenceNumber))
  }

  func testDeliveredNotAcknowledgedRemainsUnacked() {
    let event = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    _ = buffer.insert(event)
    _ = buffer.fetchPendingBatch(limit: 10)
    XCTAssertEqual(0, buffer.countPending())
    let ack = buffer.acknowledge([event.eventId])
    XCTAssertEqual([event.eventId], ack.acknowledged)
  }

  func testUnknownIdNotTreatedAsAcknowledged() {
    let event = SyntheticEventGenerator.create(sessionId: "s1", sequenceNumber: 1)
    _ = buffer.insert(event)
    _ = buffer.fetchPendingBatch(limit: 10)
    let result = buffer.acknowledge(["missing-event-id"])
    XCTAssertTrue(result.acknowledged.isEmpty)
    XCTAssertEqual(["missing-event-id"], result.unknown)
  }
}
