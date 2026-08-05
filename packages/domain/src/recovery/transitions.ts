import type {
  RecoveryCandidateState,
  RecoveryConfidence,
  RecoveryTransitionAction,
  RecoveryTransitionResult,
} from './types';

const ALLOWED: Record<RecoveryCandidateState, RecoveryTransitionAction[]> = {
  detected: ['present_to_user', 'expire_unresolved'],
  inferred: ['present_to_user', 'expire_unresolved'],
  unresolved: ['present_to_user', 'user_confirm', 'user_correct', 'user_reject', 'expire_unresolved'],
  user_confirmed: [],
  user_corrected: [],
  rejected: [],
};

const NEXT_STATE: Partial<
  Record<`${RecoveryCandidateState}:${RecoveryTransitionAction}`, RecoveryCandidateState>
> = {
  'detected:present_to_user': 'unresolved',
  'inferred:present_to_user': 'unresolved',
  'unresolved:user_confirm': 'user_confirmed',
  'unresolved:user_correct': 'user_corrected',
  'unresolved:user_reject': 'rejected',
  'detected:expire_unresolved': 'unresolved',
  'inferred:expire_unresolved': 'unresolved',
  'unresolved:expire_unresolved': 'unresolved',
};

export function canTransition(
  state: RecoveryCandidateState,
  action: RecoveryTransitionAction
): boolean {
  return ALLOWED[state].includes(action);
}

export function applyRecoveryTransition(
  state: RecoveryCandidateState,
  action: RecoveryTransitionAction,
  confidence: RecoveryConfidence
): RecoveryTransitionResult {
  if (!canTransition(state, action)) {
    return { ok: false, error: `Transition ${action} not allowed from ${state}` };
  }

  if (action === 'user_confirm' && confidence === 'low') {
    return {
      ok: false,
      error: 'Low-confidence recovery requires review before confirmation.',
    };
  }

  const key = `${state}:${action}` as keyof typeof NEXT_STATE;
  const nextState = NEXT_STATE[key];
  if (!nextState) {
    return { ok: false, error: 'No next state defined' };
  }

  return { ok: true, nextState };
}
