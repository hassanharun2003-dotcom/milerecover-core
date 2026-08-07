import {
  colors,
  darkColors,
  darkSemantic,
  layout,
  lightSemantic,
  motion,
  radii,
  spacing,
  typography,
} from '@milerecover/config';

describe('Figma-locked design tokens', () => {
  it('keeps Production Design Lock primary values', () => {
    expect(colors.forest[900]).toBe('#0B3D2E');
    expect(colors.forest[700]).toBe('#1F8A5B');
    expect(colors.background.canvas).toBe('#FAFAF8');
    expect(lightSemantic.canvas).toBe('#FAFAF8');
    expect(lightSemantic.surfaceSelected).toBe('#E5F5EC');
    expect(lightSemantic.surfaceMuted).toBe('#F3FAF6');
    expect(lightSemantic.textPrimary).toBe('#15202B');
    expect(lightSemantic.textSecondary).toBe('#5B6670');
    expect(lightSemantic.border).toBe('#E2E6EA');
    expect(lightSemantic.warning).toBe('#D97706');
    expect(lightSemantic.danger).toBe('#DC2626');
    expect(colors.status.warning).toBe('#B45309');
    expect(colors.status.warningAccent).toBe('#D97706');
    expect(radii.lg).toBe(16);
    expect(radii.xl).toBe(20);
    expect(radii.xxl).toBe(24);
    expect(layout.pageX).toBe(24);
    expect(layout.buttonH).toBe(48);
    expect(layout.tabBarH).toBe(72);
    expect(layout.fieldH).toBe(48);
  });

  it('exports the canonical light semantic palette for shipped UI', () => {
    expect(Object.keys(lightSemantic)).toEqual([
      'canvas',
      'surface',
      'surfaceMuted',
      'surfaceSelected',
      'textPrimary',
      'textSecondary',
      'textTertiary',
      'border',
      'primary',
      'primaryDeep',
      'onPrimary',
      'success',
      'warning',
      'danger',
      'disabledSurface',
      'disabledText',
      'scrim',
    ]);
    expect(lightSemantic.textPrimary).toBe(colors.text.primary);
    expect(lightSemantic.primary).toBe(colors.action.primary);
    expect(lightSemantic.onPrimary).toBe(colors.action.primaryText);
    expect(lightSemantic.border).toBe(colors.border.default);
    expect(lightSemantic.surfaceSelected).toBe(colors.action.selectedSurface);
    expect(darkSemantic).toEqual(lightSemantic);
    expect(darkColors).toBe(colors);
  });

  it('exposes Figma spacing scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.smMd).toBe(12);
    expect(spacing.md).toBe(16);
    expect(spacing.mdLg).toBe(20);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing.xxl).toBe(40);
    expect(spacing.xxxl).toBe(48);
  });

  it('exposes Figma typography scale and undo snackbar timing', () => {
    expect(typography.size.display).toBe(34);
    expect(typography.lineHeight.display).toBe(42);
    expect(typography.size.h1).toBe(28);
    expect(typography.size.headline).toBe(22);
    expect(typography.size.title).toBe(18);
    expect(typography.size.bodyLarge).toBe(17);
    expect(typography.size.body).toBe(15);
    expect(typography.size.button).toBe(16);
    expect(typography.size.caption).toBe(12);
    expect(typography.tabularNums).toContain('tabular-nums');
    expect(motion.undoSnackbarMs).toBe(4000);
  });
});
