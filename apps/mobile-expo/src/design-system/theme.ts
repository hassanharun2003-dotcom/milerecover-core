import { colors, darkColors } from '@milerecover/config';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
export type Palette = typeof colors | typeof darkColors;

export function statusColors(
  variant: StatusVariant,
  palette: Palette = colors,
): { fg: string; bg: string } {
  switch (variant) {
    case 'success':
      return { fg: palette.status.success, bg: palette.status.successBg };
    case 'warning':
      return { fg: palette.status.warning, bg: palette.status.warningBg };
    case 'danger':
      return { fg: palette.status.danger, bg: palette.status.dangerBg };
    case 'info':
      return { fg: palette.status.info, bg: palette.status.infoBg };
    default:
      return { fg: palette.neutral[700], bg: palette.neutral[100] };
  }
}
