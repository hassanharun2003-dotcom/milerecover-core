#Requires -Version 5.1
<#
.SYNOPSIS
  Automate Prototype C Android pass-2 validation via adb UI taps.

.PARAMETER EvaluateOnly
  Reevaluate captured evidence without touching the device. Exits 0 when all 24
  scenarios pass with explicit evidence in validation-summary.json.
#>
[CmdletBinding()]
param(
    [string]$Serial = '',
    [string]$EvidenceDir = '',
    [switch]$EvaluateOnly
)

$ErrorActionPreference = 'Stop'
$PrototypeRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LibPath = Join-Path $PSScriptRoot 'device-validation-lib.ps1'
. $LibPath

$AppPackage = 'com.milerecover.prototype.nativebridge'
$AppComponent = "$AppPackage/.MainActivity"

if ($EvaluateOnly) {
    if (-not $EvidenceDir) {
        throw '-EvidenceDir is required with -EvaluateOnly'
    }
    $resolvedEvidence = if ([System.IO.Path]::IsPathRooted($EvidenceDir)) {
        $EvidenceDir
    } else {
        Join-Path $PrototypeRoot $EvidenceDir
    }
    & (Join-Path $PSScriptRoot 'evaluate-device-evidence.ps1') -EvidenceDir $resolvedEvidence
    exit $LASTEXITCODE
}

