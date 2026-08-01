import Foundation

/// Legacy Native Module — semantic parity with Android PrototypeBridgeModule.
@objc(PrototypeBridgeModule)
class PrototypeBridgeModule: RCTEventEmitter {

  private let buffer = PrototypeEventBuffer()
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool { false }

  override func supportedEvents() -> [String]! {
    ["PrototypeEventsAvailable"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc func getBridgeApiVersion(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(NativeEventEnvelope.bridgeApiVersion)
  }

  @objc func getContractVersion(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve("\(NativeEventEnvelope.contractMajor)")
  }

  @objc func fetchPendingEvents(_ batchSize: NSNumber, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let limit = batchSize.intValue
    guard limit >= 1, limit <= NativeEventEnvelope.maxBatchSize else {
      reject("invalid_batch_size", "Batch size out of range", nil)
      return
    }
    let events = buffer.fetchPendingBatch(limit: limit)
    resolve([
      "events": events.map { $0.toBridgeDictionary() },
      "hasMore": buffer.countPending() > 0,
      "fetchedCount": events.count,
    ])
  }

  @objc func acknowledgeEvents(_ eventIds: [String], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let result = buffer.acknowledge(eventIds)
    resolve([
      "acknowledged": result.acknowledged,
      "alreadyAcknowledged": result.alreadyAcknowledged,
      "unknown": result.unknown,
      "failed": [],
    ])
  }

  @objc func clearPrototypeData(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    buffer.clearAll()
    resolve(NSNull())
  }

  private func emitHint() {
    if hasListeners {
      sendEvent(withName: "PrototypeEventsAvailable", body: [
        "hintId": UUID().uuidString,
        "pendingCountEstimate": buffer.countPending(),
        "emittedAt": Date().timeIntervalSince1970 * 1000,
      ])
    }
  }
}

private extension NativeEventEnvelope {
  func toBridgeDictionary() -> [String: Any] {
    [
      "eventId": eventId,
      "schemaVersion": schemaVersion,
      "eventType": eventType,
      "sessionId": sessionId,
      "sequenceNumber": sequenceNumber,
      "sourcePlatform": sourcePlatform,
      "sourceComponent": sourceComponent,
      "wallClockTimestamp": wallClockTimestamp,
      "elapsedRealtimeMs": elapsedRealtimeMs,
      "persistenceTimestamp": persistenceTimestamp,
      "payload": payload.mapValues { $0.value },
      "diagnosticMetadata": diagnosticMetadata,
      "deliveryAttemptCount": deliveryAttemptCount,
      "acknowledgmentState": acknowledgmentState,
    ]
  }
}
