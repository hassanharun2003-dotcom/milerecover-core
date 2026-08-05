import fs from 'fs';
import path from 'path';
import { ONBOARDING_STEP_ORDER } from '../src/product/types';
import {
  renderMainTabs,
  renderOnboarding,
  renderOnboardingWithInsets,
  renderStackScreen,
  renderTab,
} from '../src/testing/ScreenTestHarness';

const evidenceDir = path.join(__dirname, '..', '..', '..', 'docs', 'assets', 'ui-evidence');

describe('Screen render evidence', () => {
  beforeAll(() => {
    fs.mkdirSync(evidenceDir, { recursive: true });
  });

  it('captures onboarding step copy including each primary goal branch', async () => {
    const manifest: Record<string, string> = {};
    for (const step of ONBOARDING_STEP_ORDER) {
      const { copy } = await renderOnboarding(step);
      manifest[`onboarding-${step}`] = copy.slice(0, 500);
      expect(copy.length).toBeGreaterThan(20);
    }
    expect(manifest['onboarding-welcome']).toMatch(/MileRecover|Protect every work mile/i);
    expect(manifest['onboarding-purpose']).toMatch(
      /Employee|Self-employed|Delivery\/gig|Something else|Business|Gig|Mixed|What do you track mileage for|How do you use mileage/i,
    );
    expect(manifest['onboarding-locale_setup']).toMatch(/Country|units|rate|Miles|Kilometers/i);
    expect(manifest['onboarding-protect_drives']).toMatch(
      /Keep your drives protected|Protect future drives|Turn on drive protection|Enable drive protection|Set up protection|Not now|Skip for now/i,
    );
    expect(manifest['onboarding-ready']).toMatch(
      /You’re all set|You're all set|You’re ready|You're ready|Go to dashboard|Go to Home|Add my first drive/i,
    );

    for (const goal of ['employee_reimbursement', 'gig_delivery', 'self_employed_business', 'mixed'] as const) {
      const { copy } = await renderOnboarding('ready', { primaryGoal: goal });
      manifest[`onboarding-next-${goal}`] = copy.slice(0, 400);
      expect(copy.length).toBeGreaterThan(20);
    }

    fs.writeFileSync(path.join(evidenceDir, 'onboarding-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures truthful live Home and demo Home-with-review', async () => {
    const manifest: Record<string, string> = {};

    const liveHome = await renderMainTabs('new_user', {
      demoModeEnabled: false,
      protectionSetupState: 'not_started',
      preferredName: null,
    });
    manifest['home-live-empty'] = liveHome.copy.slice(0, 600);
    expect(liveHome.copy).toMatch(/Manual mode|Protection is ready|Drives protected|Needs attention|Paused/i);
    expect(liveHome.copy).toMatch(/Add a drive|protection|Next/i);
    expect(liveHome.copy).not.toContain('Alex Johnson');
    expect(liveHome.copy).not.toContain('87.6');
    expect(liveHome.copy).not.toContain('Airport pickup');
    expect(liveHome.copy).not.toMatch(/OTA VERIFIED/i);
    expect(liveHome.copy).not.toMatch(/Automatic tracking is not dependable/i);

    const reviewHome = await renderMainTabs('recovery_available');
    manifest['home-review-item'] = reviewHome.copy.slice(0, 600);
    expect(reviewHome.copy).toMatch(/Review \d+ possible drive|Distance|Drives|Estimated value|Next/i);

    fs.writeFileSync(path.join(evidenceDir, 'home-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures supporting stack screens including Plans monthly/annual', async () => {
    const manifest: Record<string, string> = {};
    const stacks: Array<[string, Parameters<typeof renderStackScreen>[0], Parameters<typeof renderStackScreen>[1]?]> = [
      ['bring-existing', 'BringExistingMileage'],
      ['import-preview', 'ImportPreview', undefined],
      ['manual-trip', 'ManualTrip'],
      ['trip-details', 'TripDetails', { tripId: 'trip-1' }],
      ['missing-recovery', 'MissingTripRecovery', { reviewId: 'review-recovery-1' }],
      ['protection-alert', 'ProtectionAlert'],
      ['tracking-active', 'TrackingActive'],
      ['vehicle-setup', 'VehicleSetup'],
      ['work-location-setup', 'WorkLocationSetup'],
      [
        'coming-later',
        'ComingLater',
        { title: 'Notifications', detail: 'Weekly digests are not available in this preview.' },
      ],
      ['export-report', 'ExportReport'],
      ['report-preview', 'ReportPreview', { format: 'pdf' }],
      ['plan-selection', 'PlanSelection', { source: 'profile' }],
      ['edit-setup', 'EditSetup'],
      ['privacy', 'Privacy'],
      ['help-support', 'HelpSupport'],
      ['about', 'About'],
    ];

    for (const [key, route, params] of stacks) {
      const product =
        key === 'import-preview'
          ? { importPhase: 'preview' as const, importFileLabel: 'Spreadsheet.csv' }
          : undefined;
      const { copy } = await renderStackScreen(route, params, product);
      manifest[key] = copy.slice(0, 500);
      expect(copy.length).toBeGreaterThan(10);
    }
    expect(manifest['manual-trip']).toMatch(/Add drive|Work|Personal|Decide later|Distance|Save/i);
    expect(manifest['tracking-active']).toMatch(/Tracking health|Run diagnostics|Open Protection Center/i);
    expect(manifest['help-support']).toMatch(/COMMON QUESTIONS|Common questions|Help|Review setup/i);
    expect(manifest['report-preview']).toMatch(/report|preview|work drive/i);
    expect(manifest['plan-selection']).toMatch(/Try Plus features|Current plan: Free|Free stays usable/i);
    expect(manifest['plan-selection']).toMatch(/Plus|Pro/i);
    expect(manifest['plan-selection']).not.toMatch(/RevenueCat/i);
    expect(manifest['edit-setup']).toMatch(/Update your answers|Adjust setup|Primary goal|Country/i);
    expect(manifest['privacy']).toMatch(/Privacy and data|local-first|Local-first|records miles/i);
    expect(manifest['coming-later']).toMatch(/Not available in this preview/i);
    expect(manifest['about']).toMatch(/About|version|Check for updates|Privacy/i);
    expect(manifest['plan-selection']).toMatch(/monthly|annual/i);
    expect(manifest['work-location-setup']).toMatch(/Home|Work|Client|Save|Familiar|place/i);
    manifest['plans-monthly'] = manifest['plan-selection'];
    manifest['plans-annual-toggle'] =
      'Fixed header billing toggle: Showing monthly — switch to annual / Showing annual — switch to monthly';

    fs.writeFileSync(path.join(evidenceDir, 'stack-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures empty Proof, demo Proof, empty Profile, and safe-area shell markers', async () => {
    const emptyProof = await renderTab('new_user', 'Proof', { demoModeEnabled: false });
    expect(emptyProof.copy).toMatch(
      /No trips yet|No confirmed work drives in this period|No work drives yet|No confirmed drives/i,
    );
    expect(emptyProof.copy).not.toMatch(/report is ready/i);

    const proofReady = await renderTab('proof_ready', 'Proof', { demoModeEnabled: true });
    expect(proofReady.copy).toMatch(
      /Corrections|Reports|Preview|CSV|Free CSV|Mileage reimbursement|Work mileage|Business mileage/i,
    );

    const proofBlocked = await renderTab('proof_blocked', 'Proof');
    expect(proofBlocked.copy).toMatch(/Needs details|Fix \d+ item|Corrections|Needs/i);

    const review = await renderTab('recovery_available', 'Review');
    expect(review.copy).toMatch(/Needs you|Possible drive|About 14\.2|Work|Personal|Not sure|Edit/i);

    const profile = await renderTab('new_user', 'Profile', {
      demoModeEnabled: false,
      preferredName: null,
      selectedPlan: 'free',
      vehicles: [],
      showDevTools: true,
    });
    expect(profile.copy).toContain('Vehicles');
    expect(profile.copy).toMatch(
      /IDENTITY|ACCOUNT|DRIVING|DATA|PLAN|SUPPORT|PREVIEW|Review setup|Reset app for testing/i,
    );
    expect(profile.copy).not.toContain('Alex Johnson');
    expect(profile.copy).not.toContain('alex@example.com');
    expect(profile.copy).toMatch(/Not set|Free|About/i);

    const insetWelcome = await renderOnboardingWithInsets('purpose', { top: 28, bottom: 20 });
    expect(insetWelcome.copy).toMatch(/Employee|Self-employed|Delivery\/gig|Something else|Business|Gig|Mixed|How do you use mileage/i);
    const shellSource = fs.readFileSync(
      path.join(__dirname, '../src/design-system/screenShell.tsx'),
      'utf8',
    );
    expect(shellSource).toContain('useSafeAreaInsets');
    expect(shellSource).toContain('paddingTop: insets.top');
    expect(shellSource).toContain('FixedHeaderScrollScreen');

    const tabsSource = fs.readFileSync(
      path.join(__dirname, '../src/navigation/RootTabs.tsx'),
      'utf8',
    );
    expect(tabsSource).toMatch(/Home|Review|Proof|Profile/);
  });
});
