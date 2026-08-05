/**
 * EAS Build hook — exclude expo-dev-client and its native modules from
 * autolinking for standalone preview/production profiles (APP_VARIANT != development).
 *
 * Excluding only `expo-dev-client` is insufficient: Expo still autolinks
 * `expo-dev-launcher`, `expo-dev-menu`, and `expo-dev-menu-interface` from node_modules.
 *
 * Invoked via package.json "eas-build-pre-install".
 */
const fs = require('fs');
const path = require('path');

const DEV_CLIENT_NATIVE_PACKAGES = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
];

const variant = process.env.APP_VARIANT ?? 'development';
const exclude = variant === 'development' ? [] : DEV_CLIENT_NATIVE_PACKAGES;
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.expo = {
  ...(packageJson.expo ?? {}),
  autolinking: {
    ...(packageJson.expo?.autolinking ?? {}),
    exclude,
  },
};

fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(
  `[sync-dev-client-autolinking] APP_VARIANT=${variant} exclude=${JSON.stringify(exclude)}`,
);
