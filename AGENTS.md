# AGENTS.md

## Cursor Cloud specific instructions

### What this repository is

MileRecover is in **Phase 0** — a company operating system + engineering monorepo foundation.
There is **no production application yet** (mobile, backend, and packages under `apps/` and
`packages/` are documented placeholders only). The runnable code is:

1. **Repository quality checks (primary "application").** Dependency-free Node.js scripts in
   `tooling/scripts/`. Run from the repo root with `npm run check:all` (or individual
   `check:docs` / `check:boundaries` / `check:sensitive-files` / `check:links`). No install is
   needed for these and none should be added — CI (`.github/workflows/repository-quality.yml`)
   asserts the repo root has **no `node_modules` and no lockfiles** (`pnpm-lock.yaml`,
   `package-lock.json`, `yarn.lock`). Never run `npm install`/`pnpm install` at the repo root.
2. **Disposable validation prototypes** with their own committed `package.json` +
   `package-lock.json` (this is allowed inside prototype folders, just not the repo root):
   - `prototypes/native-bridge/` (Prototype C) — React Native bridge/event-buffer harness.
   - `prototypes/local-database/harness/` (Prototype D) — sql.js benchmark harness.

### Running the prototypes

The startup update script installs the two prototype harnesses with `npm ci` in their own
folders, so their `node_modules` are ready. Standard commands (see each prototype's
`package.json`):

- `prototypes/native-bridge`: `npm run typecheck`, `npm test` (Jest, 39 tests),
  `npm run benchmark`, `npm run generate:fixtures`. These run fully in this Linux environment.
  The Android/iOS build + on-device steps in that prototype's `README.md` require Android Studio /
  Xcode + a physical device and **cannot** run in this VM.
- `prototypes/local-database/harness`: `npm run benchmark`.

### Known caveats

- `prototypes/local-database/harness` benchmark (`npm run benchmark`) currently **fails** with
  `unrecognized token: "#"`. Cause: `lib/schema-v1.sql` and `lib/schema-v2.sql` use `#` for
  comment lines, which is invalid SQLite syntax (SQLite comments start with `--`). This is a
  pre-existing bug in a disposable prototype, unrelated to environment setup.
- Node.js 20+ is required (`package.json` `engines`); the VM ships a newer Node which works fine.
