'use strict';

const fs = require('fs');
const path = require('path');

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const branch = arg('branch', 'local');
const buildLogPath = arg('build-log');
const testLogPath = arg('test-log');
const outPath = arg('out');

const buildLog = buildLogPath && fs.existsSync(buildLogPath) ? fs.readFileSync(buildLogPath, 'utf8') : '';
const testLog = testLogPath && fs.existsSync(testLogPath) ? fs.readFileSync(testLogPath, 'utf8') : '';

const buildPassed = /BUILD SUCCEEDED/.test(buildLog);
const testPassed = /\*\* TEST SUCCEEDED \*\*/.test(testLog) && !/TEST FAILED/.test(testLog);

const testsRun = [];
const testsFailed = [];
for (const line of testLog.split('\n')) {
  let m = line.match(/^Test Case '-\[(.*)\]' passed/);
  if (m) testsRun.push(m[1]);
  m = line.match(/^Test Case '-\[(.*)\]' failed/);
  if (m) testsFailed.push(m[1]);
}

const summary = {
  package: 'ios-package-2',
  platform: 'ios-simulator',
  branch,
  finishedAt: new Date().toISOString(),
  rnVersion: '0.76.5',
  contractMajor: 1,
  bridgeApiVersion: '1.0.0-prototype-c',
  unsignedBuild: true,
  hostlessLogicTarget: true,
  scheme: 'MileRecoverProtoBridgeCLogicTests',
  build: { status: buildPassed ? 'passed' : 'failed' },
  nativeTests: {
    status: testPassed ? 'passed' : 'failed',
    suites: ['PrototypeEventBufferTests', 'DiagnosticSanitizerTests', 'BridgeVersionTests'],
    testsRun,
    testsFailed,
    skippedUiTest: 'MileRecoverProtoBridgeCTests/testRendersWelcomeScreen',
  },
  exitCode: buildPassed && testPassed ? 0 : 1,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);
if (!buildPassed || !testPassed) process.exit(1);
