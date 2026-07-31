#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const scripts = [
  'check-required-files.js',
  'check-boundaries.js',
  'check-sensitive-files.js',
  'check-doc-links.js',
];

let failed = false;

for (const script of scripts) {
  const full = path.join(__dirname, script);
  const result = spawnSync(process.execPath, [full], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log('All repository checks passed.');
