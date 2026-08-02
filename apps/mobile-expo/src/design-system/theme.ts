import { colors } from '@milerecover/config';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function statusColors(variant: StatusVariant): { fg: string; bg: string } {
  switch (variant) {
    case 'success':
      return { fg: colors.status.success, bg: colors.status.successBg };
    case 'warning':
      return { fg: colors.status.warning, bg: colors.status.warningBg };
    case 'danger':
      return { fg: colors.status.danger, bg: colors.status.dangerBg };
    case 'info':
      return { fg: colors.status.info, bg: colors.status.infoBg };
    default:
      return { fg: colors.neutral[700], bg: colors.neutral[100] };
  }
}
