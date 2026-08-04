/** Visible in Profile → About. Bump APP_BUILD_LABEL when a new native preview APK is required. */
export const APP_BUILD_LABEL = '0.1.6-mvp.3';

/**
 * Shipped via OTA to prove preview channel connectivity.
 * Must change on every verification publish. Shown on Home for preview builds.
 */
export const PREVIEW_CHANNEL_MARKER =
  'OTA VERIFIED — BUILD 0.1.6 — 2026-08-04T17:30:00Z';

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
