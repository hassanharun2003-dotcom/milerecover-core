import fs from 'fs';
import path from 'path';
import { LAUNCH_FIXTURES } from '../src/testing/launchFixtures';
import {
  checkThemeContrast,
  contrastRatio,
  defaultEvidenceDir,
  renderVisualBoard,
  themeContrastPairs,
} from '../src/testing/visualEvidence';
import {
  renderMainTabs,
  renderOnboarding,
  renderStackScreen,
  renderTab,
} from '../src/testing/ScreenTestHarness';
import { ONBOARDING_STEP_ORDER } from '../src/product/types';

const pngDir = defaultEvidenceDir();
const manifestPath = path.join(pngDir, 'manifest.json');

describe('Phase 0 visual QA harness', () => {
  beforeAll(() => {
    fs.mkdirSync(pngDir, { recursive: true });
  });

  it('enforces readable contrast for light and dark semantic tokens', () => {
    const lightFails = checkThemeContrast('light');
    const darkFails = checkThemeContrast('dark');
    expect(lightFails).toEqual([]);
    expect(darkFails).toEqual([]);
    for (const theme of ['light', 'dark'] as const) {
      for (const pair of themeContrastPairs(theme)) {
        expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(pair.minRatio);
      }
    }
  });

  it('covers every launch fixture id required by the release pass', () => {
    const ids = new Set(LAUNCH_FIXTURES.map((f) => f.id));
    const required = [
      'brand_new_install',
      'onboarding_welcome',
      'onboarding_purpose',
      'onboarding_locale_setup',
      'onboarding_protect_drives',
      'onboarding_ready',
      'manual_mode',
      'permission_partial',
      'permission_granted_no_drive',
      'tracking_verified',
      'protection_degraded',
      'no_trips',
      'pending_review_trips',
      'confirmed_trips',
      'recovered_trip',
      'free_limit_close',
      'free_limit_reached',
      'report_ready',
      'report_blocked',
      'offline',
      'loading',
      'recoverable_error',
      'dark_mode',
      'light_mode',
    ];
    for (const id of required) {
      expect(ids.has(id as (typeof LAUNCH_FIXTURES)[number]['id'])).toBe(true);
    }
  });

  it('writes PNG visual evidence for major screens in light and dark', async () => {
    const manifest: Record<string, { file: string; copyPreview: string; failures: string[] }> = {};

    const boards: Array<{ id: string; title: string; copy: string }> = [];

    for (const step of ONBOARDING_STEP_ORDER) {
      const { copy } = await renderOnboarding(step);
      boards.push({ id: `onboarding-${step}`, title: `Onboarding ${step}`, copy });
    }

    const home = await renderMainTabs('new_user', { demoModeEnabled: false });
    boards.push({ id: 'home-live', title: 'Home', copy: home.copy });

    const review = await renderTab('recovery_available', 'Review');
    boards.push({ id: 'review-pending', title: 'Review', copy: review.copy });

    const proof = await renderTab('proof_ready', 'Proof');
    boards.push({ id: 'proof-ready', title: 'Proof', copy: proof.copy });

    const profile = await renderTab('new_user', 'Profile', { demoModeEnabled: false });
    boards.push({ id: 'profile', title: 'Profile', copy: profile.copy });

    const manual = await renderStackScreen('ManualTrip');
    boards.push({ id: 'manual-trip', title: 'Add drive', copy: manual.copy });

    const protection = await renderStackScreen('ProtectionAlert');
    boards.push({ id: 'protection', title: 'Protection', copy: protection.copy });

    const tracking = await renderStackScreen('TrackingActive');
    boards.push({ id: 'tracking', title: 'Tracking', copy: tracking.copy });

    const report = await renderStackScreen('ReportPreview', { format: 'pdf' });
    boards.push({ id: 'report-preview', title: 'Report preview', copy: report.copy });

    for (const board of boards) {
      for (const theme of ['light', 'dark'] as const) {
        const { filePath, failures } = renderVisualBoard(
          {
            id: board.id,
            title: board.title,
            theme,
            copy: board.copy,
          },
          pngDir,
        );
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.statSync(filePath).size).toBeGreaterThan(800);
        expect(failures).toEqual([]);
        manifest[`${board.id}-${theme}`] = {
          file: path.basename(filePath),
          copyPreview: board.copy.slice(0, 240),
          failures: failures.map((f) => f.detail),
        };
      }
    }

    // Fixture-labeled boards
    for (const fixture of LAUNCH_FIXTURES) {
      if (fixture.expectRoute === 'loading' || fixture.expectRoute === 'error') continue;
      const theme = fixture.theme === 'system' ? 'light' : fixture.theme;
      let copy = fixture.label;
      if (fixture.expectRoute === 'onboarding') {
        const step =
          fixture.product.onboardingStep ??
          fixture.product.onboarding?.currentStep ??
          'welcome';
        const rendered = await renderOnboarding(step as (typeof ONBOARDING_STEP_ORDER)[number]);
        copy = rendered.copy;
      } else {
        const rendered = await renderMainTabs(
          (fixture.product.demoScenario as 'new_user') ?? 'new_user',
          fixture.product,
        );
        copy = rendered.copy;
      }
      const { filePath, failures } = renderVisualBoard(
        {
          id: `fixture-${fixture.id}`,
          title: fixture.label,
          theme,
          copy,
        },
        pngDir,
      );
      expect(fs.existsSync(filePath)).toBe(true);
      expect(failures).toEqual([]);
      manifest[`fixture-${fixture.id}-${theme}`] = {
        file: path.basename(filePath),
        copyPreview: copy.slice(0, 240),
        failures: [],
      };
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    expect(Object.keys(manifest).length).toBeGreaterThan(30);
  }, 120_000);
});
