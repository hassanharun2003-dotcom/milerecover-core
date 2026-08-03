/** Recovery candidate lifecycle — do not collapse into generic trip status. */
export type RecoveryCandidateState =
  | 'detected'
  | 'inferred'
  | 'user_confirmed'
  | 'user_corrected'
  | 'rejected'
  | 'unresolved';

export type RecoveryConfidence = 'high' | 'medium' | 'low';

export interface RecoveryEvidenceRef {
  kind: 'gap' | 'calendar' | 'motion' | 'route_fragment';
  summary: string;
}

export interface RecoveryCandidate {
  id: string;
  state: RecoveryCandidateState;
  confidence: RecoveryConfidence;
  evidence: RecoveryEvidenceRef[];
  proposedStartAt: number;
  proposedEndAt: number;
  proposedDistanceMiles: number | null;
  plainLanguageExplanation: string;
}

export type RecoveryTransitionAction =
  | 'present_to_user'
  | 'user_confirm'
  | 'user_correct'
  | 'user_reject'
  | 'expire_unresolved';

export interface RecoveryTransitionResult {
  ok: boolean;
  nextState?: RecoveryCandidateState;
  error?: string;
}
