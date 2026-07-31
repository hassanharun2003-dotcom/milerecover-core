#Requires -Version 5.1
<#
.SYNOPSIS
  Skeleton harness for Prototype B extended lifecycle validation (adb, no secrets).

.DESCRIPTION
  Prints and optionally runs adb steps documented in EXTENDED_LIFECYCLE_VALIDATION.md.
  Operator must confirm device connection and scenario before destructive steps.

  Usage:
    .\scripts\run-lifecycle-validation.ps1 -Scenario B -DryRun
    .\scripts\run-lifecycle-validation.ps1 -Scenario B -Execute

  No credentials or backend URLs are used by this script.
#>
param(
  [ValidateSet('A', 'B', 'C', 'D', 'All')]
  [string] $Scenario = 'B',

  [switch] $DryRun,

  [switch] $Execute
)

$ErrorActionPreference = 'Stop'

$Package = 'com.milerecover.prototype.androidtracking'
$MainActivity = "$Package/.MainActivity"

function Invoke-AdbStep {
  param(
    [string] $Label,
    [string[]] $Args
  )
  $cmd = "adb $($Args -join ' ')"
  Write-Host "`n== $Label ==" -ForegroundColor Cyan
  Write-Host $cmd
  if ($Execute) {
    & adb @Args
    if ($LASTEXITCODE -ne 0) {
      throw "adb failed: $cmd (exit $LASTEXITCODE)"
    }
  } elseif (-not $DryRun) {
    Write-Host '(pass -DryRun or -Execute to control execution)' -ForegroundColor DarkGray
  }
}

function Test-AdbDevice {
  Invoke-AdbStep -Label 'Check device' -Args @('devices')
}

function Start-PrototypeApp {
  Invoke-AdbStep -Label 'Launch prototype app' -Args @(
    'shell', 'am', 'start', '-n', $MainActivity
  )
}

function Stop-PrototypeAppForce {
  Invoke-AdbStep -Label 'Force-stop app' -Args @(
    'shell', 'am', 'force-stop', $Package
  )
}

function Kill-PrototypeProcess {
  Invoke-AdbStep -Label 'Kill process (simulate death)' -Args @(
    'shell', 'am', 'kill', $Package
  )
}

function Get-PrototypePid {
  Invoke-AdbStep -Label 'Resolve PID' -Args @(
    'shell', 'pidof', $Package
  )
}

function Show-BufferHint {
  Write-Host @"

Operator checks (manual):
  1. Start validation session in app UI before kill steps.
  2. Note buffer pending count on operator screen.
  3. After relaunch, export sanitized diagnostics.
  4. Compare pending counts / export event totals.

See EXTENDED_LIFECYCLE_VALIDATION.md for pass criteria.
"@ -ForegroundColor Yellow
}

Write-Host "Prototype B lifecycle harness — package $Package"
Write-Host "Scenario: $Scenario | Execute: $Execute | DryRun: $DryRun"

Test-AdbDevice
Show-BufferHint

switch ($Scenario) {
  'A' {
    Write-Host "`nScenario A: FGS restart after swipe-away (manual recents swipe required)."
    Start-PrototypeApp
  }
  'B' {
    Write-Host "`nScenario B: Process death + relaunch."
    Start-PrototypeApp
    Get-PrototypePid
    Kill-PrototypeProcess
    Start-Sleep -Seconds 3
    Start-PrototypeApp
  }
  'C' {
    Write-Host "`nScenario C: Force-stop boundary."
    Start-PrototypeApp
    Stop-PrototypeAppForce
    Write-Host 'Reopen app manually from launcher, then export diagnostics.'
  }
  'D' {
    Write-Host "`nScenario D: Pending-event recovery (combine B + export)."
    Start-PrototypeApp
    Kill-PrototypeProcess
    Start-Sleep -Seconds 3
    Start-PrototypeApp
    Write-Host 'Export sanitized diagnostics from operator UI after relaunch.'
  }
  'All' {
    foreach ($s in @('A', 'B', 'C', 'D')) {
      Write-Host "`n--- Scenario $s (review only in All mode) ---"
    }
    Write-Host 'Re-run with -Scenario A|B|C|D -Execute for individual flows.'
  }
}

Write-Host "`nDone. Record results in DEVICE_RESULT_TEMPLATE.md (local only)."
