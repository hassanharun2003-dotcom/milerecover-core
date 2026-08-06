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
    scripts?: { 'eas-build-pre-install'?: string; 'update:preview'?: string; 'update:production'?: string };
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

  it('ships package com.milerecover.app and isolated runtime 0.2.7', () => {
    expect(APP_PACKAGE_ID).toBe('com.milerecover.app');
    expect(APP_VERSION).toBe('0.2.7');
    expect(APP_RUNTIME_VERSION).toBe('0.2.7');
    expect(APP_BUILD_LABEL).toBe('0.2.7-startup.4');
    expect(APP_UPDATE_CHANNEL).toBe('preview-foundation-0.2.7');
    expect(appConfigSource).toContain("package: 'com.milerecover.app'");
    expect(appConfigSource).toContain("bundleIdentifier: 'com.milerecover.app'");
    expect(appConfigSource).toContain("version: '0.2.7'");
    expect(appConfigSource).toContain("runtimeVersion: '0.2.7'");
    expect(appConfigSource).not.toContain("policy: 'appVersion'");
    expect(appConfigSource).toContain("checkAutomatically: 'NEVER'");
    expect(appConfigSource).not.toContain("checkAutomatically: 'ON_LOAD'");
    expect(appConfigSource).toContain('expo-location');
    expect(appConfigSource).toContain('@react-native-community/datetimepicker');
    expect(appConfigSource).toContain('@react-native-google-signin/google-signin');
    expect(appConfigSource).toContain('expo-apple-authentication');
  });

  it('uses isolated preview-foundation channel so prior OTAs cannot replace UI', () => {
    expect(eas.build.preview.autoIncrement).toBe(true);
    expect(eas.build.preview.channel).toBe('preview-foundation-0.2.7');
    expect(eas.build.preview.env?.APP_VARIANT).toBe('preview');
    expect(isStandaloneBuild('preview')).toBe(true);
    expect(isStandaloneUpdateChannel('preview-foundation-0.2.7')).toBe(true);
    expect(isStandaloneUpdateChannel('preview')).toBe(true);
    expect(isStandaloneUpdateChannel('development')).toBe(false);
    expect(appConfigSource).toContain("'expo-dev-client'");
    expect(appConfigSource).toContain('enabled: !IS_DEV_CLIENT');
    expect(packageJson.scripts?.['update:preview']).toContain('preview-foundation-0.2.7');
  });

  it('forces APP_VARIANT when publishing OTA so preview updates stay standalone', () => {
    expect(packageJson.scripts?.['update:preview']).toContain('APP_VARIANT=preview');
    expect(packageJson.scripts?.['update:production']).toContain('APP_VARIANT=production');
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
