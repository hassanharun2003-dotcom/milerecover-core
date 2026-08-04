/**
 * EAS Build hook — exclude expo-dev-client from native autolinking for
 * standalone preview/production profiles (APP_VARIANT != development).
 *
 * Invoked via package.json "eas-build-pre-install".
 */
const fs = require('fs');
const path = require('path');

const variant = process.env.APP_VARIANT ?? 'development';
const exclude = variant === 'development' ? [] : ['expo-dev-client'];
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
