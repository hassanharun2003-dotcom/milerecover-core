import * as Updates from 'expo-updates';

export interface UpdateCheckResult {
  checked: boolean;
  available: boolean;
  downloaded: boolean;
  error: string | null;
}

export function updatesEnabled(): boolean {
  return !__DEV__ && Updates.isEnabled;
}

/** Check, download if available. Does not reload — caller applies on next restart or via reload. */
export async function checkAndDownloadUpdate(): Promise<UpdateCheckResult> {
  if (!updatesEnabled()) {
    return { checked: false, available: false, downloaded: false, error: null };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return { checked: true, available: false, downloaded: false, error: null };
    }
    const fetch = await Updates.fetchUpdateAsync();
    return {
      checked: true,
      available: true,
      downloaded: fetch.isNew,
      error: null,
    };
  } catch (error) {
    return {
      checked: true,
      available: false,
      downloaded: false,
      error: error instanceof Error ? error.message : 'Update check failed',
    };
  }
}

export async function applyPendingUpdate(): Promise<void> {
  if (!updatesEnabled()) return;
  await Updates.reloadAsync();
}

export function readUpdateMetadata(): {
  runtimeVersion: string | null;
  updateId: string | null;
  channel: string | null;
  createdAt: string | null;
} {
  return {
    runtimeVersion: Updates.runtimeVersion ?? null,
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
    createdAt: Updates.createdAt ? new Date(Updates.createdAt).toISOString() : null,
  };
}
