/**
 * MileRecover design tokens — image-locked blueprint (light premium canvas).
 * Primary #0F6B46 · Mint #E8F4EE · Canvas #F7F9FC
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
  primaryDeep: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  disabledSurface: string;
  disabledText: string;
  scrim: string;
};

/** Blueprint-locked light semantic palette — only shipped theme. */
export const lightSemantic: SemanticPalette = {
  canvas: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceSelected: '#E8F4EE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  border: '#E2E8F0',
  primary: '#0F6B46',
  primaryDeep: '#073D2C',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  /** Blueprint amber accent — use nested status.warning for readable text ink. */
  warning: '#F59E0B',
  danger: '#EF4444',
  disabledSurface: '#F1F5F9',
  disabledText: '#94A3B8',
  scrim: 'rgba(15, 23, 42, 0.45)',
};

/** @deprecated Dark is not shipped — aliases light for compile safety. */
export const darkSemantic: SemanticPalette = { ...lightSemantic };

function buildNestedPalette(s: SemanticPalette) {
  const successSurface = '#DCFCE7';
  const warningSurface = '#FEF3C7';
  const dangerSurface = '#FEE2E2';
  /** Darker amber for text/icons on light surfaces (WCAG); brand accent stays s.warning. */
  const warningInk = '#B45309';

  return {
    forest: {
      900: s.primaryDeep,
      800: '#0A5236',
      700: s.primary,
      600: s.primary,
      500: '#15803D',
      100: s.surfaceSelected,
    },
    protected: {
      600: s.success,
      100: successSurface,
    },
    review: {
      600: warningInk,
      500: s.warning,
      100: warningSurface,
    },
    danger: {
      600: s.danger,
      100: dangerSurface,
    },
    neutral: {
      900: s.textPrimary,
      700: s.textSecondary,
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
      focus: s.primary,
      outline: s.textTertiary,
      selected: s.primary,
    },
    status: {
      success: s.success,
      successBg: successSurface,
      warning: warningInk,
      warningAccent: s.warning,
      warningBg: warningSurface,
      danger: s.danger,
      dangerBg: dangerSurface,
      info: s.primary,
      infoBg: s.surfaceSelected,
    },
    header: {
      background: s.primaryDeep,
      border: s.primary,
    },
    action: {
      primary: s.primary,
      primaryText: s.onPrimary,
      secondary: s.surfaceSelected,
      secondaryText: s.primary,
      selectedSurface: s.surfaceSelected,
      selectedBorder: s.primary,
      disabledSurface: s.disabledSurface,
      disabledText: s.disabledText,
      outlineBorder: s.primary,
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
/** @deprecated Not shipped — equals light palette. */
export const darkColors = colors;

export const spacing = {
  xs: 4,
  sm: 8,
  smMd: 12,
  md: 16,
  mdLg: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Blueprint card radius ~12–16 */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Blueprint typography scale (system font; hierarchy locked to image).
 * Display ~32 · H1 ~24 · H2 ~20 · Body large 16 · Body 14–15 · Caption 12
 */
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
  },
  size: {
    caption: 12,
    body: 15,
    bodyLarge: 16,
    title: 20,
    headline: 24,
    display: 32,
  },
  lineHeight: {
    caption: 16,
    body: 22,
    bodyLarge: 24,
    title: 28,
    headline: 32,
    display: 40,
  },
  tabularNums: ['tabular-nums'] as const,
} as const;

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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0F172A',
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
