/**
 * MileRecover design tokens — locked to Figma
 * file key 5y8p0axQChkYVBcM7tgHDj (MileRecover — Production Design Lock).
 *
 * Colors / spacing / radii / type measured from live Figma variables + text styles.
 * Small RN adaptations (System font stack, elevation) are intentional.
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

/** Figma Color collection (Light) — Production Design Lock. */
export const lightSemantic: SemanticPalette = {
  canvas: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F3FAF6',
  surfaceSelected: '#E5F5EC',
  textPrimary: '#15202B',
  textSecondary: '#5B6670',
  textTertiary: '#8B949E',
  border: '#E2E6EA',
  primary: '#1F8A5B',
  primaryDeep: '#0B3D2E',
  onPrimary: '#FFFFFF',
  success: '#1F8A5B',
  warning: '#D97706',
  danger: '#DC2626',
  disabledSurface: '#F3FAF6',
  disabledText: '#8B949E',
  scrim: 'rgba(21, 32, 43, 0.45)',
};

/** @deprecated Dark is not shipped — aliases light for compile safety. */
export const darkSemantic: SemanticPalette = { ...lightSemantic };

function buildNestedPalette(s: SemanticPalette) {
  const successSurface = s.surfaceSelected;
  const warningSurface = '#FEF3C7';
  const dangerSurface = '#FEE2E2';
  /** Darker amber for text/icons on light surfaces (WCAG); brand accent stays s.warning. */
  const warningInk = '#B45309';

  return {
    forest: {
      900: s.primaryDeep,
      800: '#0F5C3F',
      700: s.primary,
      600: s.primary,
      500: '#2A9A6A',
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
      secondaryText: s.primaryDeep,
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

/** Figma Spacing collection. */
export const spacing = {
  xs: 4,
  sm: 8,
  smMd: 12,
  md: 16,
  mdLg: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

/**
 * Figma Implementation Specs:
 * page padding 24 · button 48 · input 48 · bottom nav 72 · min touch 44
 */
export const layout = {
  pageX: 24,
  section: 16,
  cardPad: 16,
  buttonH: 48,
  segmentH: 40,
  fieldH: 48,
  tabBarH: 72,
  iconCircle: 40,
  iconGlyph: 20,
  deviceW: 390,
  deviceH: 844,
  contentStartTop: 54,
} as const;

/** Figma Radius collection + Implementation Specs. */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

/**
 * Figma text styles (Inter → System on RN):
 * Display 34/42 · H1 28/34 · H2 22/28 · H3 18/24 · Body Large 17/26 · Body 15/22
 */
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
  },
  size: {
    caption: 12,
    label: 13,
    bodySmall: 13,
    body: 15,
    button: 16,
    bodyLarge: 17,
    title: 18,
    headline: 22,
    h1: 28,
    display: 34,
  },
  lineHeight: {
    caption: 16,
    label: 16,
    bodySmall: 18,
    body: 22,
    button: 20,
    bodyLarge: 26,
    title: 24,
    headline: 28,
    h1: 34,
    display: 42,
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
  minHeight: 44,
  minWidth: 44,
} as const;

/** Figma effect styles shadow/card + shadow/floating. */
export const shadows = {
  card: {
    shadowColor: '#142029',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#142029',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
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
  layout,
  radii,
  typography,
  touchTarget,
  shadows,
  iconSize,
  motion,
};

export type ThemeTokens = typeof tokens;
export type AppPalette = typeof colors;
