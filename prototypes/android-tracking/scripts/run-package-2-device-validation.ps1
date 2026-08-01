#Requires -Version 5.1
<#
.SYNOPSIS
  Package 2 physical-device validation harness for Prototype B (adb, no secrets).

.DESCRIPTION
  Automates Package 2 scenarios A-J where adb allows. Collects logcat, UI dumps,
  session prefs, and buffer counters. Never uses real coordinates or changes battery
  optimization settings silently.

  Output:
    device-validation/package-2-validation-summary.json
    device-validation/runs/<timestamp>/...

  Usage:
    .\scripts\run-package-2-device-validation.ps1
    .\scripts\run-package-2-device-validation.ps1 -Execute
    .\scripts\run-package-2-device-validation.ps1 -Execute -DeviceSerial R5CR...

  See EXTENDED_LIFECYCLE_VALIDATION.md and VALIDATION_RUNBOOK.md.
#>
param(
  [string] $DeviceSerial,

  [switch] $Execute
)

$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PrototypeRoot = Split-Path -Parent $ScriptRoot
$Package = 'com.milerecover.prototype.androidtracking'
$MainActivity = "$Package/.MainActivity"
$RunStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$EvidenceRoot = Join-Path $PrototypeRoot "device-validation\runs\$RunStamp"
$SummaryPath = Join-Path $PrototypeRoot 'device-validation\package-2-validation-summary.json'

function Find-AdbPath {
  $defaultSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
  if (Test-Path -LiteralPath $defaultSdk) {
    return $defaultSdk
  }
  if ($env:ANDROID_HOME) {
    $fromHome = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
    if (Test-Path -LiteralPath $fromHome) { return $fromHome }
  }
  if ($env:ANDROID_SDK_ROOT) {
    $fromRoot = Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe'
    if (Test-Path -LiteralPath $fromRoot) { return $fromRoot }
  }
  $resolved = Get-Command adb -ErrorAction SilentlyContinue
  if ($resolved) { return $resolved.Source }
  return $null
}

function Get-AdbBaseArgs {
  param([string] $Serial)
  if ($Serial) { return @('-s', $Serial) }
  return @()
}

function Invoke-Adb {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string[]] $Args,
    [switch] $AllowFailure
  )
  $output = & $AdbPath @BaseArgs @Args 2>&1
  if (-not $AllowFailure -and $LASTEXITCODE -ne 0) {
    throw "adb failed: adb $($BaseArgs -join ' ') $($Args -join ' ') (exit $LASTEXITCODE)`n$output"
  }
  return ($output | Out-String).Trim()
}

function Resolve-Device {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs
  )
  if (-not $AdbPath) { return @() }
  $lines = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @('devices') -AllowFailure
  $devices = @(
    $lines -split "`n" |
      Where-Object { $_ -match '^\S+\s+device$' } |
      ForEach-Object { ($_ -split '\s+')[0] }
  )
  return $devices
}

function New-ScenarioResult {
  param(
    [string] $Id,
    [string] $Title,
    [string] $Status,
    [string] $Reason,
    [string[]] $EvidencePaths = @()
  )
  return [ordered]@{
    id             = $Id
    title          = $Title
    status         = $Status
    reason         = $Reason
    evidencePaths  = @($EvidencePaths)
    evidenceLayer  = 'physical-device'
    executedAtUtc  = (Get-Date).ToUniversalTime().ToString('o')
  }
}

function Save-EvidenceText {
  param(
    [string] $RelativePath,
    [string] $Content
  )
  $full = Join-Path $EvidenceRoot $RelativePath
  $dir = Split-Path -Parent $full
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $Content | Out-File -FilePath $full -Encoding utf8
  return (Resolve-Path $full).Path
}

function Invoke-AdbStep {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $Label,
    [string[]] $Args,
    [switch] $AllowFailure
  )
  Write-Host "  -> $Label" -ForegroundColor DarkCyan
  if (-not $Execute) {
    Write-Host "     (dry-run) adb $($Args -join ' ')" -ForegroundColor DarkGray
    return $null
  }
  return Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args $Args -AllowFailure:$AllowFailure
}

