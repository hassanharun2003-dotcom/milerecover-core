# Prototype C — Dependencies

**Scope:** `prototypes/native-bridge/` only — not production lock-in

---

## JavaScript / React Native (`package.json`)

| Name | Version | Purpose | License | Maintenance | Security / data | Prototype-only | Production implication | Removal |
|---|---|---|---|---|---|---|---|---|
| react | 18.3.1 | RN UI runtime | MIT | Meta | No data collection | Yes | None until ADR | Delete node_modules |
| react-native | 0.76.5 | Disposable RN host | MIT | Meta | Local prototype only | Yes | **RN version not locked** | Delete node_modules |
| @react-native/babel-preset | 0.76.5 | Babel | MIT | Meta | Build-time | Yes | None | Delete |
| @react-native/metro-config | 0.76.5 | Metro bundler | MIT | Meta | Build-time | Yes | None | Delete |
| typescript | ^5.6.3 | Contract typecheck | Apache-2.0 | Microsoft | Local | Yes | None | Delete |
| jest | ^29.7.0 | Automated tests | MIT | OpenJS | Synthetic fixtures only | Yes | None | Delete |
| ts-jest | ^29.2.5 | TS test runner | MIT | Community | Local | Yes | None | Delete |

Install: `cd prototypes/native-bridge && npm install`

Produces `package-lock.json` and `node_modules/` — gitignored.

---

## Android (`android/`)

| Name | Version | Purpose | License | Notes |
|---|---|---|---|---|
| Android Gradle Plugin | 8.6.0 | Build | Apache-2.0 | Requires SDK |
| Kotlin | 1.9.24 | Native module | Apache-2.0 | |
| androidx.core:core-ktx | 1.12.0 | Android APIs | Apache-2.0 | |
| junit | 4.13.2 | Tests | EPL-2.0 | |
| robolectric | 4.11.1 | JVM Android tests | MIT | |
| Platform SQLite | — | Prototype buffer | Public domain | **Not production DB choice** |

**Explicitly not added:** Navigation, state management, analytics, maps, auth, WatermelonDB, Realm, SQLCipher.

---

## iOS (`ios/`)

| Name | Version | Purpose | Notes |
|---|---|---|---|
| React Native (via CocoaPods) | 0.76.5 | Bridge | Install on Mac only |
| Foundation / FileManager | — | Prototype JSON buffer | Not production DB |

---

## Data handling

- Synthetic coordinate grid only (10.0, 10.0 origin)
- No network, cloud, or backend clients
- Diagnostics redact coordinates by default
- No real user location data (ADR-0004)

---

## Removal path

Delete `prototypes/native-bridge/node_modules`, `android/build`, `ios/Pods`, and prototype DB files.  
No impact on root monorepo `package.json` or production packages.
