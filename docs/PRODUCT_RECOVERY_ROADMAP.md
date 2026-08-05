# MileSave Product Recovery Roadmap

**Generated:** 1 August 2026  
**Evidence branch:** `milestone/package-3-product` @ `4fd09af7f9a149c18653de897db4cdfdff48d25b`  
**Companion:** [PROJECT_HEALTH_REPORT.md](./PROJECT_HEALTH_REPORT.md)

> **Naming note:** This roadmap targets the user-facing release **MileSave: Mileage Tracker**. The repository, package IDs, and docs currently use **MileRecover** (`com.milerecover.app`, `@milerecover/domain`). Rebranding for store listing is a separate deliverable not started in code.

> **Scope:** Facts from the repository only. No invented completed systems. Reliability over feature count.

---

# 1. Current Reality

## Genuinely working (verified locally on branch)

| Area | Evidence |
|------|----------|
| Repository governance checks | `npm run check:all` — PASS (430 paths, 123 source files, boundaries, sensitive files, doc links) |
| Domain logic + tests | `npm run test:domain` — **27/27 PASS** (13 domain + 14 persistence) |
| TypeScript | `typecheck:domain`, `typecheck:mobile`, `packages/config` typecheck — PASS |
| Pure domain modules | Permissions, Protection Health, review prioritization, recovery transitions, trip types, proof summary, onboarding progression, persistence schema v1 |
| Design tokens | `@milerecover/config` — forest-green token set in `packages/config/src/tokens.ts` |
| Mobile JS shell | RN 0.76.5, 5-tab navigation, 4-step onboarding, 6 screens, `StartupGate`, `AppContext` restore/save |
| Local persistence | AsyncStorage adapter, schema v1, primary + backup keys, 7 startup phases |
| Native project scaffolds | `apps/mobile/android`, `apps/mobile/ios` — `com.milerecover.app` |
| CI configuration | `package-3-domain.yml`, `package-3-mobile.yml`, prototype workflows on `main` |
| Prototype foundation | ~200 files under `prototypes/` (tracking, bridge, local DB, entitlements, report generation, etc.) — **isolated**, no imports into `apps/` or `packages/` (ADR-0003) |
| Planning & architecture docs | TIP, MVP, Recovery Engine, Export Formats, Offline First, Package 3 plans |

## Partially implemented

| Area | What exists | What does not |
|------|-------------|---------------|
| Home | Protection Health card, period miles, today summary from selectors | Real engine/permission inputs; always `trackingEngineState: 'idle'`, permissions `not_determined` |
| Review | Empty state + list rendering from domain selectors | No tap-through, no classification actions, no trip detail route |
| Proof | Summary from confirmed miles; honest `exportAvailable: false` | No PDF/CSV generation |
| Profile | Permission labels, privacy copy | No settings actions, vehicles, subscription, account |
| Manual add | Guidance copy only | No form, no CRUD |
| Onboarding | 4 screens with labeled buttons | Permission buttons do not call OS APIs |
| Persistence | JSON document for shell state | Not encrypted; not relational; no raw GPS/route storage |
| Package 3 increments | Inc 1 checkpointed; Inc 2 code landed | Inc 2 **not checkpoint-closed** |

## Mocked / stubbed / honest placeholders

| Surface | Behavior |
|---------|----------|
| `trackingEngineState` | Hardcoded `'idle'` in initial app state |
| `permissions` | Static `not_determined` / `not_applicable` — never refreshed from OS |
| `exportAvailable` | Domain returns `false`; Proof screen states export unavailable |
| Trip/recovery data | Empty arrays — zero mileage, no fake trips (Trust Rules compliant) |
| Sync | `lastSyncAt: null`; Profile copy: *"until sync is enabled"* |
| Mileage rate | Nullable; deduction estimate hidden until configured |

## Missing (required for stated V1 — not in production paths)

| Capability | Repo status |
|------------|-------------|
| Native Tracking Engine in production app | Prototypes only (`prototypes/android-tracking`, `prototypes/ios-tracking`, `prototypes/native-bridge`) |
| Encrypted local SQLite (TIP operational SOT) | Prototype D path exists; production uses AsyncStorage JSON |
| `PermissionService` / native permission module | Referenced in Package 3 plan; **file does not exist** |
| Trip detail screen | Not in `apps/mobile/src/screens/` |
| Tracking Active screen | Not implemented |
| Missing-trip recovery UI | Domain types + transitions only |
| Manual trip create/edit | Domain `TripRecord` types only |
| Vehicle management | Not in domain store or UI |
| Business purposes (beyond `purpose: string \| null` on trip) | No purpose library UI |
| CSV/PDF export | Architecture spec only; `prototypes/report-generation/` |
| Account / auth | `apps/backend/` — README only (1 file) |
| Subscription / entitlements | `prototypes/entitlements/` only |
| Cloud sync | `prototypes/offline-sync/` only; `api/` is OpenAPI starter |
| `packages/contracts/` | README placeholder |
| Mobile component/integration tests | None |
| E2E / device validation artifacts | Documented deferred; no screenshots or matrices in repo |

## Unverified

| Item | Status |
|------|--------|
| Package 3 mobile CI green on HEAD (`4fd09af`) | **UNVERIFIED** — 9 workflow runs; prior session documented Android assemble + iOS pod failures |
| Local Android assemble | **FAIL** on Windows host — `SDK location not found` (environment) |
| Local iOS build | Not attempted (Windows host) |
| `StartupGate` states on device/emulator | Wired in code; no emulator evidence in repo |
| Package 3 domain CI on latest push | **UNVERIFIED** on HEAD; historically green |

## Stale / contradictory documentation

