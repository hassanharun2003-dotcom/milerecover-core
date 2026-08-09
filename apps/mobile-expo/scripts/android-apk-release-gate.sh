#!/usr/bin/env bash
# VERIFY-ONLY release gate for sideloadable Android preview APKs.
# Must NOT mutate the APK. AGP/Gradle is the sole producer/signer.
#
# Usage:
#   APK=/path/to.apk \
#   EXPECT_VERSION_NAME=0.2.17 EXPECT_VERSION_CODE=72 \
#   EXPECT_PACKAGE=com.milerecover.app \
#   REQUIRE_AGP_NATIVE=1 EXPECT_GRADLE_SHA256=<sha> \
#   bash scripts/android-apk-release-gate.sh
set -euo pipefail

APK="${APK:?APK required}"
EXPECT_PACKAGE="${EXPECT_PACKAGE:-com.milerecover.app}"
EXPECT_VERSION_NAME="${EXPECT_VERSION_NAME:?EXPECT_VERSION_NAME required}"
EXPECT_VERSION_CODE="${EXPECT_VERSION_CODE:?EXPECT_VERSION_CODE required}"
EXPECT_SIGNER_SHA1="${EXPECT_SIGNER_SHA1:-E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31}"
REQUIRE_AGP_NATIVE="${REQUIRE_AGP_NATIVE:-1}"
EXPECT_GRADLE_SHA256="${EXPECT_GRADLE_SHA256:-}"
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

# Prove this gate is verify-only: record inode/size/mtime + sha before checks.
PRE_STAT="$(stat -c '%i %s %Y' "$APK" 2>/dev/null || stat -f '%i %z %m' "$APK")"
SHA=$(sha256sum "$APK" | awk '{print $1}')
echo "$SHA" > "$OUT_DIR/apk.sha256"
ok "sha256=$SHA"

if [[ -n "$EXPECT_GRADLE_SHA256" && "$SHA" != "$EXPECT_GRADLE_SHA256" ]]; then
  fail "APK sha256 differs from Gradle artifact ($EXPECT_GRADLE_SHA256) — post-AGP mutation detected"
fi
ok "matches Gradle artifact sha (or no EXPECT_GRADLE_SHA256 set)"

unzip -t "$APK" >"$OUT_DIR/unzip-t.txt" 2>&1 || fail "unzip integrity"
ok "unzip integrity"

"$ZIPALIGN" -c -v 4 "$APK" >"$OUT_DIR/zipalign.txt" 2>&1 || fail "zipalign"
unzip -v "$APK" >"$OUT_DIR/unzip-v.txt" 2>&1 || fail "unzip -v"
unzip -l "$APK" >"$OUT_DIR/unzip-l.txt" 2>&1 || fail "unzip -l"
if rg -q 'Stored .+ lib/.+\.so' "$OUT_DIR/unzip-v.txt"; then
  "$ZIPALIGN" -c -P 16 -v 4 "$APK" >>"$OUT_DIR/zipalign.txt" 2>&1 || fail "zipalign 16KB for Stored .so"
fi
ok "zipalign"

"$APKSIGNER" verify --verbose --min-sdk-version 21 --print-certs "$APK" >"$OUT_DIR/apksigner.txt" 2>&1 || fail "apksigner"
rg -q "Verified using v1 scheme \(JAR signing\): true" "$OUT_DIR/apksigner.txt" || fail "v1 signing missing"
rg -q "Verified using v2 scheme \(APK Signature Scheme v2\): true" "$OUT_DIR/apksigner.txt" || fail "v2 signing missing"
rg -q "Verified using v3 scheme \(APK Signature Scheme v3\): true" "$OUT_DIR/apksigner.txt" || fail "v3 signing missing"
rg -q "Signer #1 certificate DN: CN=.+" "$OUT_DIR/apksigner.txt" || fail "certificate DN empty/missing"
! rg -q "Signer #1 certificate DN: CN=, OU=, O=, L=, ST=, C=" "$OUT_DIR/apksigner.txt" || fail "empty certificate DN"
GOT_SHA1="$(awk -F': ' '/Signer #1 certificate SHA-1 digest:/{print $2; exit}' "$OUT_DIR/apksigner.txt" | tr '[:lower:]' '[:upper:]')"
EXPECT_SHA1_NORM="$(echo "$EXPECT_SIGNER_SHA1" | tr '[:lower:]' '[:upper:]' | tr -d ':')"
GOT_SHA1_NORM="$(echo "$GOT_SHA1" | tr -d ':')"
# apksigner prints lowercase hex without colons sometimes; normalize both.
if [[ "$GOT_SHA1_NORM" != "$EXPECT_SHA1_NORM" ]]; then
  # also try colon form compare
  GOT_COLONS="$(echo "$GOT_SHA1_NORM" | sed 's/../&:/g;s/:$//')"
  EXP_COLONS="$(echo "$EXPECT_SHA1_NORM" | sed 's/../&:/g;s/:$//')"
  [[ "$GOT_COLONS" == "$EXP_COLONS" || "$GOT_SHA1_NORM" == "$EXPECT_SHA1_NORM" ]] \
    || fail "signer SHA-1 mismatch got=$GOT_SHA1 expected=$EXPECT_SIGNER_SHA1"
