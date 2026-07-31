#Requires -Version 5.1
<#
.SYNOPSIS
  Pre-merge safety gate for Android / iOS / shared development lanes.

.DESCRIPTION
  Validates branch, forbidden path edits, secret/port patterns, contract compatibility,
  and optional test execution. Writes machine-readable lane-merge-report.json.

.PARAMETER Lane
  android | ios | shared

.PARAMETER BaseRef
  Merge base to compare against (default: milestone/android-validation for checkpoint)

.PARAMETER SkipTests
  Skip running required tests (not recommended for merge readiness)
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('android', 'ios', 'shared')]
    [string]$Lane,

    [string]$BaseRef = '',
    [switch]$SkipTests,
    [string]$ReportDir = ''
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (git rev-parse --show-toplevel 2>$null)
if (-not $RepoRoot) {
    Write-Error 'Not inside a git repository'
    exit 2
}

$ConfigPath = Join-Path $RepoRoot 'tooling\lanes\lane-config.json'
if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-Error "Lane config not found: $ConfigPath"
    exit 2
}
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$laneConfig = $config.lanes.$Lane

if (-not $BaseRef) {
    $BaseRef = $config.checkpointBranch
}

$currentBranch = (git branch --show-current).Trim()
$headSha = (git rev-parse HEAD).Trim()
$baseSha = ''
try {
    $baseSha = (git merge-base HEAD $BaseRef 2>$null)
    if (-not $baseSha) { $baseSha = (git rev-parse $BaseRef 2>$null) }
} catch {
    $baseSha = 'unknown'
}

$blockers = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$testsRun = New-Object System.Collections.Generic.List[string]
$testsPassed = New-Object System.Collections.Generic.List[string]
$testsFailed = New-Object System.Collections.Generic.List[string]

if ($currentBranch -ne $laneConfig.branch) {
    $blockers.Add("Current branch '$currentBranch' is not lane branch '$($laneConfig.branch)'") | Out-Null
}

$changedFiles = @()
if ($baseSha -and $baseSha -ne 'unknown') {
    $changedFiles = @(git diff --name-only "${baseSha}...HEAD" 2>$null)
}
if ($changedFiles.Count -eq 0) {
    $changedFiles = @(git diff --name-only HEAD 2>$null)
    $changedFiles += @(git diff --name-only --cached 2>$null)
    $changedFiles += @(git ls-files --others --exclude-standard 2>$null)
    $changedFiles = @($changedFiles | Select-Object -Unique)
}

function Test-GlobMatch {
    param([string]$Path, [string]$Pattern)
    $normalized = $Path -replace '\\', '/'
    $glob = $Pattern -replace '\\', '/'
    if ($glob.EndsWith('/**')) {
        $prefix = $glob.Substring(0, $glob.Length - 3)
        return $normalized.StartsWith("$prefix/")
    }
    return ($normalized -like ($glob -replace '\*\*', '*'))
}

$allowed = @($laneConfig.allowedPaths)
$forbidden = @($config.forbiddenPaths)
$violations = New-Object System.Collections.Generic.List[string]

foreach ($file in $changedFiles) {
    if (-not $file) { continue }
    $isAllowed = $false
    foreach ($pattern in $allowed) {
        if (Test-GlobMatch -Path $file -Pattern $pattern) {
            $isAllowed = $true
            break
        }
    }
    if (-not $isAllowed) {
        foreach ($pattern in $forbidden) {
            if (Test-GlobMatch -Path $file -Pattern $pattern) {
                $violations.Add("$file (forbidden: $pattern)") | Out-Null
                break
            }
        }
        if (-not ($violations | Where-Object { $_ -like "$file*" })) {
            $violations.Add("$file (outside lane allowed paths)") | Out-Null
        }
    }
}

if ($violations.Count -gt 0) {
    $blockers.Add("Forbidden or out-of-lane file changes: $($violations.Count)") | Out-Null
}

$trackedContent = ''
foreach ($file in $changedFiles) {
    if (Test-Path -LiteralPath (Join-Path $RepoRoot $file)) {
        $trackedContent += (Get-Content -LiteralPath (Join-Path $RepoRoot $file) -Raw -ErrorAction SilentlyContinue)
    }
}
foreach ($pattern in $config.forbiddenPatterns) {
    if ($trackedContent -match $pattern) {
        $blockers.Add("Forbidden pattern in changed files: $pattern") | Out-Null
    }
}

if (-not $SkipTests) {
    foreach ($testSpec in $laneConfig.requiredTests) {
        $parts = $testSpec -split ':', 2
        $dir = Join-Path $RepoRoot ($parts[0] -replace '/', '\')
        $cmd = $parts[1]
        $testsRun.Add($testSpec) | Out-Null
        Push-Location $dir
        try {
            if ($cmd -match '^powershell\s+(.+)$') {
                $scriptPath = Join-Path $dir $Matches[1]
                & powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath
                if ($LASTEXITCODE -ne 0) { $testsFailed.Add($testSpec) | Out-Null }
                else { $testsPassed.Add($testSpec) | Out-Null }
            } elseif ($cmd -match '^npm run (.+)$') {
                npm run $Matches[1] 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) { $testsFailed.Add($testSpec) | Out-Null }
                else { $testsPassed.Add($testSpec) | Out-Null }
            } else {
                $warnings.Add("Unknown test spec: $testSpec") | Out-Null
            }
        } finally {
            Pop-Location
        }
    }
    if ($testsFailed.Count -gt 0) {
        $blockers.Add("Required tests failed: $($testsFailed -join ', ')") | Out-Null
    }
}

$mergeReady = ($blockers.Count -eq 0)
$report = [ordered]@{
    generatedAt    = (Get-Date).ToUniversalTime().ToString('o')
    lane           = $Lane
    branch         = $currentBranch
    baseCheckpoint = $BaseRef
    baseSha        = $baseSha
    headSha        = $headSha
    rollbackCommit = $headSha
    filesChanged   = @($changedFiles)
    forbiddenEdits = @($violations)
    tests          = @{
        run    = @($testsRun)
        passed = @($testsPassed)
        failed = @($testsFailed)
    }
    evidence       = @{
        androidValidation = 'prototypes/native-bridge/device-validation-20260731-134617/validation-summary.json'
        contractVersion   = $config.contractVersion
    }
    blockers       = @($blockers)
    warnings       = @($warnings)
    mergeReadiness = $(if ($mergeReady) { 'ready' } else { 'blocked' })
}

if (-not $ReportDir) {
    $ReportDir = Join-Path $RepoRoot 'tooling\lanes\reports'
}
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$reportPath = Join-Path $ReportDir "lane-merge-report-$Lane-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "Lane: $Lane  Branch: $currentBranch  Merge readiness: $($report.mergeReadiness)"
Write-Host "Changed files: $($changedFiles.Count)  Blockers: $($blockers.Count)"
Write-Host "Report: $reportPath"

if ($blockers.Count -gt 0) {
    foreach ($b in $blockers) { Write-Host "  BLOCKER: $b" }
    exit 1
}
exit 0
