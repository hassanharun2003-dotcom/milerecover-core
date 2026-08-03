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

describe('Verified Android preview build a0fcf6cd configuration', () => {
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

  it('ships package com.milerecover.app and version/runtime 0.1.2', () => {
    expect(APP_PACKAGE_ID).toBe('com.milerecover.app');
    expect(APP_VERSION).toBe('0.1.2');
    expect(APP_BUILD_LABEL).toBe('0.1.2-preview.1');
    expect(appConfigSource).toContain("package: 'com.milerecover.app'");
    expect(appConfigSource).toContain("bundleIdentifier: 'com.milerecover.app'");
    expect(appConfigSource).toContain("version: '0.1.2'");
    expect(appConfigSource).toContain("policy: 'appVersion'");
  });

  it('enables preview autoIncrement and standalone preview behavior', () => {
    expect(eas.build.preview.autoIncrement).toBe(true);
    expect(eas.build.preview.channel).toBe('preview');
    expect(eas.build.preview.env?.APP_VARIANT).toBe('preview');
    expect(isStandaloneBuild('preview')).toBe(true);
    expect(appConfigSource).toContain("plugins: IS_DEV_CLIENT ? ['expo-dev-client'] : []");
    expect(appConfigSource).toContain('enabled: !IS_DEV_CLIENT');
  });

  it('excludes expo-dev-client from autolinking for standalone variants', () => {
    expect(getDevClientAutolinkingExclude('preview')).toEqual(['expo-dev-client']);
    expect(getDevClientAutolinkingExclude('production')).toEqual(['expo-dev-client']);
    expect(getDevClientAutolinkingExclude('development')).toEqual([]);
    expect(packageJson.scripts?.['eas-build-pre-install']).toContain(
      'sync-dev-client-autolinking.cjs',
    );
    expect(syncScript).toContain("exclude = variant === 'development' ? [] : ['expo-dev-client']");
    expect(appConfigSource).toContain("APP_VARIANT === 'development' ? [] : ['expo-dev-client']");
  });
});