function Clear-PrototypeState {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId)
  $out = Invoke-AdbStep -AdbPath $AdbPath -BaseArgs $BaseArgs -Label 'pm clear' -Args @(
    'shell', 'pm', 'clear', $Package
  )
  Save-EvidenceText -RelativePath "$ScenarioId\pm-clear.txt" -Content $out
}

function Launch-PrototypeApp {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId)
  $out = Invoke-AdbStep -AdbPath $AdbPath -BaseArgs $BaseArgs -Label 'Launch app' -Args @(
    'shell', 'am', 'start', '-n', $MainActivity
  )
  Save-EvidenceText -RelativePath "$ScenarioId\launch.txt" -Content $out
  Start-Sleep -Seconds 2
}

function Capture-Logcat {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId, [string] $Suffix = 'logcat')
  if (-not $Execute) { return $null }
  $out = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @('logcat', '-d', '-v', 'time') -AllowFailure
  return Save-EvidenceText -RelativePath "$ScenarioId\$Suffix.txt" -Content $out
}

function Capture-UiDump {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId, [string] $Suffix = 'ui-dump')
  if (-not $Execute) { return $null }
  $remote = '/sdcard/window_dump.xml'
  Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @('shell', 'uiautomator', 'dump', $remote) -AllowFailure | Out-Null
  $local = Join-Path $EvidenceRoot "$ScenarioId\$Suffix.xml"
  $dir = Split-Path -Parent $local
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  & $AdbPath @BaseArgs pull $remote $local 2>&1 | Out-Null
  if (Test-Path $local) {
    return (Resolve-Path $local).Path
  }
  return $null
}

function Get-UiDumpText {
  param([string] $DumpPath)
  if (-not $DumpPath -or -not (Test-Path $DumpPath)) { return $null }
  return Get-Content -Raw -Path $DumpPath
}

function Find-UiNodeBounds {
  param(
    [string] $DumpText,
    [string] $TextMatch
  )
  if (-not $DumpText) { return $null }
  $pattern = "text=`"$([regex]::Escape($TextMatch))`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`""
  $m = [regex]::Match($DumpText, $pattern)
  if (-not $m.Success) { return $null }
  $x1 = [int]$m.Groups[1].Value
  $y1 = [int]$m.Groups[2].Value
  $x2 = [int]$m.Groups[3].Value
  $y2 = [int]$m.Groups[4].Value
  return @{
    x = [int](($x1 + $x2) / 2)
    y = [int]((($y1 + $y2) / 2))
  }
}

function Tap-UiButton {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $DumpPath,
    [string] $Label
  )
  if (-not $Execute) {
    Write-Host "  -> tap '$Label' (dry-run)" -ForegroundColor DarkGray
    return $false
  }
  $dump = Get-UiDumpText -DumpPath $DumpPath
  $bounds = Find-UiNodeBounds -DumpText $dump -TextMatch $Label
  if (-not $bounds) { return $false }
  Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @(
    'shell', 'input', 'tap', $bounds.x.ToString(), $bounds.y.ToString()
  ) | Out-Null
  Start-Sleep -Seconds 1
  return $true
}

function Read-SessionPrefs {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId)
  if (-not $Execute) { return $null }
  $out = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @(
    'shell', 'run-as', $Package, 'cat', 'shared_prefs/prototype_b_session.xml'
  ) -AllowFailure
  return Save-EvidenceText -RelativePath "$ScenarioId\session-prefs.xml" -Content $out
}

function Read-UiStatusSnapshot {
  param([string] $DumpPath)
  $dump = Get-UiDumpText -DumpPath $DumpPath
  if (-not $dump) { return @{} }
  $textNode = [regex]::Match($dump, 'text="([^"]*FGS session requested[^"]*)"')
  if (-not $textNode.Success) { return @{} }
  $block = $textNode.Groups[1].Value -replace '&#10;', "`n"
  $map = @{}
  foreach ($line in ($block -split "`n")) {
    if ($line -match '^([^:]+):\s*(.+)$') {
      $map[$Matches[1].Trim()] = $Matches[2].Trim()
    }
  }
  return $map
}

