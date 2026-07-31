#Requires -Version 5.1
<#
.SYNOPSIS
  Non-destructive reevaluation of captured Prototype C device-validation evidence.

.DESCRIPTION
  Parses evidence files under an existing device-validation-* directory and validates
  all 24 Android scenarios using the correct evidence source per assertion:
    - uiautomator for visible UI labels/state
    - logcat for React Native log messages (including invisible TextView dumps)
    - parsed stats/counters for native bridge state

  Writes validation-summary.json and exits 0 only when all 24 scenarios pass with
  explicit supporting evidence.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$EvidenceDir
)

$ErrorActionPreference = 'Stop'
$LibPath = Join-Path $PSScriptRoot 'device-validation-lib.ps1'
. $LibPath

if (-not (Test-Path -LiteralPath $EvidenceDir)) {
    Write-Error "Evidence directory not found: $EvidenceDir"
    exit 2
}

Write-Host "Evaluating evidence: $EvidenceDir"
$results = Invoke-DeviceScenarioEvaluation -EvidenceDir $EvidenceDir
$summaryPath = Write-DeviceValidationSummary -EvidenceDir $EvidenceDir -ScenarioResults $results -RunMode 'evidence-only'

$results | Sort-Object scenario | Format-Table scenario, status, evidenceSource, observedResult -AutoSize
$failed = @($results | Where-Object { $_.status -ne 'pass' })
Write-Host "`nScenarios: $($results.Count)  Passed: $($results.Count - $failed.Count)  Failed: $($failed.Count)"
Write-Host "Summary: $summaryPath"

if ($failed.Count -gt 0) {
    Write-Host "`nFailed scenarios:"
    foreach ($item in $failed) {
        Write-Host "  #$($item.scenario) $($item.name): $($item.observedResult)"
    }
    exit 1
}

exit 0