fi
rg -q 'META-INF/.+\.RSA' "$OUT_DIR/unzip-l.txt" || fail "META-INF *.RSA missing"
rg -q 'META-INF/.+\.SF' "$OUT_DIR/unzip-l.txt" || fail "META-INF *.SF missing"
ok "apksigner v1+v2+v3 + expected signer + META-INF"

"$AAPT" dump badging "$APK" >"$OUT_DIR/badging.txt" 2>&1 || fail "aapt badging"
rg -q "package: name='${EXPECT_PACKAGE}'" "$OUT_DIR/badging.txt" || fail "package mismatch"
rg -q "versionName='${EXPECT_VERSION_NAME}'" "$OUT_DIR/badging.txt" || fail "versionName mismatch"
rg -q "versionCode='${EXPECT_VERSION_CODE}'" "$OUT_DIR/badging.txt" || fail "versionCode mismatch"
rg -q "launchable-activity" "$OUT_DIR/badging.txt" || fail "no launchable activity"
ok "package metadata"

rg -q 'lib/arm64-v8a/.+\.so' "$OUT_DIR/unzip-l.txt" || fail "arm64-v8a native libs missing"
ok "arm64-v8a present"

rg -q 'Stored .+ resources\.arsc' "$OUT_DIR/unzip-v.txt" || fail "resources.arsc not Stored (R+ requires uncompressed+aligned)"
ok "resources.arsc Stored"

# AGP-native ZIP framing checks (reject historical Python-rezip / zip -d mutation fingerprints).
python3 - "$APK" "$OUT_DIR/agp-native-zip.txt" "$REQUIRE_AGP_NATIVE" <<'PY' || fail "AGP-native ZIP framing check failed"
import sys, zipfile
from pathlib import Path
apk, out, require = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3] == '1'
with zipfile.ZipFile(apk) as z:
    infos = z.infolist()
    dd = sum(1 for i in infos if i.flag_bits & 0x08)
    utf8 = sum(1 for i in infos if i.flag_bits & 0x800)
lines = [
    f'data_descriptor_entries={dd}',
    f'utf8_flag_entries={utf8}',
    f'total_entries={len(infos)}',
]
out.write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
if dd != 0:
    print(f'FAIL: {dd} ZIP data-descriptor entries (Python-rezip fingerprint)', file=sys.stderr)
    sys.exit(1)
if require and utf8 > 32:
    # Historical post-build resign rewrote nearly all entries with UTF-8 bit (e.g. 1343).
    # AGP-native APKs keep utf8 flags near zero.
    print(f'FAIL: utf8_flag_entries={utf8} looks like post-AGP ZIP rewrite (AGP-native ~0)', file=sys.stderr)
    sys.exit(1)
print('OK: AGP-native ZIP framing')
PY
ok "AGP-native ZIP framing"

# adb install proof
"$ADB" devices | tee "$OUT_DIR/adb-devices.txt"
"$ADB" uninstall "$EXPECT_PACKAGE" >/dev/null 2>&1 || true
if ! timeout 480 "$ADB" install --no-incremental -r -d "$APK" | tee "$OUT_DIR/adb-install.txt"; then
  timeout 120 "$ADB" push "$APK" /data/local/tmp/mr-gate.apk
  timeout 300 "$ADB" shell pm install -r -g /data/local/tmp/mr-gate.apk | tee "$OUT_DIR/adb-install.txt"
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
  WELCOME_RE='Welcome to MileRecover|Get started|Never lose a work mile|Continue without an account|Continue with Google'
  WELCOME_OK=0
  for _try in $(seq 1 12); do
    "$ADB" shell uiautomator dump /sdcard/ui-gate.xml >/dev/null 2>&1 || true
    "$ADB" pull /sdcard/ui-gate.xml "$OUT_DIR/ui.xml" >/dev/null 2>&1 || true
    if [[ -f "$OUT_DIR/ui.xml" ]] && rg -q "$WELCOME_RE" "$OUT_DIR/ui.xml"; then
      WELCOME_OK=1
      break
    fi
    sleep 10
  done
  [[ "$WELCOME_OK" == "1" ]] || fail "Welcome not visible"
  ok "Welcome visible"
fi

# Gate must not have mutated the APK.
POST_STAT="$(stat -c '%i %s %Y' "$APK" 2>/dev/null || stat -f '%i %z %m' "$APK")"
POST_SHA=$(sha256sum "$APK" | awk '{print $1}')
[[ "$PRE_STAT" == "$POST_STAT" ]] || fail "APK stat changed during gate (mutation)"
[[ "$POST_SHA" == "$SHA" ]] || fail "APK sha256 changed during gate (mutation)"
ok "verify-only: APK bytes unchanged by gate"

echo "PASS sha=$SHA" | tee "$OUT_DIR/result.txt"
