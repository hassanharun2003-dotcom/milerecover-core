/**
 * Design tokens — forest green brand with one canonical light palette.
 * Prefer ThemeProvider.palette in UI; static `colors` remains the light default.
 */

export type SemanticPalette = {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceSelected: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  disabledSurface: string;
  disabledText: string;
  scrim: string;
};

export const lightSemantic: SemanticPalette = {
  canvas: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F4',
  surfaceSelected: '#E8F3ED',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  border: '#E7E5E4',
  primary: '#236B47',
  onPrimary: '#FFFFFF',
  success: '#1B7D4E',
  warning: '#B45309',
  danger: '#B91C1C',
  disabledSurface: '#F5F5F4',
  disabledText: '#A8A29E',
  scrim: 'rgba(11, 46, 31, 0.42)',
};

function buildNestedPalette(s: SemanticPalette) {
  const successSurface = '#E6F5ED';
  const warningSurface = '#FEF3C7';
  const dangerSurface = '#FEE2E2';

  return {
    forest: {
      900: '#0B2E1F',
      800: '#13402C',
      700: '#1B5538',
      600: s.primary,
      500: '#2D8056',
      100: s.surfaceSelected,
    },
    protected: {
      600: s.success,
      100: successSurface,
    },
    review: {
      600: s.warning,
      100: warningSurface,
    },
    danger: {
      600: s.danger,
      100: dangerSurface,
    },
    neutral: {
      900: s.textPrimary,
      700: '#44403C',
      500: s.textTertiary,
      200: s.border,
      100: s.surfaceMuted,
      0: s.surface,
    },
    background: {
      canvas: s.canvas,
      card: s.surface,
      mist: s.surfaceSelected,
    },
    text: {
      primary: s.textPrimary,
      secondary: s.textSecondary,
      muted: s.textTertiary,
      inverse: s.onPrimary,
      onForest: s.onPrimary,
      onInput: s.textPrimary,
      disabled: s.disabledText,
    },
    border: {
      default: s.border,
      focus: '#2D8056',
      outline: s.textTertiary,
      selected: s.primary,
    },
    status: {
      success: s.success,
      successBg: successSurface,
      warning: s.warning,
      warningBg: warningSurface,
      danger: s.danger,
      dangerBg: dangerSurface,
      info: s.primary,
      infoBg: s.surfaceSelected,
    },
    header: {
      background: '#0B2E1F',
      border: '#13402C',
    },
    action: {
      primary: s.primary,
      primaryText: s.onPrimary,
      secondary: s.surfaceSelected,
      secondaryText: '#1B5538',
      selectedSurface: s.surfaceSelected,
      selectedBorder: s.primary,
      disabledSurface: s.disabledSurface,
      disabledText: s.disabledText,
      outlineBorder: s.textTertiary,
    },
    input: {
      surface: s.surface,
      text: s.textPrimary,
      placeholder: s.textTertiary,
    },
    tab: {
      inactive: s.textTertiary,
      active: s.primary,
      bar: s.surface,
    },
    semantic: s,
  } as const;
}

export const colors = buildNestedPalette(lightSemantic);

/**
 * @deprecated Dark theme is not shipped. This alias remains temporarily for
 * older imports and resolves to the canonical light palette.
 */
export const darkSemantic: SemanticPalette = lightSemantic;

/**
 * @deprecated Dark theme is not shipped. Use `colors`; this alias returns the
 * canonical light palette to prevent customer paths from entering a dark UI.
 */
export const darkColors = colors;

export const spacing = {
  xs: 4,
  sm: 8,
  /** Design Spacing.md space-3 */
  smMd: 12,
  md: 16,
  /** Design Spacing.md space-5 */
  mdLg: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
  },
  size: {
    caption: 12,
    body: 16,
    bodyLarge: 18,
    title: 22,
    headline: 28,
  },
  lineHeight: {
    caption: 16,
    body: 22,
    bodyLarge: 24,
    title: 28,
    headline: 34,
  },
  /** Prefer for miles, scores, and version numbers */
  tabularNums: ['tabular-nums'] as const,
} as const;

/** Restrained motion tokens — pair with Reduce Motion on device later */
export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
  undoSnackbarMs: 4000,
} as const;

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0B2E1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0B2E1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export const iconSize = {
  sm: 18,
  md: 22,
  lg: 28,
} as const;

export const tokens = {
  colors,
  darkColors,
  lightSemantic,
  darkSemantic,
  spacing,
  radii,
  typography,
  touchTarget,
  shadows,
  iconSize,
  motion,
};

export type ThemeTokens = typeof tokens;
export type AppPalette = typeof colors;
