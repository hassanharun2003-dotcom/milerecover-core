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

describe('Blueprint-locked design tokens', () => {
  it('keeps image-locked forest primary values', () => {
    expect(colors.forest[900]).toBe('#073D2C');
    expect(colors.forest[700]).toBe('#0F6B46');
    expect(colors.background.canvas).toBe('#FFFFFF');
    expect(lightSemantic.canvas).toBe('#FFFFFF');
    expect(lightSemantic.surfaceSelected).toBe('#E8F4EE');
    expect(lightSemantic.textPrimary).toBe('#0F172A');
    expect(lightSemantic.border).toBe('#E2E8F0');
    expect(lightSemantic.warning).toBe('#F59E0B');
    expect(colors.status.warning).toBe('#B45309');
    expect(colors.status.warningAccent).toBe('#F59E0B');
    expect(radii.xl).toBe(20);
    expect(layout.pageX).toBe(20);
    expect(layout.buttonH).toBe(52);
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

  it('exposes spacing steps used by the design system', () => {
    expect(spacing.smMd).toBe(12);
    expect(spacing.mdLg).toBe(20);
  });

  it('exposes tabular nums, display type, and undo snackbar timing', () => {
    expect(typography.size.display).toBe(28);
    expect(typography.lineHeight.display).toBe(34);
    expect(typography.size.headline).toBe(24);
    expect(typography.tabularNums).toContain('tabular-nums');
    expect(motion.undoSnackbarMs).toBe(4000);
  });
});
