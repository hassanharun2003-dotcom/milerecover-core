#Requires -Version 5.1
<#
.SYNOPSIS
  Wireless-only daily Android dev for Prototype C (native-bridge).

.DESCRIPTION
  One command: wireless ADB connect (if needed), Metro, adb reverse, app launch,
  and React Native load verification. Never persists pairing codes or IP ports.

.PARAMETER SmokeTest
  After the initial launch, force-stop and relaunch three times to verify stability.
#>
[CmdletBinding()]
param(
    [switch]$SmokeTest,
    [switch]$SkipMetro
)

$ErrorActionPreference = 'Stop'
$PrototypeRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$MetroPort = 8081
$AppPackage = 'com.milerecover.prototype.nativebridge'
$AppComponent = "$AppPackage/.MainActivity"
$JsMarker = 'MileRecoverProtoBridgeC'
$MetroStatusUrl = "http://127.0.0.1:${MetroPort}/status"
$MetroLogPath = Join-Path $PrototypeRoot '.metro-debug.log'
$SamsungModelPattern = 'model:SM_A166U|model:SM-A166U|samsung'

$script:PairingUsed = $false

function Write-Step([string]$Message) {
    Write-Host "[dev-android-wireless] $Message"
}

function Write-Ok([string]$Message) {
    Write-Host "[dev-android-wireless] OK: $Message" -ForegroundColor Green
}

function Write-Fail([string]$Message) {
    Write-Host "[dev-android-wireless] FAIL: $Message" -ForegroundColor Red
}

