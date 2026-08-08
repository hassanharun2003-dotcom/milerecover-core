import fs from 'fs';
import path from 'path';
import { formatActiveRateLabel, localeProfileFromCountry } from '@milerecover/domain';
import { createEmptyOnboardingState, CURRENT_ONBOARDING_VERSION } from '@milerecover/domain';
import { resolveLaunchState } from '../src/startup/launchState';
import { PLAN_FIXTURES } from '../src/fixtures/subscription';

const root = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('Figma production lock regressions (retained + 0.2.13)', () => {
  it('routes fresh install to onboarding and completed setup to Home', () => {
    const fresh = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: createEmptyOnboardingState(1),
      tripCount: 0,
    });
    expect(fresh.showOnboarding).toBe(true);
    expect(fresh.allowHome).toBe(false);

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
      tripCount: 0,
    });
    expect(completed.allowHome).toBe(true);
    expect(completed.showOnboarding).toBe(false);
  });

  it('does not treat trip data alone as completed onboarding', () => {
    const result = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-with-data',
      onboarding: createEmptyOnboardingState(1),
      tripCount: 12,
    });
    expect(result.allowHome).toBe(false);
    expect(result.showOnboarding).toBe(true);
  });

  it('formats US mileage rate as dollars per mile without cents wording', () => {
    const profile = localeProfileFromCountry('US', { now: 1_700_000_000_000 });
    const label = formatActiveRateLabel(profile);
    expect(label).toBe('$0.70 / mile');
    expect(label.toLowerCase()).not.toMatch(/cent/);
  });

  it('keeps a single Home primary Add-drive CTA (no duplicate floating add)', () => {
    const home = read('src/screens/home/HomeScreen.tsx');
    expect(home).not.toMatch(/\+\s*Add a drive/);
    // Contextual primary + optional secondary "Check for missed drives" is the locked pattern.
    expect(home).toMatch(/Check for missed drives/);
  });

  it('keeps import pre-detection copy competitor-neutral', () => {
    const importScreen = read('src/screens/import/BringExistingMileageScreen.tsx');
    expect(importScreen).toMatch(/Choose an export or CSV|Bring your mileage|CSV/i);
    expect(importScreen).not.toMatch(/MileIQ|Everlance|Stride(?!\s)/);
  });

  it('presents Free / Plus / Pro with locked prices and useful Free', () => {
    const free = PLAN_FIXTURES.find((p) => p.id === 'free');
    const plus = PLAN_FIXTURES.find((p) => p.id === 'plus');
    const pro = PLAN_FIXTURES.find((p) => p.id === 'pro');
    expect(free).toBeTruthy();
    expect(plus?.monthlyPrice).toMatch(/9\.99/);
    expect(pro?.monthlyPrice).toMatch(/19\.99/);
    expect(free?.features.length).toBeGreaterThan(0);
  });

  it('wires locked illustrations for priority flows', () => {
    const illustration = read('src/components/FigmaIllustration.tsx');
    for (const key of [
      'welcomeProtection',
      'trackingCar',
      'readySuccess',
      'missingDrivesRoute',
      'missingNoResults',
      'recoverySuccess',
      'protectionHero',
    ]) {
      expect(illustration).toContain(key);
    }
    const productArt = read('src/components/ProductArt.tsx');
    expect(productArt).toMatch(/MissingDrivesArt|WelcomeArt|ProtectionArt|ReadyArt/);
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/MileRecover|Never lose a work mile/);
    expect(onboarding).toMatch(/Automatic protection is on|manual logging is ready/);
    expect(onboarding).toMatch(/Turn on automatic tracking/);
    expect(onboarding).toMatch(/requestNotificationPermission/);
  });

  it('requires confirmation before missing-drive recovery creates records', () => {
    const recovery = read('src/screens/flows/SupportingScreens.tsx');
    expect(recovery).toMatch(/Confirm work drive/);
    expect(recovery).toMatch(/confirmRecovery\(/);
    expect(recovery).toMatch(/Miles recovered/);
    expect(recovery).toMatch(/Nothing is added without your/i);
  });

  it('supports Review batch classification for similar drives', () => {
    const review = read('src/screens/review/ReviewScreen.tsx');
    expect(review).toMatch(/Classify quickly/);
    expect(review).toMatch(/Confirm classifications/);
    expect(review).toMatch(/Mark several similar drives at once/);
  });

  it('requests notification permission after location setup in onboarding', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/requestNotificationPermission/);
    expect(onboarding).toMatch(/Get alerts when a drive needs your attention/);
  });

  it('keeps review-prompt cooldown at 90 days and gates on positive events', () => {
    const prompt = read('src/services/reviewPrompt.ts');
    expect(prompt).toMatch(/COOLDOWN_MS = 1000 \* 60 \* 60 \* 24 \* 90/);
    expect(prompt).toMatch(/MIN_POSITIVE_EVENTS = 1/);
    expect(prompt).toMatch(/Never call during onboarding/);
  });
});
