import fs from 'fs';
import path from 'path';
import {
  createEmptyOnboardingState,
  CURRENT_ONBOARDING_VERSION,
  localeProfileFromCountry,
  resolveProtectionStatus,
  resolveReportPeriod,
} from '@milerecover/domain';
import { resolveLaunchState } from '../src/startup/launchState';
import { createInitialAppState } from '../src/store/types';
import {
  annualUsdFromMonthly,
  catalogAnnualLabel,
  catalogMonthlyLabel,
  YEARLY_DISCOUNT_PERCENT,
  yearlySavingsLabel,
} from '../src/constants/pricing';
import {
  APP_RUNTIME_VERSION,
  APP_UPDATE_CHANNEL,
  APP_VERSION,
  APP_BUILD_LABEL,
} from '../src/constants/buildInfo';
import {
  AUTH_SLOW_MESSAGE,
  AUTH_SIGNIN_TIMEOUT_MS,
} from '../src/services/auth';
import { PLAN_FIXTURES } from '../src/fixtures/subscription';

const root = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('0.2.14 real-device UX simplification', () => {
  it('uses honest Google loading labels and prevents duplicate taps', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    const button = read('src/design-system/imageLock.tsx');
    const auth = read('src/services/auth.ts');
    expect(onboarding).toMatch(/Opening Google…/);
    expect(onboarding).toMatch(/Signing you in…/);
    expect(onboarding).toMatch(/authTapGuard/);
    expect(onboarding).not.toMatch(/One moment…/);
    expect(button).toMatch(/loadingLabel/);
    expect(button).toMatch(/ActivityIndicator/);
    expect(button).not.toMatch(/loading \? 'One moment…'/);
    expect(auth).toMatch(/warmGoogleSignIn/);
    expect(auth).toMatch(/logAuthTiming/);
    expect(auth).toContain(AUTH_SLOW_MESSAGE);
    expect(AUTH_SIGNIN_TIMEOUT_MS).toBeGreaterThanOrEqual(10_000);
    expect(auth).toMatch(/void GoogleSignin\.getTokens/);
  });

  it('Google success enters purpose onboarding without Home intermediary', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/enterOnboardingAfterAuth/);
    expect(onboarding).toMatch(/setOnboardingStep\('purpose'\)/);
    expect(onboarding).not.toMatch(/finishOnboarding\(\);\s*\n\s*return;/);
    const authBlock = onboarding.match(/const tryAuth[\s\S]*?const authFooter/)?.[0] ?? '';
    expect(authBlock).toContain('enterOnboardingAfterAuth');
    expect(authBlock).not.toContain('finishOnboarding');
  });

  it('numbers onboarding as 1–4 excluding Welcome/auth', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/VISIBLE_ONBOARDING_STEPS/);
    expect(onboarding).toMatch(/'purpose'/);
    expect(onboarding).toMatch(/'locale_setup'/);
    expect(onboarding).toMatch(/'protect_drives'/);
    expect(onboarding).toMatch(/'ready'/);
    expect(onboarding).toMatch(/Purpose = 1 of 4/);
    // Must not keep the old “2 of 5” welcome-excluded-but-account-included model.
    expect(onboarding).not.toMatch(/2 of 5/);
    expect(onboarding).not.toMatch(/excluding Welcome \(Purpose shows/);
  });

  it('protection setup is one coherent screen with truthful Ready copy', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/Turn on automatic tracking/);
    expect(onboarding).toMatch(/Protect my drives/);
    expect(onboarding).toMatch(/Allow location so MileRecover can detect drives automatically/);
    expect(onboarding).toMatch(/Automatic protection is on/);
    expect(onboarding).toMatch(/Setup complete — manual logging is ready/);
    expect(onboarding).toMatch(/requestNotificationPermission/);
    expect(onboarding).not.toMatch(/protectionPhase === 'tracking'/);
    expect(onboarding).not.toMatch(/Set up tracking/);
    expect(onboarding).not.toMatch(/Allow when prompted/);
    expect(onboarding).not.toMatch(/Automatic tracking is prepared/);
    expect(onboarding).not.toMatch(/Notification permission is asked later/);
  });

  it('tracking setup truth table maps OS permission states', () => {
    const base = {
      trackingEnabled: true,
      canUseAutomaticCapture: true,
      trackingEngineState: 'idle' as const,
      lastConfirmedCaptureAt: null as number | null,
      lastSyncAt: null as number | null,
      pendingReviewCount: 0,
      now: Date.now(),
    };
    const none = resolveProtectionStatus({
      ...base,
      permissions: {
        location: 'denied',
        backgroundLocation: 'denied',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      },
    });
    expect(none.state).toBe('NEEDS_PERMISSION');

    const fgOnly = resolveProtectionStatus({
      ...base,
      permissions: {
        location: 'granted',
        backgroundLocation: 'denied',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      },
    });
    expect(fgOnly.state).toBe('NEEDS_PERMISSION');
    expect(fgOnly.message.toLowerCase()).toMatch(/background|location/);

    const bgOk = resolveProtectionStatus({
      ...base,
      permissions: {
        location: 'granted',
        backgroundLocation: 'granted',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      },
    });
    expect(['CONFIGURED_WAITING', 'PROTECTED']).toContain(bgOk.state);

    const manual = resolveProtectionStatus({
      ...base,
      trackingEnabled: false,
      manualMode: true,
      permissions: {
        location: 'denied',
        backgroundLocation: 'denied',
        motion: 'not_applicable',
        batteryOptimizationRestricted: false,
      },
    });
    expect(manual.state).toBe('MANUAL_ONLY');
  });

  it('Home protection hero is status-first with explicit tracking health action', () => {
    const home = read('src/screens/home/HomeScreen.tsx');
    expect(home).toMatch(/View tracking health/);
    expect(home).toMatch(/Fix tracking/);
    expect(home).toMatch(/Protection is on/);
    expect(home).toMatch(/Waiting for your first drive/);
    expect(home).toMatch(/Add your first drive/);
    expect(home).toMatch(/Check for missed drives/);
    // Hero card itself is status-only; explicit link inside opens tracking health.
    expect(home).toMatch(/<MRHeroCard\n\s*accessibilityLabel=/);
    expect(home).not.toMatch(/<MRHeroCard[^>]*onPress=\{open/);
    expect(home).toMatch(/trackingLinkLabel/);
    expect(home).toMatch(/openTrackingHealth/);
    // No duplicate protection status banner under the hero.
    expect(home).not.toMatch(/MRStatusPanel/);
    expect(home).not.toMatch(/Protection is on — waiting for your first drive/);
  });

  it('Profile Tracking health uses the same Protection Center remediation', () => {
    const profile = read('src/screens/profile/ProfileScreen.tsx');
    expect(profile).toMatch(/Tracking health/);
    expect(profile).toMatch(/ProtectionAlert/);
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    expect(supporting).toMatch(/Foreground location/);
    expect(supporting).toMatch(/Background location/);
    expect(supporting).toMatch(/Automatic protection/);
  });

  it('notification state mapping avoids Home re-nag after answer', () => {
    const notifications = read('src/services/notifications.ts');
    const bootstrap = read('src/components/NotificationBootstrap.tsx');
    const screen = read('src/screens/profile/NotificationsScreen.tsx');
    expect(notifications).toMatch(/not_determined/);
    expect(bootstrap).toMatch(/getNotificationPermission/);
    expect(bootstrap).not.toMatch(/requestNotificationPermission/);
    expect(screen).toMatch(/Open Settings/);
    expect(screen).toMatch(/osBlocked/);
  });

  it('country/unit/rate remain a single localeProfile source of truth', () => {
    const us = localeProfileFromCountry('US');
    const ca = localeProfileFromCountry('CA');
    expect(us.distanceUnit).toBe('mi');
    expect(ca.distanceUnit).toBe('km');
    expect(ca.rates[0]?.centsPerMile).toBeGreaterThan(0);
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    const edit = read('src/screens/profile/EditSetupScreen.tsx');
    expect(onboarding).toMatch(/setLocaleProfile/);
    expect(onboarding).toMatch(/localeProfileFromCountry/);
    expect(edit).toMatch(/setLocaleProfile/);
    expect(edit).toMatch(/localeProfileFromCountry/);
  });

  it('Add Drive keeps progressive disclosure for optional fields', () => {
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    const manual = supporting.match(/export function ManualTripScreen[\s\S]*?^export function /m)?.[0] ?? supporting;
    expect(manual).toMatch(/More details/);
    expect(manual).toMatch(/showDetails/);
    expect(manual).toMatch(/Work/);
    expect(manual).toMatch(/Personal/);
    expect(manual).toMatch(/Start address/);
    expect(manual).toMatch(/End address/);
    expect(manual).toMatch(/Distance/);
    expect(manual).toMatch(/Add time/);
    expect(manual).toMatch(/Parking|parking/);
    expect(manual).toMatch(/Toll|toll/);
  });

  it('Missing Drives free-scan and preview paywall avoid dead ends', () => {
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    expect(supporting).toMatch(/Free scan used for/);
    expect(supporting).toMatch(/Unlimited scans are available with Plus when purchases are enabled/);
    expect(supporting).toMatch(/Back to Review/);
    expect(supporting).toMatch(/Upgrade for unlimited scans/);
    expect(supporting).toMatch(/isPreviewBillingBuild/);
    expect(supporting).not.toMatch(/You've used this month's free scan/);
  });

  it('Plans are compact with preview-unavailable CTAs and correct pricing', () => {
    expect(catalogMonthlyLabel('plus')).toBe('$9.99');
    expect(catalogMonthlyLabel('pro')).toBe('$19.99');
    expect(catalogAnnualLabel('plus')).toBe(`$${annualUsdFromMonthly(9.99).toFixed(2)}`);
    expect(catalogAnnualLabel('pro')).toBe(`$${annualUsdFromMonthly(19.99).toFixed(2)}`);
    expect(annualUsdFromMonthly(9.99)).toBeCloseTo(9.99 * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100), 2);
    expect(yearlySavingsLabel()).toBe('Save 20%');
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$9.99');
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    expect(supporting).toMatch(/Unavailable in preview/);
    expect(supporting).toMatch(/Purchases unavailable in this preview/);
    expect(supporting).toMatch(/Current plan:/);
  });

  it('Proof empty state stays in period lockstep with one primary action', () => {
    const month = resolveReportPeriod('this_month', Date.UTC(2026, 7, 8));
    expect(month.label.toLowerCase()).toContain('month');
    const proof = read('src/screens/proof/ProofScreen.tsx');
    expect(proof).toMatch(/No work drives in \{period\.label\.toLowerCase\(\)\}/);
    expect(proof).toMatch(/Work drives you confirm will appear here/);
    expect(proof).toMatch(/MRTertiaryButton/);
    expect(proof).toMatch(/Check for missed drives/);
    expect(proof).not.toMatch(/EmptyProofArt/);
    expect(proof).not.toMatch(/Work-classified drives populate reports/);
    const initial = createInitialAppState();
    expect(initial.reportingPeriod.id).toBe('this_month');
  });

  it('returning completed users still go to Home', () => {
    const completed = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: {
        ...createEmptyOnboardingState(1),
        primaryGoal: 'employee_reimbursement',
        selectedPainPoints: ['forget_to_track'],
        countryStepAcknowledged: true,
        protectionEducationAcknowledged: true,
        permissionsEducationAcknowledged: true,
        nextActionSelected: 'go_home',
        completedAt: 1,
        completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      },
      tripCount: 3,
    });
    expect(completed.allowHome).toBe(true);
    expect(completed.showOnboarding).toBe(false);
  });

  it('onboarding artwork respects reduced-motion with one-shot animations', () => {
    const art = read('src/components/ProductArt.tsx');
    expect(art).toMatch(/useReduceMotion/);
    expect(art).toMatch(/reduceMotionChanged/);
    expect(art).toMatch(/WelcomeArt/);
    expect(art).toMatch(/TrackingArt/);
    expect(art).toMatch(/ReadyArt/);
    // Tracking should not aggressively loop in 0.2.14.
    const tracking = art.match(/export function TrackingArt[\s\S]*?^export function /m)?.[0] ?? '';
    expect(tracking).not.toMatch(/Animated\.loop/);
    expect(tracking).toMatch(/One-shot entry motion|duration: 1000/);
  });

  it('build version metadata is 0.2.16', () => {
    expect(APP_VERSION).toBe('0.2.16');
    expect(APP_RUNTIME_VERSION).toBe('0.2.16');
    expect(APP_UPDATE_CHANNEL).toBe('preview-foundation-0.2.16');
    expect(APP_BUILD_LABEL).toMatch(/^0\.2\.16/);
    const config = read('app.config.ts');
    expect(config).toMatch(/version: '0\.2\.16'/);
    expect(config).toMatch(/runtimeVersion: '0\.2\.16'/);
  });
});
