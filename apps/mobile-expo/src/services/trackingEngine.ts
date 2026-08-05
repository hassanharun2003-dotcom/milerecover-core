import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  evaluateSampleBuffer,
  filterSample,
  isDuplicateAutoTrip,
  isImpossibleJump,
  overlapsExistingAutoTrip,
  sampleIndicatesMovement,
  transitionTripMachine,
  type LocationSample,
  type SampleBufferDiscardReason,
  type TripMachineState,
  type TripRecord,
} from '@milerecover/domain';
import { enrichTripEndpoints } from './geocode';

export const TRACKING_SAMPLE_STORAGE_KEY = '@milerecover/tracking/samples/v1';
export const TRACKING_MACHINE_STORAGE_KEY = '@milerecover/tracking/machine/v1';
export const TRACKING_PENDING_TRIPS_KEY = '@milerecover/tracking/pending-trips/v1';
export const TRACKING_LAST_SUCCESSFUL_AUTOMATIC_TRIP_KEY =
  '@milerecover/tracking/last-successful-automatic-trip/v1';
export const TASK_NAME = 'milerecover-tracking';
const MAX_BUFFERED_SAMPLES = 2000;
const DISCARD_REASONS: SampleBufferDiscardReason[] = [
  'insufficient_evidence',
  'stationary_drift',
  'walking_noise',
  'poor_accuracy',
];

export type EngineState =
  | 'idle'
  | 'starting'
  | 'foreground'
  | 'foreground_background'
  | 'not_allowed'
  | 'permission_denied'
  | 'error'
  | 'stopped';

export interface TrackingDiagnostics {
  foregroundPermission: Location.PermissionStatus | 'unknown';
  backgroundPermission: Location.PermissionStatus | 'unknown';
  taskManagerAvailable: boolean;
  backgroundRegistered: boolean;
  backgroundLimited: boolean;
  backgroundLimitedReason: string | null;
  lastSampleAt: number | null;
  lastAcceptedSample: { timestamp: number; latitude?: number; longitude?: number } | null;
  lastRejectedSample: { timestamp: number; reason: string } | null;
  sampleCount: number;
  engineState: EngineState;
  tripMachineState: TripMachineState;
  activeTripState: TripMachineState;
  lastBackgroundCallbackAt: number | null;
  lastSuccessfulAutomaticTripAt: number | null;
  queueLength: number;
  batteryRestrictionState: 'unknown' | 'restricted' | 'unrestricted';
  permissionState: string;
  automaticCaptureAvailable: boolean;
  discardReasonCounts: Record<SampleBufferDiscardReason, number>;
}

export interface TrackingController {
  startTracking(): Promise<void>;
  stopTracking(): Promise<void>;
  getDiagnostics(): Promise<TrackingDiagnostics>;
}

interface TrackingControllerOptions {
  onTripClosed: (trip: TripRecord) => void;
  isAllowed: () => boolean;
  onEngineStateChange?: (state: EngineState, lastSampleAt: number | null) => void;
  getExistingTrips?: () => TripRecord[];
  getPrimaryVehicleId?: () => string | null;
}

let sampleBuffer: LocationSample[] = [];
let sampleBufferLoaded = false;
let activeController: TrackingControllerImpl | null = null;
let singletonController: TrackingControllerImpl | null = null;
let taskDefined = false;

function emptyDiscardReasonCounts(): Record<SampleBufferDiscardReason, number> {
  return {
    insufficient_evidence: 0,
    stationary_drift: 0,
    walking_noise: 0,
    poor_accuracy: 0,
  };
}

function toSample(location: Location.LocationObject): LocationSample | null {
  const { coords, timestamp } = location;
  if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return null;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracyMeters: coords.accuracy ?? null,
    speedMps: coords.speed ?? null,
    timestamp,
  };
}

async function loadSampleBuffer(): Promise<LocationSample[]> {
  if (sampleBufferLoaded) return sampleBuffer;
  try {
    const raw = await AsyncStorage.getItem(TRACKING_SAMPLE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocationSample[]) : [];
    sampleBuffer = Array.isArray(parsed)
      ? parsed
          .filter((sample) => sample && typeof sample.timestamp === 'number')
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-MAX_BUFFERED_SAMPLES)
      : [];
  } catch {
    sampleBuffer = [];
  }
  sampleBufferLoaded = true;
  return sampleBuffer;
}

