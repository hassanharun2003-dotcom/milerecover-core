import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildMileageCsv, type PersistenceRepository, type TripRecord } from '@milerecover/domain';
import { loadProductUiState } from '../product/persistence';
import { PRODUCT_UI_STORAGE_KEYS } from '../product/types';
import { APP_STATE_STORAGE_KEYS } from '../persistence/AsyncStoragePersistenceRepository';
import { AUTH_SESSION_STORAGE_KEY } from './auth';
import {
  TRACKING_MACHINE_STORAGE_KEY,
  TRACKING_PENDING_TRIPS_KEY,
  TRACKING_SAMPLE_STORAGE_KEY,
} from './trackingEngine';
import { writeTextFile } from './fileShare';

export const LAST_MANUAL_PURPOSE_STORAGE_KEY = '@milerecover/last-manual-purpose';
export const LAST_MANUAL_VEHICLE_STORAGE_KEY = '@milerecover/last-manual-vehicle';

export const LOCAL_EXPERIENCE_STORAGE_KEYS = [
  ...PRODUCT_UI_STORAGE_KEYS,
  ...APP_STATE_STORAGE_KEYS,
  TRACKING_SAMPLE_STORAGE_KEY,
  TRACKING_MACHINE_STORAGE_KEY,
  TRACKING_PENDING_TRIPS_KEY,
  AUTH_SESSION_STORAGE_KEY,
  LAST_MANUAL_PURPOSE_STORAGE_KEY,
  LAST_MANUAL_VEHICLE_STORAGE_KEY,
] as const;

export interface UserDataExportBundle {
  exportedAt: string;
  preferredName: string | null;
  vehicleCount: number;
  workPlaceCount: number;
  tripCount: number;
  csv: string;
  productUiPresent: boolean;
}

export async function buildUserDataExport(input: {
  trips: TripRecord[];
  preferredName: string | null;
  vehicleCount: number;
  workPlaceCount: number;
}): Promise<UserDataExportBundle> {
  const now = Date.now();
  const csv = buildMileageCsv(input.trips, {
    periodStart: 0,
    periodEnd: now + 86400000,
  });
  const product = await loadProductUiState();
  return {
    exportedAt: new Date(now).toISOString(),
    preferredName: input.preferredName,
    vehicleCount: input.vehicleCount,
    workPlaceCount: input.workPlaceCount,
    tripCount: input.trips.length,
    csv,
    productUiPresent: Boolean(product),
  };
}

export async function writeUserDataExportFile(bundle: UserDataExportBundle): Promise<string> {
  const payload = JSON.stringify(
    {
      exportedAt: bundle.exportedAt,
      preferredName: bundle.preferredName,
      vehicleCount: bundle.vehicleCount,
      workPlaceCount: bundle.workPlaceCount,
      tripCount: bundle.tripCount,
      mileageCsv: bundle.csv,
      note: 'MileRecover local export. Exact coordinates and raw location history are not included.',
    },
    null,
    2,
  );
  return writeTextFile(`MileRecover-data-export-${bundle.exportedAt.slice(0, 10)}.json`, payload);
}

/** Clears every local app/product/onboarding/tracking/auth key used by the demo experience. */
export async function resetAppExperience(options: { appRepository?: PersistenceRepository } = {}): Promise<void> {
  await Promise.all([
    options.appRepository?.clear() ?? Promise.resolve(),
    AsyncStorage.multiRemove([...LOCAL_EXPERIENCE_STORAGE_KEYS]),
  ]);
}

/** Clears all local device data for privacy deletion and first-launch simulation. */
export async function clearLocalPrivacyCaches(): Promise<void> {
  await resetAppExperience();
}
