# Samsung physical install diagnostics (no rebuild)

Goal: capture the exact PackageManager / PackageInstaller failure code
(`INSTALL_FAILED_*` / `INSTALL_PARSE_Failed_*` / exception) from the **physical Samsung**.

Do **not** rebuild, resign, bump versions, or publish another APK until this evidence exists.

## What you need

1. The physical Samsung phone (the one that shows "App not installed").
2. A computer (Windows, Mac, or Linux).
3. A USB cable that can transfer data (not charge-only).
4. The 0.2.17 APK file on that computer, e.g.:
   - `MileRecover-preview-0.2.17.apk`
5. `adb` installed (Android Platform Tools).

### One-time phone setup

1. On the Samsung: **Settings → About phone → Software information**.
2. Tap **Build number** 7 times until it says developer mode is on.
3. Back: **Settings → Developer options**.
4. Turn **ON**:
   - **USB debugging**
   - (If present) **Install via USB** / **USB debugging (Security settings)**
5. Plug phone into computer with USB.
6. On the phone, accept the **Allow USB debugging?** prompt (check "Always allow" if shown).

### One-time computer setup (if `adb` missing)

- **Windows/Mac/Linux:** install [Android Platform Tools](https://developer.android.com/tools/releases/platform-tools)
- Open a terminal:
  - Windows: PowerShell or Command Prompt
  - Mac: Terminal
  - Linux: Terminal
- Confirm:

```bash
adb version
```

You should see a version line. If "command not found", Platform Tools is not on your PATH.

---

## Commands to run (copy/paste in order)

Put the APK on your Desktop (or note its full path) and open a terminal.

Replace the APK path if yours is different.

### Step 1 — Confirm the phone is connected

```bash
adb devices
```

**Expected:** one line like `R58XXXXX    device`  
**Not OK:** `unauthorized` (accept the prompt on phone), empty list (cable/drivers), or `offline`.

Send back the full output of this command.

### Step 2 — Confirm old MileRecover is gone

```bash
adb shell pm path com.milerecover.app
```

**Expected if uninstalled:** empty output, or `Error` / `not found`-style message.  
If it prints `package:/...`, uninstall first:

```bash
adb uninstall com.milerecover.app
```

Send back both outputs.

### Step 3 — Clear logs so we only capture this install attempt

```bash
adb logcat -c
```

**Expected:** no error (usually silent).

### Step 4 — Start capturing install-related logs to a file

Keep this terminal tab/window open. Run:

```bash
adb logcat -v threadtime PackageManager:V PackageInstaller:V PackageParser:V installd:V *:S > samsung-install-logcat.txt
```

**Expected:** it sits there with no new prompt (it is recording).  
Leave it running. Open a **second** terminal window for the next steps.

### Step 5 — Try official adb install (this often prints the real code)

In the **second** terminal, from the folder that contains the APK:

```bash
adb install -r -d MileRecover-preview-0.2.17.apk
```

**What to look for:** the last lines. Examples of useful failures:

- `Failure [INSTALL_FAILED_...]`
- `Failure [INSTALL_PARSE_FAILED_...]`
- `Success` (if this succeeds but the Samsung GUI still fails, say so — that is also evidence)

Copy the **entire** output of this command and send it.

### Step 6 — If Step 5 failed OR you want more detail: pm install

Still in the second terminal:

```bash
adb push MileRecover-preview-0.2.17.apk /data/local/tmp/mr.apk
adb shell pm install -r -d -g /data/local/tmp/mr.apk
```

Send the **entire** output of both commands.

### Step 7 — Stop log capture and collect extras

In the **first** terminal (the one running logcat): press `Ctrl+C` to stop.

Then run these in either terminal:

```bash
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
adb shell getprop ro.product.cpu.abi
adb logcat -d -v threadtime | rg -i "PackageManager|PackageInstaller|PackageParser|installd|INSTALL_FAILED|INSTALL_PARSE_FAILED|milerecover|Verifier|Parsing" > samsung-install-filtered.txt
```

If `rg` is not installed, use:

```bash
adb logcat -d -v threadtime | grep -iE "PackageManager|PackageInstaller|PackageParser|installd|INSTALL_FAILED|INSTALL_PARSE_FAILED|milerecover|Verifier|Parsing" > samsung-install-filtered.txt
```

### Step 8 — (Optional but useful) Install via Samsung’s own installer UI while logging

Only if Steps 5–6 did **not** show a clear `INSTALL_FAILED_*` code:

1. Clear logs again: `adb logcat -c`
2. Restart log capture (Step 4).
3. On the phone, open the APK with **Files / My Files** and tap **Install** until you see **"App not installed"**.
4. Stop logcat (`Ctrl+C`).
5. Re-run the filter command from Step 7 into `samsung-install-gui-filtered.txt`.

---

## What to send back

Paste or attach **all** of the following (text is fine):

1. Output of `adb devices`
2. Output of `adb shell pm path com.milerecover.app` (and uninstall if used)
3. Full output of `adb install -r -d ...`
4. Full output of `adb shell pm install ...` (if run)
5. Files:
   - `samsung-install-logcat.txt`
   - `samsung-install-filtered.txt`
   - (optional) `samsung-install-gui-filtered.txt`
6. Phone props from Step 7 (model / Android version / SDK / ABI)

We are looking specifically for lines containing:

- `INSTALL_FAILED_`
- `INSTALL_PARSE_FAILED_`
- `PackageManager` exceptions
- `Failed to parse` / `Failed to install`

Do **not** rebuild until those lines are in hand.
