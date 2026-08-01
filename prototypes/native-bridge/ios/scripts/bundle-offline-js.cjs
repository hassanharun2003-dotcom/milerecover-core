'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const bridgeDir = path.resolve(__dirname, '../..');
const iosDir = path.resolve(__dirname, '..');
const outFile = path.join(iosDir, 'MileRecoverProtoBridgeC/main.jsbundle');
const metroCli = path.join(bridgeDir, 'node_modules/metro/src/cli.js');

if (!fs.existsSync(metroCli)) {
  console.error('error: metro CLI missing — run npm ci in prototypes/native-bridge');
  process.exit(1);
}

const generatedJs = `${outFile}.js`;
for (const stale of [outFile, generatedJs, path.join(iosDir, 'MileRecoverProtoBridgeC/index.js.bundle')]) {
  try {
    fs.unlinkSync(stale);
  } catch {
    // ignore missing
  }
}

const result = spawnSync(
  process.execPath,
  [
    metroCli,
    'build',
    'index.js',
    '--platform',
    'ios',
    '--out',
    outFile,
    '--config',
    'metro.config.js',
    '--dev',
    'false',
  ],
  { cwd: bridgeDir, stdio: 'inherit' }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (fs.existsSync(generatedJs)) {
  fs.renameSync(generatedJs, outFile);
} else if (fs.existsSync(path.join(iosDir, 'MileRecoverProtoBridgeC/index.js.bundle'))) {
  fs.renameSync(path.join(iosDir, 'MileRecoverProtoBridgeC/index.js.bundle'), outFile);
}

if (!fs.existsSync(outFile)) {
  console.error(`error: bundle not written to ${outFile}`);
  process.exit(1);
}

console.log(`Offline JS bundle ready: ${outFile}`);
