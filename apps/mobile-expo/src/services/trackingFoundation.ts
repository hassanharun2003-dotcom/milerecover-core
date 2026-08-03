/**
 * Production tracking foundation boundary.
 * Automatic trip capture is not enabled in this release candidate.
 * Manual trips, review, recovery confirmation, and reports remain fully functional.
 */

export type TrackingLifecycleState =
  | 'unavailable'
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export interface TrackingEnginePort {
  getState(): TrackingLifecycleState;
  start(): Promise<{ ok: false; reason: string }>;
  stop(): Promise<void>;
}

class PreviewTrackingEngine implements TrackingEnginePort {
  getState(): TrackingLifecycleState {
    return 'unavailable';
  }

  async start(): Promise<{ ok: false; reason: string }> {
    return {
      ok: false,
      reason:
        'Automatic capture is not available in this preview. Manual drives, review, and reports still work.',
    };
  }

  async stop(): Promise<void> {
    return;
  }
}

export const trackingEngine: TrackingEnginePort = new PreviewTrackingEngine();
