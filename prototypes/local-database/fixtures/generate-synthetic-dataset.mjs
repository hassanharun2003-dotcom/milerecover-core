import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDataset } from '../harness/lib/synthetic-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, 'synthetic-sample.json');

const dataset = generateDataset({ tripCount: 5, inboxPerSession: 10 });

// Strip controlled evidence from committed sample — metadata only for structure reference
const sample = {
  disclaimer: 'Synthetic data only. No real locations. controlled_evidence omitted in committed sample.',
  tripCount: dataset.trips.length,
  trips: dataset.trips,
  evidence: dataset.evidence.map((e) => ({
    ...e,
    payload_json: JSON.parse(e.payload_json),
  })),
  inbox: dataset.inbox.map((i) => ({
    ...i,
    sanitized_metadata_json: JSON.parse(i.sanitized_metadata_json),
    controlled_evidence_json: '[OMITTED — generated locally only]',
  })),
};

fs.writeFileSync(outPath, JSON.stringify(sample, null, 2));
console.log(`Wrote ${outPath}`);
