/**
 * Deterministic automatic-trip state machine.
 * Conservative start/stop — never invents distance or routes.
 */

export type TripMachineState =
  | 'IDLE'
  | 'POSSIBLE_MOVEMENT'
  | 'TRACKING'
  | 'POSSIBLE_STOP'
  | 'FINALIZING'
  | 'NEEDS_REVIEW'
  | 'FAILED_RECOVERABLE';

export type TripMachineEvent =
  | { type: 'SAMPLE_ACCEPTED'; moving: boolean }
  | { type: 'SAMPLE_REJECTED' }
  | { type: 'QUIET_ELAPSED' }
  | { type: 'EVIDENCE_SUFFICIENT' }
  | { type: 'EVIDENCE_INSUFFICIENT' }
  | { type: 'MANUAL_START' }
  | { type: 'MANUAL_STOP' }
  | { type: 'PROTECTION_OFF' }
  | { type: 'ENGINE_ERROR'; recoverable: boolean }
  | { type: 'RESET' };

export interface TripMachineTransition {
  from: TripMachineState;
  event: TripMachineEvent['type'];
  to: TripMachineState;
}

const ALLOWED: Record<TripMachineState, Partial<Record<TripMachineEvent['type'], TripMachineState>>> = {
  IDLE: {
    SAMPLE_ACCEPTED: 'POSSIBLE_MOVEMENT',
    MANUAL_START: 'TRACKING',
    PROTECTION_OFF: 'IDLE',
    RESET: 'IDLE',
  },
  POSSIBLE_MOVEMENT: {
    SAMPLE_ACCEPTED: 'TRACKING', // confirmed sustained movement
    SAMPLE_REJECTED: 'IDLE',
    QUIET_ELAPSED: 'IDLE',
    MANUAL_START: 'TRACKING',
    PROTECTION_OFF: 'IDLE',
    ENGINE_ERROR: 'FAILED_RECOVERABLE',
    RESET: 'IDLE',
  },
  TRACKING: {
    SAMPLE_ACCEPTED: 'TRACKING',
    QUIET_ELAPSED: 'POSSIBLE_STOP',
    MANUAL_STOP: 'FINALIZING',
    PROTECTION_OFF: 'FINALIZING',
    ENGINE_ERROR: 'FAILED_RECOVERABLE',
    RESET: 'IDLE',
  },
  POSSIBLE_STOP: {
    SAMPLE_ACCEPTED: 'TRACKING', // movement resumed
    QUIET_ELAPSED: 'FINALIZING',
    MANUAL_STOP: 'FINALIZING',
    PROTECTION_OFF: 'FINALIZING',
    ENGINE_ERROR: 'FAILED_RECOVERABLE',
    RESET: 'IDLE',
  },
  FINALIZING: {
    EVIDENCE_SUFFICIENT: 'NEEDS_REVIEW',
    EVIDENCE_INSUFFICIENT: 'FAILED_RECOVERABLE',
    ENGINE_ERROR: 'FAILED_RECOVERABLE',
    RESET: 'IDLE',
  },
  NEEDS_REVIEW: {
    RESET: 'IDLE',
    PROTECTION_OFF: 'IDLE',
    MANUAL_START: 'TRACKING',
  },
  FAILED_RECOVERABLE: {
    RESET: 'IDLE',
    MANUAL_START: 'TRACKING',
    SAMPLE_ACCEPTED: 'POSSIBLE_MOVEMENT',
    PROTECTION_OFF: 'IDLE',
  },
};

export function transitionTripMachine(
  state: TripMachineState,
  event: TripMachineEvent,
): { next: TripMachineState; changed: boolean } {
  // POSSIBLE_MOVEMENT only advances to TRACKING when sample indicates movement
  if (state === 'POSSIBLE_MOVEMENT' && event.type === 'SAMPLE_ACCEPTED') {
    const next: TripMachineState = event.moving ? 'TRACKING' : 'POSSIBLE_MOVEMENT';
    return { next, changed: next !== state };
  }
  if (state === 'IDLE' && event.type === 'SAMPLE_ACCEPTED') {
    const next: TripMachineState = event.moving ? 'POSSIBLE_MOVEMENT' : 'IDLE';
    return { next, changed: next !== state };
  }
  if (event.type === 'ENGINE_ERROR') {
    const mapped = ALLOWED[state].ENGINE_ERROR;
    if (!mapped) return { next: state, changed: false };
    const next = event.recoverable ? 'FAILED_RECOVERABLE' : mapped;
    return { next, changed: next !== state };
  }
  const next = ALLOWED[state][event.type];
  if (!next) return { next: state, changed: false };
  return { next, changed: next !== state };
}

/** Map engine runtime labels used by mobile into the machine + AppContext shell. */
export function mapEngineRuntimeToShell(
  runtime:
    | 'idle'
    | 'starting'
    | 'foreground'
    | 'foreground_background'
    | 'not_allowed'
    | 'permission_denied'
    | 'error'
    | 'stopped'
    | TripMachineState,
): 'active' | 'idle' | 'stopped' | 'unavailable' {
  switch (runtime) {
    case 'foreground':
    case 'foreground_background':
    case 'starting':
    case 'TRACKING':
    case 'POSSIBLE_MOVEMENT':
    case 'POSSIBLE_STOP':
    case 'FINALIZING':
      return 'active';
    case 'stopped':
    case 'IDLE':
    case 'NEEDS_REVIEW':
      return 'idle';
    case 'not_allowed':
    case 'permission_denied':
    case 'FAILED_RECOVERABLE':
    case 'error':
      return 'unavailable';
    default:
      return 'idle';
  }
}

export function isActivelyCapturing(state: TripMachineState): boolean {
  return state === 'TRACKING' || state === 'POSSIBLE_STOP' || state === 'FINALIZING';
}
