#!/usr/bin/env bash
# Build a preview release APK entirely via Android Gradle Plugin signing.
# ZERO post-build APK mutation. The Gradle output bytes are what get gated/published.
#
# Usage:
#   EXPECT_VERSION_NAME=0.2.17 EXPECT_VERSION_CODE=72 \
#   OUT_APK=/path/MileRecover-preview-0.2.17.apk \
#   bash scripts/build-agp-release-apk.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXPECT_VERSION_NAME="${EXPECT_VERSION_NAME:?EXPECT_VERSION_NAME required}"
EXPECT_VERSION_CODE="${EXPECT_VERSION_CODE:?EXPECT_VERSION_CODE required}"
OUT_APK="${OUT_APK:?OUT_APK required}"
EXPECT_PACKAGE="${EXPECT_PACKAGE:-com.milerecover.app}"
EXPECT_SIGNER_SHA1="${EXPECT_SIGNER_SHA1:-E6:62:40:AA:E7:FA:4B:B7:37:51:44:1E:16:04:80:D9:67:24:1F:31}"

export APP_VARIANT="${APP_VARIANT:-preview}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/Android/Sdk}}"
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"

# Existing recovered preview keystore only — never generate a new identity.
export MR_PREVIEW_STORE_FILE="${MR_PREVIEW_STORE_FILE:-$ROOT/credentials/milerecover-preview-release.keystore}"
export MR_PREVIEW_STORE_PASSWORD="${MR_PREVIEW_STORE_PASSWORD:-MileRecoverPreviewStore2026}"
export MR_PREVIEW_KEY_ALIAS="${MR_PREVIEW_KEY_ALIAS:-milerecover}"
export MR_PREVIEW_KEY_PASSWORD="${MR_PREVIEW_KEY_PASSWORD:-MileRecoverPreviewStore2026}"

if [[ ! -f "$MR_PREVIEW_STORE_FILE" ]]; then
  echo "Missing preview keystore: $MR_PREVIEW_STORE_FILE" >&2
  exit 2
fi

# Prove keystore identity before build.
KEY_SHA1="$(keytool -list -v -keystore "$MR_PREVIEW_STORE_FILE" -storepass "$MR_PREVIEW_STORE_PASSWORD" 2>/dev/null \
  | awk -F': ' '/SHA1:/{print $2; exit}')"
KEY_SHA1_NORM="$(echo "$KEY_SHA1" | tr '[:lower:]' '[:upper:]')"
EXPECT_NORM="$(echo "$EXPECT_SIGNER_SHA1" | tr '[:lower:]' '[:upper:]')"
if [[ "$KEY_SHA1_NORM" != "$EXPECT_NORM" ]]; then
  echo "Keystore SHA-1 mismatch: got $KEY_SHA1 expected $EXPECT_SIGNER_SHA1" >&2
  exit 3
fi
echo "OK: keystore SHA-1 $KEY_SHA1_NORM"

# Fresh native project from Expo prebuild (injects AGP signing via config plugin).
rm -rf android
npx expo prebuild --platform android --no-install

# Hard-fail if plugin did not wire release signing.
rg -q 'MileRecover preview release signing \(AGP-native\)' android/app/build.gradle \
  || { echo "AGP signing plugin marker missing from android/app/build.gradle" >&2; exit 4; }
rg -q 'signingConfig signingConfigs.release' android/app/build.gradle \
  || { echo "buildTypes.release is not using signingConfigs.release" >&2; exit 4; }
! rg -q 'release \{[^}]*signingConfig signingConfigs.debug' android/app/build.gradle \
  || { echo "release still signed with debug config" >&2; exit 4; }

echo "sdk.dir=$ANDROID_SDK_ROOT" > android/local.properties

# Build — AGP signs during packageRelease / signReleaseBundle-equivalent APK tasks.
(
  cd android
  ./gradlew assembleRelease --no-daemon -x lintVitalAnalyzeRelease
)

GRADLE_APK="$(ls -1 android/app/build/outputs/apk/release/app-release.apk)"
[[ -f "$GRADLE_APK" ]] || { echo "Gradle did not produce app-release.apk" >&2; exit 5; }

# Capture SHA of the exact Gradle artifact BEFORE any copy/publish step.
GRADLE_SHA="$(sha256sum "$GRADLE_APK" | awk '{print $1}')"
echo "$GRADLE_SHA" > /tmp/milerecover-agp-apk.sha256
echo "OK: Gradle APK sha256=$GRADLE_SHA"

# Byte-for-byte copy only — no zipalign/apksigner/zip/python mutation.
mkdir -p "$(dirname "$OUT_APK")"
cp -f "$GRADLE_APK" "$OUT_APK"
OUT_SHA="$(sha256sum "$OUT_APK" | awk '{print $1}')"
if [[ "$OUT_SHA" != "$GRADLE_SHA" ]]; then
  echo "FATAL: OUT_APK bytes differ from Gradle output (mutation detected)" >&2
  exit 6
fi
echo "OK: OUT_APK byte-identical to Gradle artifact"

# Refuse the historical mutation script if someone invokes it in this tree later.
if [[ -x "$ROOT/scripts/sign-android-apk.sh" ]]; then
  if head -n 5 "$ROOT/scripts/sign-android-apk.sh" | rg -q 'DISABLED|REFUSES|AGP-native only'; then
    echo "OK: sign-android-apk.sh is disabled stub"
  else
    echo "FATAL: sign-android-apk.sh still looks like a mutation pipeline" >&2
    exit 7
  fi
fi

export APK="$OUT_APK"
export EXPECT_VERSION_NAME EXPECT_VERSION_CODE EXPECT_PACKAGE
export EXPECT_SIGNER_SHA1
export REQUIRE_AGP_NATIVE=1
export EXPECT_GRADLE_SHA256="$GRADLE_SHA"
export REQUIRE_LAUNCH="${REQUIRE_LAUNCH:-0}"
bash "$ROOT/scripts/android-apk-release-gate.sh"

# Final immutability check after gate (gate is verify-only and must not rewrite APK).
POST_SHA="$(sha256sum "$OUT_APK" | awk '{print $1}')"
if [[ "$POST_SHA" != "$GRADLE_SHA" ]]; then
  echo "FATAL: APK mutated during/after gate" >&2
  exit 8
fi

echo "AGP_NATIVE_BUILD_OK sha256=$GRADLE_SHA out=$OUT_APK"
