# MileRecover Offline First Architecture

**Status:** Foundational  
**Last Updated:** July 2026  
**Owner:** Engineering

---

## Principle

**Offline first** is not a feature — it is the default state of MileRecover.

Field workers, rural contractors, and basement showings don't have reliable signal. The app must capture, review, classify, and export **without network connectivity**.

Cloud sync is **eventual**, never blocking.

---

## Local Source of Truth

During normal operation:

```
Write path:  UI → Domain Validator → Local SQLite → UI update
                              ↓ (async)
                         Sync Queue → API (when online)

Read path:   UI → Local SQLite (always)
```

Network responses **merge** into local DB — never replace wholesale.

---

## Offline-Capable Operations (MVP)

| Operation | Offline | Notes |
|---|---|---|
| Auto trip detection | ✓ | Native engine, no network |
| Manual trip entry | ✓ | |
| Review / confirm / reject | ✓ | |
| Edit purpose, distance | ✓ | |
| Proof Score display | ✓ | Computed locally |
| Export PDF/CSV | ✓ | Generated on device |
| AI purpose suggestion | Partial | Cached templates only |
| Account login (first) | ✗ | Required once |
| Subscription purchase | ✗ | Store requires network |
| Recovery calendar suggestions | ✗ | Requires opt-in fetch |

---

## Sync Engine Design

### Outbound Queue

Mutations appended to `sync_queue` table:

```json
{
  "id": "uuid",
  "entity": "trip",
  "operation": "update",
  "payload": { ... },
  "client_timestamp": "...",
  "retry_count": 0
}
```

**Processing:**
1. On connectivity (NWPathMonitor / ConnectivityManager)
2. Batch upload FIFO
3. Ack with server version
4. Mark synced; remove from queue

**Retry:** Exponential backoff, max 7 days retention, then user alert.

### Inbound Sync

- Client sends `last_sync_cursor`
- Server returns delta since cursor
- Apply in transaction with conflict check

---

## Conflict Resolution

See [Database.md](./Database.md).

**User-visible conflicts only when:**
- Same trip modified differently on two devices
- Server rejected trip (Trust Rule violation)

Conflict UI presents both versions — user picks. **Trust over automation.**

---

## Offline UX Patterns

### Sync Indicator States
| State | UI |
|---|---|
| Synced | Subtle cloud check (fade after 2s) |
| Pending | "3 changes waiting to sync" |
| Syncing | Non-blocking spinner in status bar |
| Offline | "Offline — changes saved locally" |
| Error | "Sync failed — tap to retry" |

### No Blocking Modals
Never prevent trip review because sync failed.

### Stale Data Transparency
If last sync >7 days ago on login: banner "You have local data from another device period — review sync status"

---

## Native Engine + Offline

Location batches write directly to SQLite from native code — bypasses JS thread for reliability when app backgrounded/killed.

On app crash recovery: engine resumes from last batch_id.

---

## Export Offline

PDF/CSV generated from local DB using embedded template engine.

Exports include metadata:
```json
{
  "generated_at": "...",
  "device_id": "...",
  "sync_status": "offline|synced",
  "pending_trip_count": 0
}
```

CPA can see export was generated offline (transparency).

---

## Testing Requirements

| Test | Pass Criteria |
|---|---|
| Airplane mode 7-day trip | All trips local, zero loss |
| Sync after offline period | All mutations applied |
| Conflict simulation | User resolution works |
| Kill app mid-write | No corruption |
| Export offline | Valid PDF/CSV |

---

## Related Documents

- [Database.md](./Database.md)
- [Frontend.md](./Frontend.md)
- [API.md](./API.md)
- [../docs/03 Core Principles.md](../docs/03%20Core%20Principles.md)
