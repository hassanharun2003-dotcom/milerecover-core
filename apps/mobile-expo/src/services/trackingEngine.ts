import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  filterSample,
  isDuplicateAutoTrip,
  maybeCloseTripFromSamples,
  type LocationSample,
  type TripRecord,
} from '@milerecover/domain';

export const TRACKING_SAMPLE_STORAGE_KEY = '@milerecover/tracking/samples/v1';
export const TASK_NAME = 'milerecover-tracking';
const MAX_BUFFERED_SAMPLES = 2000;

type EngineState =
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
  sampleCount: number;
  engineState: EngineState;
  automaticCaptureAvailable: boolean;
}

export interface TrackingController {
  startTracking(): Promise<void>;
  stopTracking(): Promise<void>;
  getDiagnostics(): Promise<TrackingDiagnostics>;
}

interface TrackingControllerOptions {
  onTripClosed: (trip: TripRecord) => void;
  isAllowed: () => boolean;
}

let sampleBuffer: LocationSample[] = [];
let sampleBufferLoaded = false;
let activeController: TrackingControllerImpl | null = null;
let singletonController: TrackingControllerImpl | null = null;
let taskDefined = false;

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

async function appendSamples(locations: Location.LocationObject[]): Promise<void> {
  const accepted = locations
    .map(toSample)
    .filter((sample): sample is LocationSample => sample != null && filterSample(sample));

  if (accepted.length === 0) return;

  await loadSampleBuffer();
  sampleBuffer = [...sampleBuffer, ...accepted]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_BUFFERED_SAMPLES);

  const closed = maybeCloseTripFromSamples(sampleBuffer);
  if (closed && activeController) {
    sampleBuffer = sampleBuffer.filter((sample) => sample.timestamp > closed.consumedUntil);
    activeController.handleClosedTrip(closed.trip);
  }

  await persistSampleBuffer();
  activeController?.markLastSample(accepted[accepted.length - 1].timestamp);
}

function defineBackgroundTask(): boolean {
  if (taskDefined) return true;
  try {
    if (!TaskManager.isTaskDefined(TASK_NAME)) {
      TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
        if (error) {
          activeController?.markBackgroundLimited(error.message);
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
  private lastSampleAt: number | null = null;
  private backgroundLimitedReason: string | null = null;
  private closedTrips: TripRecord[] = [];

  constructor(private options: TrackingControllerOptions) {}

  updateOptions(options: TrackingControllerOptions): void {
    this.options = options;
  }

  async startTracking(): Promise<void> {
    if (!this.options.isAllowed()) {
      this.engineState = 'not_allowed';
      return;
    }
    if (this.foregroundSubscription) return;

    activeController = this;
    this.engineState = 'starting';
    this.backgroundLimitedReason = null;
    await loadSampleBuffer();

    const foreground = await this.ensureForegroundPermission();
    if (foreground !== Location.PermissionStatus.GRANTED) {
      this.engineState = 'permission_denied';
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
        this.engineState = 'error';
        this.backgroundLimitedReason = reason;
      },
    );

    const backgroundStarted = await this.tryStartBackgroundUpdates();
    this.engineState = backgroundStarted ? 'foreground_background' : 'foreground';

    const closed = maybeCloseTripFromSamples(sampleBuffer);
    if (closed) {
      sampleBuffer = sampleBuffer.filter((sample) => sample.timestamp > closed.consumedUntil);
      this.handleClosedTrip(closed.trip);
      await persistSampleBuffer();
    }
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
    this.engineState = 'stopped';
  }

  async getDiagnostics(): Promise<TrackingDiagnostics> {
    await loadSampleBuffer();
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

    return {
      foregroundPermission,
      backgroundPermission,
      taskManagerAvailable,
      backgroundRegistered,
      backgroundLimited,
      backgroundLimitedReason:
        this.backgroundLimitedReason ??
        (!taskManagerAvailable
          ? 'TaskManager is unavailable in this runtime.'
          : backgroundPermission !== Location.PermissionStatus.GRANTED
            ? 'Background location permission is not granted.'
            : !backgroundRegistered
              ? 'Background updates are not registered; foreground watch is still active while the app is open.'
              : null),
      lastSampleAt: this.lastSampleAt ?? sampleBuffer.at(-1)?.timestamp ?? null,
      sampleCount: sampleBuffer.length,
      engineState: this.engineState,
      automaticCaptureAvailable,
    };
  }

  handleClosedTrip(trip: TripRecord): void {
    if (isDuplicateAutoTrip(trip, this.closedTrips)) return;
    this.closedTrips = [trip, ...this.closedTrips].slice(0, 50);
    this.options.onTripClosed(trip);
  }

  markLastSample(timestamp: number): void {
    this.lastSampleAt = timestamp;
  }

  markBackgroundLimited(reason: string): void {
    this.backgroundLimitedReason = reason;
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
          pausesUpdatesAutomatically: true,
          showsBackgroundLocationIndicator: false,
          foregroundService: {
            notificationTitle: 'MileRecover is watching for work drives',
            notificationBody: 'Automatic capture is active while tracking is enabled.',
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

export function createTrackingController(options: TrackingControllerOptions): TrackingController {
  if (!singletonController) {
    singletonController = new TrackingControllerImpl(options);
  } else {
    singletonController.updateOptions(options);
  }
  return singletonController;
}