| Document | Issue |
|----------|-------|
| Root `README.md` | Claims Phase 0, mobile not initialized |
| Root `package.json` | *"No production application builds yet"* |
| TIP §1 | Application code in *"separate application repository"* — Package 3 lives in this monorepo |
| `planning/Package 3 Implementation Plan.md` | Persistence listed in Increment 6; actually delivered in Increment 2 |
| `planning/MVP.md` | 4-tab navigation; app implements **5-tab** Package 3 IA (documented override in Package 3 plan) |
| `design/Interaction Rules.md` | Mentions swipe-to-confirm; V1 roadmap below requires **labeled controls** (product direction for MileSave V1) |

## Branch / checkpoint state

| Item | Value |
|------|-------|
| Active branch | `milestone/package-3-product` |
| `main` | Frozen at Package 2 — `023c5b5` |
| Tags present | `checkpoint/package-3-increment-1`, `checkpoint/package-3-increment-2-start` |
| Tag missing | `checkpoint/package-3-increment-2` |

---

# 2. Release Definition

## Smallest complete production-ready V1

**Product:** MileSave: Mileage Tracker (Play Store listing name; implementation continues in this monorepo until rebrand).

**Promise:** Reliable automatic mileage capture, honest review, gap recovery with evidence, and exportable business-mile records — **without inventing mileage**.

### V1 must include (mapped to repo intent)

| Requirement | V1 definition (minimal, shippable) |
|-------------|-----------------------------------|
| Reliable automatic mileage tracking | Native Tracking Engine v1 promoted into `apps/mobile` (Android first); conservative detection; foreground service on Android; draft trips → local store |
| Clear tracking-status visibility | Protection Health + **Tracking Active** screen driven by real engine + permission inputs |
| Missing-trip recovery | **Local** gap detection + recovery candidates (domain exists); user-confirmed accept/reject; no silent trip creation |
| Simple trip review (no swipe-only) | Review queue with **labeled** Business / Personal / Reject / Open detail buttons on each row and in trip detail |
| Business and personal classification | `applyClassification` / `rejectTrip` domain functions wired to UI |
| Business purposes | Required text (or picker from user-defined list) before business confirm |
| Manual trip creation and editing | Form: date, distance, classification, purpose; edit existing trips |
| Vehicle management | At least one default vehicle; add/edit/archive; trip associates to vehicle |
| Mileage summaries | Home + Proof period totals from **confirmed business** miles only |
| CSV and PDF exports | On-device generation per `architecture/Export Formats.md`; tier gating per `docs/09 Pricing.md` (basic CSV Free; PDF Plus+) |
| Account and privacy controls | Sign-in (Apple + Google minimum on Android); delete local data; export portability; privacy policy link |
| Subscription entitlement handling | RevenueCat (or equivalent) client + **server reconcile** for tamper resistance; local entitlement cache for offline |
| Android-first production readiness | Signed release build, Play Console internal track, permission declarations, battery optimization guidance |
| Honest states | Empty, loading, permission denied/restricted, offline, engine unavailable, export blocked, subscription locked — per `planning/Package 3 UX State Matrix.md` |

### Explicitly out of V1 (not required for core functionality in repo)

| Excluded | Reason |
|----------|--------|
| Tax filing, banking, AI chat | Not in MVP launch scope; no production code |
| Teams / fleet management | MVP out of scope; H3 in `planning/MVP.md` |
| Full cloud sync / multi-device | TIP Phase 6; defer to V1.1 unless auth requires backup |
| Calendar matching, competitor import recovery | Plus-tier server-assisted features; prototypes only |
| Proof Score | Plus feature; can ship V1 with export completeness checks first |
| iOS App Store release | Android-first; iOS simulator CI as parity guard only until Android ships |

### V1 success measures (from repo docs, adapted)

| Gate | Target |
|------|--------|
| Critical Trust Rule violations | 0 |
| Phantom trip rate (beta) | <5% (`planning/MVP.md`) |
| Offline 7-day capture/review | Zero data loss |
| Export acceptance (beta panel) | ≥85% CPA/employer CSV |
| Native CI + release build | Green on milestone branch |

---

# 3. Critical Path

Dependency order from **current state** → **Android Play production V1**:

```
[R1] Repository truth & doc cleanup
  ↓
[R2] Mobile CI green + Increment 2 checkpoint
  ↓
[R3] Design system lock + navigation/shell hardening
  ↓
[R3b] Encrypted local trip store (SQLite) — ADR + adapter — BLOCKS real GPS writes
  ↓
[R4] Native tracking engine promotion (Android) + lifecycle reliability
  ↓
[R5] Permission + battery-health UX (must gate engine start)
  ↓
[R6] Trip review, editing, classification (labeled controls)
  ↓
[R7] Missing-trip recovery + evidence UI
  ↓
[R8] Vehicles, purposes, manual trip CRUD
  ↓
[R9] Mileage summaries polish (Home/Proof/Reports)
  ↓
[R10] CSV + PDF on-device export + tier gates
  ↓
[R11] Account, privacy, subscription entitlements (minimal backend)
  ↓
[R12] Android production hardening + Play Store release gates
  ↓
[V1] Closed beta → Production
```

**Parallel allowed after R2:** Domain/contract work, export prototype promotion research, backend auth spike — **not** feature UI that depends on unproven native builds.

**Hard blockers:** No real location persistence before R3b. No Play release before R2 + R4 + R5 green on physical Android device matrix.

---

# 4. Package Plan

Each package follows the same template. Packages **R1–R7** are detailed in §5. **R8–R12** complete the path to V1.

---

## Package R1 — Repository Truth & Documentation Cleanup

