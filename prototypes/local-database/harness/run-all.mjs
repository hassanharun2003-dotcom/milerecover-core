import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSqliteTypedBenchmarks } from './candidates/sqlite-typed/benchmark.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'output');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const sqliteResults = await runSqliteTypedBenchmarks();
  fs.writeFileSync(
    path.join(outDir, 'sqlite-typed-results.json'),
    JSON.stringify(sqliteResults, null, 2),
  );

  const summary = {
    generatedAt: new Date().toISOString(),
    candidates: {
      'sqlite-typed': { status: sqliteResults.status, path: 'output/sqlite-typed-results.json' },
      watermelon: { status: 'pending', path: 'candidates/watermelon/EVALUATION.md' },
      realm: { status: 'pending', path: 'candidates/realm/EVALUATION.md' },
      'native-sqlite-kotlin': { status: 'pending', path: 'candidates/native-sqlite-kotlin/README.md' },
      'native-sqlite-swift': { status: 'pending', path: 'candidates/native-sqlite-swift/EVALUATION.md' },
    },
    disclaimer:
      'Only sqlite-typed sql.js harness produces measured timings in this environment. Mobile candidates require device/emulator runs.',
  };

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
