#Requires -Version 5.1
<#
.SYNOPSIS
  Stop Metro and clear the Prototype C wireless dev session on port 8081.
#>
[CmdletBinding()]
param(
    [switch]$DisconnectAdb
)

$ErrorActionPreference = 'Stop'
$MetroPort = 8081
$PrototypeRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Write-Step([string]$Message) {
    Write-Host "[stop-dev-android] $Message"
}

function Find-AdbPath {
    $paths = @(
        $(if ($env:ANDROID_HOME) { Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe' }),
        $(if ($env:ANDROID_SDK_ROOT) { Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe' }),
        $(Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

    if ($paths.Count -eq 0) {
        return $null
    }
    return $paths[0]
}

$stopped = $false
$listeners = @(Get-NetTCPConnection -LocalPort $MetroPort -State Listen -ErrorAction SilentlyContinue)

foreach ($conn in $listeners) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Step "Stopping $($proc.ProcessName) (PID $($proc.Id)) on port $MetroPort..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $stopped = $true
    }
}

if ($stopped) {
    Write-Host "[stop-dev-android] OK: Metro stopped on port $MetroPort." -ForegroundColor Green
} else {
    Write-Host "[stop-dev-android] OK: No listener on port $MetroPort." -ForegroundColor Green
}

$metroLog = Join-Path $PrototypeRoot '.metro-debug.log'
if (Test-Path -LiteralPath $metroLog) {
    Remove-Item -LiteralPath $metroLog -Force -ErrorAction SilentlyContinue
}

if ($DisconnectAdb) {
    $adbPath = Find-AdbPath
    if ($adbPath) {
        $serials = @(
            & $adbPath devices 2>&1 |
                Where-Object { $_ -match '\tdevice$' } |
                ForEach-Object { ($_ -split '\s+')[0] }
        )
        foreach ($serial in $serials) {
            if ($serial -match ':') {
                Write-Step "Disconnecting $serial..."
                & $adbPath disconnect $serial 2>&1 | Out-Null
            }
        }
    }
}

exit 0