| Field | Content |
|-------|---------|
| **Objective** | Align root docs with Package 3 reality; remove contributor confusion |
| **User problem solved** | Engineers and agents stop building against false "Phase 0 / no app" assumptions |
| **Repository areas** | `README.md`, `package.json`, `planning/Package 3 Implementation Plan.md`, `planning/Technical Implementation Plan.md` (monorepo note), `docs/PRODUCT_RECOVERY_ROADMAP.md` cross-links |
| **Dependencies** | None |
| **Acceptance criteria** | Root README describes milestone branch workflow, Package 3 status, accurate tab IA (5-tab); package.json description accurate; plan increment sequencing matches Inc 1–2 delivery |
| **Automated tests** | `npm run check:all`, `npm run check:links` |
| **Manual tests** | New contributor can find `apps/mobile/README.md` and run commands without hitting contradictions |
| **CI gate** | `repository-quality.yml` on updated docs path |
| **Definition of done** | Docs merged on milestone branch; no claim of features not implemented |
| **Branch** | `milestone/package-r1-repo-truth` |
| **Checkpoint tag** | `checkpoint/product-recovery-r1` |

---

## Package R2 — Mobile CI & Increment 2 Checkpoint Closure

| Field | Content |
|-------|---------|
| **Objective** | Green `package-3-mobile.yml` on HEAD; close Package 3 Increment 2 formally |
| **User problem solved** | Every change proves the app still builds on Android + iOS simulator |
| **Repository areas** | `.github/workflows/package-3-mobile.yml`, `apps/mobile/android/**`, `apps/mobile/ios/**`, `apps/mobile/package.json`, `apps/mobile/ios/MileRecoverTests/MileRecoverTests.m` |
| **Dependencies** | R1 (optional, recommended) |
| **Acceptance criteria** | Android `assembleDebug` green in CI; iOS `pod install` + unsigned simulator build green; tag `checkpoint/package-3-increment-2` exists |
| **Automated tests** | Full `package-3-mobile.yml` job matrix |
| **Manual tests** | Android emulator launch (smoke); document SDK setup in `apps/mobile/README.md` if gaps found |
| **CI gate** | `package-3-mobile.yml` all jobs green |
| **Definition of done** | Checkpoint tag pushed; health report appendix can list verified CI SHA |
| **Branch** | `milestone/package-3-product` (or `milestone/package-r2-ci-closure`) |
| **Checkpoint tag** | `checkpoint/package-3-increment-2` |

---

## Package R3 — App Shell & Locked Design System

| Field | Content |
|-------|---------|
| **Objective** | Production shell matches Design Bible + Interaction Rules for MileSave V1 (labeled actions, no swipe-only flows) |
| **User problem solved** | Consistent, accessible UI foundation before feature screens multiply |
| **Repository areas** | `packages/config/**`, `apps/mobile/src/components/ui.tsx`, `apps/mobile/src/navigation/**`, new shared components (Button variants, ListRow, StatusBanner, EmptyState, ErrorState), `design/Design Bible.md` token reconciliation note |
| **Dependencies** | R2 |
| **Acceptance criteria** | All screens use shared primitives; accessibility labels on primary actions; 5-tab IA stable; stack routes stubbed for TripDetail, TrackingActive, RecoveryFlow, Settings |
| **Automated tests** | `typecheck:mobile`; optional snapshot tests for `EmptyState` / `StatusBanner` |
| **Manual tests** | VoiceOver/TalkBack pass on tab bar + onboarding buttons |
| **CI gate** | `package-3-mobile.yml` shared-checks |
| **Definition of done** | No screen-local one-off button styles; navigation types cover V1 routes |
| **Branch** | `milestone/package-r3-design-system` |
| **Checkpoint tag** | `checkpoint/product-recovery-r3` |

---

## Package R3b — Encrypted Local Trip Store (prerequisite for tracking)

| Field | Content |
|-------|---------|
| **Objective** | Replace AsyncStorage JSON blob for trip/evidence data with encrypted SQLite (or validated alternative from `prototypes/local-database/`) |
| **User problem solved** | Trip and location-adjacent data stored safely at rest before engine writes |
| **Repository areas** | New ADR in `docs/adr/`, `packages/domain/src/persistence/**`, new mobile adapter, migration from schema v1 shell-only split |
| **Dependencies** | R2, R3 (navigation for migration UX) |
| **Acceptance criteria** | ADR accepted; domain tests for migration; shell settings remain recoverable; trip table supports CRUD; encryption uses platform APIs — honest docs |
| **Automated tests** | Persistence migration tests; domain CRUD tests |
| **Manual tests** | Upgrade from Inc 2 install preserves onboarding; corrupt DB triggers safe recovery UI |
| **CI gate** | `package-3-domain.yml` + `package-3-mobile.yml` |
| **Definition of done** | No raw GPS in AsyncStorage; trip writes go to encrypted store |
| **Branch** | `milestone/package-r3b-local-store` |
| **Checkpoint tag** | `checkpoint/product-recovery-r3b` |

---

## Package R4 — Tracking Engine & Lifecycle Reliability

| Field | Content |
|-------|---------|
| **Objective** | Promote native tracking from prototypes into production (Android first); reliable IDLE→RECORDING→DRAFT pipeline |
| **User problem solved** | Drives become pending trips without user babysitting the app |
| **Repository areas** | `apps/mobile/android/**` native module, `packages/contracts/` (bridge DTOs), `apps/mobile/src/services/tracking/**`, domain trip ingest, `architecture/Native Tracking Engine.md` implementation notes |
| **Dependencies** | R3b, R2 |
| **Acceptance criteria** | Engine state exposed to JS; drafts persist to local store; reboot recovery documented; battery benchmark against prototype targets (<5% Android daily — aspirational, measured in manual matrix) |
| **Automated tests** | Domain ingest tests; Android JVM/unit tests where prototype patterns exist |
| **Manual tests** | 30-min drive simulation on Android emulator/device; app kill + relaunch during recording; airplane mode |
| **CI gate** | `package-3-mobile.yml` + new Android native test job if added |
| **Definition of done** | Home shows non-idle engine state when recording; pending trips appear in Review |
| **Branch** | `milestone/package-r4-tracking-engine` |
| **Checkpoint tag** | `checkpoint/product-recovery-r4` |

---

## Package R5 — Permission & Battery-Health Experience