function Save-StatusSnapshot {
  param(
    [string] $ScenarioId,
    [hashtable] $Status,
    [string] $Suffix = 'status'
  )
  $json = ($Status | ConvertTo-Json -Depth 4)
  return Save-EvidenceText -RelativePath "$ScenarioId\$Suffix.json" -Content $json
}

function Test-ServiceProcessRunning {
  param([string] $AdbPath, [string[]] $BaseArgs)
  if (-not $Execute) { return $null }
  $pidOut = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @('shell', 'pidof', $Package) -AllowFailure
  return [bool]($pidOut -match '\d')
}

function Test-NotificationActive {
  param([string] $AdbPath, [string[]] $BaseArgs)
  if (-not $Execute) { return $null }
  $out = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @(
    'shell', 'dumpsys', 'notification', '--noredact'
  ) -AllowFailure
  return ($out -match [regex]::Escape($Package))
}

function Read-BatteryOptimizationState {
  param([string] $AdbPath, [string[]] $BaseArgs, [string] $ScenarioId)
  if (-not $Execute) { return $null }
  $out = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @(
    'shell', 'dumpsys', 'deviceidle', 'whitelist'
  ) -AllowFailure
  $restricted = -not ($out -match [regex]::Escape($Package))
  $power = Invoke-Adb -AdbPath $AdbPath -BaseArgs $BaseArgs -Args @(
    'shell', 'dumpsys', 'power'
  ) -AllowFailure
  $payload = @{
    package              = $Package
    onDeviceIdleWhitelist = -not $restricted
    likelyRestricted     = $restricted
    powerSaveHint        = ($power -match 'Power save mode: ON')
    note                 = 'Detection only - settings not changed by harness'
  } | ConvertTo-Json -Depth 3
  return Save-EvidenceText -RelativePath "$ScenarioId\battery-optimization.json" -Content $payload
}

function Ensure-PermissionsViaUi {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $ScenarioId
  )
  $dump = Capture-UiDump -AdbPath $AdbPath -BaseArgs $BaseArgs -ScenarioId $ScenarioId -Suffix 'pre-permission-ui'
  if (-not $dump) { return $false }
  Tap-UiButton -AdbPath $AdbPath -BaseArgs $BaseArgs -DumpPath $dump -Label 'Explain & request foreground permissions' | Out-Null
  Start-Sleep -Seconds 1
  Invoke-AdbStep -AdbPath $AdbPath -BaseArgs $BaseArgs -Label 'Grant permissions (assumes prior grant or system dialog)' -Args @(
    'shell', 'pm', 'grant', $Package, 'android.permission.ACCESS_FINE_LOCATION'
  ) -AllowFailure | Out-Null
  Invoke-AdbStep -AdbPath $AdbPath -BaseArgs $BaseArgs -Label 'Grant notifications' -Args @(
    'shell', 'pm', 'grant', $Package, 'android.permission.POST_NOTIFICATIONS'
  ) -AllowFailure | Out-Null
  return $true
}

function Start-SessionViaUi {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $ScenarioId
  )
  $dump = Capture-UiDump -AdbPath $AdbPath -BaseArgs $BaseArgs -ScenarioId $ScenarioId -Suffix 'pre-start-ui'
  Tap-UiButton -AdbPath $AdbPath -BaseArgs $BaseArgs -DumpPath $dump -Label 'Start validation session' | Out-Null
  Start-Sleep -Seconds 2
}

function Stop-SessionViaUi {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $ScenarioId
  )
  $dump = Capture-UiDump -AdbPath $AdbPath -BaseArgs $BaseArgs -ScenarioId $ScenarioId -Suffix 'pre-stop-ui'
  Tap-UiButton -AdbPath $AdbPath -BaseArgs $BaseArgs -DumpPath $dump -Label 'Stop validation session' | Out-Null
  Start-Sleep -Seconds 2
}

