# Phase 0 Checklist

**Status:** Active  
**Last Updated:** July 2026  
**Owner:** Engineering  
**Authority:** [Technical Implementation Plan.md](./Technical%20Implementation%20Plan.md) §26 Phase 0

Phase 0 establishes repository, governance, quality controls, and boundaries — **no production application behavior**.

---

## Repository structure

- [x] `apps/mobile`, `apps/backend` directories with README
- [x] `packages/domain`, `contracts`, `config`, `testing` with README
- [x] `prototypes/` A–J directories with brief READMEs
- [x] `tooling/scripts`, `fixtures`, `schemas`
- [x] `docs/adr/` framework and ADRs 0001–0004
- [x] Root workspace manifest (`package.json`, `pnpm-workspace.yaml`)
- [ ] Replace CODEOWNERS placeholders before external collaboration

## Git policies

- [x] `.gitignore` — secrets, DBs, build output, diagnostics
- [x] `.gitattributes` — text normalization
- [x] `.editorconfig`
- [x] `.env.example` — documentation only

## Governance

- [x] ADR process (`docs/adr/README.md`, template)
- [x] Engineering Principles
- [x] Dependency and Vendor Policy
- [x] Synthetic Test Data Policy
- [x] Prototype Governance
- [x] SECURITY.md

## GitHub

- [x] PR template
- [x] Issue templates (bug, feature, prototype, ADR, security, docs)
- [x] CODEOWNERS (placeholder comments)
- [x] CI workflow `repository-quality.yml`

## Quality checks

- [x] `check:required-files`
- [x] `check:boundaries`
- [x] `check:sensitive-files`
- [x] `check:doc-links`
- [x] `check:all`

## Security

- [x] No secrets in repository
- [x] No real user location data in fixtures
- [x] Sensitive filename CI guard
- [ ] Secret scanning tool (optional, post–Phase 0)

## Readiness confirmations

- [x] No production application code
- [x] No dependencies installed (`node_modules`, lockfiles absent)
- [x] No vendor prematurely locked (maps, analytics, crash, entitlements, local DB)
- [x] Prototype briefs A–J present
- [ ] **Technical Implementation Plan formally approved by founding team**
- [ ] **Phase 0 exit review meeting completed**

---

## Phase 0 exit criteria

Phase 0 is complete when:

1. All checklist items above are checked (except optional secret scanner)
2. `npm run check:all` passes locally and in CI
3. ADRs 0001–0004 accepted
4. Founding team approves exit review
5. **Phase 1 may begin** — validation prototypes A/B/C/I in `prototypes/` (still no production UI)

Phase 0 exit does **not** require prototypes A–J to be implemented.

---

## After exit

**Approved next stage:** Phase 1 native tracking validation prototypes — not production feature development.

See [Technical Implementation Plan.md](./Technical%20Implementation%20Plan.md) §34.

---

## Commands

```bash
node tooling/scripts/check-all.js
# or, when using npm scripts:
npm run check:all
```

No build, start, or deploy commands exist in Phase 0.
