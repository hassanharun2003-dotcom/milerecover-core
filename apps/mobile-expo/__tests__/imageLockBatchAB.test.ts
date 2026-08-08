import {
  CURRENT_ONBOARDING_VERSION,
  createEmptyOnboardingState,
  nextIncompleteEssentialStep,
} from '@milerecover/domain';
import { lightSemantic, layout, radii, typography } from '@milerecover/config';
import {
  ONBOARDING_STEP_ORDER,
  PRIMARY_GOAL_OPTIONS,
  allowInternalPreviewTools,
  createInitialProductUiState,
} from '../src/product/types';
import { selectHomePeriodSummary } from '../src/product/presentation';
import { createInitialAppState } from '../src/store/types';
import { selectProductExperience } from '../src/product/selectors';
import fs from 'fs';
import path from 'path';

describe('Image lock Batch A/B foundations', () => {
  it('uses Figma Production Design Lock layout/typography tokens', () => {
    expect(lightSemantic.canvas).toBe('#FAFAF8');
    expect(lightSemantic.primary).toBe('#1C8054');
    expect(lightSemantic.primaryDeep).toBe('#0B3D2E');
    expect(lightSemantic.surfaceSelected).toBe('#E5F5EC');
    expect(radii.xl).toBe(20);
    expect(layout.pageX).toBe(24);
    expect(layout.buttonH).toBe(48);
    expect(typography.size.display).toBe(34);
    expect(typography.lineHeight.display).toBe(42);
  });

  it('clean install opens welcome and requires account before purpose', () => {
    const empty = createEmptyOnboardingState();
    expect(empty.currentStep).toBe('welcome');
    expect(nextIncompleteEssentialStep(empty)).toBe('welcome');
    expect(CURRENT_ONBOARDING_VERSION).toBe(11);
    expect(ONBOARDING_STEP_ORDER).toEqual([
      'welcome',
      'account',
      'purpose',
      'locale_setup',
      'protect_drives',
      'ready',
    ]);
    const afterWelcome = {
      ...empty,
      completedSteps: ['welcome' as const],
    };
    expect(nextIncompleteEssentialStep(afterWelcome)).toBe('account');
  });

  it('matches collage purpose labels exactly', () => {
    expect(PRIMARY_GOAL_OPTIONS.map((o) => o.label)).toEqual([
      'Employee reimbursement',
      'Self-employed / business',
      'Delivery or gig work',
      'Personal / mixed use',
    ]);
    expect(PRIMARY_GOAL_OPTIONS.find((o) => o.id === 'mixed')?.label).toBe('Personal / mixed use');
  });

  it('keeps Reset App preview-only (never in production)', () => {
    expect(allowInternalPreviewTools('preview')).toBe(true);
    expect(allowInternalPreviewTools('development')).toBe(true);
    expect(allowInternalPreviewTools('production')).toBe(false);
    const profile = fs.readFileSync(
      path.join(__dirname, '../src/screens/profile/ProfileScreen.tsx'),
      'utf8',
    );
    expect(profile).toMatch(/Reset onboarding/);
    expect(profile).toMatch(/Reset App To Brand New User/);
    expect(profile).toMatch(/resetOnboarding/);
    expect(profile).toMatch(/allowInternalPreviewTools/);
  });

  it('does not hardcode collage sample money in production Home path', () => {
    const home = fs.readFileSync(
      path.join(__dirname, '../src/screens/home/HomeScreen.tsx'),
      'utf8',
    );
    expect(home).not.toMatch(/487\.32/);
    expect(home).not.toMatch(/1,?264/);
    expect(home).toMatch(/selectHomePeriodSummary/);
    expect(home).toMatch(/periodKind: 'ytd'/);

    const deniedPermissions = {
      location: 'denied' as const,
      backgroundLocation: 'denied' as const,
      motion: 'not_applicable' as const,
      batteryOptimizationRestricted: true,
    };
    const live = selectProductExperience(
      createInitialAppState(),
      createInitialProductUiState(),
      deniedPermissions,
      false,
    );
    expect(live.liveMode).toBe(true);
    const year = selectHomePeriodSummary({
      trips: live.confirmedTrips,
      locale: createInitialProductUiState().localeProfile,
      preferredName: null,
      primaryGoal: null,
      periodKind: 'ytd',
    });
    expect(year.tripCount).toBe(0);
    expect(year.estimatedValueCents === null || year.estimatedValueCents === 0).toBe(true);
    expect(JSON.stringify(year)).not.toContain('487.32');
    // Empty Home may show truthful $0.00 when a rate is available — never collage samples.
    expect(year.estimatedValueLabel === '$0.00' || year.estimatedValueCents == null).toBe(true);
  });

  it('Welcome uses branded green mark, not app icon asset', () => {
    const ds = fs.readFileSync(
      path.join(__dirname, '../src/design-system/imageLock.tsx'),
      'utf8',
    );
    expect(ds).toMatch(/function MRWelcomeLogo/);
    expect(ds).not.toMatch(/require\('\.\.\/\.\.\/assets\/icon\.png'\)/);
    const welcome = fs.readFileSync(
      path.join(__dirname, '../src/screens/onboarding/OnboardingFlow.tsx'),
      'utf8',
    );
    expect(welcome).toMatch(/Continue with Google|Continue without an account/);
    expect(welcome).not.toMatch(/I already use a mileage app/);
  });
});
