import fs from 'fs';
import path from 'path';
import {
  APP_BUILD_LABEL,
  APP_PACKAGE_ID,
  APP_VERSION,
  getDevClientAutolinkingExclude,
  isStandaloneBuild,
} from '../src/constants/buildInfo';

const root = path.join(__dirname, '..');

function readJson(fileName: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, fileName), 'utf8')) as Record<string, unknown>;
}

describe('Production MVP build configuration', () => {
  const appConfigSource = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
  const syncScript = fs.readFileSync(
    path.join(root, 'scripts/sync-dev-client-autolinking.cjs'),
    'utf8',
  );
  const packageJson = readJson('package.json') as {
    scripts?: { 'eas-build-pre-install'?: string };
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

  it('ships package com.milerecover.app and version/runtime 0.2.3', () => {
    expect(APP_PACKAGE_ID).toBe('com.milerecover.app');
    expect(APP_VERSION).toBe('0.2.3');
    expect(APP_BUILD_LABEL).toBe('0.2.3-blueprint-lock.3');
    expect(appConfigSource).toContain("package: 'com.milerecover.app'");
    expect(appConfigSource).toContain("bundleIdentifier: 'com.milerecover.app'");
    expect(appConfigSource).toContain("version: '0.2.3'");
    expect(appConfigSource).toContain("policy: 'appVersion'");
    expect(appConfigSource).toContain('expo-location');
    expect(appConfigSource).toContain('@react-native-community/datetimepicker');
    expect(appConfigSource).toContain('@react-native-google-signin/google-signin');
    expect(appConfigSource).toContain('expo-apple-authentication');
  });

  it('enables preview autoIncrement and standalone preview behavior', () => {
    expect(eas.build.preview.autoIncrement).toBe(true);
    expect(eas.build.preview.channel).toBe('preview');
    expect(eas.build.preview.env?.APP_VARIANT).toBe('preview');
    expect(isStandaloneBuild('preview')).toBe(true);
    expect(appConfigSource).toContain("'expo-dev-client'");
    expect(appConfigSource).toContain('enabled: !IS_DEV_CLIENT');
  });

  it('forces APP_VARIANT when publishing OTA so preview updates stay standalone', () => {
    const pkg = readJson('package.json') as {
      scripts?: { 'update:preview'?: string; 'update:production'?: string };
    };
    expect(pkg.scripts?.['update:preview']).toContain('APP_VARIANT=preview');
    expect(pkg.scripts?.['update:preview']).toContain('--channel preview');
    expect(pkg.scripts?.['update:production']).toContain('APP_VARIANT=production');
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
    expect(syncScript).toContain("'expo-dev-launcher'");
    expect(syncScript).toContain("'expo-dev-menu'");
    expect(syncScript).toContain('DEV_CLIENT_NATIVE_PACKAGES');
    expect(appConfigSource).toContain("'expo-dev-launcher'");
    expect(appConfigSource).toContain('DEV_CLIENT_NATIVE_PACKAGES');
  });
});
