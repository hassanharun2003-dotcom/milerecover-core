#!/usr/bin/env bash
# Package 2 — iOS simulator native validation (unsigned, no Metro UI test).
# Run from repo root or prototypes/native-bridge. Requires macOS + Xcode.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BRIDGE_DIR="$(cd "${IOS_DIR}/.." && pwd)"
EVIDENCE_DIR="${IOS_DIR}/ci-evidence"
SUMMARY_FILE="${EVIDENCE_DIR}/package-2-validation-summary.json"
LOG_DIR="${EVIDENCE_DIR}/logs"
mkdir -p "${EVIDENCE_DIR}" "${LOG_DIR}"

WS="${IOS_DIR}/MileRecoverProtoBridgeC.xcworkspace"
SCHEME="MileRecoverProtoBridgeC"
SDK="iphonesimulator"
CONFIG="Debug"
BUILD_LOG="${LOG_DIR}/simulator-build.log"
TEST_LOG="${LOG_DIR}/simulator-test.log"

started_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
build_status="skipped"
test_status="skipped"
simulator_name=""
simulator_udid=""
tests_run=()
tests_failed=()
exit_code=0

write_summary() {
  local finished_at
  finished_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local tests_json="[]"
  if [ "${#tests_run[@]}" -gt 0 ]; then
    tests_json="$(printf '%s\n' "${tests_run[@]}" | sed 's/.*/"&"/' | paste -sd, -)"
    tests_json="[${tests_json}]"
  fi
  local failed_json="[]"
  if [ "${#tests_failed[@]}" -gt 0 ]; then
    failed_json="$(printf '%s\n' "${tests_failed[@]}" | sed 's/.*/"&"/' | paste -sd, -)"
    failed_json="[${failed_json}]"
  fi
  cat > "${SUMMARY_FILE}" <<EOF
{
  "package": "ios-package-2",
  "platform": "ios-simulator",
  "branch": "${GITHUB_REF_NAME:-local}",
  "startedAt": "${started_at}",
  "finishedAt": "${finished_at}",
  "rnVersion": "0.76.5",
  "contractMajor": 1,
  "bridgeApiVersion": "1.0.0-prototype-c",
  "unsignedBuild": true,
  "metroUiTestSkipped": true,
  "simulator": {
    "name": "${simulator_name}",
    "udid": "${simulator_udid}"
  },
  "build": {
    "status": "${build_status}",
    "log": "${BUILD_LOG#${IOS_DIR}/}"
  },
  "nativeTests": {
    "status": "${test_status}",
    "log": "${TEST_LOG#${IOS_DIR}/}",
    "skippedUiTest": "MileRecoverProtoBridgeCTests/testRendersWelcomeScreen",
    "suites": [
      "PrototypeEventBufferTests",
      "DiagnosticSanitizerTests",
      "BridgeVersionTests"
    ],
    "testsRun": ${tests_json},
    "testsFailed": ${failed_json}
  },
  "exitCode": ${exit_code}
}
EOF
}

on_exit() {
  exit_code=$?
  write_summary
}
trap on_exit EXIT

cd "${BRIDGE_DIR}"

if [ ! -f "${IOS_DIR}/Podfile" ] || [ ! -d "${IOS_DIR}/MileRecoverProtoBridgeC.xcodeproj" ]; then
  echo "error: iOS scaffold missing (Podfile / xcodeproj)" >&2
  build_status="blocked"
  test_status="blocked"
  exit 1
fi

if [ ! -d "${WS}" ]; then
  echo "Running pod install..."
  (cd "${IOS_DIR}" && pod install --repo-update)
fi

if [ ! -d "${WS}" ]; then
  echo "error: workspace missing after pod install" >&2
  build_status="failed"
  test_status="skipped"
  exit 1
fi

# Pick first available iPhone simulator and boot it.
simulator_line="$(xcrun simctl list devices available | grep -m1 "iPhone" || true)"
if [ -z "${simulator_line}" ]; then
  echo "error: no iPhone simulator available" >&2
  build_status="failed"
  test_status="skipped"
  exit 1
fi

simulator_udid="$(echo "${simulator_line}" | sed -nE 's/.*\(([A-F0-9-]+)\).*/\1/p')"
simulator_name="$(echo "${simulator_line}" | sed -E 's/^[[:space:]]*//;s/ \([^)]*\)//' | xargs)"
echo "Using simulator: ${simulator_name} (${simulator_udid})"
xcrun simctl boot "${simulator_udid}" 2>/dev/null || true

echo "Building for iOS Simulator (unsigned)..."
if xcodebuild \
  -workspace "${WS}" \
  -scheme "${SCHEME}" \
  -sdk "${SDK}" \
  -configuration "${CONFIG}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  build 2>&1 | tee "${BUILD_LOG}"; then
  build_status="passed"
else
  build_status="failed"
  test_status="skipped"
  exit 1
fi

echo "Running native XCTest (Swift suites only; Metro UI test skipped)..."
set +e
xcodebuild test \
  -workspace "${WS}" \
  -scheme "${SCHEME}" \
  -sdk "${SDK}" \
  -destination "platform=iOS Simulator,id=${simulator_udid}" \
  -configuration "${CONFIG}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  -only-testing:MileRecoverProtoBridgeCTests/PrototypeEventBufferTests \
  -only-testing:MileRecoverProtoBridgeCTests/DiagnosticSanitizerTests \
  -only-testing:MileRecoverProtoBridgeCTests/BridgeVersionTests \
  2>&1 | tee "${TEST_LOG}"
test_exit=$?
set -e

# Parse xcodebuild output for executed tests.
while IFS= read -r line; do
  case "${line}" in
    *"' passed on"*)
      test_name="$(echo "${line}" | sed -nE "s/^Test Case '-\[(.*)\]' passed.*/\1/p")"
      [ -n "${test_name}" ] && tests_run+=("${test_name}")
      ;;
    *"' failed on"*)
      test_name="$(echo "${line}" | sed -nE "s/^Test Case '-\[(.*)\]' failed.*/\1/p")"
      [ -n "${test_name}" ] && tests_failed+=("${test_name}")
      ;;
  esac
done < "${TEST_LOG}"

if [ "${test_exit}" -eq 0 ]; then
  test_status="passed"
else
  test_status="failed"
  exit "${test_exit}"
fi

echo "Validation summary written to ${SUMMARY_FILE}"
