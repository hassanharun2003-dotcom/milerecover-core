/** Visible in Profile → About. Bump APP_BUILD_LABEL when a new native preview APK is required. */
export const APP_BUILD_LABEL = '0.1.0-preview.1';

/** Shipped via OTA to prove preview channel connectivity. Cursor bumps this for test updates. */
export const PREVIEW_CHANNEL_MARKER = 'Base preview build';

export type AppVariant = 'development' | 'preview' | 'production';

export function isStandaloneBuild(variant: AppVariant | string | undefined): boolean {
  return variant === 'preview' || variant === 'production';
}
