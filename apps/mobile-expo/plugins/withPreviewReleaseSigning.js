/**
 * Expo config plugin — inject AGP release signingConfig using the recovered
 * MileRecover preview keystore. Secrets come from env (never committed).
 *
 * Required env (or defaults for local preview):
 *   MR_PREVIEW_STORE_FILE
 *   MR_PREVIEW_STORE_PASSWORD
 *   MR_PREVIEW_KEY_ALIAS
 *   MR_PREVIEW_KEY_PASSWORD
 *
 * Final APK must be produced by `gradlew assembleRelease` with ZERO post-build
 * APK mutation (no sign-android-apk.sh / zip -d / Python rezip).
 */
const { withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const RELEASE_SIGNING_MARKER = 'MileRecover preview release signing (AGP-native)';

function withPreviewReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (contents.includes(RELEASE_SIGNING_MARKER)) {
      return cfg;
    }

    if (!contents.includes('signingConfigs {')) {
      throw new Error('withPreviewReleaseSigning: signingConfigs block not found in app/build.gradle');
    }
    if (!contents.includes('signingConfig signingConfigs.debug')) {
      throw new Error('withPreviewReleaseSigning: expected release to reference signingConfigs.debug');
    }

    // Insert release signingConfig after the debug block closes inside signingConfigs.
    // Match the generated Expo/RN template structure.
    const debugBlock = `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

    const replacement = `signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        // ${RELEASE_SIGNING_MARKER}
        release {
            def storePath = System.getenv('MR_PREVIEW_STORE_FILE')
            if (storePath == null || storePath.isEmpty()) {
                throw new GradleException('MR_PREVIEW_STORE_FILE is required for release signing')
            }
            storeFile file(storePath)
            storePassword System.getenv('MR_PREVIEW_STORE_PASSWORD')
            keyAlias System.getenv('MR_PREVIEW_KEY_ALIAS')
            keyPassword System.getenv('MR_PREVIEW_KEY_PASSWORD')
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
        }
    }`;

    if (!contents.includes(debugBlock)) {
      throw new Error(
        'withPreviewReleaseSigning: unexpected signingConfigs.debug template; refusing to patch',
      );
    }
    contents = contents.replace(debugBlock, replacement);

    // Point release buildType at release signingConfig (not debug).
    contents = contents.replace(
      /release \{\n\s*\/\/ Caution! In production[\s\S]*?signingConfig signingConfigs\.debug/,
      (block) => block.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release'),
    );

    if (!contents.includes('signingConfig signingConfigs.release')) {
      throw new Error('withPreviewReleaseSigning: failed to set buildTypes.release.signingConfig');
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withPreviewReleaseSigning,
  'withPreviewReleaseSigning',
  '1.0.0',
);
