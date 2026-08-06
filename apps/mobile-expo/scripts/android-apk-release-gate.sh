#!/usr/bin/env bash
# Required release gate for sideloadable Android preview APKs.
# Usage:
#   APK=/path/to.apk \
#   EXPECT_VERSION_NAME=0.2.8 EXPECT_VERSION_CODE=43 \
#   EXPECT_PACKAGE=com.milerecover.app \
#   bash scripts/android-apk-release-gate.sh
set -euo pipefail

APK="${APK:?APK required}"
EXPECT_PACKAGE="${EXPECT_PACKAGE:-com.milerecover.app}"
EXPECT_VERSION_NAME="${EXPECT_VERSION_NAME:?EXPECT_VERSION_NAME required}"
EXPECT_VERSION_CODE="${EXPECT_VERSION_CODE:?EXPECT_VERSION_CODE required}"
REQUIRE_LAUNCH="${REQUIRE_LAUNCH:-1}"
ALIVE_SECS="${ALIVE_SECS:-60}"
ADB="${ADB:-adb}"
OUT_DIR="${OUT_DIR:-/tmp/milerecover-apk-gate}"
mkdir -p "$OUT_DIR"

BUILD_TOOLS="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}/build-tools"
AAPT="$(ls -1 "$BUILD_TOOLS"/*/aapt 2>/dev/null | sort -V | tail -1)"
APKSIGNER="$(ls -1 "$BUILD_TOOLS"/*/apksigner 2>/dev/null | sort -V | tail -1)"
ZIPALIGN="$(ls -1 "$BUILD_TOOLS"/*/zipalign 2>/dev/null | sort -V | tail -1)"

fail() { echo "FAIL: $*" | tee "$OUT_DIR/result.txt"; exit 1; }
ok() { echo "OK: $*"; }

[[ -f "$APK" ]] || fail "APK missing: $APK"
SHA=$(sha256sum "$APK" | awk '{print $1}')
echo "$SHA" > "$OUT_DIR/apk.sha256"
ok "sha256=$SHA"

unzip -t "$APK" >"$OUT_DIR/unzip-t.txt" 2>&1 || fail "unzip integrity"
ok "unzip integrity"

"$ZIPALIGN" -c -v 4 "$APK" >"$OUT_DIR/zipalign.txt" 2>&1 || fail "zipalign"
# Materialize zip listings first — `unzip | rg -q` under pipefail false-fails on SIGPIPE.
unzip -v "$APK" >"$OUT_DIR/unzip-v.txt" 2>&1 || fail "unzip -v"
unzip -l "$APK" >"$OUT_DIR/unzip-l.txt" 2>&1 || fail "unzip -l"
if rg -q 'Stored .+ lib/.+\.so' "$OUT_DIR/unzip-v.txt"; then
  "$ZIPALIGN" -c -P 16 -v 4 "$APK" >>"$OUT_DIR/zipalign.txt" 2>&1 || fail "zipalign 16KB for Stored .so"
fi
ok "zipalign"

# minSdk 24+ apps report v1=false on default verify even when JAR sigs are
# valid; force --min-sdk-version 21 so v1 is evaluated for sideload/Samsung.
"$APKSIGNER" verify --verbose --min-sdk-version 21 --print-certs "$APK" >"$OUT_DIR/apksigner.txt" 2>&1 || fail "apksigner"
rg -q "Verified using v1 scheme \(JAR signing\): true" "$OUT_DIR/apksigner.txt" || fail "v1 signing missing"
rg -q "Verified using v2 scheme \(APK Signature Scheme v2\): true" "$OUT_DIR/apksigner.txt" || fail "v2 signing missing"
rg -q "Verified using v3 scheme \(APK Signature Scheme v3\): true" "$OUT_DIR/apksigner.txt" || fail "v3 signing missing"
# Reject empty DN certificates that Samsung prep can choke on.
rg -q "Signer #1 certificate DN: CN=.+" "$OUT_DIR/apksigner.txt" || fail "certificate DN empty/missing"
! rg -q "Signer #1 certificate DN: CN=, OU=, O=, L=, ST=, C=" "$OUT_DIR/apksigner.txt" || fail "empty certificate DN"
rg -q 'META-INF/.+\.RSA' "$OUT_DIR/unzip-l.txt" || fail "META-INF *.RSA missing"
rg -q 'META-INF/.+\.SF' "$OUT_DIR/unzip-l.txt" || fail "META-INF *.SF missing"
ok "apksigner v1+v2+v3 + non-empty DN + META-INF"

"$AAPT" dump badging "$APK" >"$OUT_DIR/badging.txt" 2>&1 || fail "aapt badging"
rg -q "package: name='${EXPECT_PACKAGE}'" "$OUT_DIR/badging.txt" || fail "package mismatch"
rg -q "versionName='${EXPECT_VERSION_NAME}'" "$OUT_DIR/badging.txt" || fail "versionName mismatch"
rg -q "versionCode='${EXPECT_VERSION_CODE}'" "$OUT_DIR/badging.txt" || fail "versionCode mismatch"
rg -q "launchable-activity" "$OUT_DIR/badging.txt" || fail "no launchable activity"
ok "package metadata"

rg -q 'lib/arm64-v8a/.+\.so' "$OUT_DIR/unzip-l.txt" || fail "arm64-v8a native libs missing"
ok "arm64-v8a present"

# adb install proof
"$ADB" devices | tee "$OUT_DIR/adb-devices.txt"
"$ADB" uninstall "$EXPECT_PACKAGE" >/dev/null 2>&1 || true
if ! timeout 180 "$ADB" install -r -d "$APK" | tee "$OUT_DIR/adb-install.txt"; then
  # Fallback push+pm for flaky adb install streaming
  timeout 90 "$ADB" push "$APK" /data/local/tmp/mr-gate.apk
  timeout 120 "$ADB" shell pm install -r -g /data/local/tmp/mr-gate.apk | tee "$OUT_DIR/adb-install.txt"
fi
rg -q "Success" "$OUT_DIR/adb-install.txt" || fail "adb install did not return Success"
ok "adb install Success"

if [[ "$REQUIRE_LAUNCH" == "1" ]]; then
  "$ADB" logcat -c || true
  "$ADB" shell am force-stop "$EXPECT_PACKAGE" || true
  "$ADB" shell am start -n "$EXPECT_PACKAGE/.MainActivity"
  sleep 15
  PID=$("$ADB" shell pidof "$EXPECT_PACKAGE" | tr -d '\r' || true)
  [[ -n "${PID:-}" ]] || fail "process not running after launch"
  sleep "$ALIVE_SECS"
  PID2=$("$ADB" shell pidof "$EXPECT_PACKAGE" | tr -d '\r' || true)
  [[ "$PID" == "$PID2" ]] || fail "process died within ${ALIVE_SECS}s (before=$PID after=$PID2)"
  ok "alive ${ALIVE_SECS}s pid=$PID2"
  "$ADB" shell uiautomator dump /sdcard/ui-gate.xml >/dev/null
  "$ADB" pull /sdcard/ui-gate.xml "$OUT_DIR/ui.xml" >/dev/null
  rg -q "Welcome to MileRecover|Get started" "$OUT_DIR/ui.xml" || fail "Welcome not visible"
  ok "Welcome visible"
fi

echo "PASS sha=$SHA" | tee "$OUT_DIR/result.txt"
