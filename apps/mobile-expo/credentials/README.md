# Android preview signing credentials

Local preview release keystores live in this directory and are gitignored.

`scripts/sign-android-apk.sh` signs preview APKs with:

- v1 + v2 + v3 signature schemes
- a certificate that has a non-empty Distinguished Name (CN/O/C)

Empty-DN / v2-only APKs from AGP 8 + Expo auto keystores can pass `adb install`
but fail Samsung PackageInstaller “Preparing app…” when opened from Downloads.