async function persistSampleBuffer(): Promise<void> {
  await AsyncStorage.setItem(TRACKING_SAMPLE_STORAGE_KEY, JSON.stringify(sampleBuffer.slice(-MAX_BUFFERED_SAMPLES)));
}

function lastCleanSample(samples: LocationSample[]): LocationSample | null {
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (filterSample(samples[i])) return samples[i];
  }
  return null;
}

async function loadPendingTrips(): Promise<TripRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(TRACKING_PENDING_TRIPS_KEY);
    const parsed = raw ? (JSON.parse(raw) as TripRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistPendingTrips(trips: TripRecord[]): Promise<void> {
  await AsyncStorage.setItem(TRACKING_PENDING_TRIPS_KEY, JSON.stringify(trips.slice(0, 50)));
}

async function loadLastSuccessfulAutomaticTripAt(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(TRACKING_LAST_SUCCESSFUL_AUTOMATIC_TRIP_KEY);
    const parsed = raw == null ? null : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function persistLastSuccessfulAutomaticTripAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(TRACKING_LAST_SUCCESSFUL_AUTOMATIC_TRIP_KEY, String(timestamp));
}

async function enqueuePendingTrip(trip: TripRecord): Promise<void> {
  const pending = await loadPendingTrips();
  if (isDuplicateAutoTrip(trip, pending) || overlapsExistingAutoTrip(trip, pending)) return;
  await persistPendingTrips([trip, ...pending]);
}

async function flushPendingTrips(emit: (trip: TripRecord) => void): Promise<void> {
  const pending = await loadPendingTrips();
  if (pending.length === 0) return;
  await persistPendingTrips([]);
  for (const trip of pending.reverse()) {
    emit(trip);
  }
}

async function applyBufferEvaluation(): Promise<void> {
  const evaluation = evaluateSampleBuffer(sampleBuffer);
  if (evaluation.action === 'wait') return;

  if (evaluation.action === 'discard') {
    activeController?.noteBufferDiscard(evaluation.reason);
    activeController?.advanceMachine({ type: 'QUIET_ELAPSED' });
    activeController?.advanceMachine({ type: 'EVIDENCE_INSUFFICIENT' });
    sampleBuffer = sampleBuffer.filter((sample) => sample.timestamp > evaluation.consumedUntil);
    activeController?.advanceMachine({ type: 'RESET' });
    await persistSampleBuffer();
    return;
  }

  activeController?.advanceMachine({ type: 'QUIET_ELAPSED' });
  activeController?.advanceMachine({ type: 'EVIDENCE_SUFFICIENT' });
  sampleBuffer = sampleBuffer.filter((sample) => sample.timestamp > evaluation.consumedUntil);
  if (activeController) {
    await activeController.handleClosedTrip(evaluation.trip);
  } else {
    await enqueuePendingTrip(evaluation.trip);
  }
  activeController?.advanceMachine({ type: 'RESET' });
  await persistSampleBuffer();
}

async function appendSamples(locations: Location.LocationObject[]): Promise<void> {
  const candidates = locations
    .map(toSample)
    .filter((sample): sample is LocationSample => sample != null);

  if (candidates.length === 0) return;

  await loadSampleBuffer();
  const buffered: LocationSample[] = [];
  const cleanForMotion: LocationSample[] = [];
  let previousClean = lastCleanSample(sampleBuffer);
  for (const sample of candidates) {
    if (filterSample(sample) && previousClean && isImpossibleJump(previousClean, sample)) {
      activeController?.noteRejectedSample('impossible_jump', sample.timestamp);
      continue;
    }
    buffered.push(sample);
    if (filterSample(sample)) {
      cleanForMotion.push(sample);
      previousClean = sample;
    }
  }
  if (buffered.length === 0) return;

  const previousForMotion = lastCleanSample(sampleBuffer);
  sampleBuffer = [...sampleBuffer, ...buffered]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_BUFFERED_SAMPLES);

  const moving = cleanForMotion.some((sample, index) => {
    const prev =
      index === 0 ? previousForMotion : cleanForMotion[index - 1] ?? previousForMotion;
    return sampleIndicatesMovement(sample, prev);
  });
  if (cleanForMotion.length > 0) {
    activeController?.advanceMachine({ type: 'SAMPLE_ACCEPTED', moving });
  }

  await applyBufferEvaluation();
  if (cleanForMotion.length > 0) {
    activeController?.noteAcceptedSample(cleanForMotion[cleanForMotion.length - 1]);
  }
}