function Find-AdbPath {
    $candidateList = [System.Collections.Generic.List[string]]::new()
    if ($env:ANDROID_HOME) {
        $candidateList.Add((Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'))
    }
    if ($env:ANDROID_SDK_ROOT) {
        $candidateList.Add((Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe'))
    }
    $candidateList.Add((Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'))
    if (${env:ProgramFiles(x86)}) {
        $candidateList.Add((
            Join-Path ${env:ProgramFiles(x86)} 'Android\android-sdk\platform-tools\adb.exe'
        ))
    }

    foreach ($path in $candidateList) {
        if (Test-Path -LiteralPath $path) {
            return $path
        }
    }

    throw 'adb.exe not found. Install Android SDK platform-tools or set ANDROID_HOME.'
}

function Invoke-Adb {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    $base = @()
    if ($Serial) {
        $base += '-s', $Serial
    }
    return & $AdbPath @base @Args 2>&1
}

function Get-AuthorizedDeviceLines {
    param([string]$AdbPath)

    & $AdbPath start-server 2>&1 | Out-Null
    return @(
        & $AdbPath devices -l 2>&1 |
            Where-Object { $_ -match '\tdevice(\s|$)' }
    )
}

function Get-SamsungSerial {
    param([string]$AdbPath)

    $lines = Get-AuthorizedDeviceLines -AdbPath $AdbPath
    if ($lines.Count -eq 0) {
        return $null
    }

    $samsung = @($lines | Where-Object { $_ -match $SamsungModelPattern })
    if ($samsung.Count -gt 0) {
        return ($samsung[0] -split '\s+')[0]
    }

    if ($lines.Count -eq 1) {
        Write-Step 'Samsung model not detected; using the only connected device.'
        return ($lines[0] -split '\s+')[0]
    }

    Write-Step 'Multiple devices connected; prefer Samsung if present.'
    return ($lines[0] -split '\s+')[0]
}

function Test-EndpointFormat {
    param([string]$Value)

    return $Value -match '^\d{1,3}(\.\d{1,3}){3}:\d+$'
}

function Read-EndpointPrompt {
    param([string]$Prompt)

    while ($true) {
        $value = (Read-Host $Prompt).Trim()
        if (Test-EndpointFormat -Value $value) {
            return $value
        }
        Write-Fail 'Enter IP and port like 192.168.1.10:5555'
    }
}

function Read-PairingCodeSecure {
    $secure = Read-Host 'Enter the 6-digit wireless debugging pairing code' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    } finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }

    if ($plain -notmatch '^\d{6}$') {
        throw 'Pairing code must be exactly six digits.'
    }

    return $plain
}

function Test-AdbConnectSucceeded {
    param(
        [string]$AdbPath,
        [object]$ConnectOutput
    )

    $text = ($ConnectOutput | Out-String).Trim()
    if ($text -match '(?i)cannot resolve host|failed to connect|error|unable to connect') {
        return $false
    }

    Start-Sleep -Seconds 1
    return [bool](Get-SamsungSerial -AdbPath $AdbPath)
}

function Connect-WirelessDevice {
    param([string]$AdbPath)

    Write-Host ''
    Write-Host 'Wireless debugging is not connected.'
    Write-Host 'On the phone, open:'
    Write-Host '  Settings → Developer options → Wireless debugging'
    Write-Host 'Turn Wireless debugging ON.'
    Write-Host ''

    $mainEndpoint = Read-EndpointPrompt 'Enter the main "IP address & port" from that screen'
    $connectOut = Invoke-Adb -AdbPath $AdbPath -Serial '' -Args @('connect', $mainEndpoint)

    if (Test-AdbConnectSucceeded -AdbPath $AdbPath -ConnectOutput $connectOut) {
        Write-Ok "Connected via $mainEndpoint"
        return (Get-SamsungSerial -AdbPath $AdbPath)
    }

    Write-Step "adb connect did not authorize a device. Output: $($connectOut | Out-String)"

    if (-not (Get-SamsungSerial -AdbPath $AdbPath)) {
        Write-Host ''
        Write-Host 'Pairing is required (first-time or expired trust).'
        Write-Host 'On the phone: Wireless debugging → Pair device with pairing code'
        Write-Host ''

        $pairEndpoint = Read-EndpointPrompt 'Enter the pairing "IP address & port"'
        $pairCode = Read-PairingCodeSecure
        $script:PairingUsed = $true

        $pairOut = Invoke-Adb -AdbPath $AdbPath -Serial '' -Args @('pair', $pairEndpoint, $pairCode)
        $pairCode = $null

        if (($pairOut | Out-String) -notmatch '(?i)successfully paired') {
            throw "adb pair failed: $($pairOut | Out-String)"
        }

        Write-Ok 'Device paired successfully.'

        Write-Host ''
        Write-Host 'Return to the main Wireless debugging screen for the connect port.'
        $mainEndpoint = Read-EndpointPrompt 'Enter the main "IP address & port"'
        $connectOut = Invoke-Adb -AdbPath $AdbPath -Serial '' -Args @('connect', $mainEndpoint)

        if (-not (Test-AdbConnectSucceeded -AdbPath $AdbPath -ConnectOutput $connectOut)) {
            throw "adb connect failed after pairing: $($connectOut | Out-String)"
        }

        Write-Ok "Connected via $mainEndpoint"
    }

    $serial = Get-SamsungSerial -AdbPath $AdbPath
    if (-not $serial) {
        throw 'Device connected but Samsung SM-A166U was not detected in adb devices -l.'
    }

    return $serial
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
        Write-Ok "Metro already running on port $MetroPort (packager-status:running)"
        return
    }

    if (Test-MetroListening -and -not (Test-MetroRunning)) {
        throw "Port $MetroPort is in use but Metro status is not healthy."
    }

    Write-Step 'Starting Metro with reset cache in a dedicated window...'
    $metroCmd = "Set-Location -LiteralPath '$PrototypeRoot'; npx.cmd react-native start --reset-cache *> '$MetroLogPath'"

    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $metroCmd) `
        -WorkingDirectory $PrototypeRoot `
        -WindowStyle Normal | Out-Null

    if (-not (Wait-MetroRunning)) {
        if (Test-Path -LiteralPath $MetroLogPath) {
            Write-Step 'Recent Metro log:'
            Get-Content -LiteralPath $MetroLogPath -Tail 20 | ForEach-Object { Write-Host "  $_" }
        }
        throw 'Metro did not reach packager-status:running within timeout.'
    }

    Write-Ok 'Metro is running (packager-status:running)'
}

function Ensure-AdbReverse {
    param(
        [string]$AdbPath,
        [string]$Serial
    )

    Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('reverse', '--remove-all') | Out-Null
    $reverseResult = Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @(
        'reverse', "tcp:${MetroPort}", "tcp:${MetroPort}"
    )

    if ($LASTEXITCODE -ne 0) {
        throw "adb reverse failed: $($reverseResult | Out-String)"
    }

    $list = @(Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('reverse', '--list'))
    $expected = "tcp:${MetroPort} tcp:${MetroPort}"
    $matched = @($list | Where-Object { $_ -match [regex]::Escape($expected) })

    if ($matched.Count -eq 0) {
        throw "adb reverse not listed after setup:`n$($list -join "`n")"
    }

    Write-Ok "adb reverse active: $($matched[0])"
    return ($list -join "`n")
}

function Launch-DebugApp {
    param(
        [string]$AdbPath,
        [string]$Serial
    )

    Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @(
        'shell', 'am', 'force-stop', $AppPackage
    ) | Out-Null
    Start-Sleep -Milliseconds 500

    $launch = Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @(
        'shell', 'am', 'start', '-n', $AppComponent
    )

    if ($LASTEXITCODE -ne 0) {
        throw "App launch failed: $($launch | Out-String)"
    }
}

function Test-ReactNativeLoaded {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [int]$WaitSeconds = 8
    )

    Start-Sleep -Seconds $WaitSeconds
    $logText = (Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('logcat', '-d') | Out-String)

    $hasSuccess = $logText -match [regex]::Escape("Running `"$JsMarker`"")
    $hasFailure = $logText -match 'Unable to load script|ConnectException|Failed to connect to localhost/127\.0\.0\.1:8081'

    return @{
        Loaded  = ($hasSuccess -and -not $hasFailure)
        Success = if ($hasSuccess) {
            ($logText -split "`n" | Where-Object { $_ -match [regex]::Escape("Running `"$JsMarker`"") } | Select-Object -First 1).Trim()
        } else { $null }
        Failure = if ($hasFailure) {
            ($logText -split "`n" | Where-Object {
                $_ -match 'Unable to load script|ConnectException|Failed to connect'
            } | Select-Object -First 1).Trim()
        } else { $null }
    }
}

