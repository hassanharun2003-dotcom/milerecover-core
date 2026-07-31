# Native SQLite (Swift) — Prototype D evaluation

**Status:** **Pending** — Xcode project not included in this pass

## Approach

Direct `SQLite3` / `GRDB` / `SQLCipher` from Swift for iOS native tracking module (Prototype A alignment).

## What must be proven

| Requirement | Planned validation |
|---|---|
| Native write performance | Swift benchmark mirroring Kotlin module scenarios |
| Encryption | SQLCipher or GRDB encryption — Keychain key wrap |
| RN interoperability | Separate DB file vs shared — **decision required** |
| Background threads | Writer on native tracking queue; readers on main/actor |

## Benchmark status

All scenarios **pending** iOS simulator/device harness (future `candidates/native-sqlite-swift/`).

## Notes

Prototype B Android module provides partial cross-platform evidence for **native SQLite direct** pattern; iOS confirmation still required.
