import fs from 'fs';
import path from 'path';
import { createEmptyOnboardingState, CURRENT_ONBOARDING_VERSION, resolveReportPeriod } from '@milerecover/domain';
import { resolveLaunchState } from '../src/startup/launchState';
import { createInitialAppState } from '../src/store/types';
import {
  annualUsdFromMonthly,
  CATALOG_PLANS,
  catalogAnnualLabel,
  catalogMonthlyLabel,
  YEARLY_DISCOUNT_PERCENT,
  yearlySavingsLabel,
} from '../src/constants/pricing';
import { APP_RUNTIME_VERSION, APP_UPDATE_CHANNEL, APP_VERSION } from '../src/constants/buildInfo';
import { PLAN_FIXTURES } from '../src/fixtures/subscription';

const root = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('0.2.13 real-device correction regressions', () => {
  it('routes fresh install to onboarding before Home', () => {
    const fresh = resolveLaunchState({
      appHydrated: true,
      productHydrated: true,
      startupPhase: 'ready-empty',
      onboarding: createEmptyOnboardingState(1),
      tripCount: 0,
    });
    expect(fresh.showOnboarding).toBe(true);
    expect(fresh.allowHome).toBe(false);
  });

  it('routes returning completed users to Home', () => {
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

  it('does not treat trip data alone as completed onboarding (upgrade preservation gate)', () => {
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

  it('keeps Google auth before onboarding steps and never fakes success without credentials', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    const auth = read('src/services/auth.ts');
    expect(onboarding).toMatch(/account/);
    expect(onboarding).toMatch(/Continue with Google|isProviderAvailable\('google'\)/);
    expect(auth).toMatch(/googleConfigured/);
    expect(auth).toMatch(/AUTH_BACKEND_CONNECTED = false/);
    expect(auth).not.toMatch(/fake.*google|mock successful google/i);
  });

  it('Home has one primary contextual CTA and secondary missed-drives action', () => {
    const home = read('src/screens/home/HomeScreen.tsx');
    expect(home).toMatch(/Add your first drive/);
    expect(home).toMatch(/Check for missed drives/);
    expect(home).toMatch(/navigate\('ProtectionAlert'\)/);
    expect(home).toMatch(/Protection is on/);
    expect(home).toMatch(/Waiting for your first drive/);
    // Hero is status; explicit tracking-health link opens Protection Center.
    const heroBlock = home.match(/<MRHeroCard[\s\S]*?<\/MRHeroCard>/)?.[0] ?? '';
    expect(heroBlock).toContain('trackingLinkLabel');
    expect(heroBlock).toContain('openTrackingHealth');
    expect(heroBlock).not.toContain('MissingDrivesIntro');
    expect(home).toMatch(/View tracking health/);
    expect(home).toMatch(/openTrackingHealth/);
  });

  it('Import stays competitor-neutral before file detection', () => {
    const importScreen = read('src/screens/import/BringExistingMileageScreen.tsx');
    expect(importScreen).toMatch(/Choose an export or CSV/);
    expect(importScreen).toMatch(/current mileage app/i);
    expect(importScreen).not.toMatch(/MileIQ|Everlance|Driversnote|Stride/);
  });

  it('Proof period control label/data stay consistent', () => {
    const month = resolveReportPeriod('this_month', Date.UTC(2026, 7, 7));
    const quarter = resolveReportPeriod('this_quarter', Date.UTC(2026, 7, 7));
    const year = resolveReportPeriod('this_year', Date.UTC(2026, 7, 7));
    const ytd = resolveReportPeriod('ytd', Date.UTC(2026, 7, 7));
    expect(month.label.toLowerCase()).toContain('month');
    expect(month.label.toLowerCase()).not.toContain('year to date');
    expect(quarter.label).toMatch(/^Q3 2026$/);
    expect(year.label).toBe('2026');
    expect(ytd.label.toLowerCase()).toContain('year to date');

    const proof = read('src/screens/proof/ProofScreen.tsx');
    expect(proof).toMatch(/normalizePeriodKind/);
    expect(proof).toMatch(/Work drives you confirm will appear here/);

    const initial = createInitialAppState();
    expect(initial.reportingPeriod.id).toBe('this_month');
    expect(initial.reportingPeriod.label.toLowerCase()).toContain('month');
    expect(initial.reportingPeriod.label.toLowerCase()).not.toContain('year to date');
  });

  it('build version metadata is 0.2.16 and matches app config', () => {
    expect(APP_VERSION).toBe('0.2.16');
    expect(APP_RUNTIME_VERSION).toBe('0.2.16');
    expect(APP_UPDATE_CHANNEL).toBe('preview-foundation-0.2.16');
    const config = read('app.config.ts');
    expect(config).toMatch(/version: '0.2.16'/);
    expect(config).toMatch(/runtimeVersion: '0.2.16'/);
    const about = read('src/screens/about/AboutScreen.tsx');
    const profile = read('src/screens/profile/ProfileScreen.tsx');
    expect(about).toMatch(/APP_VERSION/);
    expect(profile).toMatch(/APP_VERSION/);
    expect(about).not.toMatch(/0\.2\.11/);
    expect(profile).not.toMatch(/0\.2\.11/);
  });

  it('plan prices have one source of truth and yearly Save % matches arithmetic', () => {
    const plus = CATALOG_PLANS.find((p) => p.id === 'plus')!;
    const pro = CATALOG_PLANS.find((p) => p.id === 'pro')!;
    expect(catalogMonthlyLabel('plus')).toBe('$9.99');
    expect(catalogMonthlyLabel('pro')).toBe('$19.99');
    expect(catalogAnnualLabel('plus')).toBe(`$${annualUsdFromMonthly(plus.monthlyUsd).toFixed(2)}`);
    expect(catalogAnnualLabel('pro')).toBe(`$${annualUsdFromMonthly(pro.monthlyUsd).toFixed(2)}`);
    expect(annualUsdFromMonthly(9.99)).toBeCloseTo(9.99 * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100), 2);
    expect(annualUsdFromMonthly(19.99)).toBeCloseTo(19.99 * 12 * (1 - YEARLY_DISCOUNT_PERCENT / 100), 2);
    expect(yearlySavingsLabel()).toBe('Save 20%');
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.monthlyPrice).toBe('$9.99');
    expect(PLAN_FIXTURES.find((p) => p.id === 'plus')?.annualPrice).toBe(catalogAnnualLabel('plus'));
    const plansUi = read('src/screens/flows/SupportingScreens.tsx');
    expect(plansUi).toMatch(/yearlySavingsLabel/);
    expect(plansUi).toMatch(/Purchases unavailable in this preview|Store unavailable|Unavailable in preview/);
    const nav = read('src/navigation/RootNavigator.tsx');
    expect(nav).toMatch(/title: 'Plans'/);
    expect(nav).not.toMatch(/Go Pro/);
  });

  it('Missing Drives artwork assets exist and ProductArt is wired', () => {
    const asset = path.join(root, 'assets/illustrations/missing-drives-route.png');
    expect(fs.existsSync(asset)).toBe(true);
    expect(fs.statSync(asset).size).toBeGreaterThan(500);
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    expect(supporting).toMatch(/MissingDrivesArt/);
    expect(supporting).toMatch(/Uses evidence/);
    expect(supporting).toMatch(/nothing is added without your/i);
    expect(supporting).toMatch(/Confirm work drive/);
  });

  it('Protection Center shows truthful statuses and one primary action pattern', () => {
    const supporting = read('src/screens/flows/SupportingScreens.tsx');
    expect(supporting).toMatch(/Foreground location/);
    expect(supporting).toMatch(/Background location/);
    expect(supporting).toMatch(/Automatic protection/);
    expect(supporting).toMatch(/Battery optimization/);
    expect(supporting).toMatch(/Waiting for your first drive/);
    expect(supporting).toMatch(/ProtectionArt/);
  });

  it('Notifications master state tracks OS permission with Open Settings', () => {
    const screen = read('src/screens/profile/NotificationsScreen.tsx');
    const service = read('src/services/notifications.ts');
    expect(screen).toMatch(/getNotificationPermission/);
    expect(screen).toMatch(/Open Settings/);
    expect(screen).toMatch(/osBlocked/);
    expect(service).toMatch(/openNotificationSettings/);
    // 0.2.14 requests notifications once during onboarding after location setup.
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    expect(onboarding).toMatch(/requestNotificationPermission/);
  });

  it('onboarding country selection uses ISO-driven CountryFlag badges', () => {
    const onboarding = read('src/screens/onboarding/OnboardingFlow.tsx');
    const edit = read('src/screens/profile/EditSetupScreen.tsx');
    const flag = read('src/components/CountryFlag.tsx');
    expect(onboarding).toMatch(/CountryFlag/);
    expect(edit).toMatch(/CountryFlag/);
    expect(flag).toMatch(/United States flag/);
    expect(flag).toMatch(/Canada flag/);
    expect(flag).toMatch(/United Kingdom flag/);
    expect(flag).toMatch(/Australia flag/);
  });

  it('offline tracking persists closed drives before geocode enrichment', () => {
    const engine = read('src/services/trackingEngine.ts');
    expect(engine).toMatch(/enqueuePendingTrip\(nextTrip\)/);
    expect(engine).toMatch(/temporary network loss cannot drop/);
    expect(engine).toMatch(/enrichTripEndpoints/);
  });
});