| Field | Content |
|-------|---------|
| **Objective** | Real OS permission flows + Android battery optimization guidance; Protection Health uses live inputs |
| **User problem solved** | User understands why tracking is limited and how to fix it |
| **Repository areas** | `apps/mobile/src/services/permissions/PermissionService.ts` (new), native permission modules, `ProfileScreen`, onboarding steps, `packages/domain` permission mapping |
| **Dependencies** | R4 (engine to protect), R3 |
| **Acceptance criteria** | Location + background location requested with education copy; battery opt-out detected on Android; denied/restricted states match UX matrix; **labeled** "Open Settings" actions |
| **Automated tests** | Domain permission mapping tests (existing); mock PermissionService unit tests |
| **Manual tests** | Deny location → Home shows `limited`; grant → level improves; Settings deep link works on Android |
| **CI gate** | `package-3-mobile.yml` |
| **Definition of done** | No static `not_determined` after first permission check; onboarding permission buttons functional |
| **Branch** | `milestone/package-r5-permissions` |
| **Checkpoint tag** | `checkpoint/product-recovery-r5` |

---

## Package R6 — Trip Review, Editing & Classification

| Field | Content |
|-------|---------|
| **Objective** | Full review loop with labeled controls; trip detail; edit distance/purpose |
| **User problem solved** | User confirms business miles without swipe gestures or mystery actions |
| **Repository areas** | `apps/mobile/src/screens/review/**`, new `screens/trip/TripDetailScreen.tsx`, domain `applyClassification`/`rejectTrip` wiring, navigation stack |
| **Dependencies** | R4 (trips exist), R3, R3b |
| **Acceptance criteria** | Each review row: **Business**, **Personal**, **Reject**, **View details** buttons; business confirm requires purpose; undo snackbar per Interaction Rules G2; no swipe-only classification |
| **Automated tests** | Domain classification tests; mobile selector tests; component tests for action bar |
| **Manual tests** | Classify 10 trips; reject from detail only; verify Proof totals update |
| **CI gate** | `package-3-mobile.yml` + domain tests |
| **Definition of done** | Review empty state only when queue truly empty; confirmed miles match domain |
| **Branch** | `milestone/package-r6-review` |
| **Checkpoint tag** | `checkpoint/product-recovery-r6` |

---

## Package R7 — Missing-Trip Recovery & Evidence

| Field | Content |
|-------|---------|
| **Objective** | Local gap detection → recovery candidates → user confirm/reject with evidence display |
| **User problem solved** | User recovers legitimately missed drives without invented mileage |
| **Repository areas** | `packages/domain/src/recovery/**`, new `screens/recovery/**`, gap detector (local), Review integration |
| **Dependencies** | R4, R6 |
| **Acceptance criteria** | Recovery candidates never auto-promote to trips; evidence list visible before confirm; `RecoveryTransitionAction` honored; Free tier scan limit enforced locally (1/month per pricing doc) |
| **Automated tests** | Existing `recovery-transitions` tests expanded; gap fixture tests |
| **Manual tests** | Simulate day gap → candidate appears → confirm creates `source: recovered` trip → reject archives |
| **CI gate** | Domain + mobile CI |
| **Definition of done** | Recovery flow reachable from Review; Trust Rules preserved |
| **Branch** | `milestone/package-r7-recovery` |
| **Checkpoint tag** | `checkpoint/product-recovery-r7` |

---

## Package R8 — Vehicles, Purposes & Manual Trip CRUD

| Field | Content |
|-------|---------|
| **Objective** | Vehicle management; purpose library; manual add/edit screen functional |
| **User problem solved** | User records trips tracking missed and organizes by vehicle |
| **Repository areas** | Domain vehicle types, `ManualTripScreen`, Profile vehicle section, purpose picker |
| **Dependencies** | R3b, R6 |
| **Acceptance criteria** | Manual form validates per Interaction Rules; ≥1 vehicle; business purpose required for business classification |
| **Automated tests** | Domain validation tests; form validation unit tests |
| **Manual tests** | Create manual trip offline; edit distance; assign vehicle |
| **CI gate** | Standard mobile + domain |
| **Definition of done** | ManualTripScreen no longer guidance-only stub |
| **Branch** | `milestone/package-r8-manual-vehicles` |
| **Checkpoint tag** | `checkpoint/product-recovery-r8` |

---

## Package R9 — Mileage Summaries & Reports UI

| Field | Content |
|-------|---------|
| **Objective** | Period summaries, reporting period selector, honest completeness indicators |
| **User problem solved** | User sees defensible totals for a tax/reimbursement period |
| **Repository areas** | Home, Proof, optional Reports sub-screen |
| **Dependencies** | R6 |
| **Acceptance criteria** | Only confirmed business miles in totals; pending excluded; stale warning when applicable |
| **Automated tests** | Proof summary tests (extend existing) |
| **Manual tests** | Change reporting period; verify totals |
| **CI gate** | Domain tests |
| **Definition of done** | Matches `calculateProofSummary` behavior |
| **Branch** | `milestone/package-r9-summaries` |
| **Checkpoint tag** | `checkpoint/product-recovery-r9` |

---

## Package R10 — CSV & PDF Export

| Field | Content |
|-------|---------|
| **Objective** | On-device export per `architecture/Export Formats.md`; tier gates |
| **User problem solved** | User delivers CPA/employer-ready files |
| **Repository areas** | Promote patterns from `prototypes/report-generation/`, Proof screen, export service in mobile |
| **Dependencies** | R9, R11 (entitlements for PDF) |
| **Acceptance criteria** | Basic CSV (Free); PDF (Plus+); export preview shows pending exclusion; filename pattern documented |
| **Automated tests** | Golden-file CSV tests; PDF structure smoke test |
| **Manual tests** | Export offline; open CSV in Excel; PDF readable |
| **CI gate** | Domain + new export test job |
| **Definition of done** | `exportAvailable: true` when entitled and data complete |
| **Branch** | `milestone/package-r10-export` |
| **Checkpoint tag** | `checkpoint/product-recovery-r10` |

