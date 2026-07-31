#Requires -Version 5.1
<#
.SYNOPSIS
  Force-stop and relaunch the debug app three times; capture logcat evidence.
#>
param(
    [string]$AdbPath = $(Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe')
)

$ErrorActionPreference = 'Stop'
$AppPackage = 'com.milerecover.prototype.nativebridge'
$AppComponent = "$AppPackage/.MainActivity"
$LogDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'debug-logs'
$Marker = 'MileRecoverProtoBridgeC'

if (-not (Test-Path -LiteralPath $AdbPath)) {
    throw "adb not found: $AdbPath"
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$serialLine = & $AdbPath devices -l 2>&1 | Where-Object { $_ -match '\tdevice(\s|$)' } | Select-Object -First 1
if (-not $serialLine) {
    throw 'No device connected.'
}
$serial = ($serialLine -split '\s+')[0]
Write-Host "Testing with device: $serial"

$adbBase = @('-s', $serial)
$results = @()

for ($i = 1; $i -le 3; $i++) {
    Write-Host "`n=== Relaunch $i/3 ==="

    & $AdbPath @adbBase logcat -c 2>&1 | Out-Null
    & $AdbPath @adbBase shell am force-stop $AppPackage 2>&1 | Out-Null
    Start-Sleep -Seconds 1

    $reverseBefore = (& $AdbPath @adbBase reverse --list 2>&1) -join '; '
    Write-Host "Reverse before launch: $reverseBefore"

    & $AdbPath @adbBase shell am start -n $AppComponent 2>&1 | Out-Null
    Start-Sleep -Seconds 6

    $logPath = Join-Path $LogDir "relaunch-$i-logcat.txt"
    & $AdbPath @adbBase logcat -d 2>&1 | Out-File -FilePath $logPath -Encoding utf8

    $reverseAfter = (& $AdbPath @adbBase reverse --list 2>&1) -join '; '
    $successLine = Select-String -Path $logPath -Pattern "Running `"$Marker`"" -SimpleMatch -ErrorAction SilentlyContinue | Select-Object -First 1
    $failLine = Select-String -Path $logPath -Pattern 'Unable to load script|ConnectException|Failed to connect to localhost' -ErrorAction SilentlyContinue | Select-Object -First 1

    $passed = [bool]$successLine -and -not $failLine
    $results += [pscustomobject]@{
        Relaunch = $i
        Passed   = $passed
        Reverse  = $reverseAfter
        Success  = if ($successLine) { $successLine.Line.Trim() } else { $null }
        Failure  = if ($failLine) { $failLine.Line.Trim() } else { $null }
        LogFile  = $logPath
    }

    Write-Host "Result: $(if ($passed) { 'PASS' } else { 'FAIL' })"
    if ($successLine) { Write-Host "  Success: $($successLine.Line.Trim())" }
    if ($failLine) { Write-Host "  Failure: $($failLine.Line.Trim())" }
}

Write-Host "`n=== Summary ==="
$results | Format-Table Relaunch, Passed, Reverse -AutoSize
$allPassed = ($results | Where-Object { -not $_.Passed }).Count -eq 0
Write-Host "All three relaunches passed: $allPassed"
exit $(if ($allPassed) { 0 } else { 1 })
