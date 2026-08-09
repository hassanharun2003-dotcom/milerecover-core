import fs from 'fs';
import path from 'path';
import {
  APP_BUILD_LABEL,
  APP_PACKAGE_ID,
  APP_RUNTIME_VERSION,
  APP_UPDATE_CHANNEL,
  APP_VERSION,
  getDevClientAutolinkingExclude,
  isStandaloneBuild,
  isStandaloneUpdateChannel,
} from '../src/constants/buildInfo';

const root = path.join(__dirname, '..');

function readJson(fileName: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, fileName), 'utf8')) as Record<string, unknown>;
}

describe('Production MVP build configuration', () => {
  const appConfigSource = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
  const packageJson = readJson('package.json') as {
    scripts?: {
      'eas-build-pre-install'?: string;
      'update:preview'?: string;
      'update:production'?: string;
      'gate:android-apk'?: string;
      'sign:android-apk'?: string;
      'build:android-apk'?: string;
    };
  };
  const eas = readJson('eas.json') as {
    build: {
      preview: {
        autoIncrement?: boolean;
        channel?: string;
        env?: { APP_VARIANT?: string };
      };
    };
  };

  it('ships package com.milerecover.app and isolated runtime 0.2.17', () => {
    expect(APP_PACKAGE_ID).toBe('com.milerecover.app');
    expect(APP_VERSION).toBe('0.2.17');
    expect(APP_RUNTIME_VERSION).toBe('0.2.17');
    expect(APP_BUILD_LABEL).toBe('0.2.17-agp-native.1');
    expect(APP_UPDATE_CHANNEL).toBe('preview-foundation-0.2.17');
    expect(appConfigSource).toContain("package: 'com.milerecover.app'");
    expect(appConfigSource).toContain("bundleIdentifier: 'com.milerecover.app'");
    expect(appConfigSource).toContain("version: '0.2.17'");
    expect(appConfigSource).toContain('versionCode: 72');
    expect(appConfigSource).toContain("runtimeVersion: '0.2.17'");
    expect(appConfigSource).not.toContain("policy: 'appVersion'");
    expect(appConfigSource).toContain("checkAutomatically: 'NEVER'");
    expect(appConfigSource).not.toContain("checkAutomatically: 'ON_LOAD'");
    expect(appConfigSource).toContain('useLegacyPackaging: true');
    expect(appConfigSource).toContain('./plugins/withPreviewReleaseSigning');
    expect(appConfigSource).toContain('versionCode: 72');
    expect(appConfigSource).toContain('expo-location');
    expect(appConfigSource).toContain('@react-native-community/datetimepicker');
    expect(appConfigSource).toContain('@react-native-google-signin/google-signin');
    expect(appConfigSource).toContain('expo-apple-authentication');
  });

  it('uses isolated preview-foundation channel so prior OTAs cannot replace UI', () => {
    expect(eas.build.preview.autoIncrement).toBe(true);
    expect(eas.build.preview.channel).toBe('preview-foundation-0.2.17');
    expect(eas.build.preview.env?.APP_VARIANT).toBe('preview');
    expect(isStandaloneBuild('preview')).toBe(true);
    expect(isStandaloneUpdateChannel('preview-foundation-0.2.17')).toBe(true);
    expect(isStandaloneUpdateChannel('preview')).toBe(true);
    expect(isStandaloneUpdateChannel('development')).toBe(false);
    expect(appConfigSource).toContain("'expo-dev-client'");
    expect(appConfigSource).toContain('enabled: !IS_DEV_CLIENT');
    expect(packageJson.scripts?.['update:preview']).toContain('preview-foundation-0.2.17');
  });

  it('forces APP_VARIANT when publishing OTA so preview updates stay standalone', () => {
    expect(packageJson.scripts?.['update:preview']).toContain('APP_VARIANT=preview');
    expect(packageJson.scripts?.['update:production']).toContain('APP_VARIANT=production');
  });

  it('requires android APK sign + release gate scripts', () => {
    expect(packageJson.scripts?.['gate:android-apk']).toContain('android-apk-release-gate.sh');
    expect(packageJson.scripts?.['sign:android-apk']).toContain('sign-android-apk.sh');
    expect(packageJson.scripts?.['build:android-apk']).toContain('build-agp-release-apk.sh');
    expect(fs.existsSync(path.join(root, 'scripts/android-apk-release-gate.sh'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'scripts/sign-android-apk.sh'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'scripts/build-agp-release-apk.sh'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'plugins/withPreviewReleaseSigning.js'))).toBe(true);
  });

  it('disables post-build APK mutation and requires AGP-native signing plugin', () => {
    const resign = fs.readFileSync(path.join(root, 'scripts/sign-android-apk.sh'), 'utf8');
    expect(resign).toMatch(/DISABLED|AGP-native only/);
    expect(resign).toMatch(/exit 2/);
    // Stub must refuse immediately — no executable mutation pipeline remains.
    const resignCode = resign
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
    expect(resignCode).not.toMatch(/zipfile|zip -d|apksigner sign|jarsigner/);
    const gate = fs.readFileSync(path.join(root, 'scripts/android-apk-release-gate.sh'), 'utf8');
    expect(gate).toMatch(/VERIFY-ONLY|Must NOT mutate/);
    expect(gate).toMatch(/EXPECT_GRADLE_SHA256/);
    expect(gate).toMatch(/data_descriptor_entries/);
    // Gate/build may mention historical mutation tools in comments; code must not invoke them.
    const nonComment = (src: string) =>
      src
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('#'))
        .join('\n');
    const gateCode = nonComment(gate);
    expect(gateCode).not.toMatch(/apksigner\s+sign\b/);
    expect(gateCode).not.toMatch(/\bzip\s+-d\b/);
    expect(gateCode).not.toMatch(/ZipFile\([^)]+,\s*['\"]w['\"]/);
    const build = fs.readFileSync(path.join(root, 'scripts/build-agp-release-apk.sh'), 'utf8');
    expect(build).toMatch(/assembleRelease/);
    expect(build).toMatch(/ZERO post-build APK mutation/);
    expect(build).toMatch(/cp -f/);
    const buildCode = nonComment(build);
    expect(buildCode).not.toMatch(/apksigner\s+sign\b/);
    expect(buildCode).not.toMatch(/\bzip\s+-d\b/);
    expect(buildCode).not.toMatch(/ZipFile\([^)]+,\s*['\"]w['\"]/);
    const plugin = fs.readFileSync(path.join(root, 'plugins/withPreviewReleaseSigning.js'), 'utf8');
    expect(plugin).toMatch(/signingConfigs\.release/);
    expect(plugin).toMatch(/MR_PREVIEW_STORE_FILE/);
    expect(plugin).toMatch(/enableV1Signing true/);
    expect(plugin).toMatch(/enableV2Signing true/);
    expect(plugin).toMatch(/enableV3Signing true/);
  });

  it('excludes expo-dev-client native modules from autolinking for standalone variants', () => {
    const expected = [
      'expo-dev-client',
      'expo-dev-launcher',
      'expo-dev-menu',
      'expo-dev-menu-interface',
    ];
    expect(getDevClientAutolinkingExclude('preview')).toEqual(expected);
    expect(getDevClientAutolinkingExclude('production')).toEqual(expected);
    expect(getDevClientAutolinkingExclude('development')).toEqual([]);
    expect(packageJson.scripts?.['eas-build-pre-install']).toContain(
      'sync-dev-client-autolinking.cjs',
    );
  });

  it('documents Samsung old-UI root cause and 0.2.6 startup crash', () => {
    const rca = fs.readFileSync(
      path.join(root, '../../docs/design/ROOT_CAUSE_SAMSUNG_OLD_UI.md'),
      'utf8',
    );
    expect(rca).toMatch(/runtimeVersion/);
    expect(rca).toMatch(/0\.1\.8/);
    expect(rca).toMatch(/HomeScreen\.tsx/);
    const crash = fs.readFileSync(
      path.join(root, '../../docs/qa/STARTUP_CRASH_0.2.6.md'),
      'utf8',
    );
    expect(crash).toMatch(/UpdateFailedToLoad/);
    expect(crash).toMatch(/checkAutomatically/);
  });
});

