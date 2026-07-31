import Foundation

/// Prototype-only file-backed buffer — NOT production DB (see Prototype D).
/// Uses Application Support directory; differs from Prototype B FGS buffer scope.
final class PrototypeEventBuffer {
  private struct StoredEvent: Codable {
    var envelope: NativeEventEnvelope
  }

  private let fileURL: URL
  private var events: [String: StoredEvent] = [:]
  private var duplicateRejectedCount = 0
  private var rejectedCount = 0
  private let queue = DispatchQueue(label: "com.milerecover.prototype.nativebridge.buffer")

  init() {
    let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    fileURL = dir.appendingPathComponent("prototype_c_bridge.json")
    loadFromDisk()
  }

  enum InsertResult { case inserted, duplicateRejected }

  func insert(_ event: NativeEventEnvelope) -> InsertResult {
    queue.sync {
      let key = "\(event.sessionId):\(event.sequenceNumber)"
      if events.values.contains(where: { "\($0.envelope.sessionId):\($0.envelope.sequenceNumber)" == key }) {
        duplicateRejectedCount += 1
        return .duplicateRejected
      }
      events[event.eventId] = StoredEvent(envelope: event)
      persist()
      return .inserted
    }
  }

  func fetchPendingBatch(limit: Int) -> [NativeEventEnvelope] {
    queue.sync {
      let pending = events.values
        .map(\.envelope)
        .filter { $0.acknowledgmentState == NativeEventEnvelope.AckState.pending }
        .sorted { $0.sequenceNumber < $1.sequenceNumber }
        .prefix(limit)
      var delivered: [NativeEventEnvelope] = []
      for var e in pending {
        e = NativeEventEnvelope(
          eventId: e.eventId,
          schemaVersion: e.schemaVersion,
          eventType: e.eventType,
          sessionId: e.sessionId,
          sequenceNumber: e.sequenceNumber,
          sourcePlatform: e.sourcePlatform,
          sourceComponent: e.sourceComponent,
          wallClockTimestamp: e.wallClockTimestamp,
          elapsedRealtimeMs: e.elapsedRealtimeMs,
          persistenceTimestamp: e.persistenceTimestamp,
          payload: e.payload,
          diagnosticMetadata: e.diagnosticMetadata,
          deliveryAttemptCount: e.deliveryAttemptCount + 1,
          acknowledgmentState: NativeEventEnvelope.AckState.delivered
        )
        events[e.eventId] = StoredEvent(envelope: e)
        delivered.append(e)
      }
      persist()
      return delivered
    }
  }

  struct AcknowledgeResult {
    var acknowledged: [String] = []
    var alreadyAcknowledged: [String] = []
    var unknown: [String] = []
  }

  func acknowledge(_ eventIds: [String]) -> AcknowledgeResult {
    queue.sync {
      var result = AcknowledgeResult()
      for id in eventIds {
        guard let stored = events[id] else {
          result.unknown.append(id)
          continue
        }
        if stored.envelope.acknowledgmentState == NativeEventEnvelope.AckState.acknowledged {
          result.alreadyAcknowledged.append(id)
          continue
        }
        let ack = NativeEventEnvelope(
          eventId: stored.envelope.eventId,
          schemaVersion: stored.envelope.schemaVersion,
          eventType: stored.envelope.eventType,
          sessionId: stored.envelope.sessionId,
          sequenceNumber: stored.envelope.sequenceNumber,
          sourcePlatform: stored.envelope.sourcePlatform,
          sourceComponent: stored.envelope.sourceComponent,
          wallClockTimestamp: stored.envelope.wallClockTimestamp,
          elapsedRealtimeMs: stored.envelope.elapsedRealtimeMs,
          persistenceTimestamp: stored.envelope.persistenceTimestamp,
          payload: stored.envelope.payload,
          diagnosticMetadata: stored.envelope.diagnosticMetadata,
          deliveryAttemptCount: stored.envelope.deliveryAttemptCount,
          acknowledgmentState: NativeEventEnvelope.AckState.acknowledged
        )
        events[id] = StoredEvent(envelope: ack)
        result.acknowledged.append(id)
      }
      persist()
      return result
    }
  }

  func countPending() -> Int {
    queue.sync { events.values.filter { $0.envelope.acknowledgmentState == NativeEventEnvelope.AckState.pending }.count }
  }

  func clearAll() {
    queue.sync {
      events.removeAll()
      duplicateRejectedCount = 0
      rejectedCount = 0
      persist()
    }
  }

  private func persist() {
    let list = events.values.map(\.envelope)
    if let data = try? JSONEncoder().encode(list) {
      try? data.write(to: fileURL, options: .atomic)
    }
  }

  private func loadFromDisk() {
    guard let data = try? Data(contentsOf: fileURL),
          let list = try? JSONDecoder().decode([NativeEventEnvelope].self, from: data) else { return }
    for e in list { events[e.eventId] = StoredEvent(envelope: e) }
  }
}