if (-not $EvidenceDir) {
    $EvidenceDir = Join-Path $PrototypeRoot "device-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

function Find-AdbPath {
    $candidateList = [System.Collections.Generic.List[string]]::new()
    if ($env:ANDROID_HOME) {
        $candidateList.Add((Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'))
    }
    $candidateList.Add((Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'))
    foreach ($path in $candidateList) {
        if (Test-Path -LiteralPath $path) { return $path }
    }
    throw 'adb.exe not found'
}

function Get-DeviceSerial {
    param([string]$AdbPath, [string]$Preferred)
    if ($Preferred) {
        $check = & $AdbPath -s $Preferred get-state 2>&1
        if ($check -eq 'device') { return $Preferred }
    }
    $line = @(& $AdbPath devices -l 2>&1 | Where-Object { $_ -match '^\S+\s+device\s' }) | Select-Object -First 1
    if (-not $line) { throw 'No authorized Android device connected' }
    return ($line -split '\s+')[0]
}

function Invoke-AdbShell {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$ShellArgs
    )

    if ($Serial) {
        return (& $AdbPath -s $Serial @ShellArgs 2>&1 | Out-String).Trim()
    }
    return (& $AdbPath @ShellArgs 2>&1 | Out-String).Trim()
}

function Get-UiDump {
    param([string]$AdbPath, [string]$Serial)
    Invoke-AdbShell -AdbPath $AdbPath -Serial $Serial -ShellArgs @('shell', 'uiautomator', 'dump', '/sdcard/window_dump.xml') | Out-Null
    Start-Sleep -Milliseconds 400
    return (Invoke-AdbShell -AdbPath $AdbPath -Serial $Serial -ShellArgs @('shell', 'cat', '/sdcard/window_dump.xml'))
}

function Scroll-ToLogSection {
    param([string]$AdbPath, [string]$Serial)
    for ($i = 0; $i -lt 8; $i++) {
        $xml = Get-UiDump -AdbPath $AdbPath -Serial $Serial
        if ($xml -match 'text="Log"') { return }
        Scroll-Down -AdbPath $AdbPath -Serial $Serial
    }
}

function Scroll-Down {
    param([string]$AdbPath, [string]$Serial)
    Invoke-AdbShell -AdbPath $AdbPath -Serial $Serial -ShellArgs @('shell', 'input', 'swipe', '540', '1700', '540', '700', '350') | Out-Null
    Start-Sleep -Milliseconds 500
}

function Scroll-ToTop {
    param([string]$AdbPath, [string]$Serial)
    for ($i = 0; $i -lt 4; $i++) {
        Invoke-AdbShell -AdbPath $AdbPath -Serial $Serial -ShellArgs @('shell', 'input', 'swipe', '540', '700', '540', '1700', '350') | Out-Null
        Start-Sleep -Milliseconds 300
    }
}

function Tap-Button {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [string]$Label,
        [int]$MaxScrolls = 20
    )

    Scroll-ToTop -AdbPath $AdbPath -Serial $Serial
    for ($s = 0; $s -le $MaxScrolls; $s++) {
        $xml = Get-UiDump -AdbPath $AdbPath -Serial $Serial
        $pattern = [regex]::Escape($Label)
        $m = [regex]::Match($xml, "text=`"$pattern`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"")
        if (-not $m.Success) {
            $m = [regex]::Match($xml, "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*text=`"$pattern`"")
        }
        if ($m.Success) {
            $x = [int](([int]$m.Groups[1].Value + [int]$m.Groups[3].Value) / 2)
            $y = [int](([int]$m.Groups[2].Value + [int]$m.Groups[4].Value) / 2)
            Invoke-AdbShell -AdbPath $AdbPath -Serial $Serial -ShellArgs @('shell', 'input', 'tap', "$x", "$y") | Out-Null
            return @{ Found = $true; X = $x; Y = $y; Scroll = $s }
        }
        if ($s -lt $MaxScrolls) { Scroll-Down -AdbPath $AdbPath -Serial $Serial }
    }
    return @{ Found = $false }
}

function Wait-UiContains {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [string]$Pattern,
        [int]$TimeoutSec = 20
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $xml = Get-UiDump -AdbPath $AdbPath -Serial $Serial
        if ($xml -match $Pattern) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Save-Evidence {
    param(
        [string]$Name,
        [string]$Xml,
        [string]$Logcat,
        [hashtable]$Meta
    )
    $path = Join-Path $EvidenceDir "$Name.txt"
    $lines = (Get-UiTextsFromXml -Xml $Xml) -join "`n"
    @(
        "=== $Name ===",
        ($Meta.GetEnumerator() | ForEach-Object { "$($_.Key): $($_.Value)" }),
        '',
        '--- UI texts (sample) ---',
        $lines,
        '',
        '--- logcat (RN tail) ---',
        $Logcat
    ) | Set-Content -Path $path -Encoding UTF8
}

function Invoke-Step {
    param(
        [string]$AdbPath,
        [string]$Serial,
        [int[]]$ScenarioIds,
        [string]$Name,
        [string]$Button,
        [scriptblock]$Assert,
        [int]$WaitSec = 2
    )

    Write-Host "`n== $Name (scenarios $($ScenarioIds -join ',')) =="
    $tap = Tap-Button -AdbPath $AdbPath -Serial $Serial -Label $Button
    if (-not $tap.Found) {
        return [pscustomobject]@{ Scenarios = $ScenarioIds; Name = $Name; Pass = $false; Evidence = "Button not found: $Button"; Source = 'uiautomator' }
    }
    Start-Sleep -Seconds $WaitSec
    Scroll-ToTop -AdbPath $AdbPath -Serial $Serial
    Start-Sleep -Milliseconds 300
    $xml = Get-UiDump -AdbPath $AdbPath -Serial $Serial
    Scroll-ToLogSection -AdbPath $AdbPath -Serial $Serial
    $xmlLog = Get-UiDump -AdbPath $AdbPath -Serial $Serial
    if ($xmlLog.Length -gt $xml.Length) { $xml = $xmlLog }
    $logcat = Get-DeviceValidationLogcatTail -AdbPath $AdbPath -Serial $Serial
    $ctx = New-DeviceValidationContext -Xml $xml -Logcat $logcat
    try {
        $result = & $Assert $ctx
        Save-Evidence -Name ($Name -replace '[^\w\-]', '_') -Xml $xml -Logcat $logcat -Meta @{
            button = $Button
            result = $result.Message
            source = $result.Source
        }
        $pass = [bool]$result.Pass
        Write-Host "  $(if ($pass) { 'PASS' } else { 'FAIL' }) [$($result.Source)]: $($result.Message)"
        return [pscustomobject]@{
            Scenarios = $ScenarioIds
            Name      = $Name
            Pass      = $pass
            Evidence  = $result.Message
            Source    = $result.Source
        }
    } catch {
        return [pscustomobject]@{ Scenarios = $ScenarioIds; Name = $Name; Pass = $false; Evidence = $_.Exception.Message; Source = 'error' }
    }
}

function New-StepResult {
    param([bool]$Pass, [string]$Message, [string]$Source)
    return @{ Pass = $Pass; Message = $Message; Source = $Source }
}

$adbPath = Find-AdbPath
$serial = Get-DeviceSerial -AdbPath $adbPath -Preferred $Serial
Write-Host "Device: $serial"
Write-Host "Evidence: $EvidenceDir"

Invoke-AdbShell -AdbPath $adbPath -Serial $serial -ShellArgs @('reverse', 'tcp:8081', 'tcp:8081') | Out-Null
try {
    $metro = Invoke-RestMethod http://127.0.0.1:8081/status -TimeoutSec 5
    if ($metro -ne 'packager-status:running') { throw 'Metro not running' }
} catch {
    throw "Metro unavailable: $($_.Exception.Message). Start with .\scripts\dev-android-wireless.ps1"
}

Invoke-AdbShell -AdbPath $adbPath -Serial $serial -ShellArgs @('shell', 'am', 'force-stop', $AppPackage) | Out-Null
Start-Sleep 1
Invoke-AdbShell -AdbPath $adbPath -Serial $serial -ShellArgs @('logcat', '-c') | Out-Null
Invoke-AdbShell -AdbPath $adbPath -Serial $serial -ShellArgs @('shell', 'am', 'start', '-n', $AppComponent) | Out-Null

if (-not (Wait-UiContains -AdbPath $adbPath -Serial $serial -Pattern 'NON-PRODUCTION' -TimeoutSec 30)) {
    throw 'Validation UI did not load (banner not found)'
}

$null = Tap-Button -AdbPath $adbPath -Serial $serial -Label 'Clear prototype data'
Start-Sleep -Seconds 2
$null = Tap-Button -AdbPath $adbPath -Serial $serial -Label 'Refresh stats'
Start-Sleep -Seconds 1

$results = @()

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(24) -Name 'Clear prototype data (baseline)' -Button 'Clear prototype data' -WaitSec 3 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '0') -Message "pendingCount=$pending after clear" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(2) -Name 'Empty-buffer fetch' -Button 'Fetch without acknowledging' -WaitSec 2 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch without ack: fetched 0'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: Fetch without ack: fetched 0' } else { 'No fetched 0 in logcat corpus' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(3) -Name 'Generate 1 event' -Button 'Generate 1 synthetic event' -WaitSec 3 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '1') -Message "pendingCount=$pending" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(5) -Name 'Contract header' -Button 'Verify contract header' -WaitSec 1 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Contract verify PASS'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: Contract verify PASS' } else { 'Contract verify PASS not in logcat' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(4,6) -Name 'Fetch and ack one' -Button 'Fetch pending + ack all' -WaitSec 2 -Assert {
    param($ctx)
    $logPass = (Test-DeviceLogMatch -Context $ctx -Pattern 'Auto-ack all fetched: ack=1|Fetch \+ ack \(full\): fetched 1') -or
        ((Get-DeviceStat -Context $ctx -Key 'acknowledgedCount') -eq '1')
    New-StepResult -Pass $logPass -Message $(if ($logPass) { 'log/stats: ack=1 for single event' } else { 'ack=1 not found' }) -Source 'logcat+stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(7) -Name 'Pending zero after ack' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '0') -Message "pendingCount=$pending" -Source 'stats'
}

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(8) -Name 'Clear before ten-event' -Button 'Clear prototype data' -WaitSec 2 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '0') -Message "pendingCount=$pending" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(8) -Name 'Generate exactly 10' -Button 'Generate exactly 10 events' -WaitSec 2 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '10') -Message "pendingCount=$pending" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(9) -Name 'Ordered fetch ten' -Button 'Fetch without acknowledging' -WaitSec 2 -Assert {
    param($ctx)
    $logPass = Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch without ack: fetched 10.*seq=\[1'
    $uiPass = Test-DeviceUiMatch -Context $ctx -Pattern 'Last fetch cached: 10 events'
    $pass = $logPass -or $uiPass
    New-StepResult -Pass $pass -Message $(if ($logPass) { 'log: fetched 10 ordered seq' } elseif ($uiPass) { 'UI: Last fetch cached: 10 events' } else { 'Ordered fetch evidence missing' }) -Source $(if ($logPass) { 'logcat' } elseif ($uiPass) { 'uiautomator' } else { 'logcat+uiautomator' })
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(10) -Name 'Ack first 5' -Button 'Acknowledge first 5 only' -WaitSec 2 -Assert {
    param($ctx)
    $logPass = Test-DeviceLogMatch -Context $ctx -Pattern 'Ack first 5.*ack=5'
    $statPass = (Get-DeviceStat -Context $ctx -Key 'acknowledgedCount') -eq '5'
    $pass = $logPass -or $statPass
    New-StepResult -Pass $pass -Message $(if ($logPass) { 'log: Ack first 5: ack=5' } elseif ($statPass) { 'stats: acknowledgedCount=5' } else { 'ack=5 not found' }) -Source $(if ($logPass) { 'logcat' } else { 'stats' })
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(11) -Name 'Five remain pending' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
    $cached = Test-DeviceUiMatch -Context $ctx -Pattern 'Last fetch cached: 10 events'
    $pass = ($ack -eq '5') -and $cached
    New-StepResult -Pass $pass -Message "acknowledgedCount=$ack; cached10=$cached" -Source 'stats+uiautomator'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(12) -Name 'Ack remaining 5' -Button 'Acknowledge remaining 5' -WaitSec 2 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Ack remaining 5.*ack=5'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: Ack remaining 5: ack=5' } else { 'remaining ack=5 not in logcat' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(12) -Name 'All ten acked' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
    New-StepResult -Pass ($pending -eq '0' -and $ack -eq '10') -Message "pendingCount=$pending acknowledgedCount=$ack" -Source 'stats'
}

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(13) -Name 'Clear before observation test' -Button 'Clear prototype data' -WaitSec 2 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '0') -Message "pendingCount=$pending after clear" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(13) -Name 'Stop push observation' -Button 'Stop push observation' -WaitSec 1 -Assert {
    param($ctx)
    $pass = (Test-DeviceUiMatch -Context $ctx -Pattern 'Push observation:\s*stopped') -or
        (Test-DeviceLogMatch -Context $ctx -Pattern 'Push observation: STOPPED|Push observation: stopped')
    New-StepResult -Pass $pass -Message $(if ($pass) { 'observation stopped' } else { 'stop not logged' }) -Source 'uiautomator+logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(13) -Name 'Generate 10 while stopped' -Button 'Generate exactly 10 events' -WaitSec 2 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    New-StepResult -Pass ($pending -eq '10') -Message "pendingCount=$pending with observation stopped" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(14) -Name 'Restart push observation' -Button 'Restart push observation' -WaitSec 1 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Push observation: ACTIVE'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: Push observation: ACTIVE' } else { 'restart not in logcat' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(15) -Name 'Pull without push' -Button 'Fetch without acknowledging' -WaitSec 2 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch without ack: fetched 10'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: fetched 10 after restart' } else { 'pull 10 not in logcat' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(16) -Name 'Simulate JS restart' -Button 'Simulate JS restart' -WaitSec 1 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'JS handler state cleared'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: JS handler state cleared' } else { 'JS restart log missing' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(17) -Name 'Replay unacknowledged' -Button 'Replay unacknowledged (pull again)' -WaitSec 2 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Replay pull:|Replay: pull returned'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'log: replay confirmed' } else { 'replay log missing' }) -Source 'logcat'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(17) -Name 'Complete replay ack' -Button 'Acknowledge first 5 only' -WaitSec 2 -Assert {
    param($ctx)
    $pass = Test-DeviceLogMatch -Context $ctx -Pattern 'Ack first 5.*ack=5' -or (Get-DeviceStat -Context $ctx -Key 'acknowledgedCount') -eq '5'
    New-StepResult -Pass $pass -Message $(if ($pass) { 'partial ack after replay' } else { 'partial ack step not confirmed' }) -Source 'logcat+stats'
}
$null = Tap-Button -AdbPath $adbPath -Serial $serial -Label 'Acknowledge remaining 5'
Start-Sleep -Seconds 2

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(18) -Name 'Duplicate insertion' -Button 'Simulate duplicate insertion' -WaitSec 2 -Assert {
    param($ctx)
    $logPass = Test-DeviceLogMatch -Context $ctx -Pattern 'Duplicate simulation: rejected=true'
    $statPass = [int](Get-DeviceStat -Context $ctx -Key 'duplicateRejectedCount') -ge 1
    $pass = $logPass -or $statPass
    New-StepResult -Pass $pass -Message $(if ($logPass) { 'log: duplicate rejected=true' } else { "stats: duplicateRejectedCount=$(Get-DeviceStat -Context $ctx -Key 'duplicateRejectedCount')" }) -Source $(if ($logPass) { 'logcat' } else { 'stats' })
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(19) -Name 'Duplicate counter' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $dup = Get-DeviceStat -Context $ctx -Key 'duplicateRejectedCount'
    New-StepResult -Pass ([int]$dup -ge 1) -Message "duplicateRejectedCount=$dup" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(20) -Name 'Unsupported schema' -Button 'Simulate unsupported schema event' -WaitSec 2 -Assert {
    param($ctx)
    $logPass = Test-DeviceLogMatch -Context $ctx -Pattern 'Unsupported schema: rejected=true'
    $statPass = [int](Get-DeviceStat -Context $ctx -Key 'rejectedCount') -ge 1
    $pass = $logPass -or $statPass
    New-StepResult -Pass $pass -Message $(if ($logPass) { 'log: schema rejected=true' } else { "stats: rejectedCount=$(Get-DeviceStat -Context $ctx -Key 'rejectedCount')" }) -Source $(if ($logPass) { 'logcat' } else { 'stats' })
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(21) -Name 'Rejected not acked' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $rej = Get-DeviceStat -Context $ctx -Key 'rejectedCount'
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    $pass = ([int]$rej -ge 1) -and ([int]$pending -ge 1)
    New-StepResult -Pass $pass -Message "rejectedCount=$rej pendingCount=$pending" -Source 'stats'
}

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(22,23) -Name 'Export diagnostics + privacy' -Button 'Export sanitized diagnostics' -WaitSec 3 -Assert {
    param($ctx)
    $export = (Test-DeviceLogMatch -Context $ctx -Pattern 'Diagnostics exported') -or (Test-DeviceUiMatch -Context $ctx -Pattern 'Diagnostics exported')
    $privacy = Test-DeviceUiMatch -Context $ctx -Pattern 'Coordinate privacy check:\s*PASS'
    $noCoords = -not ($ctx.FullCorpus -match 'latitude|longitude|"lat"|"lng"')
    $pass = $export -and $privacy -and $noCoords
    New-StepResult -Pass $pass -Message "export=$export privacy=$privacy noCoords=$noCoords" -Source 'uiautomator+logcat'
}

$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(24) -Name 'Final clear data' -Button 'Clear prototype data' -WaitSec 2 -Assert {
    param($ctx)
    $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
    $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
    New-StepResult -Pass ($pending -eq '0' -and $ack -eq '0') -Message "pendingCount=$pending acknowledgedCount=$ack" -Source 'stats'
}
$results += Invoke-Step -AdbPath $adbPath -Serial $serial -ScenarioIds @(1) -Name 'Final refresh stats' -Button 'Refresh stats' -WaitSec 1 -Assert {
    param($ctx)
    $conn = Test-DeviceUiMatch -Context $ctx -Pattern 'Connection:\s*connected'
    New-StepResult -Pass $conn -Message "connection connected=$conn" -Source 'uiautomator'
}

$stepSummaryPath = Join-Path $EvidenceDir 'summary.json'
$results | ConvertTo-Json -Depth 4 | Set-Content $stepSummaryPath -Encoding UTF8
$results | Format-Table Name, Pass, Source, Evidence -AutoSize

$scenarioResults = Invoke-DeviceScenarioEvaluation -EvidenceDir $EvidenceDir
$validationSummaryPath = Write-DeviceValidationSummary -EvidenceDir $EvidenceDir -ScenarioResults $scenarioResults -RunMode 'live-device'

Write-Host "`n--- Step automation (informational) ---"
$stepFailed = @($results | Where-Object { -not $_.Pass })
Write-Host "Steps: $($results.Count)  Passed: $($results.Count - $stepFailed.Count)  Failed: $($stepFailed.Count)"

Write-Host "`n--- Scenario validation (authoritative) ---"
$scenarioResults | Sort-Object scenario | Format-Table scenario, status, evidenceSource, observedResult -AutoSize
$scenarioFailed = @($scenarioResults | Where-Object { $_.status -ne 'pass' })
Write-Host "Scenarios: $($scenarioResults.Count)  Passed: $($scenarioResults.Count - $scenarioFailed.Count)  Failed: $($scenarioFailed.Count)"
Write-Host "Evidence dir: $EvidenceDir"
Write-Host "validation-summary.json: $validationSummaryPath"

exit $(if ($scenarioFailed.Count -eq 0) { 0 } else { 1 })
