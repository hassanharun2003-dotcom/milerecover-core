import { Platform } from 'react-native';
import {
  AUTH_BACKEND_CONNECTED,
  getAuthPort,
  getGoogleAuthClientIdsForDiagnostics,
  googleConfigured,
  setAuthPortForTests,
  setGoogleAuthExtraForTests,
  type AuthPort,
  type AuthResult,
} from '../src/services/auth';
import { createEmptyOnboardingState, CURRENT_ONBOARDING_VERSION } from '@milerecover/domain';
import { resolveLaunchState } from '../src/startup/launchState';
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('Google auth + startup contract (0.2.13)', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    setGoogleAuthExtraForTests(null);
    setAuthPortForTests(null);
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOs });
  });

  it('requires both Android and Web client IDs on Android (never substitutes Web for Android)', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    setGoogleAuthExtraForTests({
      googleWebClientId: 'web-only.apps.googleusercontent.com',
    });
    expect(googleConfigured()).toBe(false);

    setGoogleAuthExtraForTests({
      googleAndroidClientId: 'android-only.apps.googleusercontent.com',
    });
    expect(googleConfigured()).toBe(false);

    setGoogleAuthExtraForTests({
      googleWebClientId: 'same.apps.googleusercontent.com',
      googleAndroidClientId: 'same.apps.googleusercontent.com',
    });
    expect(googleConfigured()).toBe(false);

    setGoogleAuthExtraForTests({
      googleWebClientId: 'web.apps.googleusercontent.com',
      googleAndroidClientId: 'android.apps.googleusercontent.com',
    });
    expect(googleConfigured()).toBe(true);
    const ids = getGoogleAuthClientIdsForDiagnostics();
    expect(ids.hasWebClientId).toBe(true);
    expect(ids.hasAndroidClientId).toBe(true);
  });

  it('hides Google provider when config is unavailable', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    setGoogleAuthExtraForTests({});
    expect(getAuthPort().isProviderAvailable('google')).toBe(false);
  });

  it('fresh install shows authentication-first welcome (not Home)', () => {
    const fresh = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: createEmptyOnboardingState(1),
      tripCount: 0,
    });
    expect(fresh.showOnboarding).toBe(true);
    expect(fresh.allowHome).toBe(false);
    expect(fresh.kind).toBe('firstLaunch');

    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/MileRecover/);
    expect(onboarding).toMatch(/Never lose a work mile/);
    expect(onboarding).toMatch(/Continue with Google/);
    expect(onboarding).toMatch(/Continue without an account/);
    expect(onboarding).toMatch(/enterOnboardingAfterAuth|setOnboardingStep\('purpose'\)/);
    expect(onboarding).not.toMatch(/Get started →/);
  });

  it('Google auth success continues into onboarding purpose, never invents Home unlock', async () => {
    const successPort: AuthPort = {
      isProviderAvailable: (provider) => provider === 'google',
      getSession: async () => null,
      signIn: async (): Promise<AuthResult> => ({
        ok: true,
        userId: 'google:test',
        email: 'driver@example.com',
        displayName: 'Test Driver',
        photoUrl: null,
        provider: 'google',
        backendLinked: false,
      }),
      signOut: async () => undefined,
    };
    setAuthPortForTests(successPort);
    const result = await getAuthPort().signIn('google');
    expect(result.ok).toBe(true);
    expect(AUTH_BACKEND_CONNECTED).toBe(false);

    // Launch still requires onboarding completion stamp — auth alone is insufficient.
    const afterAuthIncomplete = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: {
        ...createEmptyOnboardingState(1),
        accountStepAcknowledged: true,
        currentStep: 'purpose',
      },
      tripCount: 0,
    });
    expect(afterAuthIncomplete.allowHome).toBe(false);
    expect(afterAuthIncomplete.showOnboarding).toBe(true);
  });

  it('fresh user cannot bypass onboarding with trip data alone', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: createEmptyOnboardingState(1),
      tripCount: 9,
    });
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });

  it('partial onboarding resumes setup (not Home)', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: {
        ...createEmptyOnboardingState(1),
        accountStepAcknowledged: true,
        primaryGoal: 'employee_reimbursement',
        currentStep: 'locale_setup',
        countryStepAcknowledged: false,
      },
      tripCount: 0,
    });
    expect(result.kind).toBe('onboardingInProgress');
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });

  it('completed returning user opens Home', () => {
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
      tripCount: 2,
    });
    expect(completed.allowHome).toBe(true);
    expect(completed.showOnboarding).toBe(false);
  });

  it('upgrade with valid completion stamp preserves Home without re-onboarding', () => {
    const upgraded = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: {
        ...createEmptyOnboardingState(1),
        primaryGoal: 'gig_delivery',
        selectedPainPoints: ['forget_to_track'],
        countryStepAcknowledged: true,
        protectionEducationAcknowledged: true,
        permissionsEducationAcknowledged: true,
        nextActionSelected: 'start_protection',
        completedAt: Date.now() - 86_400_000,
        completedOnboardingVersion: CURRENT_ONBOARDING_VERSION,
      },
      tripCount: 40,
    });
    expect(upgraded.kind).toBe('returningUser');
    expect(upgraded.allowHome).toBe(true);
  });

  it('keeps country selection in onboarding and ISO CountryFlag wiring', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/locale_setup/);
    expect(onboarding).toMatch(/CountryFlag/);
    expect(onboarding).toMatch(/Set your region and mileage rate|Where do you drive|Country/);
  });

  it('defers notification permission until after Home unlock', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).not.toMatch(/requestNotificationPermission/);
    expect(onboarding).toMatch(/Notification permission is asked later/);
  });
});
