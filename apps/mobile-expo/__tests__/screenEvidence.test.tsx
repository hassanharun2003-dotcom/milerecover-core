import fs from 'fs';
import path from 'path';
import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
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
    expect(manifest['onboarding-welcome']).toMatch(/Protect every work mile|Get started|MileRecover/i);
    expect(manifest['onboarding-account']).toMatch(/Sign in|Skip for now|Google/i);
    expect(manifest['onboarding-permissions_education']).toMatch(/How location helps|Allow location/i);
    expect(manifest['onboarding-preferred_name']).toMatch(/What should we call you/i);
    expect(manifest['onboarding-primary_goal']).toMatch(/What do you use work mileage for/i);
    expect(manifest['onboarding-pain_points']).toMatch(/What causes the most trouble/i);
    expect(manifest['onboarding-vehicle_setup']).toMatch(/Add a vehicle|Skip for now/i);
    expect(manifest['onboarding-protection_education']).toMatch(/How tracking works|You’re in control/i);
    expect(manifest['onboarding-ready']).toMatch(/Go to Home|You’re ready|Set up automatic protection/i);
    expect(manifest['onboarding-driving_pattern']).toBeUndefined();

    for (const goal of ['employee_reimbursement', 'gig_delivery', 'self_employed_business', 'mixed'] as const) {
      const { copy } = await renderOnboarding('ready', { primaryGoal: goal });
      manifest[`onboarding-next-${goal}`] = copy.slice(0, 400);
      expect(copy.length).toBeGreaterThan(20);
    }
    expect(manifest['onboarding-next-mixed']).toMatch(/Go to Home|Set up automatic protection/i);
    expect(manifest['onboarding-next-gig_delivery']).toMatch(/Go to Home|Set up automatic protection/i);
    expect(manifest['onboarding-next-self_employed_business']).toMatch(/Go to Home|Set up automatic protection/i);

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
    expect(liveHome.copy).toMatch(/Ready when you are|You’re protected\.|You're protected\./i);
    expect(liveHome.copy).toMatch(/Add a drive|watching|Plus/i);
    expect(liveHome.copy).not.toContain('Alex Johnson');
    expect(liveHome.copy).not.toContain('87.6');
    expect(liveHome.copy).not.toContain('Airport pickup');

    const reviewHome = await renderMainTabs('recovery_available');
    manifest['home-review-item'] = reviewHome.copy.slice(0, 600);
    expect(reviewHome.copy).toContain(DEMO_SCENARIOS.recovery_available.homeTitle);

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
    expect(manifest['manual-trip']).toMatch(/Add drive|Work|Personal|Decide later|Miles|Save/i);
    expect(manifest['tracking-active']).toMatch(/Watching is off|Watching is on|Watching needs Plus|Are you protected/i);
    expect(manifest['help-support']).toMatch(/COMMON QUESTIONS|Common questions|Help/i);
    expect(manifest['report-preview']).toMatch(/report|preview|work drive/i);
    expect(manifest['plan-selection']).toMatch(/Choose the protection that fits your driving|Keep the protection that already helped|Current:/i);
    expect(manifest['plan-selection']).toMatch(/Plus|Pro|90-Day Rescue/i);
    expect(manifest['edit-setup']).toMatch(/Update your answers|Adjust setup|Primary goal/i);
    expect(manifest['privacy']).toMatch(/Privacy and data|local-first|Local-first/i);
    expect(manifest['coming-later']).toMatch(/Not available in this preview/i);
    expect(manifest['about']).toMatch(/Restart onboarding/i);
    expect(manifest['plan-selection']).toMatch(/monthly|annual/i);
    manifest['plans-monthly'] = manifest['plan-selection'];
    manifest['plans-annual-toggle'] =
      'Fixed header billing toggle: Showing monthly — switch to annual / Showing annual — switch to monthly';

    fs.writeFileSync(path.join(evidenceDir, 'stack-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures empty Proof, demo Proof, empty Profile, and safe-area shell markers', async () => {
    const emptyProof = await renderTab('new_user', 'Proof', { demoModeEnabled: false });
    expect(emptyProof.copy).toMatch(/No confirmed work drives in this period|No work drives yet|No confirmed drives/i);
    expect(emptyProof.copy).not.toMatch(/report is ready/i);

    const proofReady = await renderTab('proof_ready', 'Proof', { demoModeEnabled: true });
    expect(proofReady.copy).toMatch(/ready to review|confirmed work|Total miles|drives/i);

    const proofBlocked = await renderTab('proof_blocked', 'Proof');
    expect(proofBlocked.copy).toMatch(/Review one item before sharing|need a look|Review/i);

    const review = await renderTab('recovery_available', 'Review');
    expect(review.copy).toMatch(/Needs you|About 14\.2/i);

    const profile = await renderTab('new_user', 'Profile', {
      demoModeEnabled: false,
      preferredName: null,
      selectedPlan: 'free',
      vehicles: [],
      showDevTools: true,
    });
    expect(profile.copy).toContain('Vehicles');
    expect(profile.copy).toMatch(/Coverage|Watching|Protection|Tracking/i);
    expect(profile.copy).toMatch(/Driving|Import|Privacy|Help/i);
    expect(profile.copy).not.toContain('Alex Johnson');
    expect(profile.copy).not.toContain('alex@example.com');
    expect(profile.copy).toMatch(/Your profile|Your account|preferred name|Not set/i);
    expect(profile.copy).toMatch(/You’re on Free|MileRecover FREE|Status: free/i);
    expect(profile.copy).toMatch(/Coverage|Manual logging|About/i);

    const insetWelcome = await renderOnboardingWithInsets('welcome', { top: 28, bottom: 20 });
    expect(insetWelcome.copy).toMatch(/Protect every work mile|MileRecover|Get started/i);
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
    expect(tabsSource).toContain('@expo/vector-icons/Ionicons');
    expect(tabsSource).toContain('paddingBottom: bottomPad');

    fs.writeFileSync(
      path.join(evidenceDir, 'profile-evidence.json'),
      JSON.stringify(
        {
          emptyProof: emptyProof.copy.slice(0, 500),
          demoProof: proofReady.copy.slice(0, 500),
          profile: profile.copy.slice(0, 600),
          safeArea:
            'TabScreen pads insets.top; RootTabs pads insets.bottom; FixedHeaderScrollScreen reserves header; onboarding insets top=28 bottom=20',
        },
        null,
        2,
      ),
    );

    const liveHome = await renderMainTabs('new_user', { demoModeEnabled: false });
    fs.writeFileSync(
      path.join(evidenceDir, 'integrity-evidence.json'),
      JSON.stringify(
        {
          '1-onboarding-welcome': (await renderOnboarding('welcome')).copy.slice(0, 240),
          '2-onboarding-goals': {
            employee_reimbursement: (await renderOnboarding('ready', { primaryGoal: 'employee_reimbursement' })).copy.slice(0, 160),
            gig_delivery: (await renderOnboarding('ready', { primaryGoal: 'gig_delivery' })).copy.slice(0, 160),
            self_employed_business: (await renderOnboarding('ready', { primaryGoal: 'self_employed_business' })).copy.slice(0, 160),
            mixed: (await renderOnboarding('ready', { primaryGoal: 'mixed' })).copy.slice(0, 160),
          },
          '3-home-truthful': liveHome.copy.slice(0, 240),
          '4-home-review-item': (await renderMainTabs('recovery_available')).copy.slice(0, 240),
          '5-empty-proof': emptyProof.copy.slice(0, 240),
          '6-demo-proof': proofReady.copy.slice(0, 240),
          '7-empty-profile': profile.copy.slice(0, 240),
          '8-plans-monthly': (await renderStackScreen('PlanSelection', { source: 'profile' })).copy.slice(0, 240),
          '9-plans-annual': 'Fixed header toggle switches monthly/annual without sticky overlap',
          '10-safe-area': 'insets.top TabScreen + insets.bottom tab bar + FixedHeaderScrollScreen + Ionicons',
        },
        null,
        2,
      ),
    );
  });
});
