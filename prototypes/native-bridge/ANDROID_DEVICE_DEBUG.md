# Prototype C — Android device debug (SM-A166U)

**NON-PRODUCTION — VALIDATION ONLY**

Use when the app shows a blank/gray screen or cannot reach Metro.

---

## Prerequisites

- Metro running from `prototypes/native-bridge` on port **8081**
- Samsung device paired via **wireless debugging**
- Android SDK `platform-tools` on PATH (or use full path below)

---

## One-time / each session

From PowerShell:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

# 1. Confirm device
& $adb devices

# 2. Reverse Metro port (required for wireless ADB)
& $adb reverse tcp:8081 tcp:8081
& $adb reverse --list

# 3. Start Metro (separate terminal, from prototype root)
cd prototypes\native-bridge
npm start
```

---

## Launch app

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb shell am start -n com.milerecover.prototype.nativebridge/.MainActivity
```

Or run **app** debug from Android Studio with Metro already running.

---

## 16 KB compatibility dialog (Android 15+)

Samsung may show **“Android App Compatibility — This app isn't 16 KB compatible”** on debug builds.

- Tap **OK** or **Don't show again** — this is a React Native/Hermes debug warning, not a MileRecover defect.
- The validation UI renders **behind** this dialog until dismissed.

---

## Verify Metro connection

```powershell
Invoke-RestMethod http://localhost:8081/status
# Expect: packager-status:running
```

Logcat success signal:

```powershell
& $adb logcat -d | Select-String "Running `"MileRecoverProtoBridgeC`""
```

---

## Dark mode / “empty gray screen”

If Metro is connected but the screen looks empty:

- System **dark mode** + DayNight theme made validation text low-contrast (fixed: light theme + explicit background in debug host).
- Rebuild and reinstall the debug APK after pulling latest prototype changes.

---

## Reinstall from Android Studio

1. Open `prototypes/native-bridge/android`
2. Run **app** on SM-A166U
3. Run `adb reverse` again after reconnecting wireless debugging

---

## Related

- [ANDROID_FIRST_DEVICE_PASS.md](./ANDROID_FIRST_DEVICE_PASS.md)
- [README.md](./README.md)
