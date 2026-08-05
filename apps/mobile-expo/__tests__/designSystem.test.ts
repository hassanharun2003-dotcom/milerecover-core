import {
  colors,
  darkColors,
  darkSemantic,
  lightSemantic,
  motion,
  spacing,
  typography,
} from '@milerecover/config';

describe('Locked forest-green design tokens', () => {
  it('keeps deep forest primary values', () => {
    expect(colors.forest[900]).toBe('#0B2E1F');
    expect(colors.forest[700]).toBe('#1B5538');
    expect(colors.background.canvas).toBe('#FAFAF8');
  });

  it('exports only the canonical light semantic palette for shipped UI', () => {
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
    expect(darkSemantic).toBe(lightSemantic);
    expect(darkColors).toBe(colors);
  });

  it('exposes spacing steps used by the design system', () => {
    expect(spacing.smMd).toBe(12);
    expect(spacing.mdLg).toBe(20);
  });

  it('exposes tabular nums and undo snackbar timing', () => {
    expect(typography.tabularNums).toContain('tabular-nums');
    expect(motion.undoSnackbarMs).toBe(4000);
  });
});
