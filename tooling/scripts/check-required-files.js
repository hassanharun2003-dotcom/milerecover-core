#!/usr/bin/env node
/**
 * Required foundation files for Phase 0+.
 * Dependency-free — Node.js standard library only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const REQUIRED_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'package.json',
  'pnpm-workspace.yaml',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.env.example',
  'docs/Engineering Principles.md',
  'docs/Dependency and Vendor Policy.md',
  'docs/Synthetic Test Data Policy.md',
  'docs/adr/README.md',
  'docs/adr/0000-template.md',
  'docs/adr/0001-monorepo-workspace.md',
  'docs/adr/0002-application-boundaries.md',
  'docs/adr/0003-prototype-before-production.md',
  'docs/adr/0004-no-real-user-data-in-development.md',
  'planning/Technical Implementation Plan.md',
  'planning/Phase 0 Checklist.md',
  'planning/Prototype Governance.md',
  'apps/README.md',
  'apps/mobile/README.md',
  'apps/backend/README.md',
  'packages/README.md',
  'packages/domain/README.md',
  'packages/contracts/README.md',
  'packages/config/README.md',
  'packages/testing/README.md',
  'prototypes/README.md',
  'tooling/README.md',
  'tooling/schemas/boundary-rules.json',
  '.github/workflows/repository-quality.yml',
  '.github/pull_request_template.md',
];

const REQUIRED_DIRS = [
  'apps/mobile',
  'apps/backend',
  'packages/domain',
  'packages/contracts',
  'packages/config',
  'packages/testing',
  'prototypes/ios-tracking',
  'prototypes/android-tracking',
  'prototypes/native-bridge',
  'prototypes/local-database',
  'prototypes/offline-sync',
  'prototypes/entitlements',
  'prototypes/csv-import',
  'prototypes/report-generation',
  'prototypes/battery-benchmark',
  'prototypes/recovery-precision',
  'tooling/scripts',
  'tooling/fixtures',
  'docs/adr',
];

function main() {
  const missing = [];

  for (const rel of REQUIRED_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      missing.push(`file: ${rel}`);
    }
  }

  for (const rel of REQUIRED_DIRS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      missing.push(`directory: ${rel}`);
    }
  }

  if (missing.length > 0) {
    console.error('Required-file check FAILED. Missing:');
    for (const m of missing) console.error(`  - ${m}`);
    process.exit(1);
  }

  console.log(`Required-file check passed (${REQUIRED_FILES.length} files, ${REQUIRED_DIRS.length} directories).`);
}

main();
