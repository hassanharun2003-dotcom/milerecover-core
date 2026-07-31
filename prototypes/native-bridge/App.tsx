import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BRIDGE_API_VERSION,
  CONTRACT_MAJOR_VERSION,
  JS_SUPPORTED_SCHEMA_VERSIONS,
  MAX_BATCH_SIZE,
} from './contract/constants';
import { diagnosticsJsonExcludesCoordinates } from './contract/sanitize';
import type { NativeEventEnvelope } from './contract/types';
import { parseNativeEvent } from './contract/validate';
import { IdempotentEventHandler } from './src/bridge/EventHandler';
import {
  NativeBridgeClient,
  type NativeBridgeModule,
} from './src/bridge/NativeBridgeClient';

const NATIVE_MODULE_NAME = 'PrototypeBridgeModule';
const VALIDATION_BANNER = 'NON-PRODUCTION — VALIDATION ONLY';

function getNativeModule(): NativeBridgeModule | null {
  const mod = NativeModules[NATIVE_MODULE_NAME] as NativeBridgeModule | undefined;
  return mod ?? null;
}

export default function App(): React.JSX.Element {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [stats, setStats] = useState<Record<string, number | string | null>>({});
  const [logLines, setLogLines] = useState<string[]>([]);
  const [lastSequence, setLastSequence] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<NativeEventEnvelope[]>([]);
  const [pushObservation, setPushObservation] = useState<'active' | 'stopped'>('active');
  const [pushHintCount, setPushHintCount] = useState(0);
  const [diagnosticsPreview, setDiagnosticsPreview] = useState<string | null>(null);
  const [privacyCheck, setPrivacyCheck] = useState<'pass' | 'fail' | null>(null);
  const handler = useMemo(() => new IdempotentEventHandler(), []);
  const pushSubRef = useRef<{ remove: () => void } | null>(null);

  const client = useMemo(() => new NativeBridgeClient(getNativeModule()), []);
  const pushEmitter = useMemo(() => {
    const mod = NativeModules[NATIVE_MODULE_NAME];
    return mod ? new NativeEventEmitter(mod) : null;
  }, []);

  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [line, ...prev].slice(0, 50));
  }, []);

  const refreshStats = useCallback(async () => {
    const mod = getNativeModule();
    if (!mod) {
      setConnectionState('disconnected');
      setStats({ error: 'Native module not linked — use Android/iOS build' });
      return;
    }
    await client.connect();
    setConnectionState(client.connectionState);
    const bufferStats = await mod.getBufferStats();
    setStats(bufferStats as unknown as Record<string, number | string | null>);
    setLastSequence(bufferStats.lastSequenceReceived);
  }, [client]);

  const startPushObservation = useCallback(() => {
    if (!pushEmitter) return;
    pushSubRef.current?.remove();
    pushSubRef.current = pushEmitter.addListener('PrototypeEventsAvailable', () => {
      setPushHintCount((c) => c + 1);
      appendLog('Push hint received — pull remains authoritative');
    });
    setPushObservation('active');
    appendLog('Push observation: ACTIVE');
  }, [pushEmitter, appendLog]);

  const stopPushObservation = useCallback(() => {
    pushSubRef.current?.remove();
    pushSubRef.current = null;
    setPushObservation('stopped');
    appendLog('Push observation: STOPPED (native buffer unchanged; pull authoritative)');
  }, [appendLog]);

  useEffect(() => {
    refreshStats();
    startPushObservation();
    client.registerPushListener(() => undefined);
    return () => {
      pushSubRef.current?.remove();
    };
  }, [client, refreshStats, startPushObservation]);

  const pullOnly = async (batchSize: number, label = 'Fetch without ack') => {
    const mod = getNativeModule();
    if (!mod) {
      appendLog(`${label}: native module unavailable`);
      return [];
    }
    const result = await mod.fetchPendingEvents(batchSize);
    const parsed: NativeEventEnvelope[] = [];
    for (const raw of result.events) {
      const handled = handler.handle(raw);
      if (!handled.ok) {
        appendLog(`Rejected on pull: ${handled.error.message}`);
        continue;
      }
      if (handled.result.duplicateDetected) {
        appendLog(`JS duplicate detected: seq ${handled.result.event.sequenceNumber}`);
      }
      parsed.push(handled.result.event);
    }
    setLastFetched(parsed);
    const sequences = parsed.map((e) => e.sequenceNumber).join(', ');
    appendLog(
      `${label}: fetched ${result.fetchedCount}, hasMore=${result.hasMore}, seq=[${sequences}]`,
    );
    await refreshStats();
    return parsed;
  };

  const ackEventIds = async (ids: string[], label: string) => {
    if (!ids.length) {
      appendLog(`${label}: no event IDs to acknowledge`);
      return;
    }
    const mod = getNativeModule();
    if (!mod) return;
    const ack = await mod.acknowledgeEvents(ids);
    appendLog(
      `${label}: ack=${ack.acknowledged.length}, already=${ack.alreadyAcknowledged.length}, unknown=${ack.unknown.length}`,
    );
    await refreshStats();
  };

  const pullAndHandle = async (batchSize: number) => {
    const parsed = await pullOnly(batchSize, 'Fetch + ack (full)');
    const ids = parsed.map((e) => e.eventId);
    if (ids.length) {
      await ackEventIds(ids, 'Auto-ack all fetched');
    }
    setLastFetched([]);
  };

  const simulateJsRestart = () => {
    handler.simulateRestart();
    appendLog('JS handler state cleared — native buffer unchanged');
  };

  const resetValidationState = () => {
    handler.simulateRestart();
    setLastFetched([]);
    setDiagnosticsPreview(null);
    setPrivacyCheck(null);
    appendLog('Validation UI state reset (native buffer unchanged)');
  };

  const exportDiagnostics = async () => {
    const mod = getNativeModule();
    if (!mod) return;
    const diag = await mod.exportSanitizedDiagnostics();
    const json = JSON.stringify(diag, null, 2);
    setDiagnosticsPreview(json);
    const pass = diagnosticsJsonExcludesCoordinates(json);
    setPrivacyCheck(pass ? 'pass' : 'fail');
    appendLog(
      `Diagnostics exported: ${diag.recentEventSummaries.length} summaries — privacy ${pass ? 'PASS' : 'FAIL'}`,
    );
  };

  const verifyContractHeader = () => {
    const ok =
      BRIDGE_API_VERSION === '1.0.0-prototype-c' &&
      CONTRACT_MAJOR_VERSION === 1 &&
      String(stats.contractVersion ?? CONTRACT_MAJOR_VERSION) === String(CONTRACT_MAJOR_VERSION);
    appendLog(
      ok
        ? `Contract verify PASS — API ${BRIDGE_API_VERSION}, major ${CONTRACT_MAJOR_VERSION}, lastSeq=${lastSequence ?? '—'}`
        : 'Contract verify FAIL — check header and stats',
    );
  };

  const unackedFromLastFetch = lastFetched.length;

  const ValidationAction = ({
    label,
    onPress,
    primary,
  }: {
    label: string;
    onPress: () => void;
    primary?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.button, primary ? styles.buttonPrimary : styles.buttonValidation]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.banner}>{VALIDATION_BANNER}</Text>
      <Text style={styles.subBanner}>Prototype C · Bridge validation host</Text>

      <Text style={styles.meta}>Bridge API: {BRIDGE_API_VERSION}</Text>
      <Text style={styles.meta}>Contract major: {CONTRACT_MAJOR_VERSION}</Text>
      <Text style={styles.meta}>JS schemas: {JS_SUPPORTED_SCHEMA_VERSIONS.join(', ')}</Text>
      <Text style={styles.meta}>Connection: {connectionState}</Text>
      <Text style={styles.meta}>Push observation: {pushObservation} (hints: {pushHintCount})</Text>
      <Text style={styles.meta}>Last fetch cached: {lastFetched.length} events</Text>
      <Text style={styles.meta}>Last sequence: {lastSequence ?? '—'}</Text>

      <View style={styles.statsBox}>
        {Object.entries(stats).map(([k, v]) => (
          <Text key={k} style={styles.statLine}>
            {k}: {String(v)}
          </Text>
        ))}
      </View>

      <Text style={styles.section}>Buffer — generate & pull</Text>
      <ValidationAction label="Refresh stats" onPress={refreshStats} />
      <ValidationAction
        label="Clear prototype data"
        onPress={async () => {
          const mod = getNativeModule();
          if (mod) await mod.clearPrototypeData();
          setLastFetched([]);
          setDiagnosticsPreview(null);
          setPrivacyCheck(null);
          handler.simulateRestart();
          await refreshStats();
          appendLog('Prototype data cleared');
        }}
      />
      <ValidationAction label="Reset validation UI state" onPress={resetValidationState} />
      <ValidationAction label="Verify contract header" onPress={verifyContractHeader} />
      <ValidationAction
        label="Generate 1 synthetic event"
        onPress={async () => {
          const mod = getNativeModule();
          if (mod) await mod.generateSyntheticEvents(1, 'proto-debug');
          await refreshStats();
        }}
      />
      <ValidationAction
        label="Generate exactly 10 events"
        onPress={async () => {
          const mod = getNativeModule();
          if (mod) {
            const r = await mod.generateSyntheticEvents(10, 'proto-ten');
            appendLog(`Generated 10: inserted=${r.inserted}, dupRejected=${r.duplicateRejected}`);
          }
          await refreshStats();
        }}
      />
      <ValidationAction
        label="Generate burst (100)"
        onPress={async () => {
          const mod = getNativeModule();
          if (mod) await mod.generateSyntheticEvents(100, 'proto-burst');
          await refreshStats();
        }}
      />
      <ValidationAction label="Fetch without acknowledging" onPress={() => pullOnly(10)} primary />
      <ValidationAction label="Fetch pending + ack all" onPress={() => pullAndHandle(MAX_BATCH_SIZE)} />

      <Text style={styles.section}>Partial acknowledgment (10-event flow)</Text>
      <ValidationAction
        label="Acknowledge first 5 only"
        onPress={() => ackEventIds(lastFetched.slice(0, 5).map((e) => e.eventId), 'Ack first 5')}
      />
      <ValidationAction
        label="Acknowledge remaining 5"
        onPress={() => ackEventIds(lastFetched.slice(5, 10).map((e) => e.eventId), 'Ack remaining 5')}
      />
      <Text style={styles.hint}>
        After ack first 5: expect {Math.max(0, unackedFromLastFetch - 5)} unacked in last fetch cache
      </Text>

      <Text style={styles.section}>Observation & replay</Text>
      <ValidationAction label="Stop push observation" onPress={stopPushObservation} />
      <ValidationAction label="Restart push observation" onPress={startPushObservation} />
      <ValidationAction label="Simulate JS restart" onPress={simulateJsRestart} />
      <ValidationAction
        label="Replay unacknowledged (pull again)"
        onPress={async () => {
          const before = lastFetched.length;
          const again = await pullOnly(10, 'Replay pull');
          if (again.length === 0 && before > 0) {
            appendLog(
              `Replay: pull returned 0 new; ${before} events still ack-able from last fetch cache`,
            );
          }
        }}
      />

      <Text style={styles.section}>Error-path simulation</Text>
      <ValidationAction
        label="Simulate duplicate insertion"
        onPress={async () => {
          const mod = getNativeModule();
          if (!mod) return;
          const r = await mod.simulateDuplicateInsertion();
          appendLog(`Duplicate simulation: rejected=${r.duplicateRejected}`);
          await refreshStats();
        }}
      />
      <ValidationAction
        label="Simulate unsupported schema event"
        onPress={async () => {
          const mod = getNativeModule();
          if (!mod) return;
          const r = await mod.simulateUnsupportedSchemaEvent();
          appendLog(`Unsupported schema: rejected=${r.rejected}`);
          await refreshStats();
        }}
      />

      <Text style={styles.section}>Diagnostics & privacy</Text>
      <ValidationAction label="Export sanitized diagnostics" onPress={exportDiagnostics} primary />
      {privacyCheck !== null && (
        <Text style={[styles.privacyBadge, privacyCheck === 'pass' ? styles.privacyPass : styles.privacyFail]}>
          Coordinate privacy check: {privacyCheck === 'pass' ? 'PASS' : 'FAIL'}
        </Text>
      )}
      {diagnosticsPreview !== null && (
        <View style={styles.diagnosticsBox}>
          <Text style={styles.section}>Sanitized diagnostics preview</Text>
          <Text style={styles.diagnosticsText} selectable>
            {diagnosticsPreview}
          </Text>
        </View>
      )}

      <Text style={styles.section}>Log</Text>
      {logLines.map((line, i) => (
        <Text key={i} style={styles.logLine}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  banner: {
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 4,
    fontSize: 13,
  },
  subBanner: {
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
    fontSize: 11,
  },
  meta: { fontSize: 12, color: '#334155', marginBottom: 2 },
  statsBox: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  statLine: { fontSize: 11, fontFamily: 'monospace' },
  button: {
    padding: 10,
    borderRadius: 6,
    marginVertical: 4,
  },
  buttonValidation: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#b45309',
  },
  buttonPrimary: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  buttonText: { color: '#f8fafc', fontSize: 12 },
  section: { marginTop: 12, fontWeight: '600', fontSize: 13, color: '#0f172a' },
  hint: { fontSize: 10, color: '#64748b', marginBottom: 4, fontStyle: 'italic' },
  logLine: { fontSize: 10, color: '#475569', fontFamily: 'monospace' },
  diagnosticsBox: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    maxHeight: 220,
  },
  diagnosticsText: { fontSize: 9, fontFamily: 'monospace', color: '#14532d' },
  privacyBadge: {
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  privacyPass: { backgroundColor: '#dcfce7', color: '#166534' },
  privacyFail: { backgroundColor: '#fee2e2', color: '#991b1b' },
});