---

## Package R11 — Account, Privacy & Subscription Entitlements

| Field | Content |
|-------|---------|
| **Objective** | Minimal auth + RevenueCat entitlements + privacy controls |
| **User problem solved** | User owns account, understands data use, unlocks Plus/Pro features honestly |
| **Repository areas** | `apps/backend/` (minimal), `apps/mobile/src/services/auth/**`, `services/entitlements/**`, Profile settings, promote `prototypes/entitlements/` patterns |
| **Dependencies** | R2; can start spike after R3 |
| **Acceptance criteria** | Sign-in; sign-out; delete account data; entitlement gates auto-capture limit (40/mo Free); offline entitlement cache |
| **Automated tests** | Entitlement resolver unit tests; API contract tests |
| **Manual tests** | Purchase sandbox; offline Plus feature; account deletion |
| **CI gate** | Backend CI (new workflow) + mobile |
| **Definition of done** | No feature claims without entitlement check |
| **Branch** | `milestone/package-r11-account-billing` |
| **Checkpoint tag** | `checkpoint/product-recovery-r11` |

---

## Package R12 — Android Production Hardening & Play Release

| Field | Content |
|-------|---------|
| **Objective** | Release-signed AAB, Play Console internal track, permission declarations, crash reporting |
| **User problem solved** | Real users install from Play Store safely |
| **Repository areas** | `apps/mobile/android` signing, ProGuard/R8, `AndroidManifest` permissions, privacy policy URL, Sentry/ crash config (Phase 11 TIP) |
| **Dependencies** | R4–R11 |
| **Acceptance criteria** | Internal track build; location permission strings accurate; no debug keystore in repo; 7-day offline soak pass |
| **Automated tests** | Release assemble in CI; `check:sensitive-files` |
| **Manual tests** | Device matrix (3+ OEMs); Play pre-launch report |
| **CI gate** | New `android-release.yml` |
| **Definition of done** | Closed beta gate passed (§10) |
| **Branch** | `milestone/package-r12-android-release` |
| **Checkpoint tag** | `checkpoint/milesave-v1-android-beta` |

---

# 5. First Seven Packages (Detailed)

## R1 — Repository Truth & Documentation Cleanup

**Objective:** Stop documentation from lying about project state.

**User problem:** Contributors waste cycles on wrong assumptions; agents implement against Phase 0 brief.

**Exact areas:**
- `README.md` — structure, branch strategy, Package 3 status, commands
- `package.json` — description field
- `planning/Package 3 Implementation Plan.md` — reconcile Inc 2 persistence delivery, remaining increments
- Optional: `planning/Technical Implementation Plan.md` §1 — monorepo reality footnote

**Dependencies:** None.

**Acceptance criteria:**
1. README accurately lists `apps/mobile` as initialized on milestone branch
2. Increment 2 scope documented as implemented/pending checkpoint
3. 5-tab IA documented as intentional vs MVP 4-tab
4. Link to this roadmap and health report

**Automated tests:** `npm run check:all`

**Manual tests:** Read-through by second engineer; no contradictory claims in root vs `apps/mobile/README.md`

**CI gate:** `repository-quality.yml`

**Definition of done:** Single source of truth for "where is the app?"

**Branch / tag:** `milestone/package-r1-repo-truth` → `checkpoint/product-recovery-r1`

---

## R2 — Mobile CI & Increment 2 Checkpoint Closure

**Objective:** Prove native builds work in CI; close Increment 2.

**User problem:** Cannot ship what cannot build.

**Exact areas:**
- `.github/workflows/package-3-mobile.yml`
- `apps/mobile/android/**`, `apps/mobile/ios/**`
- Fix or replace `MileRecoverTests.m` template assertion

**Dependencies:** R1 recommended.

**Acceptance criteria:**
1. All three jobs in `package-3-mobile.yml` green on merge commit
2. Tag `checkpoint/package-3-increment-2` at that commit
3. Android assemble artifact or log retained

**Automated tests:** CI matrix (shared-checks, android-debug, ios-simulator)

**Manual tests:**
1. Windows: `npm run android:assemble` with SDK configured
2. macOS: `pod install` + simulator build (if available)

**CI gate:** `package-3-mobile.yml` — mandatory

**Definition of done:** Increment 2 validation doc checklist items for CI marked complete

**Branch / tag:** `milestone/package-3-product` → `checkpoint/package-3-increment-2`

---

## R3 — App Shell & Locked Design System

**Objective:** Harden UI foundation and navigation for all V1 screens.

**User problem:** Inconsistent UI erodes trust in a financial-instrument product.

**Exact areas:**
- `packages/config/src/tokens.ts` — extend if Design Bible gaps found
- `apps/mobile/src/components/ui.tsx` → split into design-system folder
- `apps/mobile/src/navigation/` — add stack navigator for modals/detail
- Stub screens: `TrackingActiveScreen`, `TripDetailScreen`, `RecoveryFlowScreen`, `SettingsScreen`

**Dependencies:** R2 green.

**Acceptance criteria:**
1. Primary/secondary/destructive buttons with visible labels (min 48dp touch)
2. Shared `EmptyState`, `LoadingState`, `ErrorBanner`, `OfflineBanner` components
3. No swipe gestures required for any primary action
4. Tab bar unchanged (5-tab Package 3 IA)

**Automated tests:** `npm run typecheck:mobile`

**Manual tests:** Rotate device; large font; TalkBack on onboarding buttons

**CI gate:** `package-3-mobile.yml` shared-checks

**Definition of done:** All existing screens migrated to design-system components

**Branch / tag:** `milestone/package-r3-design-system` → `checkpoint/product-recovery-r3`

---

## R4 — Tracking Engine & Lifecycle Reliability

**Objective:** Android native engine captures drives into local store.

**User problem:** Core product value — automatic mileage — does not exist today.

