import {
  isShareInFlight,
  resetShareControllerForTests,
  SHARE_COPY,
  shareFile,
  subscribeShareInFlight,
  writeAndShareTextFile,
} from '../src/services/fileShare';

const mockShareAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();
const mockWriteAsStringAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///docs/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

describe('CSV single-flight sharing', () => {
  beforeEach(() => {
    resetShareControllerForTests();
    mockShareAsync.mockReset();
    mockIsAvailableAsync.mockReset();
    mockWriteAsStringAsync.mockReset();
    mockDeleteAsync.mockReset();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockWriteAsStringAsync.mockResolvedValue(undefined);
    mockDeleteAsync.mockResolvedValue(undefined);
  });

  it('ignores rapid double tap while a share is in flight', async () => {
    let release!: () => void;
    mockShareAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const first = shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    await Promise.resolve();
    expect(isShareInFlight()).toBe(true);

    const second = await shareFile('file:///cache/b.csv', 'text/csv', 'Share');
    expect(second).toEqual({ ok: false, reason: 'busy', message: SHARE_COPY.busy });
    expect(mockShareAsync).toHaveBeenCalledTimes(1);

    release();
    const done = await first;
    expect(done.ok).toBe(true);
    if (done.ok) expect(done.message).toBe(SHARE_COPY.csvReady);
    expect(isShareInFlight()).toBe(false);
  });

  it('returns calm busy copy while the share sheet stays open', async () => {
    const busyEvents: boolean[] = [];
    const unsubscribe = subscribeShareInFlight((busy) => busyEvents.push(busy));

    let release!: () => void;
    mockShareAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const pending = shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    await Promise.resolve();
    expect(busyEvents).toContain(true);

    const again = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(again.message).toBe(SHARE_COPY.busy);

    release();
    await pending;
    expect(isShareInFlight()).toBe(false);
    unsubscribe();
  });

  it('recovers after successful dismissal', async () => {
    mockShareAsync.mockResolvedValueOnce(undefined);
    const first = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(first.ok).toBe(true);

    mockShareAsync.mockResolvedValueOnce(undefined);
    const second = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(second.ok).toBe(true);
    expect(mockShareAsync).toHaveBeenCalledTimes(2);
  });

  it('maps genuine share failure to calm user copy without Expo text', async () => {
    mockShareAsync.mockRejectedValueOnce(
      new Error('Call to function ExpoSharing.shareAsync has been rejected.'),
    );
    const result = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(result).toEqual({ ok: false, reason: 'failed', message: SHARE_COPY.failed });
    expect(JSON.stringify(result)).not.toMatch(/ExpoSharing|rejected/i);
  });

  it('maps concurrent native share rejection to calm busy copy', async () => {
    mockShareAsync.mockRejectedValueOnce(
      new Error(
        'Call to function ExpoSharing.shareAsync has been rejected. Another share request is being processed now.',
      ),
    );
    const result = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(result).toEqual({ ok: false, reason: 'busy', message: SHARE_COPY.busy });
    expect(JSON.stringify(result)).not.toMatch(/ExpoSharing|rejected/i);
  });

  it('recovers after failure so a later share can succeed', async () => {
    mockShareAsync.mockRejectedValueOnce(new Error('native failure'));
    const failed = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(failed.ok).toBe(false);

    mockShareAsync.mockResolvedValueOnce(undefined);
    const ok = await shareFile('file:///cache/a.csv', 'text/csv', 'Share');
    expect(ok.ok).toBe(true);
  });

  it('writes one temp file for writeAndShareTextFile and cleans up', async () => {
    mockShareAsync.mockResolvedValueOnce(undefined);
    const result = await writeAndShareTextFile({
      filename: 'mile-export.csv',
      contents: 'a,b\n1,2\n',
      mimeType: 'text/csv',
      dialogTitle: 'Share',
    });
    expect(result.ok).toBe(true);
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
    expect(mockDeleteAsync).toHaveBeenCalledTimes(1);
  });

  it('does not write a second file when share is already open', async () => {
    let release!: () => void;
    mockShareAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const first = writeAndShareTextFile({
      filename: 'mile-export.csv',
      contents: 'one',
      mimeType: 'text/csv',
      dialogTitle: 'Share',
    });
    await Promise.resolve();
    const second = await writeAndShareTextFile({
      filename: 'mile-export.csv',
      contents: 'two',
      mimeType: 'text/csv',
      dialogTitle: 'Share',
    });
    expect(second.reason).toBe('busy');
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1);
    release();
    await first;
  });
});
