import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type ShareResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'unavailable' | 'failed'; message: string };

export async function writeTextFile(filename: string, contents: string): Promise<string> {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    throw new Error('No writable directory is available on this device.');
  }
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<ShareResult> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Sharing is not available on this device.',
    };
  }
  try {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
    return { ok: true, uri };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share failed.';
    if (/cancel/i.test(message)) {
      return { ok: false, reason: 'cancelled', message: 'Share cancelled.' };
    }
    return { ok: false, reason: 'failed', message };
  }
}
