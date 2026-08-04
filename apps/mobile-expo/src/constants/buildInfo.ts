/** Visible in Profile → About. Bump APP_BUILD_LABEL when a new native preview APK is required. */
export const APP_BUILD_LABEL = '0.1.6-mvp.1';

/** Shipped via OTA to prove preview channel connectivity. Cursor bumps this for test updates. */
export const PREVIEW_CHANNEL_MARKER = 'blocker fixes mvp';

/** App store / runtime version — bumped for native auth/billing modules. */
export const APP_VERSION = '0.1.6';

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