function Invoke-LaunchAndVerify {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [switch]$ClearLog
    )

    if ($ClearLog) {
        Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('logcat', '-c') | Out-Null
    }

    Launch-DebugApp -AdbPath $AdbPath -Serial $Serial
    return (Test-ReactNativeLoaded -AdbPath $AdbPath -Serial $Serial)
}

function Invoke-RelaunchSmokeTests {
    param(
        [string]$AdbPath,
        [string]$Serial
    )

    Write-Step 'Smoke test: three consecutive relaunches...'
    $results = @()

    for ($i = 1; $i -le 3; $i++) {
        Write-Host "`n--- Relaunch $i/3 ---"
        $reverseBefore = (Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('reverse', '--list') | Out-String).Trim()

        $check = Invoke-LaunchAndVerify -AdbPath $AdbPath -Serial $Serial -ClearLog
        $reverseAfter = (Invoke-Adb -AdbPath $AdbPath -Serial $Serial -Args @('reverse', '--list') | Out-String).Trim()

        $results += [pscustomobject]@{
            Relaunch = $i
            Passed   = $check.Loaded
            Reverse  = $reverseAfter
        }

        Write-Host "  Reverse: $reverseAfter"
        Write-Host "  Result: $(if ($check.Loaded) { 'PASS' } else { 'FAIL' })"
        if ($check.Success) { Write-Host "  $($check.Success)" }
        if ($check.Failure) { Write-Host "  $($check.Failure)" -ForegroundColor Red }
    }

    return $results
}

try {
    Write-Step "Prototype root: $PrototypeRoot"

    $adbPath = Find-AdbPath
    Write-Ok "Using adb: $adbPath"

    $serial = Get-SamsungSerial -AdbPath $adbPath
    if (-not $serial) {
        $serial = Connect-WirelessDevice -AdbPath $adbPath
    } else {
        Write-Ok "Samsung already connected: $serial"
    }

    if (-not $SkipMetro) {
        Start-MetroIfNeeded
    } elseif (-not (Test-MetroRunning)) {
        throw 'Metro is not running and -SkipMetro was specified.'
    }

    if (-not (Test-MetroRunning)) {
        throw "Metro is not healthy at $MetroStatusUrl"
    }

    $reverseList = Ensure-AdbReverse -AdbPath $adbPath -Serial $serial

    Invoke-Adb -AdbPath $adbPath -Serial $serial -Args @('logcat', '-c') | Out-Null
    $verify = Invoke-LaunchAndVerify -AdbPath $adbPath -Serial $serial

    if (-not $verify.Loaded) {
        Write-Step 'First launch did not load React Native; retrying once...'
        Ensure-AdbReverse -AdbPath $adbPath -Serial $serial | Out-Null
        Invoke-Adb -AdbPath $adbPath -Serial $serial -Args @('logcat', '-c') | Out-Null
        $verify = Invoke-LaunchAndVerify -AdbPath $adbPath -Serial $serial
    }

    if (-not $verify.Loaded) {
        Write-Fail 'React Native did not load after retry.'
        if ($verify.Failure) { Write-Host $verify.Failure }
        exit 1
    }

    Write-Ok "React Native loaded: $($verify.Success)"

    $smokeResults = $null
    if ($SmokeTest) {
        $smokeResults = Invoke-RelaunchSmokeTests -AdbPath $adbPath -Serial $serial
        $failed = @($smokeResults | Where-Object { -not $_.Passed })
        if ($failed.Count -gt 0) {
            Write-Fail "Smoke test failed on relaunch(s): $($failed.Relaunch -join ', ')"
            exit 1
        }
        Write-Ok 'All three relaunch smoke tests passed.'
    }

    Write-Host ''
    Write-Ok 'Wireless Android dev session ready.'
    Write-Host "  Metro:    $MetroStatusUrl"
    Write-Host "  Device:   $serial"
    Write-Host "  Reverse:`n$reverseList"
    Write-Host "  Pairing:  $(if ($script:PairingUsed) { 'used this run' } else { 'not needed' })"
    if ($SmokeTest) {
        Write-Host '  Smoke:    3/3 relaunches passed'
    } else {
        Write-Host '  Tip: rerun with -SmokeTest to verify three consecutive relaunches.'
    }
    Write-Host ''
    Write-Host 'Keep the Metro window open. Stop with .\scripts\stop-dev-android.ps1'

    exit 0
} catch {
    Write-Fail $_.Exception.Message
    exit 1
}
