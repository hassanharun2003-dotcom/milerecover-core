# MileRecover Frontend Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Mobile Engineering

---

## Overview

The MileRecover frontend delivers a **trust-first** mobile experience for mileage evidence management. Architecture prioritizes **offline first** operation, native tracking integration, and clear separation between UI state and evidentiary records.

**No React Native code in this repository yet.** This document defines the planned architecture.

---

## Stack (Planned)

| Layer | Choice |
|---|---|
| Framework | React Native (New Architecture) |
| Language | TypeScript |
| Navigation | React Navigation 6+ |
| Local state | Zustand or Jotai (UI ephemeral) |
| Server state / sync | TanStack Query + sync layer |
| Local database | WatermelonDB (SQLite) |
| Maps | Mapbox or Apple/Google native maps |
| Native modules | Swift (iOS), Kotlin (Android) |

---

## Layer Architecture

```
┌─────────────────────────────────────────┐
│  Screens & Flows                        │
│  (Review, Export, Recovery, Settings)   │
├─────────────────────────────────────────┤
│  Components (Design System bindings)    │
├─────────────────────────────────────────┤
│  Application Services                   │
│  TripService, ProofScoreService,        │
│  ExportService, SyncService             │
├─────────────────────────────────────────┤
│  Domain Models & Validators             │
│  (Trust Rules enforced here)            │
├─────────────────────────────────────────┤
│  Repository Layer                       │
│  LocalRepository → APIRepository        │
├─────────────────────────────────────────┤
│  Native Bridge                          │
│  TrackingEngineModule, BatteryModule    │
├─────────────────────────────────────────┤
│  SQLite (WatermelonDB) + File Storage   │
└─────────────────────────────────────────┘
```

---

## Key Frontend Modules

### Trip Module
- CRUD with Trust Rule validation
- Status state machine: `draft → pending → confirmed | personal | rejected`
- No transition to `confirmed` without user event or rule match

### Review Module
- Pending queue from local DB (instant load)
- Optimistic UI with rollback on validation failure
- Batch operations with summary modal

### Proof Score Module
- Display scores from local calculation
- Breakdown sheet from cached factor JSON
- Recalculate on trip edit

### Export Module
- Generate PDF/CSV on-device (offline capable)
- Optional cloud-enhanced export H2
- Preview before share

### Sync Module
- Background sync when connectivity available
- Queue outbound mutations
- Conflict UI when needed

### Tracking Module
- Native bridge to Tracking Engine
- Subscribe to trip detection events
- Permission and battery status

---

## State Management Strategy

| State Type | Store |
|---|---|
| UI ephemeral (sheet open, filters) | Zustand |
| Trip records | WatermelonDB (source of truth) |
| User preferences | MMKV or SecureStore |
| Sync cursor | Local DB metadata table |
| Auth tokens | Keychain / Keystore |

**Never store trips only in memory.**

---

## Offline First UX

- All reads from local DB first
- Network fetches merge, never replace without conflict check
- Optimistic writes always persist locally
- `SyncIndicator` component bound to sync service events

See [Offline First.md](./Offline%20First.md).

---

## Native Module Bridge

```typescript
// Conceptual interface — not implemented yet
interface TrackingEngineNative {
  startTracking(config: TrackingConfig): Promise<void>;
  stopTracking(): Promise<void>;
  getStatus(): Promise<TrackingStatus>;
  onTripDetected(callback: (event: TripDetectedEvent) => void): Subscription;
  onLocationBatch(callback: (batch: LocationSample[]) => void): Subscription;
}
```

Trip detection events write to local DB via background task before UI notification.

---

## Navigation Structure

```
RootNavigator
├── AuthStack (login, onboarding)
└── MainTabs
    ├── HomeStack
    ├── ReviewStack
    ├── TripsStack
    ├── ExportStack
    └── SettingsStack
```

Deep links: `milerecover://review`, `milerecover://trip/:id`, `milerecover://export`

---

## Performance Targets

| Metric | Target |
|---|---|
| Cold start | <2.5s |
| Review queue load | <200ms (local) |
| Trip detail map render | <500ms |
| Scroll FPS | 60fps |

---

## Testing Strategy (Future)

| Layer | Approach |
|---|---|
| Validators / domain | Unit tests |
| Repositories | Integration with in-memory SQLite |
| Components | React Native Testing Library |
| Flows | Detox E2E |
| Native engine | XCTest / Espresso separate |

Critical test: **no trip confirms without user action**

---

## Platform Parity

- Shared TS business logic ≥90%
- Platform-specific: permissions UI, haptics, background tasks
- iOS HIG patterns: see [../design/Apple HIG References.md](../design/Apple%20HIG%20References.md)

---

## Related Documents

- [Native Tracking Engine.md](./Native%20Tracking%20Engine.md)
- [Database.md](./Database.md)
- [../design/Component Library.md](../design/Component%20Library.md)