function defineBackgroundTask(): boolean {
  if (taskDefined) return true;
  try {
    if (!TaskManager.isTaskDefined(TASK_NAME)) {
      TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
        activeController?.markBackgroundCallback(Date.now());
        if (error) {
          activeController?.markBackgroundLimited(error.message);
          activeController?.advanceMachine({ type: 'ENGINE_ERROR', recoverable: true });
          return;
        }
        const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations ?? [];
        await appendSamples(locations);
      });
    }
    taskDefined = true;
    return true;
  } catch (error) {
    activeController?.markBackgroundLimited(
      error instanceof Error ? error.message : 'Background task could not be defined.',
    );
    return false;
  }
}

defineBackgroundTask();

class TrackingControllerImpl implements TrackingController {
  private foregroundSubscription: Location.LocationSubscription | null = null;
  private engineState: EngineState = 'idle';
  private tripMachineState: TripMachineState = 'IDLE';
  private lastSampleAt: number | null = null;
  private lastAcceptedSample: TrackingDiagnostics['lastAcceptedSample'] = null;
  private lastRejectedSample: TrackingDiagnostics['lastRejectedSample'] = null;
  private lastBackgroundCallbackAt: number | null = null;
  private lastSuccessfulAutomaticTripAt: number | null = null;
  private lastSuccessfulAutomaticTripLoaded = false;
  private backgroundLimitedReason: string | null = null;
  private closedTrips: TripRecord[] = [];
  private discardReasonCounts = emptyDiscardReasonCounts();

  constructor(private options: TrackingControllerOptions) {}

  updateOptions(options: TrackingControllerOptions): void {
    this.options = options;
  }

  private setEngineState(next: EngineState): void {
    this.engineState = next;
    this.options.onEngineStateChange?.(next, this.lastSampleAt);
  }

  advanceMachine(event: Parameters<typeof transitionTripMachine>[1]): void {
    const result = transitionTripMachine(this.tripMachineState, event);
    if (result.changed) {
      this.tripMachineState = result.next;
      void AsyncStorage.setItem(TRACKING_MACHINE_STORAGE_KEY, result.next);
    }
  }

  noteRejectedSample(reason: string, timestamp = Date.now()): void {
    this.lastRejectedSample = { timestamp, reason };
    this.advanceMachine({ type: 'SAMPLE_REJECTED' });
  }

  noteBufferDiscard(reason: SampleBufferDiscardReason): void {
    this.discardReasonCounts = {
      ...this.discardReasonCounts,
      [reason]: this.discardReasonCounts[reason] + 1,
    };
  }

  noteAcceptedSample(sample: LocationSample): void {
    this.lastAcceptedSample = {
      timestamp: sample.timestamp,
      latitude: sample.latitude,
      longitude: sample.longitude,
    };
    this.markLastSample(sample.timestamp);
  }

