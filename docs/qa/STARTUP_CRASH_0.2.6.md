# Startup crash investigation — MileRecover 0.2.6

**APK:** `MileRecover-preview-0.2.6.apk`  
**SHA-256:** `f8e9b8e3c1f6b764633f5dbc7bb2e4a376592c8c112674ca4cf685173fe088e7`  
**versionName / versionCode:** `0.2.6` / `34`  
**Commit:** `508164c`  
**Device under test:** Pixel 6 AVD `mile_pixel6`, API 34 (TCG)

## Exact exceptions captured (logcat)

### 1. Primary — Expo Updates blocks cold start

```
E dev.expo.updates: Failed to download remote update
code=UpdateFailedToLoad
```

Stack (abbreviated):

```
java.net.Inet6AddressImpl.lookupHostByName
okhttp3.Dns$Companion$DnsSystem.lookup
expo.modules.updates.loader.FileDownloader.downloadRemoteUpdate
expo.modules.updates.loader.RemoteLoader.loadRemoteUpdate
expo.modules.updates.loader.LoaderTask.start
expo.modules.updates.procedures.StartupProcedure.run
```

State machine:

```
Updates state change: StartStartup  {isStartupProcedureRunning=true}
Updates state change: Check         {isChecking=true, isStartupProcedureRunning=true}
Updates state change: CheckError    {checkError={message=Failed to download remote update}}
Updates state change: EndStartup    {isStartupProcedureRunning=false}
```

Only **after** `EndStartup` does Hermes report:

```
I ReactNativeJS: Running "main"
```

Observed first Activity display: **+32s170ms** from process start.

### 2. Secondary — React host not ready while UI focused

```
E unknown:ReactHost: Unhandled SoftException
com.facebook.react.bridge.ReactNoCrashSoftException:
raiseSoftException(onWindowFocusChange(hasFocus = "true")):
Tried to access onWindowFocusChange while context is not ready
  at com.facebook.react.runtime.ReactHostImpl.raiseSoftException
```

Symptom of Updates delaying React context creation while MainActivity is already visible.

### 3. Non-fatal noise

```
W FirebaseApp: Default FirebaseApp failed to initialize because no default options were found.
I FirebaseInitProvider: FirebaseApp initialization unsuccessful
```

## Root cause

`app.config.ts` set `updates.checkAutomatically: 'ON_LOAD'`.

Native Expo Updates `StartupProcedure` therefore runs a **remote update check before React Native JS starts**. On devices with slow/failing DNS or Expo connectivity (common on cellular / captive Wi‑Fi / airplane transitions), that check errors with `UpdateFailedToLoad` and holds `isStartupProcedureRunning=true` for many seconds.

On Samsung this presents as: splash/open → blank → process appears to close (ANR / user kill / delayed paint beyond perceived launch). Emulator eventually recovered after the check failed; there was **no classic `FATAL EXCEPTION: main` JVM crash** for `com.milerecover.app` in ApplicationExitInfo (exits observed were USER REQUESTED / PACKAGE UPDATED from test tooling).

Contributing factors:

- No JS `ErrorBoundary` (any later render throw = silent death)
- `TaskManager.defineTask` at `trackingEngine` module import
- Eager import of `RootNavigator` / SupportingScreens graph at App load
- UpdateProvider treated only channels `'preview'|'production'` as standalone (missed `preview-foundation-*`)

## Fix (0.2.7)

1. `checkAutomatically: 'NEVER'` — JS post-paint update checks only
2. Isolated runtime/channel `0.2.7` / `preview-foundation-0.2.7`
3. `StartupErrorBoundary` around app shell
4. Lazy `OnboardingFlow` / `RootNavigator`; deferred tracking engine import
5. Background task defined only when tracking starts
6. Automated `scripts/android-launch-smoke.sh` (60s alive + Welcome)
7. **0.2.7-startup.2:** serialize product-ui AsyncStorage writes (latest-wins). Rapid onboarding taps previously let an older in-flight `setItem` finish last, so force-stop reopen lost completion and returned to Welcome.

## Evidence files

`/tmp/crash-026/full.log` (agent VM) and this document in-repo.
