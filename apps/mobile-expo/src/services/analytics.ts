type AnalyticsValue = string | number | boolean;

export interface AnalyticsEvent {
  name: string;
  props: Record<string, AnalyticsValue>;
  createdAt: number;
}

/** Privacy-conscious event catalog — no coordinates, routes, purpose text, notes, plates, or report content. */
export const ANALYTICS_EVENTS = {
  onboardingStarted: 'onboarding_started',
  onboardingStepCompleted: 'onboarding_step_completed',
  onboardingStepViewed: 'onboarding_step_viewed',
  onboardingCompleted: 'onboarding_completed',
  goalSelected: 'goal_selected',
  countrySelected: 'country_selected',
  protectionSetupStarted: 'protection_setup_started',
  protectionSetupCompleted: 'protection_setup_completed',
  protectionDegradedViewed: 'protection_degraded_viewed',
  permissionEducationViewed: 'permission_education_viewed',
  permissionOutcome: 'permission_outcome',
  firstDriveSaved: 'first_drive_saved',
  firstAutomaticDriveCaptured: 'first_automatic_drive_captured',
  firstReviewDecision: 'first_review_decision',
  firstRecoveryCandidate: 'first_recovery_candidate',
  firstRecoveredDrive: 'first_recovered_drive',
  firstReportPreview: 'first_report_preview',
  firstExport: 'first_export',
  manualDriveAdded: 'manual_drive_added',
  uncertainDriveReviewed: 'uncertain_drive_reviewed',
  recoveryStarted: 'recovery_started',
  recoveryCompleted: 'recovery_completed',
  reportExportedCsv: 'report_exported_csv',
  reportExportedPdf: 'report_exported_pdf',
  trialOfferViewed: 'trial_offer_viewed',
  trialOfferTrigger: 'trial_offer_trigger',
  trialStarted: 'trial_started',
  trialDismissed: 'trial_dismissed',
  trialConverted: 'trial_converted',
  trialCancelled: 'trial_cancelled',
  subscriptionActivated: 'subscription_activated',
  subscriptionRenewed: 'subscription_renewed',
  subscriptionExpired: 'subscription_expired',
  planSelected: 'plan_selected',
  paywallViewed: 'paywall_viewed',
  paywallFrequencyCapApplied: 'paywall_frequency_cap_applied',
  trialOfferShown: 'trial_offer_shown',
  paywallShown: 'paywall_shown',
  purchaseStarted: 'purchase_started',
  purchaseCompleted: 'purchase_completed',
  purchaseFailed: 'purchase_failed',
  purchaseUnavailable: 'purchase_unavailable',
  rescueViewed: 'rescue_viewed',
  updateApplied: 'update_applied',
  trackingStarted: 'tracking_started',
  trackingStopped: 'tracking_stopped',
  autoTripClosed: 'auto_trip_closed',
  manualTripSaved: 'manual_trip_saved',
  importCompleted: 'import_completed',
  reportPreviewed: 'report_previewed',
} as const;

const PRIVATE_PROP_PATTERN =
  /(coordinate|latitude|longitude|lat|lng|purpose|notes?|plate|route|receipt|export_content)/i;
const bufferedEvents: AnalyticsEvent[] = [];

function sanitizeProps(props: Record<string, AnalyticsValue> = {}): Record<string, AnalyticsValue> {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !PRIVATE_PROP_PATTERN.test(key)),
  );
}

export function logEvent(name: string, props: Record<string, AnalyticsValue> = {}): void {
  try {
    const event: AnalyticsEvent = {
      name,
      props: sanitizeProps(props),
      createdAt: Date.now(),
    };

    if (__DEV__) {
      console.debug('[analytics]', event.name, event.props);
      return;
    }

    bufferedEvents.push(event);
    if (bufferedEvents.length > 100) {
      bufferedEvents.splice(0, bufferedEvents.length - 100);
    }
  } catch {
    // Analytics must never block mileage tracking or saving.
  }
}

export function getBufferedEvents(): AnalyticsEvent[] {
  return [...bufferedEvents];
}