  async startTracking(): Promise<void> {
    if (!this.options.isAllowed()) {
      this.setEngineState('not_allowed');
      return;
    }
    if (this.foregroundSubscription) return;

    activeController = this;
    this.setEngineState('starting');
    this.backgroundLimitedReason = null;
    await loadSampleBuffer();
    await flushPendingTrips((trip) => {
      void this.handleClosedTrip(trip);
    });

    try {
      const saved = await AsyncStorage.getItem(TRACKING_MACHINE_STORAGE_KEY);
      if (
        saved === 'TRACKING' ||
        saved === 'POSSIBLE_STOP' ||
        saved === 'POSSIBLE_MOVEMENT' ||
        saved === 'FINALIZING'
      ) {
        this.tripMachineState = saved;
      }
    } catch {
      // ignore
    }

    const foreground = await this.ensureForegroundPermission();
    if (foreground !== Location.PermissionStatus.GRANTED) {
      this.setEngineState('permission_denied');
      return;
    }

    this.foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 25,
      },
      (location) => {
        void appendSamples([location]);
      },
      (reason) => {
        this.setEngineState('error');
        this.backgroundLimitedReason = reason;
        this.advanceMachine({ type: 'ENGINE_ERROR', recoverable: true });
      },
    );

    const backgroundStarted = await this.tryStartBackgroundUpdates();
    this.setEngineState(backgroundStarted ? 'foreground_background' : 'foreground');

    await applyBufferEvaluation();
  }

  async stopTracking(): Promise<void> {
    this.foregroundSubscription?.remove();
    this.foregroundSubscription = null;

    try {
      const registered = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
      if (registered) {
        await Location.stopLocationUpdatesAsync(TASK_NAME);
      }
    } catch {
      // Foreground capture can stop even when the background registration API is unavailable.
    }

    if (activeController === this) activeController = null;
    this.advanceMachine({ type: 'PROTECTION_OFF' });
    this.tripMachineState = 'IDLE';
    void AsyncStorage.setItem(TRACKING_MACHINE_STORAGE_KEY, 'IDLE');
    this.setEngineState('stopped');
  }

  async getDiagnostics(): Promise<TrackingDiagnostics> {
    await loadSampleBuffer();
    if (!this.lastSuccessfulAutomaticTripLoaded) {
      this.lastSuccessfulAutomaticTripAt = await loadLastSuccessfulAutomaticTripAt();
      this.lastSuccessfulAutomaticTripLoaded = true;
    }
    const pendingTrips = await loadPendingTrips();
    const taskManagerAvailable = await this.isTaskManagerAvailable();
    const foregroundPermission = await safePermission(() => Location.getForegroundPermissionsAsync());
    const backgroundPermission = await safePermission(() => Location.getBackgroundPermissionsAsync());
    const backgroundRegistered = await safeBoolean(() => Location.hasStartedLocationUpdatesAsync(TASK_NAME));
    const automaticCaptureAvailable = this.options.isAllowed();
    const backgroundLimited =
      !backgroundRegistered ||
      !taskManagerAvailable ||
      backgroundPermission !== Location.PermissionStatus.GRANTED ||
      this.backgroundLimitedReason != null;
    const backgroundLimitedReason =
      this.backgroundLimitedReason ??
      (!taskManagerAvailable
        ? 'TaskManager is unavailable in this runtime.'
        : backgroundPermission !== Location.PermissionStatus.GRANTED
          ? 'Background location permission is not granted.'
          : !backgroundRegistered
            ? 'Background updates are not registered; foreground watch is still active while the app is open.'
            : null);
    const lastBufferedSample = sampleBuffer.at(-1) ?? null;

    return {
      foregroundPermission,
      backgroundPermission,
      taskManagerAvailable,
      backgroundRegistered,
      backgroundLimited,
      backgroundLimitedReason,
      lastSampleAt: this.lastSampleAt ?? lastBufferedSample?.timestamp ?? null,
      lastAcceptedSample:
        this.lastAcceptedSample ??
        (lastBufferedSample
          ? {
              timestamp: lastBufferedSample.timestamp,
              latitude: lastBufferedSample.latitude,
              longitude: lastBufferedSample.longitude,
            }
          : null),
      lastRejectedSample: this.lastRejectedSample,
      sampleCount: sampleBuffer.length,
      engineState: this.engineState,
      tripMachineState: this.tripMachineState,
      activeTripState: this.tripMachineState,
      lastBackgroundCallbackAt: this.lastBackgroundCallbackAt,
      lastSuccessfulAutomaticTripAt: this.lastSuccessfulAutomaticTripAt,
      queueLength: pendingTrips.length,
      batteryRestrictionState: batteryRestrictionState(backgroundLimitedReason),
      permissionState: summarizePermissionState(foregroundPermission, backgroundPermission),
      automaticCaptureAvailable,
      discardReasonCounts: DISCARD_REASONS.reduce(
        (counts, reason) => ({
          ...counts,
          [reason]: this.discardReasonCounts[reason],
        }),
        emptyDiscardReasonCounts(),
      ),
    };
  }

  async handleClosedTrip(trip: TripRecord): Promise<void> {
    const primaryVehicleId = this.options.getPrimaryVehicleId?.() ?? null;
    let nextTrip: TripRecord = {
      ...trip,
      vehicleId: trip.vehicleId ?? primaryVehicleId,
    };

    const existing = [
      ...this.closedTrips,
      ...(this.options.getExistingTrips?.() ?? []),
    ];
    if (isDuplicateAutoTrip(nextTrip, existing) || overlapsExistingAutoTrip(nextTrip, existing)) {
      return;
    }

    const start = nextTrip.routePreview?.[0] ?? null;
    const end = nextTrip.routePreview?.[nextTrip.routePreview.length - 1] ?? null;
    // Emit immediately so Review is not blocked by network geocoding.
    this.closedTrips = [nextTrip, ...this.closedTrips].slice(0, 50);
    if (nextTrip.source === 'auto_detected') {
      const closedAt = Date.now();
      this.lastSuccessfulAutomaticTripAt = closedAt;
      this.lastSuccessfulAutomaticTripLoaded = true;
      void persistLastSuccessfulAutomaticTripAt(closedAt);
    }
    this.options.onTripClosed(nextTrip);

    void enrichTripEndpoints({ start, end }).then(({ startLabel, endLabel }) => {
      if (!startLabel && !endLabel) return;
      const enriched: TripRecord = {
        ...nextTrip,
        startLabel: startLabel ?? nextTrip.startLabel,
        endLabel: endLabel ?? nextTrip.endLabel,
        updatedAt: Date.now(),
      };
      this.options.onTripClosed(enriched);
    });
  }

  markLastSample(timestamp: number): void {
    this.lastSampleAt = timestamp;
    this.options.onEngineStateChange?.(this.engineState, timestamp);
  }

  markBackgroundLimited(reason: string): void {
    this.backgroundLimitedReason = reason;
  }

  markBackgroundCallback(timestamp: number): void {
    this.lastBackgroundCallbackAt = timestamp;
  }

  private async ensureForegroundPermission(): Promise<Location.PermissionStatus> {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status === Location.PermissionStatus.GRANTED) return existing.status;
    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.status;
  }

  private async tryStartBackgroundUpdates(): Promise<boolean> {
    if (!defineBackgroundTask()) return false;
    const taskManagerAvailable = await this.isTaskManagerAvailable();
    if (!taskManagerAvailable) {
      this.backgroundLimitedReason = 'TaskManager is unavailable in this runtime.';
      return false;
    }

    const background = await this.ensureBackgroundPermission();
    if (background !== Location.PermissionStatus.GRANTED) {
      this.backgroundLimitedReason = 'Background location permission is not granted.';
      return false;
    }

    try {
      const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
      if (!alreadyStarted) {
        await Location.startLocationUpdatesAsync(TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 25,
          deferredUpdatesInterval: 10000,
          pausesUpdatesAutomatically: true,
          activityType: Location.LocationActivityType.AutomotiveNavigation,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'MileRecover is protecting drives',
            notificationBody: 'Automatic capture is active. Turn off protection anytime in the app.',
            notificationColor: '#1B5538',
          },
        });
      }
      return true;
    } catch (error) {
      this.backgroundLimitedReason =
        error instanceof Error ? error.message : 'Background updates could not be started.';
      return false;
    }
  }

  private async ensureBackgroundPermission(): Promise<Location.PermissionStatus> {
    const existing = await Location.getBackgroundPermissionsAsync();
    if (existing.status === Location.PermissionStatus.GRANTED) return existing.status;
    const requested = await Location.requestBackgroundPermissionsAsync();
    return requested.status;
  }

  private async isTaskManagerAvailable(): Promise<boolean> {
    return safeBoolean(() => TaskManager.isAvailableAsync());
  }
}

