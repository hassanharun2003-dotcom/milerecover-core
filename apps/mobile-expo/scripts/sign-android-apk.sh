#!/usr/bin/env bash
# DISABLED — AGP-native only.
#
# Historical post-build APK mutation (Python zipfile / zip -d / jarsigner /
# apksigner resign) is SUSPECT for Samsung PackageInstaller clean-install
# failures and is no longer part of the release pipeline.
#
# Release APKs must be signed by Gradle signingConfigs.release during
# `assembleRelease`. See scripts/build-agp-release-apk.sh.
set -euo pipefail
echo "REFUSES: sign-android-apk.sh is disabled (AGP-native only)." >&2
echo "Use: bash scripts/build-agp-release-apk.sh" >&2
exit 2
