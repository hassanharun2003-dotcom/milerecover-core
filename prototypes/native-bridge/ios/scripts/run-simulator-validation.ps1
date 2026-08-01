# Package 2 — iOS simulator validation wrapper (Windows / cross-platform doc entry point).
# Requires Git Bash or WSL with macOS Xcode unavailable on Windows hosts.
# On macOS CI or a Mac dev machine, invoke the bash script directly.
param(
  [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BashScript = Join-Path $ScriptDir "run-simulator-validation.sh"

if ($Help) {
  @"
iOS Package 2 simulator validation (native XCTest only)

Usage:
  .\run-simulator-validation.ps1

Requirements:
  - macOS with Xcode 15+ (cannot run xcodebuild on Windows)
  - Git Bash or WSL to execute run-simulator-validation.sh
  - npm ci + pod install in prototypes/native-bridge/ios

Output:
  prototypes/native-bridge/ios/ci-evidence/package-2-validation-summary.json

Skips Metro UI test:
  MileRecoverProtoBridgeCTests/testRendersWelcomeScreen
"@
  exit 0
}

if (-not (Test-Path $BashScript)) {
  Write-Error "Missing bash script: $BashScript"
}

$bash = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bash) {
  Write-Error @"
bash not found. This wrapper documents the validation entry point on Windows.
Run on macOS (or GitHub Actions macos-latest):

  cd prototypes/native-bridge/ios/scripts
  chmod +x run-simulator-validation.sh
  ./run-simulator-validation.sh
"@
}

Write-Host "Delegating to bash: $BashScript"
& bash $BashScript
exit $LASTEXITCODE