async function safePermission(
  getter: () => Promise<Location.PermissionResponse>,
): Promise<Location.PermissionStatus | 'unknown'> {
  try {
    return (await getter()).status;
  } catch {
    return 'unknown';
  }
}

async function safeBoolean(getter: () => Promise<boolean>): Promise<boolean> {
  try {
    return await getter();
  } catch {
    return false;
  }
}

function batteryRestrictionState(
  reason: string | null,
): TrackingDiagnostics['batteryRestrictionState'] {
  if (!reason || !/battery/i.test(reason)) return 'unknown';
  if (/unrestricted|not restricted|disabled|off/i.test(reason)) return 'unrestricted';
  return 'restricted';
}

function summarizePermissionState(
  foreground: Location.PermissionStatus | 'unknown',
  background: Location.PermissionStatus | 'unknown',
): string {
  if (foreground === 'unknown' || background === 'unknown') return 'permission status unknown';
  if (foreground === Location.PermissionStatus.GRANTED && background === Location.PermissionStatus.GRANTED) {
    return 'foreground and background granted';
  }
  if (foreground !== Location.PermissionStatus.GRANTED) return `foreground ${foreground}`;
  return `background ${background}`;
}

export function createTrackingController(options: TrackingControllerOptions): TrackingController {
  if (!singletonController) {
    singletonController = new TrackingControllerImpl(options);
  } else {
    singletonController.updateOptions(options);
  }
  return singletonController;
}

export async function getTrackingDiagnostics(): Promise<TrackingDiagnostics> {
  if (!singletonController) {
    singletonController = new TrackingControllerImpl({
      onTripClosed: () => undefined,
      isAllowed: () => false,
    });
  }
  return singletonController.getDiagnostics();
}
