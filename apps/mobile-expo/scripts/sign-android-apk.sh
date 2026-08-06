#!/usr/bin/env bash
# Re-sign a release APK with v1+v2+v3 and a proper certificate DN.
# Strips any prior META-INF signatures via unpack/repack, jarsigner (v1),
# zipalign -f -v 4, then apksigner (v1+v2+v3).
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
if ! command -v jarsigner >/dev/null 2>&1; then
  echo "jarsigner not found on PATH" >&2
  exit 2
fi
if ! command -v unzip >/dev/null 2>&1 || ! command -v zip >/dev/null 2>&1; then
  echo "unzip/zip required" >&2
  exit 2
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
WORK="$TMP_DIR/work"
UNSIGNED="$TMP_DIR/stripped.apk"
V1_SIGNED="$TMP_DIR/v1-signed.apk"
ALIGNED="$TMP_DIR/aligned.apk"

mkdir -p "$WORK"
# Strip META-INF (and any prior APK Signing Block) by unpack/repack so
# jarsigner/apksigner own the certificate.
unzip -q "$IN_APK" -d "$WORK"
rm -rf "$WORK/META-INF"
(
  cd "$WORK"
  # -X strips extra file attributes that confuse JAR signing.
  zip -q -r -X -9 "$UNSIGNED" .
)

# JAR / v1 signing with SHA-256
jarsigner \
  -keystore "$KEYSTORE" \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -signedjar "$V1_SIGNED" \
  "$UNSIGNED" \
  "$KEY_ALIAS"

# 4-byte zip alignment after v1 signing and before apksigner.
# With useLegacyPackaging, .so files are compressed so 16KB page-align (-P)
# does not apply; use zipalign -f -v 4 (not incompatible -p / -P 16).
# Note: zipalign after jarsigner invalidates v1 digests; apksigner below
# regenerates a valid v1 (+ v2 + v3) signature.
"$ZIPALIGN" -f -v 4 "$V1_SIGNED" "$ALIGNED"

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
# If any .so is Stored, also enforce 16KB page alignment.
if rg -q 'Stored .+ lib/.+\.so' "$TMP_DIR/unzip-v.txt"; then
  "$ZIPALIGN" -c -P 16 -v 4 "$OUT_APK" >>/tmp/milerecover-zipalign-verify.txt
fi

# Require META-INF JAR signature artifacts for Samsung PackageInstaller.
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

echo "Signed OK -> $OUT_APK"
