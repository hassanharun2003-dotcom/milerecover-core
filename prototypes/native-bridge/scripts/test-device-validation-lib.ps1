#Requires -Version 5.1
<#
.SYNOPSIS
  Smoke test for device-validation-lib against known pass-2 evidence.
#>
[CmdletBinding()]
param(
    [string]$EvidenceDir = ''
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PrototypeRoot = Split-Path -Parent $ScriptDir
if (-not $EvidenceDir) {
    $EvidenceDir = Join-Path $PrototypeRoot 'device-validation-20260731-134617'
}

. (Join-Path $ScriptDir 'device-validation-lib.ps1')

if (-not (Test-Path -LiteralPath $EvidenceDir)) {
    Write-Error "Fixture evidence dir missing: $EvidenceDir"
    exit 2
}

$results = Invoke-DeviceScenarioEvaluation -EvidenceDir $EvidenceDir
$failed = @($results | Where-Object { $_.status -ne 'pass' })

Write-Host "Validator smoke test: $($results.Count - $failed.Count)/$($results.Count) scenarios passed"

if ($failed.Count -gt 0) {
    foreach ($item in $failed) {
        Write-Host "FAIL #$($item.scenario) $($item.name): $($item.observedResult)"
    }
    exit 1
}

$bundle = Resolve-DeviceEvidenceBundle -EvidenceDir $EvidenceDir -RelativePaths @(
    'Empty-buffer_fetch.txt',
    'Five_remain_pending.txt'
)
if (-not (Test-DeviceLogMatch -Context $bundle.Context -Pattern 'Fetch without ack: fetched 0')) {
    Write-Error 'Expected empty-buffer fetch log line in merged corpus'
    exit 1
}

Write-Host 'Validator smoke test: PASS'
exit 0