**Exact areas:**
- Promote from `prototypes/native-bridge/`, `prototypes/android-tracking/` (copy/adapt, **no import**)
- `packages/contracts/src/tracking/` — bridge event DTOs
- `apps/mobile/android/app/src/main/java/**` — MileRecover tracking module
- Domain: trip draft ingestion from native events
- Requires **R3b** encrypted store (run as first commit(s) of R4 if not separate branch)

**Dependencies:** R2, R3, R3b.

**Acceptance criteria:**
1. `trackingEngineState` reflects native state (`idle` | `active` | `stopped` | `unavailable`)
2. Completed drives create `TripRecord` with `status: pending`, `source: auto_detected`
3. Engine survives app background/kill (best-effort; document limits)
4. No fake mileage in tests or UI

**Automated tests:**
- Domain draft ingestion unit tests
- Reuse/adapt prototype JVM tests where applicable

**Manual tests (Android):**
1. Simulated drive 10+ min → pending trip in Review
2. Force-stop during drive → recovery behavior documented
3. Airplane mode entire session

**CI gate:** `package-3-mobile.yml` + native unit tests

**Definition of done:** Protection Health engine factor ≠ 0 when recording

**Branch / tag:** `milestone/package-r4-tracking-engine` → `checkpoint/product-recovery-r4`

---

## R5 — Permission & Battery-Health Experience

**Objective:** Functional permission requests and battery guidance.

**User problem:** Users think app is "broken" when OS blocks background tracking.

**Exact areas:**
- `apps/mobile/src/services/permissions/PermissionService.ts`
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` flow
- iOS: defer full Always flow to post-Android; stub `not_applicable` where needed
- Update `OnboardingFlow.tsx` — permission steps call service
- `ProfileScreen` — labeled "Fix permissions" / "Open Settings"

**Dependencies:** R4 (engine exists to validate permissions), R3.

**Acceptance criteria:**
1. After onboarding, permission snapshot reflects OS state
2. Protection Health level changes when permissions change
3. Android battery optimization restriction detected
4. All actions use labeled buttons (no swipe)

**Automated tests:** Domain `permissions.test.ts` (existing); PermissionService mocks

**Manual tests:**
1. Deny location → Home `limited` + fix path
2. Grant background → level improves
3. Revoke in Settings → app reflects on resume

**CI gate:** `package-3-mobile.yml`

**Definition of done:** Parity matrix row "Native permissions" → **Done (Android)**

**Branch / tag:** `milestone/package-r5-permissions` → `checkpoint/product-recovery-r5`

---

## R6 — Trip Review, Editing & Classification

**Objective:** Complete review loop with accessible labeled controls.

**User problem:** Detected trips are useless without classification.

**Exact areas:**
- `ReviewScreen.tsx` — action bar per item
- `TripDetailScreen.tsx` — full trip view, edit mode
- Wire `applyClassification`, `rejectTrip` through AppContext/store
- Purpose field on business confirm

**Dependencies:** R4, R3b, R3.

**Acceptance criteria:**
1. **Business**, **Personal**, **Reject**, **View details** visible on each pending item
2. Reject only from detail (Interaction Rules)
3. Undo snackbar 4s on classify
4. Confirmed business miles update Home/Proof immediately

**Automated tests:**
- Extend domain tests for edge cases
- Mobile: review selector + action handler tests

**Manual tests:**
1. Classify 5 trips with mixed outcomes
2. Edit distance on detail → totals recalculate
3. Offline classify → persists after relaunch

**CI gate:** Domain + mobile CI

**Definition of done:** Review screen non-empty when pending trips exist

**Branch / tag:** `milestone/package-r6-review` → `checkpoint/product-recovery-r6`

---

## R7 — Missing-Trip Recovery & Evidence

**Objective:** Local gap recovery with explicit user confirmation.

**User problem:** Missed drives are the product wedge — currently domain-only.

**Exact areas:**
- Local gap detector (time between confirmed/auto trips)
- `RecoveryCandidate` UI in Review or dedicated flow
- `packages/domain/src/recovery/transitions.ts` — wire all actions
- Evidence display from `RecoveryEvidenceRef`

**Dependencies:** R4, R6.

**Acceptance criteria:**
1. Gap produces candidate with `state: detected`
2. User must tap labeled **Confirm trip**, **Edit details**, or **Dismiss**
3. Confirm creates trip with `source: recovered` — never silent
4. Free tier: 1 scan/month enforced (local counter)

**Automated tests:** Recovery transition tests; gap detector fixtures

**Manual tests:**
1. Day with no trips after drives → gap candidate
2. Dismiss → no trip created
3. Confirm → trip in history with recovery label

**CI gate:** Domain + mobile CI

**Definition of done:** Recovery Engine launch pipeline step 4 (User Review UI) exists for local gaps

**Branch / tag:** `milestone/package-r7-recovery` → `checkpoint/product-recovery-r7`

---

# 6. Backend Decision

## Does V1 truly need a backend?

**Yes — minimal backend required** for the V1 scope defined in §2, specifically **account identity**, **account deletion**, and **subscription entitlement reconciliation**.

**No — full backend is not required** for core mileage functionality. Capture, review, classification, local recovery, and on-device export can remain **local-first** per `architecture/Offline First.md` and TIP §2.

## What works without a custom backend

| Concern | V1 approach |
|---------|-------------|
| Trip capture | Native engine → encrypted local SQLite |
| Review / classify / edit | Local domain + UI |
| Missing-trip recovery (gaps) | Local gap detector + domain transitions |
| CSV/PDF export | On-device generation (`architecture/Export Formats.md`) |
| Offline usage | Default state; no sync queue in V1 |
| Privacy / delete local data | Local wipe + AsyncStorage/SQLite clear |

## Minimum backend responsibilities (V1)

| Service | Responsibility | Why required |
|---------|----------------|--------------|
| **Auth** | Apple + Google OAuth token exchange; issue session JWT; user id | Account controls in §2 |
| **Entitlements** | RevenueCat (or equivalent) webhook receiver; store canonical entitlement snapshot | Tamper-resistant Plus/Pro gates; 40 trips/mo Free limit |
| **Account deletion** | Delete server-side user record + revoke tokens | Privacy/GDPR path in SECURITY.md |
| **Optional backup metadata** | Store encrypted backup blob pointer (S3) — **defer if scope pressure** | Not required for first closed beta |

## Explicitly defer past V1

- Bidirectional sync / conflict resolution (`architecture/Offline First.md` sync engine)
- Server-assisted recovery (calendar, imports)
- AI assist endpoints
- PostgreSQL trip storage as authoritative SOT

## Safe local-first + backend split

```
Mobile (source of truth for trips)
  ├── Encrypted SQLite — all trip/evidence data
  ├── Entitlement cache — last known RevenueCat + server reconcile
  └── Export — generated on device

