type AnalyticsValue = string | number | boolean;

export interface AnalyticsEvent {
  name: string;
  props: Record<string, AnalyticsValue>;
  createdAt: number;
}

export const ANALYTICS_EVENTS = {
  onboardingStarted: 'onboarding_started',
  onboardingStepViewed: 'onboarding_step_viewed',
  onboardingCompleted: 'onboarding_completed',
  trialOfferShown: 'trial_offer_shown',
  paywallShown: 'paywall_shown',
  purchaseUnavailable: 'purchase_unavailable',
  trackingStarted: 'tracking_started',
  trackingStopped: 'tracking_stopped',
  autoTripClosed: 'auto_trip_closed',
  manualTripSaved: 'manual_trip_saved',
  importCompleted: 'import_completed',
  reportPreviewed: 'report_previewed',
} as const;

const PRIVATE_PROP_PATTERN = /(coordinate|latitude|longitude|lat|lng|purpose|notes?)/i;
const bufferedEvents: AnalyticsEvent[] = [];

function sanitizeProps(props: Record<string, AnalyticsValue> = {}): Record<string, AnalyticsValue> {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !PRIVATE_PROP_PATTERN.test(key)),
  );
}

export function logEvent(name: string, props: Record<string, AnalyticsValue> = {}): void {
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
}

export function getBufferedEvents(): AnalyticsEvent[] {
  return [...bufferedEvents];
}
