#!/usr/bin/env bash
# Re-sign a release APK with v1+v2+v3 and a proper certificate DN.
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

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
ALIGNED="$TMP_DIR/aligned.apk"

# Align uncompressed native libs for 16KB pages before signing.
"$ZIPALIGN" -f -p 16 4 "$IN_APK" "$ALIGNED"

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

"$APKSIGNER" verify --verbose --print-certs "$OUT_APK" | tee /tmp/milerecover-apksigner-verify.txt
"$ZIPALIGN" -c -P 16 -v 4 "$OUT_APK" >/tmp/milerecover-zipalign-verify.txt
echo "Signed OK -> $OUT_APK"
