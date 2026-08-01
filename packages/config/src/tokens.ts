/**
 * Package 3 design tokens — deep forest green primary (locked direction).
 * Semantic names decouple screens from raw hex values.
 */
export const colors = {
  forest: {
    900: '#0B2E1F',
    800: '#13402C',
    700: '#1B5538',
    600: '#236B47',
    500: '#2D8056',
    100: '#E8F3ED',
  },
  protected: {
    600: '#1B7D4E',
    100: '#E6F5ED',
  },
  review: {
    600: '#B45309',
    100: '#FEF3C7',
  },
  danger: {
    600: '#B91C1C',
    100: '#FEE2E2',
  },
  neutral: {
    900: '#1C1917',
    700: '#44403C',
    500: '#78716C',
    200: '#E7E5E4',
    100: '#F5F5F4',
    0: '#FFFFFF',
  },
  background: {
    canvas: '#FAFAF8',
    card: '#FFFFFF',
  },
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    inverse: '#FFFFFF',
    onForest: '#FFFFFF',
  },
  border: {
    default: '#E7E5E4',
    focus: '#2D8056',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
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
} as const;

export const touchTarget = {
  minHeight: 48,
  minWidth: 48,
} as const;

export const tokens = { colors, spacing, radii, typography, touchTarget };

export type ThemeTokens = typeof tokens;
