#!/usr/bin/env node
/**
 * Basic boundary guard — scans source files for prohibited import patterns.
 * Phase 0: validates policy markers and import text when source exists.
 * This is NOT a complete architecture verifier.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const RULES_PATH = path.join(ROOT, 'tooling/schemas/boundary-rules.json');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.kt', '.swift']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function relFromRoot(full) {
  return path.relative(ROOT, full).replace(/\\/g, '/');
}

function detectPackage(relPath) {
  if (relPath.startsWith('packages/domain/')) return 'domain';
  if (relPath.startsWith('packages/contracts/')) return 'contracts';
  if (relPath.startsWith('packages/config/')) return 'config';
  if (relPath.startsWith('packages/testing/')) return 'testing';
  if (relPath.startsWith('apps/mobile-expo/')) return 'mobile-expo';
  if (relPath.startsWith('apps/mobile/')) return 'mobile';
  if (relPath.startsWith('apps/backend/')) return 'backend';
  if (relPath.startsWith('prototypes/')) return 'prototype';
  if (relPath.startsWith('tooling/scripts/')) return 'tooling-script';
  return null;
}

function lineLooksLikeImport(line) {
  const t = line.trim();
  return (
    t.startsWith('import ') ||
    t.startsWith('export ') && t.includes(' from ') ||
    t.startsWith('require(') ||
    t.includes('from ') && (t.startsWith('const ') || t.startsWith('let '))
  );
}

function main() {
  const rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
  const violations = [];

  // Policy marker: prototypes README must warn against production import
  const protoReadme = path.join(ROOT, 'prototypes/README.md');
  if (fs.existsSync(protoReadme)) {
    const text = fs.readFileSync(protoReadme, 'utf8');
    if (!text.includes('must not be imported') && !text.includes('must not be promoted')) {
      violations.push('prototypes/README.md missing promotion/import prohibition language');
    }
  }

  const scanRoots = ['packages', 'apps', 'prototypes'];
  const allFiles = scanRoots.flatMap((d) => walk(path.join(ROOT, d)));

  if (allFiles.length === 0) {
    console.log('Boundary check passed (no source files yet — directory policy markers only).');
    return;
  }

  for (const file of allFiles) {
    const rel = relFromRoot(file);
    const pkg = detectPackage(rel);
    if (!pkg || pkg === 'tooling-script' || pkg === 'prototype') continue;

    const pkgRules = rules.packages[pkg];
    if (!pkgRules) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!lineLooksLikeImport(line)) continue;
      const lower = line.toLowerCase();

      for (const banned of pkgRules.mustNotImportFrom || []) {
        const needle = banned.toLowerCase();
        if (lower.includes(`'${needle}`) || lower.includes(`"${needle}`) || lower.includes(`/${needle}`) || lower.includes(`${needle}/`)) {
          violations.push(`${rel}:${i + 1} — prohibited import pattern "${banned}" for ${pkg}`);
        }
      }
    }
  }

  // Production must not import prototypes
  for (const file of allFiles) {
    const rel = relFromRoot(file);
    const pkg = detectPackage(rel);
    if (pkg !== 'mobile' && pkg !== 'backend' && !rel.startsWith('packages/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (/prototypes\//i.test(content) && /import|require|from/i.test(content)) {
      violations.push(`${rel} — imports from prototypes/ (forbidden until ADR promotion)`);
    }
  }

  if (violations.length > 0) {
    console.error('Boundary check FAILED:');
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log(`Boundary check passed (${allFiles.length} source files scanned).`);
}

main();
