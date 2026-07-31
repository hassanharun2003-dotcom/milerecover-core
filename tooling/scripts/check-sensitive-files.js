#!/usr/bin/env node
/**
 * Detect suspicious tracked filenames — does NOT read or print file contents.
 * Does NOT replace dedicated secret scanning tools.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');

const SENSITIVE_BASENAMES = new Set([
  '.env',
]);

const SENSITIVE_EXTENSIONS = [
  '.pem',
  '.p12',
  '.pfx',
  '.key',
  '.keystore',
  '.jks',
  '.mobileprovision',
  '.provisionprofile',
  '.sqlite',
  '.sqlite3',
  '.db',
];

const SENSITIVE_NAME_PATTERNS = [
  /^\.env\./,
  /id_rsa/i,
  /private[_-]?key/i,
  /credentials\.json$/i,
  /google-services\.json$/i,
  /GoogleService-Info\.plist$/i,
];

const ALLOWLIST_PREFIXES = [
  '.env.example',
  'tooling/fixtures/',
];

function isAllowlisted(rel) {
  return ALLOWLIST_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

function isSensitive(rel) {
  if (isAllowlisted(rel)) return false;
  const base = path.basename(rel);
  if (SENSITIVE_BASENAMES.has(base)) return true;
  const ext = path.extname(rel).toLowerCase();
  if (SENSITIVE_EXTENSIONS.includes(ext)) return true;
  return SENSITIVE_NAME_PATTERNS.some((re) => re.test(rel));
}

function listTrackedFiles() {
  try {
    const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return out.split('\n').filter(Boolean);
  } catch {
    // Not a git repo or git unavailable — walk tree excluding ignored patterns
    const found = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else found.push(path.relative(ROOT, full).replace(/\\/g, '/'));
      }
    }
    walk(ROOT);
    return found;
  }
}

function main() {
  const tracked = listTrackedFiles();
  const hits = tracked.filter(isSensitive);

  if (hits.length > 0) {
    console.error('Sensitive-file check FAILED. Suspicious tracked paths (names only):');
    for (const h of hits) console.error(`  - ${h}`);
    process.exit(1);
  }

  console.log(`Sensitive-file check passed (${tracked.length} tracked paths scanned by name).`);
}

main();
