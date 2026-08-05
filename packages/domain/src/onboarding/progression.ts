export type OnboardingStep =
  | 'welcome'
  | 'location_permission'
  | 'motion_permission'
  | 'ready_check';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedMotion: boolean;
}

const ORDER: OnboardingStep[] = [
  'welcome',
  'location_permission',
  'motion_permission',
  'ready_check',
];

export function initialOnboardingProgress(): OnboardingProgress {
  return { currentStep: 'welcome', completedSteps: [], skippedMotion: false };
}

export function advanceOnboarding(
  progress: OnboardingProgress,
  action: 'next' | 'skip_motion'
): OnboardingProgress {
  const completed = new Set(progress.completedSteps);
  completed.add(progress.currentStep);

  let skippedMotion = progress.skippedMotion;
  if (action === 'skip_motion') {
    skippedMotion = true;
  }

  const idx = ORDER.indexOf(progress.currentStep);
  let nextIdx = idx + 1;
  if (action === 'skip_motion' && progress.currentStep === 'motion_permission') {
    nextIdx = ORDER.indexOf('ready_check');
  }

  const nextStep = ORDER[Math.min(nextIdx, ORDER.length - 1)] ?? 'ready_check';

  return {
    currentStep: nextStep,
    completedSteps: Array.from(completed),
    skippedMotion,
  };
}

export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return progress.completedSteps.includes('ready_check');
}
