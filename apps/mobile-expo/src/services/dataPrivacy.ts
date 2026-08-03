import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildMileageCsv, type TripRecord } from '@milerecover/domain';
import { clearProductUiState, loadProductUiState } from '../product/persistence';
import { PRODUCT_UI_STORAGE_KEY } from '../product/types';
import { TRACKING_SAMPLE_STORAGE_KEY } from './trackingEngine';
import { writeTextFile } from './fileShare';

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

/** Clears product UI and tracking sample buffers. Domain trips are cleared via AppContext reset. */
export async function clearLocalPrivacyCaches(): Promise<void> {
  await clearProductUiState();
  await AsyncStorage.multiRemove([PRODUCT_UI_STORAGE_KEY, TRACKING_SAMPLE_STORAGE_KEY]);
}