Minimal backend
  ├── POST /auth/oauth — session
  ├── POST /webhooks/revenuecat — entitlement updates
  ├── DELETE /account — server user purge
  └── GET /entitlements — refresh on launch when online
```

**Honest constraint:** First login and subscription purchase require network (`architecture/Offline First.md` table). Offline capture after initial setup remains fully functional.

---

# 7. Architecture Corrections

## Must refactor now (before real user data)

| Item | Why now | Action |
|------|---------|--------|
| AsyncStorage JSON for trips | Unencrypted; won't scale; TIP requires encrypted SQLite | R3b — split shell doc from trip store |
| No PermissionService | Blocks honest Protection Health | R5 — before public beta |
| Prototype import ban | ADR-0003 | Promote by copy/adapt into `apps/mobile`, never `import from prototypes` |
| Stale root docs | Causes wrong build decisions | R1 |
| Mobile CI red/unverified | No release without green builds | R2 |
| `AppContext.tsx` monolith | Will break when trip CRUD lands | Extract `TripRepository`, `PermissionService` facades during R4–R6 |
| iOS test template | Wrong assertions | R2 fix |

## Postpone (acceptable debt if V1 gates met)

| Item | Defer until |
|------|-------------|
| Full cloud sync | V1.1+ |
| `packages/testing/` formalization | After mobile component tests exist |
| WatermelonDB vs raw SQLite final lock | R3b spike — use prototype D learnings |
| iOS production release | After Android V1 stable |
| Proof Score | After export works (Plus differentiator) |
| Calendar / import recovery | Post-V1 Plus features |
| Secret scanning tool (Phase 0 open item) | Before public Play release (R12) |
| Merge milestone branch to `main` | User decision after Inc 2 checkpoint |

## Do not refactor (working as intended)

- Domain/persistence test coverage for schema v1
- 5-tab Package 3 IA
- Honest `exportAvailable: false` until R10
- Prototype isolation under `prototypes/`

---

# 8. UX Implementation Map

Locked MileSave V1 experience mapped to **concrete screens and states**. All primary actions use **visible labeled buttons**. No swipe-only classification.

| Experience area | Screen / component | Routes | Key states | Primary labeled actions |
|-----------------|-------------------|--------|------------|-------------------------|
| **Welcome & onboarding** | `OnboardingFlow` (4 steps) | Pre-tabs gate in `StartupGate` | welcome, location education, motion education, ready checklist | **Get Started**, **Continue**, **Skip for now**, **Enter MileRecover** |
| **Home / protection overview** | `HomeScreen` | Tab: Home | empty (0 mi valid), loading (`restoring`), permission-limited, attention, protected, error | **View tracking status**, **Fix permissions** (when `at_risk`/`limited`) |
| **Tracking active** | `TrackingActiveScreen` (R3 stub → R4) | Stack from Home | idle, detecting, recording, paused, unavailable, error | **Pause tracking**, **Resume tracking**, **View trip in progress** |
| **Review queue** | `ReviewScreen` | Tab: Review | empty, items pending, loading, error | Per row: **Business**, **Personal**, **View details**; Reject in detail only |
| **Trip details** | `TripDetailScreen` (R6) | Stack | pending, confirmed, personal, rejected, stale | **Mark business**, **Mark personal**, **Reject trip**, **Edit trip**, **Save changes** |
| **Missing-trip recovery** | `RecoveryFlowScreen` (R7) | Stack from Review | candidate detected, editing, confirm error | **Confirm trip**, **Edit details**, **Dismiss suggestion** |
| **Reports & exports** | `ProofScreen` + export sheet (R10) | Tab: Proof | complete, needs_review, insufficient_data, export locked (tier) | **Export CSV**, **Export PDF**, **Preview export** |
| **Profile & settings** | `ProfileScreen` + `SettingsScreen` | Tab: Profile | default, signed out, signed in | **Manage vehicles**, **Sign in**, **Sign out**, **Delete my data**, **Subscription** |
| **Permission warning** | `StatusBanner` on Home/Profile | Inline | denied, restricted, battery restricted | **Open Settings**, **Learn more** |
| **Offline state** | `OfflineBanner` | Global subtle | offline, online | **Dismiss** (non-blocking) |
| **Empty state** | `EmptyState` component | Review, Home, Proof | no trips, no review items, no exports yet | **Add manual trip**, **Check permissions** |
| **Subscription state** | Paywall sheet + Profile | Modal | free, plus, pro, expired | **Subscribe**, **Restore purchases**, **Continue with Free** |

**State derivation rule (repo fact):** All states from `@milerecover/domain` selectors — `planning/Package 3 UX State Matrix.md`.

**Navigation IA (repo fact):** 5 tabs — Home, Review, Add (manual), Proof, Profile — `RootTabs.tsx`.

---

# 9. Risk Register

Ranked by **severity × likelihood** (H/M/L).

| Rank | Risk | Severity | Likelihood | Mitigation |
|------|------|----------|------------|------------|
| 1 | Native mobile CI not green | H | H | R2 — block all feature work until green |
| 2 | Tracking engine promotion fails battery/OEM kills | H | H | R4 — prototype benchmarks; physical device matrix; conservative defaults |
| 3 | AsyncStorage used for real trip/GPS data | H | M | R3b before R4 writes |
| 4 | Documentation drift causes wrong features | M | H | R1 + checkpoint docs per package |
| 5 | Entitlement bypass without server reconcile | H | M | R11 minimal backend |
| 6 | Branch never merges to main | M | M | PR strategy after Inc 2 checkpoint |
| 7 | Scope creep (calendar, AI, sync) | M | M | This roadmap §2 exclusions |
| 8 | Export format rejected by CPAs | M | M | R10 golden files; beta panel from `planning/Beta Testing.md` |
| 9 | iOS parity delays Android | L | H | Android-first explicit; iOS CI compile-only until R12+ |
| 10 | Single JSON blob performance collapse | M | L | R3b SQLite migration |
| 11 | Permission denial churn | M | M | R5 education + honest `limited` state |
| 12 | RevenueCat/vendor lock | L | L | Abstract entitlement interface in domain |

---

# 10. Release Gates

## Internal alpha

| Gate | Measure |
|------|---------|
| Build | Android debug + release assemble green in CI |
| Core loop | Auto capture → pending → classify → confirmed total updates |
| Data | Encrypted local store; relaunch preserves state |
| Trust | Zero fake mileage; `check:all` pass |
| Team | 3 internal users, 5 drives each, 7 days |
| Docs | Known limitations documented |

## Closed beta (Play internal testing)

| Gate | Measure |
|------|---------|
| Build | Signed AAB on Play internal track |
| Permissions | Location + background + battery flow complete on Android |
| Recovery | Local gap recovery tested by ≥10 users |
| Export | CSV accepted by ≥85% beta panel (`planning/MVP.md` target) |
| Subscriptions | Sandbox purchases unlock Plus features |
| Stability | Crash-free sessions ≥99% (Sentry or equivalent) |
| Offline | 7-day offline soak — zero data loss |
| Legal | Privacy policy + Play Data Safety form complete |

## Play Store production release

| Gate | Measure |
|------|---------|
| Beta | Closed beta gate passed |
| Performance | Battery within NTE targets on 3 OEM devices (measured) |
| Phantom trips | <5% beta rate |
| Retention | Week-1 ≥45% beta cohort |
| Security | Secret scanning enabled; no credentials in repo |
| Support | In-app help + contact path |
| Rollout | Staged 5% → 20% → 100% with crash monitoring |

---

# 11. Recommended Next Increment

## Package 3 Increment 3 (small, checkpointable)

**Do not start until:** `checkpoint/package-3-increment-2` exists (R2 complete).

**Scope — UI + read-only native status only (no full engine promotion):**

| In scope | Out of scope |
|----------|--------------|
| `TrackingActiveScreen` with honest states from **stub** or read-only native module | Full drive capture pipeline (R4) |
| Home → Tracking Active navigation | SQLite migration (R3b) |
| Protection Health card links to Tracking Active | Permission OS prompts (R5) |
| Wire `trackingEngineState` from native **status callback** if bridge stub exists; else document `idle` with "Engine not connected" honestly | Trip writes from engine |
| Design-system components from R3 (if R3 lands first) | Recovery UI |
| Domain tests unchanged (27+) | Export |

**Suggested deliverables:**
1. `apps/mobile/src/screens/tracking/TrackingActiveScreen.tsx`
2. Stack navigator route from Home
3. Native module skeleton exposing `getEngineState()` only (Android optional in Inc 3)
4. Update `planning/Package 3 Implementation Plan.md` Increment 3 checklist
5. 2–3 mobile component tests (TrackingActive renders states)

**Acceptance criteria:**
1. User can open Tracking Active from Home via labeled button
2. Screen shows engine state, last capture time, plain-language explanation from domain
3. No fake "recording" when engine is idle
4. All existing CI green + domain 27/27

**Branch:** `milestone/package-3-product`  
**Checkpoint tag:** `checkpoint/package-3-increment-3`

**Estimated size:** 1 focused PR, ≤15 files touched — completable without R3b/R4 dependency if native module is read-only stub.

---

# 12. Commands

Run after **every package** merge to milestone branch.

## Repository-wide (always)

```bash
npm run check:all
npm run test:domain
npm run typecheck:domain
npm --prefix packages/config run typecheck
npm run typecheck:mobile
```

## Package-specific

### R1 — Docs only

```bash
npm run check:all
npm run check:links
```

### R2 — Mobile CI closure

```bash
npm run check:all
npm run test:domain
npm run typecheck:mobile
npm run android:assemble
# macOS additionally:
cd apps/mobile/ios && pod install
cd apps/mobile && npx react-native config
```

### R3 / R3b / R4–R7 — Mobile feature packages

```bash
npm run check:all
npm run test:domain
npm run typecheck:domain
npm run typecheck:mobile
npm run android:assemble
# After R3b:
npm run test:persistence
```

### R11 — Backend package (when added)

```bash
npm run check:all
# Plus backend CI script when created, e.g.:
# npm --prefix apps/backend test
```

### R12 — Android release

```bash
npm run check:all
npm run check:sensitive-files
cd apps/mobile/android && ./gradlew assembleRelease
```

## CI workflows to verify on GitHub

| Package | Required green workflow |
|---------|-------------------------|
| R1 | `repository-quality.yml` |
| R2+ | `package-3-mobile.yml` (all jobs) |
| Domain changes | `package-3-domain.yml` |
| Prototype regression | `prototype-android-jvm.yml`, `prototype-c-ios-simulator.yml` (on `main` paths) |

## Tagging after checkpoint

```bash
git tag -a checkpoint/<name> -m "<package> complete"
git push origin checkpoint/<name>
```

---

*This roadmap is derived from repository inspection at `4fd09af`. Update checkpoint tags and CI verification rows when green builds are confirmed.*
