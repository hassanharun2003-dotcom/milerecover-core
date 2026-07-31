# Lane Ownership Boundaries

**Purpose:** Prevent Android and iOS agents from overwriting each other's work or touching production product code.

**Status:** Active for Prototype B/C parallel development (July 2026)

---

## Android lane (`milestone/android-validation`)

**May modify:**

- `prototypes/android-tracking/**`
- `prototypes/native-bridge/android/**`
- Android-specific validation scripts (`dev-android*.ps1`, `run-device*.ps1`, `evaluate-device-evidence.ps1`, etc.)
- Android validation documents (`ANDROID_*.md`, device pass results)
- Approved Android CI workflows (`.github/workflows/prototype-android*.yml`)

**Must not modify:** iOS sources, shared contracts without shared-lane review, production paths (see Forbidden).

---

## iOS lane (`milestone/ios-readiness`)

**May modify:**

- `prototypes/native-bridge/ios/**`
- `prototypes/ios-tracking/**` (when created)
- iOS-specific validation scripts and docs
- iOS cloud-build workflows (`.github/workflows/prototype-c-ios-simulator.yml`)

**Must not modify:** Android Gradle/Kotlin validation artifacts, shared contracts without shared-lane review, production paths.

---

## Shared lane (`milestone/shared-contracts`)

**May modify:**

- Prototype-local TypeScript contracts (`prototypes/native-bridge/contract/**`, `src/**`)
- Synthetic fixtures and cross-platform contract tests
- Platform parity documents (`PLATFORM_PARITY.md`, runbooks, results templates)
- Lane tooling (`tooling/lanes/**`)
- Planning documents for parallel development

**Must not modify:** Platform-native implementation files except when explicitly coordinating a versioned contract change with both lanes.

---

## Forbidden for all lanes (without separate approved build package)

- `apps/**`
- `packages/**`
- `api/**`
- Pricing, Product DNA, PRD behavior, subscriptions
- Production tracking, backend, Recovery, Proof
- Production infrastructure
- Dependency/toolchain upgrades (RN, Kotlin, Swift, Gradle, AGP, CocoaPods) without explicit evidence and approval

---

## Enforcement

Run before every lane merge:

```powershell
.\tooling\lanes\check-lane-merge.ps1 -Lane android|ios|shared
```

No lane may silently edit another lane's files. Cross-lane changes require explicit shared-lane PR and contract-freeze review.
