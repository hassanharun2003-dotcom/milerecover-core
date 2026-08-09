#!/usr/bin/env bash
# Re-sign a release APK with v1+v2+v3 and a proper certificate DN.
#
# CRITICAL (Samsung PackageInstaller):
# Do NOT unpack/repack the APK with Python zipfile. That rewrite injects ZIP
# data-descriptor flags (0x08) on ~all entries. Those APKs can still pass
# apksigner/zipalign/aapt static gates but fail Samsung's install-time parse
# with: "Can't install app / There's a problem with the app file".
#
# Instead: strip prior JAR signatures with Info-ZIP `zip -d` (preserves /
# normalizes entry framing without data descriptors), zipalign, then apksigner.
#
# Usage: IN_APK=... OUT_APK=... bash scripts/sign-android-apk.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN_APK="${IN_APK:?IN_APK required}"
OUT_APK="${OUT_APK:?OUT_APK required}"
KEYSTORE="${KEYSTORE:-$ROOT/credentials/milerecover-preview-release.keystore}"
STORE_PASS="${STORE_PASS:-MileRecoverPreviewStore2026}"
KEY_PASS="${KEY_PASS:-MileRecoverPreviewStore2026}"
KEY_ALIAS="${KEY_ALIAS:-milerecover}"

BUILD_TOOLS="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}/build-tools"
APKSIGNER="$(ls -1 "$BUILD_TOOLS"/*/apksigner 2>/dev/null | sort -V | tail -1)"
ZIPALIGN="$(ls -1 "$BUILD_TOOLS"/*/zipalign 2>/dev/null | sort -V | tail -1)"
if [[ -z "${APKSIGNER:-}" || -z "${ZIPALIGN:-}" ]]; then
  echo "apksigner/zipalign not found under $BUILD_TOOLS" >&2
  exit 2
fi
if [[ ! -f "$KEYSTORE" ]]; then
  echo "Missing keystore: $KEYSTORE" >&2
  exit 2
fi
if ! command -v zip >/dev/null 2>&1; then
  echo "Info-ZIP 'zip' required (apt install zip)" >&2
  exit 2
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 required" >&2
  exit 2
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
STRIPPED="$TMP_DIR/stripped.apk"
ALIGNED="$TMP_DIR/aligned.apk"

cp -f "$IN_APK" "$STRIPPED"

# Remove only JAR signature members. `zip -d` rewrites the archive using
# standard local headers (no data descriptors) without Python zipfile.
# Ignore "name not matched" when the input was already unsigned.
set +e
zip -d "$STRIPPED" \
  'META-INF/*.SF' \
  'META-INF/*.RSA' \
  'META-INF/*.DSA' \
  'META-INF/*.EC' \
  'META-INF/MANIFEST.MF' \
  'META-INF/*.MF' \
  >"$TMP_DIR/zip-d.txt" 2>&1
ZIP_RC=$?
set -e
# zip returns 12 when some patterns matched nothing; 0 on full success.
if [[ "$ZIP_RC" -ne 0 && "$ZIP_RC" -ne 12 ]]; then
  cat "$TMP_DIR/zip-d.txt" >&2
  echo "zip -d failed rc=$ZIP_RC" >&2
  exit 3
fi
echo "stripped signatures -> $STRIPPED ($(wc -c <"$STRIPPED") bytes)"

# 4-byte zip alignment before apksigner.
# With useLegacyPackaging, .so files are compressed so 16KB page-align (-P)
# does not apply; use zipalign -f -v 4.
"$ZIPALIGN" -f -v 4 "$STRIPPED" "$ALIGNED" >"$TMP_DIR/zipalign-out.txt"

"$APKSIGNER" sign \
  --ks "$KEYSTORE" \
  --ks-pass "pass:$STORE_PASS" \
  --ks-key-alias "$KEY_ALIAS" \
  --key-pass "pass:$KEY_PASS" \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$OUT_APK" \
  "$ALIGNED"

# Default verify uses the APK minSdk (24+): v1 is present but unused for that
# range when v2/v3 cover it. Force min-sdk 21 so v1 is reported.
"$APKSIGNER" verify --verbose --min-sdk-version 21 --print-certs "$OUT_APK" \
  | tee /tmp/milerecover-apksigner-verify.txt
"$ZIPALIGN" -c -v 4 "$OUT_APK" >/tmp/milerecover-zipalign-verify.txt
unzip -v "$OUT_APK" >"$TMP_DIR/unzip-v.txt"
unzip -l "$OUT_APK" >"$TMP_DIR/unzip-l.txt"

# resources.arsc must remain Stored for targetSdk 30+.
rg -q 'Stored .+ resources\.arsc' "$TMP_DIR/unzip-v.txt" || {
  echo "resources.arsc must be Stored (uncompressed) for R+ installs" >&2
  exit 3
}

# If any .so is Stored, also enforce 16KB page alignment.
if rg -q 'Stored .+ lib/.+\.so' "$TMP_DIR/unzip-v.txt"; then
  "$ZIPALIGN" -c -P 16 -v 4 "$OUT_APK" >>/tmp/milerecover-zipalign-verify.txt
fi

rg -q 'META-INF/.+\.RSA' "$TMP_DIR/unzip-l.txt" || {
  echo "Missing META-INF *.RSA after signing" >&2
  exit 3
}
rg -q 'META-INF/.+\.SF' "$TMP_DIR/unzip-l.txt" || {
  echo "Missing META-INF *.SF after signing" >&2
  exit 3
}
rg -q "Verified using v1 scheme \(JAR signing\): true" /tmp/milerecover-apksigner-verify.txt || {
  echo "v1 signing missing (checked with --min-sdk-version 21)" >&2
  exit 3
}
rg -q "Verified using v2 scheme \(APK Signature Scheme v2\): true" /tmp/milerecover-apksigner-verify.txt || {
  echo "v2 signing missing" >&2
  exit 3
}
rg -q "Verified using v3 scheme \(APK Signature Scheme v3\): true" /tmp/milerecover-apksigner-verify.txt || {
  echo "v3 signing missing" >&2
  exit 3
}
rg -q "Signer #1 certificate DN: CN=.+" /tmp/milerecover-apksigner-verify.txt || {
  echo "certificate DN empty/missing" >&2
  exit 3
}

# Hard gate: zero ZIP data-descriptor flags (Samsung install compatibility).
python3 - "$OUT_APK" <<'PY'
import sys, zipfile
from pathlib import Path
apk = Path(sys.argv[1])
with zipfile.ZipFile(apk) as z:
    dd = sum(1 for i in z.infolist() if i.flag_bits & 0x08)
if dd != 0:
    print(f"FAIL: {dd} ZIP entries still carry data-descriptor flag 0x08", file=sys.stderr)
    print("Samsung PackageInstaller can reject these as 'problem with the app file'.", file=sys.stderr)
    sys.exit(4)
print(f"OK: data_descriptor_entries=0")
PY

echo "Signed OK -> $OUT_APK"
