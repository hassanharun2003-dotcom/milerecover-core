import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type ShareFailureReason = 'cancelled' | 'unavailable' | 'failed' | 'busy';

export type ShareResult =
  | { ok: true; uri: string; message: string }
  | { ok: false; reason: ShareFailureReason; message: string };

export const SHARE_COPY = {
  csvReady: 'CSV ready to share.',
  pdfReady: 'PDF ready to share.',
  ready: 'Ready to share.',
  busy: 'Your share sheet is already open.',
  failed: 'We couldn’t open sharing. Please try again.',
  unavailable: 'Sharing isn’t available on this device.',
  cancelled: 'Share cancelled.',
  preparingCsv: 'Preparing CSV…',
} as const;

let activeShare: Promise<ShareResult> | null = null;
const busyListeners = new Set<(busy: boolean) => void>();

function notifyBusy(busy: boolean): void {
  for (const listener of busyListeners) {
    listener(busy);
  }
}

export function isShareInFlight(): boolean {
  return activeShare != null;
}

export function subscribeShareInFlight(listener: (busy: boolean) => void): () => void {
  busyListeners.add(listener);
  listener(activeShare != null);
  return () => {
    busyListeners.delete(listener);
  };
}

/** Test-only: clear single-flight state between cases. */
export function resetShareControllerForTests(): void {
  activeShare = null;
  notifyBusy(false);
}

function successMessageForMime(mimeType: string): string {
  if (mimeType.includes('csv')) return SHARE_COPY.csvReady;
  if (mimeType.includes('pdf')) return SHARE_COPY.pdfReady;
  return SHARE_COPY.ready;
}

function humanizeShareError(error: unknown): { reason: ShareFailureReason; message: string } {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  if (/cancel/i.test(raw)) {
    return { reason: 'cancelled', message: SHARE_COPY.cancelled };
  }
  if (
    /another share request is being processed/i.test(raw) ||
    /share request is being processed/i.test(raw)
  ) {
    return { reason: 'busy', message: SHARE_COPY.busy };
  }
  // Never surface Expo / native stack text to the user.
  return { reason: 'failed', message: SHARE_COPY.failed };
}

async function runExclusive(task: () => Promise<ShareResult>): Promise<ShareResult> {
  if (activeShare) {
    return { ok: false, reason: 'busy', message: SHARE_COPY.busy };
  }
  const run = task();
  activeShare = run;
  notifyBusy(true);
  try {
    return await run;
  } finally {
    if (activeShare === run) {
      activeShare = null;
      notifyBusy(false);
    }
  }
}

export async function writeTextFile(filename: string, contents: string): Promise<string> {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    throw new Error('No writable directory is available on this device.');
  }
  const safeName = filename.replace(/[^\w.\-]+/g, '_');
  const uri = `${base}${safeName}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export async function deleteSharedFileSafe(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Best-effort cleanup; ignore if the OS still holds the file.
  }
}

/**
 * Single-flight share controller for the whole app.
 * Concurrent calls return a calm busy result instead of rejecting with Expo errors.
 */
export async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<ShareResult> {
  return runExclusive(async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        return { ok: false, reason: 'unavailable', message: SHARE_COPY.unavailable };
      }
      await Sharing.shareAsync(uri, { mimeType, dialogTitle });
      return { ok: true, uri, message: successMessageForMime(mimeType) };
    } catch (error) {
      const mapped = humanizeShareError(error);
      return { ok: false, reason: mapped.reason, message: mapped.message };
    }
  });
}

/**
 * Write once, share once, then clean up the temp file after the sheet resolves.
 * Claims the single-flight lock before writing so duplicate taps cannot create extra files.
 */
export async function writeAndShareTextFile(options: {
  filename: string;
  contents: string;
  mimeType: string;
  dialogTitle: string;
}): Promise<ShareResult> {
  return runExclusive(async () => {
    let uri: string;
    try {
      uri = await writeTextFile(options.filename, options.contents);
    } catch {
      return { ok: false, reason: 'failed', message: SHARE_COPY.failed };
    }
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        await deleteSharedFileSafe(uri);
        return { ok: false, reason: 'unavailable', message: SHARE_COPY.unavailable };
      }
      await Sharing.shareAsync(uri, {
        mimeType: options.mimeType,
        dialogTitle: options.dialogTitle,
      });
      return { ok: true, uri, message: successMessageForMime(options.mimeType) };
    } catch (error) {
      const mapped = humanizeShareError(error);
      return { ok: false, reason: mapped.reason, message: mapped.message };
    } finally {
      void deleteSharedFileSafe(uri);
    }
  });
}
