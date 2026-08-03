import { colors, motion, spacing, typography } from '@milerecover/config';

describe('Locked forest-green design tokens', () => {
  it('keeps deep forest primary values', () => {
    expect(colors.forest[900]).toBe('#0B2E1F');
    expect(colors.forest[700]).toBe('#1B5538');
    expect(colors.background.canvas).toBe('#FAFAF8');
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