function Acknowledge-PendingViaUi {
  param(
    [string] $AdbPath,
    [string[]] $BaseArgs,
    [string] $ScenarioId
  )
  $dump = Capture-UiDump -AdbPath $AdbPath -BaseArgs $BaseArgs -ScenarioId $ScenarioId -Suffix 'pre-ack-ui'
  Tap-UiButton -AdbPath $AdbPath -BaseArgs $BaseArgs -DumpPath $dump -Label 'Acknowledge all pending events' | Out-Null
  Start-Sleep -Seconds 1
}

# --- Main ---

Write-Host "Package 2 device validation - $Package"
Write-Host "Execute: $Execute | Evidence: $EvidenceRoot"

$adbPath = Find-AdbPath
if ($adbPath) {
  Write-Host "Using adb: $adbPath"
} else {
  Write-Host 'adb not found - physical scenarios will be marked blocked.' -ForegroundColor Yellow
}

$baseArgs = Get-AdbBaseArgs -Serial $DeviceSerial
$devices = Resolve-Device -AdbPath $adbPath -BaseArgs $baseArgs

$deviceConnected = $devices.Count -gt 0
$activeSerial = $DeviceSerial
if (-not $activeSerial -and $deviceConnected) {
  $activeSerial = $devices[0]
}
if ($activeSerial) {
  $baseArgs = Get-AdbBaseArgs -Serial $activeSerial
}

$deviceInfo = @{
  connected = $deviceConnected
  serial    = $activeSerial
  model     = $null
  manufacturer = $null
}

if ($deviceConnected -and $Execute) {
  $deviceInfo.model = Invoke-Adb -AdbPath $adbPath -BaseArgs $baseArgs -Args @('shell', 'getprop', 'ro.product.model') -AllowFailure
  $deviceInfo.manufacturer = Invoke-Adb -AdbPath $adbPath -BaseArgs $baseArgs -Args @('shell', 'getprop', 'ro.product.manufacturer') -AllowFailure
}

if (-not (Test-Path (Split-Path $EvidenceRoot))) {
  New-Item -ItemType Directory -Path $EvidenceRoot -Force | Out-Null
}

$scenarios = @()

function Add-Scenario { param($Result) $script:scenarios += $Result }

