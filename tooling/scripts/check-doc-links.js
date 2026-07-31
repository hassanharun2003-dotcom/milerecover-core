#!/usr/bin/env node
/**
 * Validate relative Markdown links in key foundation documents.
 * No network access — local paths only.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const SCAN_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'planning/Phase 0 Checklist.md',
  'planning/Technical Implementation Plan.md',
  'docs/Engineering Principles.md',
  'docs/adr/README.md',
];

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function isExternal(href) {
  return /^(https?:|mailto:|#)/.test(href);
}

function decodeUri(c) {
  try {
    return decodeURIComponent(c);
  } catch {
    return c;
  }
}

function resolveLink(fromFile, href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  const fromDir = path.dirname(path.join(ROOT, fromFile));
  return path.normalize(path.join(fromDir, decodeUri(clean)));
}

function main() {
  const broken = [];

  for (const rel of SCAN_FILES) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      broken.push(`${rel} — source file missing`);
      continue;
    }
    const text = fs.readFileSync(full, 'utf8');
    let match;
    while ((match = LINK_RE.exec(text)) !== null) {
      const href = match[2].trim();
      if (isExternal(href)) continue;
      const target = resolveLink(rel, href);
      if (target && !fs.existsSync(target)) {
        broken.push(`${rel} → ${href}`);
      }
    }
  }

  if (broken.length > 0) {
    console.error('Documentation-link check FAILED:');
    for (const b of broken) console.error(`  - ${b}`);
    process.exit(1);
  }

  console.log(`Documentation-link check passed (${SCAN_FILES.length} files).`);
}

main();
