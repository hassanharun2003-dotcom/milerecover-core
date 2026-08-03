import fs from 'fs';
import path from 'path';
import { DEMO_SCENARIOS } from '../src/fixtures/scenarios';
import { ONBOARDING_STEP_ORDER } from '../src/product/types';
import { renderMainTabs, renderOnboarding, renderStackScreen, renderTab } from '../src/testing/ScreenTestHarness';

const evidenceDir = path.join(__dirname, '..', '..', '..', 'docs', 'assets', 'ui-evidence');

describe('Screen render evidence', () => {
  beforeAll(() => {
    fs.mkdirSync(evidenceDir, { recursive: true });
  });

  it('captures onboarding step copy', async () => {
    const manifest: Record<string, string> = {};
    for (const step of ONBOARDING_STEP_ORDER) {
      const { copy } = await renderOnboarding(step);
      manifest[`onboarding-${step}`] = copy.slice(0, 500);
      expect(copy.length).toBeGreaterThan(20);
    }
    fs.writeFileSync(path.join(evidenceDir, 'onboarding-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures home scenarios', async () => {
    const scenarios = ['fully_protected', 'recovery_available', 'protection_limited', 'offline_sync'] as const;
    const manifest: Record<string, string> = {};
    for (const id of scenarios) {
      const { copy } = await renderMainTabs(id);
      manifest[`home-${id}`] = copy.slice(0, 600);
      expect(copy).toContain(DEMO_SCENARIOS[id].homeTitle);
    }
    fs.writeFileSync(path.join(evidenceDir, 'home-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures supporting stack screens', async () => {
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
      ['coming-later', 'ComingLater', { title: 'Notifications', detail: 'Weekly digests coming later.' }],
      ['export-report', 'ExportReport'],
      ['report-preview', 'ReportPreview', { format: 'pdf' }],
      ['plan-selection', 'PlanSelection', { source: 'profile' }],
      ['help-support', 'HelpSupport'],
      ['about', 'About'],
    ];

    for (const [key, route, params] of stacks) {
      const product = key === 'import-preview' ? { importPhase: 'preview' as const, importFileLabel: 'Spreadsheet.csv' } : undefined;
      const { copy } = await renderStackScreen(route, params, product);
      manifest[key] = copy.slice(0, 500);
      expect(copy.length).toBeGreaterThan(10);
    }
    expect(manifest['manual-trip']).toContain('attest');
    expect(manifest['tracking-active']).toContain('not active yet');
    expect(manifest['help-support']).toContain('COMMON QUESTIONS');
    fs.writeFileSync(path.join(evidenceDir, 'stack-evidence.json'), JSON.stringify(manifest, null, 2));
  });

  it('captures proof, review, and profile tab copy', async () => {
    const proofReady = await renderTab('proof_ready', 'Proof');
    expect(proofReady.copy).toContain('Ready for proof');

    const proofBlocked = await renderTab('proof_blocked', 'Proof');
    expect(proofBlocked.copy).toContain('Items need review');

    const review = await renderTab('recovery_available', 'Review');
    expect(review.copy).toContain('Needs review');

    const profile = await renderTab('fully_protected', 'Profile');
    expect(profile.copy).toContain('Vehicles');
    expect(profile.copy).toContain('Tracking status');
    fs.writeFileSync(
      path.join(evidenceDir, 'profile-evidence.json'),
      JSON.stringify({ profile: profile.copy.slice(0, 600) }, null, 2),
    );
  });
});