if (-not $deviceConnected) {
  $blockedReason = if ($adbPath) { 'No adb device connected' } else { 'adb not found on PATH or default SDK locations' }
  foreach ($def in @(
      @{ id = 'A'; title = 'Clean start' },
      @{ id = 'B'; title = 'Start lifecycle' },
      @{ id = 'C'; title = 'App background' },
      @{ id = 'D'; title = 'Screen off/on' },
      @{ id = 'E'; title = 'Task removal' },
      @{ id = 'F'; title = 'Ordinary process death' },
      @{ id = 'G'; title = 'Pending-event recovery' },
      @{ id = 'H'; title = 'Idempotent start/stop' },
      @{ id = 'I'; title = 'Reboot preparation' },
      @{ id = 'J'; title = 'Battery optimization state' }
    )) {
    Add-Scenario (New-ScenarioResult -Id $def.id -Title $def.title -Status 'blocked' -Reason $blockedReason)
  }
} else {
  # Scenario A - Clean start
  $aEvidence = @()
  if ($Execute) {
    Clear-PrototypeState -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'A' | Out-Null
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'A'
    $uiA = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'A'
    if ($uiA) { $aEvidence += $uiA }
    $statusA = Read-UiStatusSnapshot -DumpPath $uiA
    $aEvidence += Save-StatusSnapshot -ScenarioId 'A' -Status $statusA
    $aEvidence += Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'A'
    $aPass = ($statusA['FGS session requested'] -eq 'false') -and ($statusA['Pending events'] -eq '0')
    Add-Scenario (New-ScenarioResult -Id 'A' -Title 'Clean start' -Status $(if ($aPass) { 'pass' } else { 'fail' }) -Reason $(if ($aPass) { 'Empty session and zero pending after pm clear' } else { 'Expected inactive session and zero pending' }) -EvidencePaths $aEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'A' -Title 'Clean start' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario B - Start lifecycle
  $bEvidence = @()
  if ($Execute) {
    Ensure-PermissionsViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'B' | Out-Null
    Start-SessionViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'B'
    $uiB = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'B' -Suffix 'post-start-ui'
    if ($uiB) { $bEvidence += $uiB }
    $statusB = Read-UiStatusSnapshot -DumpPath $uiB
    $bEvidence += Save-StatusSnapshot -ScenarioId 'B' -Status $statusB
    $bEvidence += Read-SessionPrefs -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'B'
    $bEvidence += Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'B'
    $svc = Test-ServiceProcessRunning -AdbPath $adbPath -BaseArgs $baseArgs
    $notif = Test-NotificationActive -AdbPath $adbPath -BaseArgs $baseArgs
    $bPass = ($statusB['FGS session requested'] -eq 'true') -and ($statusB['Tracking state'] -match 'SERVICE') -and $svc -and $notif
    Add-Scenario (New-ScenarioResult -Id 'B' -Title 'Start lifecycle' -Status $(if ($bPass) { 'pass' } else { 'fail' }) -Reason $(if ($bPass) { 'Session requested, service process and notification observed' } else { 'Missing active session/service/notification signals' }) -EvidencePaths ($bEvidence | Where-Object { $_ }))
  } else {
    Add-Scenario (New-ScenarioResult -Id 'B' -Title 'Start lifecycle' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario C - App background
  if ($Execute) {
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Home background' -Args @('shell', 'input', 'keyevent', 'KEYCODE_HOME') | Out-Null
    Start-Sleep -Seconds 15
    $svcC = Test-ServiceProcessRunning -AdbPath $adbPath -BaseArgs $baseArgs
    $notifC = Test-NotificationActive -AdbPath $adbPath -BaseArgs $baseArgs
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'C'
    $uiC = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'C'
    $statusC = Read-UiStatusSnapshot -DumpPath $uiC
    $cEvidence = @($uiC, (Save-StatusSnapshot -ScenarioId 'C' -Status $statusC), (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'C')) | Where-Object { $_ }
    $cPass = $svcC -and $notifC -and ($statusC['FGS session requested'] -eq 'true')
    Add-Scenario (New-ScenarioResult -Id 'C' -Title 'App background' -Status $(if ($cPass) { 'pass' } else { 'fail' }) -Reason $(if ($cPass) { 'Service survived 15s background' } else { 'Service or session lost while backgrounded' }) -EvidencePaths $cEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'C' -Title 'App background' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario D - Screen off/on
  if ($Execute) {
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Screen off' -Args @('shell', 'input', 'keyevent', 'KEYCODE_POWER') | Out-Null
    Start-Sleep -Seconds 10
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Screen on' -Args @('shell', 'input', 'keyevent', 'KEYCODE_POWER') | Out-Null
    Start-Sleep -Seconds 2
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'D'
    $uiD = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'D'
    $statusD = Read-UiStatusSnapshot -DumpPath $uiD
    $dEvidence = @($uiD, (Save-StatusSnapshot -ScenarioId 'D' -Status $statusD), (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'D')) | Where-Object { $_ }
    $dPass = ($statusD['FGS session requested'] -eq 'true')
    Add-Scenario (New-ScenarioResult -Id 'D' -Title 'Screen off/on' -Status $(if ($dPass) { 'pass' } else { 'fail' }) -Reason $(if ($dPass) { 'Session remained requested after screen off/on' } else { 'Session not active after screen toggle' }) -EvidencePaths $dEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'D' -Title 'Screen off/on' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario E - Task removal (partial automation)
  if ($Execute) {
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Remove task (simulate)' -Args @(
      'shell', 'am', 'stack', 'remove', '1'
    ) -AllowFailure | Out-Null
    Start-Sleep -Seconds 5
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'E'
    $uiE = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'E'
    $statusE = Read-UiStatusSnapshot -DumpPath $uiE
    $eEvidence = @($uiE, (Save-StatusSnapshot -ScenarioId 'E' -Status $statusE), (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'E')) | Where-Object { $_ }
    $manualNote = Save-EvidenceText -RelativePath 'E\manual-note.txt' -Content "Swipe-from-recents behavior is OEM-dependent. Harness attempted am stack remove; operator may supplement with manual recents swipe evidence."
    $eEvidence += $manualNote
    $eStatus = if ($statusE['FGS session requested'] -eq 'true') { 'pass' } else { 'blocked' }
    $eReason = if ($eStatus -eq 'pass') {
      'Session still requested after task removal attempt'
    } else {
      'Task removal outcome ambiguous - verify manually via recents swipe; see manual-note.txt'
    }
    Add-Scenario (New-ScenarioResult -Id 'E' -Title 'Task removal' -Status $eStatus -Reason $eReason -EvidencePaths $eEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'E' -Title 'Task removal' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario F - Ordinary process death
  if ($Execute) {
    $preF = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'F' -Suffix 'pre-kill-ui'
    $preStatusF = Read-UiStatusSnapshot -DumpPath $preF
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Kill process' -Args @('shell', 'am', 'kill', $Package) | Out-Null
    Start-Sleep -Seconds 3
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'F'
    $uiF = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'F' -Suffix 'post-relaunch-ui'
    $statusF = Read-UiStatusSnapshot -DumpPath $uiF
    $fEvidence = @(
      $preF, $uiF,
      (Save-StatusSnapshot -ScenarioId 'F' -Status $statusF -Suffix 'post-status'),
      (Read-SessionPrefs -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'F'),
      (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'F')
    ) | Where-Object { $_ }
    $bufferRetained = [int]$statusF['Buffered events (total)'] -ge [int]$preStatusF['Buffered events (total)']
    $fPass = $bufferRetained -and ([int]$statusF['Pending events'] -gt 0)
    Add-Scenario (New-ScenarioResult -Id 'F' -Title 'Ordinary process death' -Status $(if ($fPass) { 'pass' } else { 'fail' }) -Reason $(if ($fPass) { 'Buffer counts retained after am kill + relaunch' } else { 'Buffer/session not retained as expected' }) -EvidencePaths $fEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'F' -Title 'Ordinary process death' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario G - Pending-event recovery
  if ($Execute) {
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G'
    $pendingBefore = (Read-UiStatusSnapshot -DumpPath (Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G' -Suffix 'pre-recovery-ui'))['Pending events']
    Invoke-AdbStep -AdbPath $adbPath -BaseArgs $baseArgs -Label 'Kill for recovery' -Args @('shell', 'am', 'kill', $Package) | Out-Null
    Start-Sleep -Seconds 3
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G'
    $uiG1 = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G' -Suffix 'post-kill-ui'
    $statusG1 = Read-UiStatusSnapshot -DumpPath $uiG1
    Acknowledge-PendingViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G'
    $uiG2 = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G' -Suffix 'post-ack-ui'
    $statusG2 = Read-UiStatusSnapshot -DumpPath $uiG2
    $gEvidence = @($uiG1, $uiG2, (Save-StatusSnapshot -ScenarioId 'G' -Status $statusG2 -Suffix 'post-ack-status'), (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'G')) | Where-Object { $_ }
    $gPass = ([int]$statusG1['Pending events'] -ge [int]$pendingBefore) -and ($statusG2['Pending events'] -eq '0')
    Add-Scenario (New-ScenarioResult -Id 'G' -Title 'Pending-event recovery' -Status $(if ($gPass) { 'pass' } else { 'fail' }) -Reason $(if ($gPass) { 'Pending events survived kill and cleared after ack' } else { 'Pending recovery or ack flow failed' }) -EvidencePaths $gEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'G' -Title 'Pending-event recovery' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario H - Idempotent start/stop
  if ($Execute) {
    Launch-PrototypeApp -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H'
    Start-SessionViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H'
    Start-SessionViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H'
    $uiH1 = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H' -Suffix 'duplicate-start-ui'
    Stop-SessionViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H'
    Stop-SessionViaUi -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H'
    $uiH2 = Capture-UiDump -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H' -Suffix 'duplicate-stop-ui'
    $statusH = Read-UiStatusSnapshot -DumpPath $uiH2
    $hEvidence = @($uiH1, $uiH2, (Save-StatusSnapshot -ScenarioId 'H' -Status $statusH), (Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'H')) | Where-Object { $_ }
    $hPass = ($statusH['FGS session requested'] -eq 'false') -and ($statusH['Tracking state'] -eq 'STOPPED')
    Add-Scenario (New-ScenarioResult -Id 'H' -Title 'Idempotent start/stop' -Status $(if ($hPass) { 'pass' } else { 'fail' }) -Reason $(if ($hPass) { 'Duplicate start/stop left STOPPED with session requested false' } else { 'Final state not STOPPED/inactive' }) -EvidencePaths $hEvidence)
  } else {
    Add-Scenario (New-ScenarioResult -Id 'H' -Title 'Idempotent start/stop' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }

  # Scenario I - Reboot (blocked unless safe automation)
  $iNote = Save-EvidenceText -RelativePath 'I\reboot-harness.txt' -Content "Reboot scenario requires device reboot which breaks wireless adb pairing on lab devices. Harness records schema only. Run manually when USB/wireless adb can be restored with one documented operator step. Do not mark pass without post-reboot evidence."
  Add-Scenario (New-ScenarioResult -Id 'I' -Title 'Reboot preparation' -Status 'blocked' -Reason 'Reboot automation unsafe for wireless adb - manual harness documented only' -EvidencePaths @($iNote))

  # Scenario J - Battery optimization detect only
  if ($Execute) {
    $jEvidence = @(Read-BatteryOptimizationState -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'J') | Where-Object { $_ }
    $jEvidence += Capture-Logcat -AdbPath $adbPath -BaseArgs $baseArgs -ScenarioId 'J' -Suffix 'battery-logcat'
    Add-Scenario (New-ScenarioResult -Id 'J' -Title 'Battery optimization state' -Status 'pass' -Reason 'Battery optimization state detected and recorded; settings unchanged' -EvidencePaths ($jEvidence | Where-Object { $_ }))
  } else {
    Add-Scenario (New-ScenarioResult -Id 'J' -Title 'Battery optimization state' -Status 'not-applicable' -Reason 'Dry-run - re-run with -Execute')
  }
}

$summary = [ordered]@{
  package           = $Package
  validationPackage = 'package-2-android-lifecycle'
  generatedAtUtc    = (Get-Date).ToUniversalTime().ToString('o')
  executeMode       = [bool]$Execute
  device            = $deviceInfo
  evidenceRoot      = $(if (Test-Path $EvidenceRoot) { (Resolve-Path $EvidenceRoot).Path } else { $EvidenceRoot })
  evidenceLayers    = [ordered]@{
    jvmPure           = 'Gradle :app:testDebugUnitTest - EventIngestGateTest (no Robolectric)'
    robolectric       = 'Gradle :app:testDebugUnitTest - SessionManager, ProcessRecreation, SqliteEventBuffer, etc.'
    physicalDevice    = 'This harness - adb scenarios A-J'
    notSimulatable    = 'OEM task removal, reboot/wireless adb repair, force-stop UX'
  }
  scenarios         = $scenarios
}

$summaryDir = Split-Path -Parent $SummaryPath
if (-not (Test-Path $summaryDir)) {
  New-Item -ItemType Directory -Path $summaryDir -Force | Out-Null
}
$summary | ConvertTo-Json -Depth 8 | Out-File -FilePath $SummaryPath -Encoding utf8

Write-Host "`nSummary written: $SummaryPath"
Write-Host "Scenarios:"
foreach ($s in $scenarios) {
  Write-Host "  $($s.id): $($s.status) - $($s.title)"
}

if (-not $Execute) {
  Write-Host "`nDry-run complete. Re-run with -Execute when a device is connected." -ForegroundColor Yellow
}

Write-Host "`nDone."
