#!/usr/bin/env node
/**
 * Restore files from agent transcript Write operations (Phase 0 hydration).
 * Uses latest Write content per path when duplicates exist.
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ROOT = path.resolve(import.meta.dirname, '../..');
const TRANSCRIPT =
  process.env.TRANSCRIPT_PATH ??
  path.join(
    process.env.USERPROFILE ?? '',
    '.cursor',
    'projects',
    'c-Users-User-OneDrive-Documents-milerecover-core',
    'agent-transcripts',
    '05279dbf-23ce-4fff-a677-dd57f0c5cca7',
    '05279dbf-23ce-4fff-a677-dd57f0c5cca7.jsonl',
  );

if (!fs.existsSync(TRANSCRIPT)) {
  console.error('Transcript not found:', TRANSCRIPT);
  process.exit(1);
}

/** @type {Map<string, string>} */
const files = new Map();

const rl = readline.createInterface({
  input: fs.createReadStream(TRANSCRIPT, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line.includes('"Write"')) continue;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    continue;
  }
  const parts = obj.message?.content;
  if (!Array.isArray(parts)) continue;
  for (const part of parts) {
    if (part.type !== 'tool_use' || part.name !== 'Write') continue;
    const input = part.input;
    if (!input?.path || input.contents === undefined) continue;
    const normalized = input.path.replace(/\\/g, '/').toLowerCase();
    if (!normalized.includes('milerecover-core/')) continue;
    const rel = input.path.split(/milerecover-core[/\\]/i)[1]?.replace(/\\/g, '/');
    if (!rel) continue;
    // Skip prototype C paths already in git — keep checkpoint versions
    if (rel.startsWith('prototypes/native-bridge/')) continue;
    files.set(rel, input.contents);
  }
}

let restored = 0;
let skipped = 0;
for (const [rel, contents] of files) {
  const dest = path.join(ROOT, rel);
  if (fs.existsSync(dest)) {
    const stat = fs.statSync(dest);
    if (stat.isFile() && stat.size > 0) {
      skipped++;
      continue;
    }
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents, 'utf8');
  restored++;
}

console.log(
  JSON.stringify(
    {
      transcript: TRANSCRIPT,
      candidates: files.size,
      restored,
      skippedExisting: skipped,
    },
    null,
    2,
  ),
);
