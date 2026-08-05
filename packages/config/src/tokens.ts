/**
 * Design tokens — forest green brand with semantic light/dark palettes.
 * Prefer ThemeProvider.palette in UI; static `colors` remains the light default.
 */

export type SemanticPalette = {
  canvas: string;
  elevatedCanvas: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  actionPrimary: string;
  actionPrimaryText: string;
  actionSecondary: string;
  actionSecondaryText: string;
  selectedSurface: string;
  selectedBorder: string;
  warningSurface: string;
  warningText: string;
  dangerSurface: string;
  dangerText: string;
  successSurface: string;
  successText: string;
  divider: string;
  disabledSurface: string;
  disabledText: string;
  focusRing: string;
  inputSurface: string;
  inputText: string;
  inputPlaceholder: string;
  outlineBorder: string;
  tabInactive: string;
  tabActive: string;
  tabBar: string;
};

export const lightSemantic: SemanticPalette = {
  canvas: '#FAFAF8',
  elevatedCanvas: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#E8F3ED',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#78716C',
  actionPrimary: '#236B47',
  actionPrimaryText: '#FFFFFF',
  actionSecondary: '#E8F3ED',
  actionSecondaryText: '#1B5538',
  selectedSurface: '#E8F3ED',
  selectedBorder: '#236B47',
  warningSurface: '#FEF3C7',
  warningText: '#B45309',
  dangerSurface: '#FEE2E2',
  dangerText: '#B91C1C',
  successSurface: '#E6F5ED',
  successText: '#1B7D4E',
  divider: '#E7E5E4',
  disabledSurface: '#F5F5F4',
  disabledText: '#A8A29E',
  focusRing: '#2D8056',
  inputSurface: '#FFFFFF',
  inputText: '#1C1917',
  inputPlaceholder: '#78716C',
  outlineBorder: '#78716C',
  tabInactive: '#78716C',
  tabActive: '#236B47',
  tabBar: '#FFFFFF',
};

/**
 * Dark theme: light text on deep forest — readable headings, clear outline buttons,
 * distinct disabled vs enabled. Input cards stay light with dark text.
 */
export const darkSemantic: SemanticPalette = {
  canvas: '#0A1410',
  elevatedCanvas: '#121F18',
  surface: '#1A2B22',
  surfaceSecondary: '#24362C',
  textPrimary: '#F5F5F4',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  actionPrimary: '#3D9B6A',
  actionPrimaryText: '#0A1410',
  actionSecondary: '#1F3A2C',
  actionSecondaryText: '#B8E0C8',
  selectedSurface: '#1F3A2C',
  selectedBorder: '#5CB88A',
  warningSurface: '#3A2E14',
  warningText: '#F0C14A',
  dangerSurface: '#3A1A1A',
  dangerText: '#F0A0A0',
  successSurface: '#163028',
  successText: '#7DCEA0',
  divider: '#2A3B32',
  disabledSurface: '#152019',
  disabledText: '#5C665F',
  focusRing: '#5CB88A',
  inputSurface: '#F5F5F4',
  inputText: '#1C1917',
  inputPlaceholder: '#78716C',
  outlineBorder: '#8A9A90',
  tabInactive: '#A8A29E',
  tabActive: '#5CB88A',
  tabBar: '#121F18',
};

function buildNestedPalette(s: SemanticPalette, isDark: boolean) {
  return {
    forest: {
      900: '#0B2E1F',
      800: '#13402C',
      700: '#1B5538',
      600: '#236B47',
      500: '#2D8056',
      100: isDark ? '#1F3A2C' : '#E8F3ED',
    },
    protected: {
      600: s.successText,
      100: s.successSurface,
    },
    review: {
      600: s.warningText,
      100: s.warningSurface,
    },
    danger: {
      600: s.dangerText,
      100: s.dangerSurface,
    },
    neutral: isDark
      ? {
          900: s.textPrimary,
          700: s.textSecondary,
          500: s.textMuted,
          200: s.divider,
          100: s.surfaceSecondary,
          0: s.surface,
        }
      : {
          900: '#1C1917',
          700: '#44403C',
          500: '#78716C',
          200: '#E7E5E4',
          100: '#F5F5F4',
          0: '#FFFFFF',
        },
    background: {
      canvas: s.canvas,
      card: s.surface,
      mist: s.surfaceSecondary,
    },
    text: {
      primary: s.textPrimary,
      secondary: s.textSecondary,
      muted: s.textMuted,
      inverse: '#FFFFFF',
      onForest: s.actionPrimaryText,
      onInput: s.inputText,
      disabled: s.disabledText,
    },
    border: {
      default: s.divider,
      focus: s.focusRing,
      outline: s.outlineBorder,
      selected: s.selectedBorder,
    },
    status: {
      success: s.successText,
      successBg: s.successSurface,
      warning: s.warningText,
      warningBg: s.warningSurface,
      danger: s.dangerText,
      dangerBg: s.dangerSurface,
      info: s.actionPrimary,
      infoBg: s.actionSecondary,
    },
    header: {
      background: isDark ? '#0B2E1F' : '#0B2E1F',
      border: '#13402C',
    },
    action: {
      primary: s.actionPrimary,
      primaryText: s.actionPrimaryText,
      secondary: s.actionSecondary,
      secondaryText: s.actionSecondaryText,
      selectedSurface: s.selectedSurface,
      selectedBorder: s.selectedBorder,
      disabledSurface: s.disabledSurface,
      disabledText: s.disabledText,
      outlineBorder: s.outlineBorder,
    },
    input: {
      surface: s.inputSurface,
      text: s.inputText,
      placeholder: s.inputPlaceholder,
    },
    tab: {
      inactive: s.tabInactive,
      active: s.tabActive,
      bar: s.tabBar,
    },
    semantic: s,
  } as const;
}

export const colors = buildNestedPalette(lightSemantic, false);
export const darkColors = buildNestedPalette(darkSemantic, true);

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
export type AppPalette = typeof colors | typeof darkColors;
