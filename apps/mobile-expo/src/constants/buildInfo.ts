/** Visible in Profile → About. Bump APP_BUILD_LABEL when a new native preview APK is required. */
export const APP_BUILD_LABEL = '0.1.2-preview.2';

/** Shipped via OTA to prove preview channel connectivity. Cursor bumps this for test updates. */
export const PREVIEW_CHANNEL_MARKER = 'Preview channel connected';

/** App store / runtime version for the verified standalone preview APK. */
export const APP_VERSION = '0.1.2';

/** Android applicationId / iOS bundle identifier for MileRecover product builds. */
export const APP_PACKAGE_ID = 'com.milerecover.app';

export type AppVariant = 'development' | 'preview' | 'production';

export function isStandaloneBuild(variant: AppVariant | string | undefined): boolean {
  return variant === 'preview' || variant === 'production';
}

/** expo-dev-client must not be autolinked into standalone preview/production APKs. */
export function getDevClientAutolinkingExclude(
  variant: string = typeof process !== 'undefined' && process.env.APP_VARIANT
    ? process.env.APP_VARIANT
    : 'development',
): string[] {
  return variant === 'development' ? [] : ['expo-dev-client'];
}
