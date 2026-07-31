#Requires -Version 5.1
<#
.SYNOPSIS
  Stabilize React Native Android debug for Prototype C (native-bridge).

.DESCRIPTION
  Locates adb, verifies a device is connected, ensures Metro is running on 8081,
  recreates adb reverse for Metro, and relaunches the debug app.

  Run from any directory. Does not store pairing codes, IPs, or device secrets.
#>
[CmdletBinding()]
param(
    [switch]$SkipLaunch,
    [switch]$SkipMetro
)

$ErrorActionPreference = 'Stop'
$PrototypeRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$MetroPort = 8081
$AppComponent = 'com.milerecover.prototype.nativebridge/.MainActivity'
$MetroStatusUrl = "http://127.0.0.1:${MetroPort}/status"
$MetroLogPath = Join-Path $PrototypeRoot '.metro-debug.log'

function Write-Step([string]$Message) {
    Write-Host "[start-android-debug] $Message"
}

function Write-Ok([string]$Message) {
    Write-Host "[start-android-debug] OK: $Message" -ForegroundColor Green
}

function Write-Fail([string]$Message) {
    Write-Host "[start-android-debug] FAIL: $Message" -ForegroundColor Red
}

function Find-AdbPath {
    $candidates = @(
        $(if ($env:ANDROID_HOME) { Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe' }),
        $(if ($env:ANDROID_SDK_ROOT) { Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe' }),
        $(Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'),
        $(Join-Path ${env:ProgramFiles(x86)} 'Android\android-sdk\platform-tools\adb.exe')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

    if (-not $candidates -or $candidates.Count -eq 0) {
        throw 'adb.exe not found. Install Android SDK platform-tools or set ANDROID_HOME.'
    }

    return ($candidates | Select-Object -First 1)
}

function Test-MetroListening {
    $conn = Get-NetTCPConnection -LocalPort $MetroPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    return [bool]$conn
}

function Test-MetroRunning {
    try {
        $status = Invoke-RestMethod -Uri $MetroStatusUrl -TimeoutSec 3
        return ($status -eq 'packager-status:running')
    } catch {
        return $false
    }
}

function Wait-MetroRunning {
    param([int]$TimeoutSeconds = 120)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-MetroRunning) {
            return $true
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Start-MetroIfNeeded {
    if (Test-MetroRunning) {
        Write-Ok "Metro already running on port $MetroPort"
        return
    }

    if (Test-MetroListening -and -not (Test-MetroRunning)) {
        Write-Fail "Port $MetroPort is in use but Metro status endpoint is not healthy."
        throw "Another process may be bound to port $MetroPort."
    }

    Write-Step "Starting Metro with reset cache in a dedicated window..."
    $metroCmd = "Set-Location -LiteralPath '$PrototypeRoot'; npx.cmd react-native start --reset-cache *> '$MetroLogPath'"

    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $metroCmd) `
        -WorkingDirectory $PrototypeRoot `
        -WindowStyle Normal | Out-Null

    if (-not (Wait-MetroRunning)) {
        Write-Fail "Metro did not report packager-status:running within timeout."
        if (Test-Path -LiteralPath $MetroLogPath) {
            Write-Step "Recent Metro log:"
            Get-Content -LiteralPath $MetroLogPath -Tail 20 | ForEach-Object { Write-Host "  $_" }
        }
        throw 'Metro failed to start.'
    }

    Write-Ok "Metro is running (packager-status:running)"
}

function Get-ConnectedDeviceSerial {
    param([string]$AdbPath)

    & $AdbPath start-server 2>&1 | Out-Null

    $lines = & $AdbPath devices -l 2>&1 |
        Where-Object { $_ -match '\tdevice(\s|$)' }

    if (-not $lines -or $lines.Count -eq 0) {
        return $null
    }

    $samsung = $lines | Where-Object { $_ -match 'model:SM-A166U|samsung' } | Select-Object -First 1
    if ($samsung) {
        return ($samsung -split '\s+')[0]
    }

    if ($lines.Count -gt 1) {
        Write-Step "Multiple devices connected; using the first authorized device."
    }

    return ($lines[0] -split '\s+')[0]
}

function Ensure-AdbReverse {
    param(
        [string]$AdbPath,
        [string]$Serial
    )

    $adbArgs = @()
    if ($Serial) {
        $adbArgs += '-s', $Serial
    }

    & $AdbPath @adbArgs reverse --remove-all 2>&1 | Out-Null
    $reverseResult = & $AdbPath @adbArgs reverse "tcp:${MetroPort}" "tcp:${MetroPort}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "adb reverse failed: $reverseResult"
    }

    $list = & $AdbPath @adbArgs reverse --list 2>&1
    $expected = "tcp:${MetroPort} tcp:${MetroPort}"
    $matched = $list | Where-Object { $_ -match [regex]::Escape($expected) }

    if (-not $matched) {
        throw "adb reverse not listed after setup. Output:`n$($list -join "`n")"
    }

    Write-Ok "adb reverse active: $($matched | Select-Object -First 1)"
    return ($list -join "`n")
}

function Launch-DebugApp {
    param(
        [string]$AdbPath,
        [string]$Serial
    )

    $adbArgs = @()
    if ($Serial) {
        $adbArgs += '-s', $Serial
    }

    & $AdbPath @adbArgs shell am force-stop com.milerecover.prototype.nativebridge 2>&1 | Out-Null
    Start-Sleep -Milliseconds 500
    $launch = & $AdbPath @adbArgs shell am start -n $AppComponent 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "App launch failed: $launch"
    }

    Write-Ok "Launched $AppComponent"
}

try {
    Write-Step "Prototype root: $PrototypeRoot"

    $adbPath = Find-AdbPath
    Write-Ok "Using adb: $adbPath"

    $serial = Get-ConnectedDeviceSerial -AdbPath $adbPath
    if (-not $serial) {
        Write-Fail 'No authorized Android device found.'
        Write-Host ''
        Write-Host 'Wireless ADB reconnect (phone):'
        Write-Host '  Settings > Developer options > Wireless debugging'
        Write-Host '  Ensure it is ON, then use "Pair device with pairing code" or reconnect from Android Studio Device Manager.'
        Write-Host '  After the device appears under "adb devices", rerun this script.'
        exit 2
    }

    Write-Ok "Device connected: $serial"

    if (-not $SkipMetro) {
        Start-MetroIfNeeded
    } elseif (-not (Test-MetroRunning)) {
        throw 'Metro is not running and -SkipMetro was specified.'
    }

    $reverseList = Ensure-AdbReverse -AdbPath $adbPath -Serial $serial

    if (-not $SkipLaunch) {
        Launch-DebugApp -AdbPath $adbPath -Serial $serial
    }

    Write-Host ''
    Write-Ok 'Android debug session ready.'
    Write-Host "  Metro:  $MetroStatusUrl"
    Write-Host "  Device: $serial"
    Write-Host "  Reverse:`n$reverseList"
    Write-Host ''
    Write-Host 'Keep the Metro window open. Rerun this script after wireless ADB reconnects.'
    exit 0
} catch {
    Write-Fail $_.Exception.Message
    exit 1
}
