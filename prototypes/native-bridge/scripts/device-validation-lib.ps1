#Requires -Version 5.1
<#
  Shared Prototype C Android device-validation helpers.
  Evidence sources:
    - uiautomator: visible UI labels/state in XML dump or UI texts section
    - logcat: ReactNativeJS, PrototypeBridge, and AccessibilityNodeInfoDumper text: lines
    - stats: parsed buffer counters (pendingCount, acknowledgedCount, etc.)
#>

function Get-UiTextsFromXml {
    param([string]$Xml)
    if (-not $Xml) { return @() }
    return @([regex]::Matches($Xml, 'text="([^"]*)"') | ForEach-Object { $_.Groups[1].Value })
}

function Get-StatValueFromCorpus {
    param(
        [string]$Corpus,
        [string]$Key
    )
    if (-not $Corpus) { return $null }
    $patterns = @(
        "${Key}:\s*(\d+)",
        "${Key}=\s*(\d+)",
        "text=`"${Key}: (\d+)`"",
        "text=`"$([regex]::Escape($Key)): (\d+)`""
    )
    foreach ($pattern in $patterns) {
        $m = [regex]::Match($Corpus, $pattern)
        if ($m.Success) { return $m.Groups[1].Value }
    }
    return $null
}

function Get-LogLinesFromEvidenceContent {
    param([string]$Content)
    if (-not $Content) { return @() }

    $lines = New-Object System.Collections.Generic.List[string]

    if ($Content -match '(?s)--- logcat \(RN tail\) ---\s*(.*)\z') {
        foreach ($line in ($Matches[1] -split "`n")) {
            $trimmed = $line.TrimEnd("`r")
            if ($trimmed) { $lines.Add($trimmed) | Out-Null }
        }
    }

    foreach ($match in [regex]::Matches($Content, 'text:\s([^;]+);')) {
        $text = $match.Groups[1].Value.Trim()
        if ($text) { $lines.Add($text) | Out-Null }
    }

    foreach ($match in [regex]::Matches($Content, 'ReactNativeJS[^:]*:\s*(.+)')) {
        $lines.Add($match.Groups[1].Value.Trim()) | Out-Null
    }

    return @($lines | Select-Object -Unique)
}

function Get-UiTextsFromEvidenceContent {
    param([string]$Content)
    if (-not $Content) { return @() }
    if ($Content -notmatch '(?s)--- UI texts \(sample\) ---\s*(.*?)\s*--- logcat') {
        return @()
    }
    return @(
        ($Matches[1] -split "`n") |
            ForEach-Object { $_.TrimEnd("`r") } |
            Where-Object { $_ -and $_ -notmatch '^===' }
    )
}

function New-DeviceValidationContext {
    param(
        [string]$Xml = '',
        [string]$Logcat = '',
        [string]$EvidenceContent = ''
    )

    $uiFromXml = (Get-UiTextsFromXml -Xml $Xml) -join "`n"
    $uiFromEvidence = (Get-UiTextsFromEvidenceContent -Content $EvidenceContent) -join "`n"
    $uiCorpus = @($uiFromXml, $uiFromEvidence) -join "`n"

    $logCorpusParts = @($Logcat)
    if ($EvidenceContent) {
        $logCorpusParts += (Get-LogLinesFromEvidenceContent -Content $EvidenceContent) -join "`n"
    }
    $logCorpus = ($logCorpusParts | Where-Object { $_ }) -join "`n"

    $fullCorpus = @($uiCorpus, $logCorpus, $Xml, $EvidenceContent) -join "`n"

    return [pscustomobject]@{
        Xml              = $Xml
        Logcat           = $Logcat
        EvidenceContent  = $EvidenceContent
        UiCorpus         = $uiCorpus
        LogCorpus        = $logCorpus
        FullCorpus       = $fullCorpus
    }
}

function Test-DeviceLogMatch {
    param(
        [Parameter(Mandatory)][pscustomobject]$Context,
        [Parameter(Mandatory)][string]$Pattern
    )
    return ($Context.LogCorpus -match $Pattern)
}

function Test-DeviceUiMatch {
    param(
        [Parameter(Mandatory)][pscustomobject]$Context,
        [Parameter(Mandatory)][string]$Pattern
    )
    return ($Context.UiCorpus -match $Pattern)
}

function Get-DeviceStat {
    param(
        [Parameter(Mandatory)][pscustomobject]$Context,
        [Parameter(Mandatory)][string]$Key
    )
    return Get-StatValueFromCorpus -Corpus $Context.FullCorpus -Key $Key
}

function Read-DeviceEvidenceFile {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
}

function Resolve-DeviceEvidenceBundle {
    param(
        [Parameter(Mandatory)][string]$EvidenceDir,
        [Parameter(Mandatory)][string[]]$RelativePaths
    )

    $usedPaths = New-Object System.Collections.Generic.List[string]
    $mergedContentParts = New-Object System.Collections.Generic.List[string]

    foreach ($relative in $RelativePaths) {
        $candidate = Join-Path $EvidenceDir $relative
        if (Test-Path -LiteralPath $candidate) {
            $content = Read-DeviceEvidenceFile -Path $candidate
            if ($content) {
                $usedPaths.Add($relative) | Out-Null
                $mergedContentParts.Add($content) | Out-Null
            }
        }
    }

    if ($usedPaths.Count -eq 0) {
        return $null
    }

    $mergedContent = $mergedContentParts -join "`n`n--- merged evidence ---`n`n"
    return [pscustomobject]@{
        Path    = ($usedPaths -join ' + ')
        Content = $mergedContent
        Context = New-DeviceValidationContext -EvidenceContent $mergedContent
    }
}

function New-DeviceScenarioResult {
    param(
        [int]$Scenario,
        [string]$Name,
        [string]$Status,
        [string]$Expected,
        [string]$Observed,
        [string]$EvidenceFile,
        [string]$EvidenceSource
    )
    return [ordered]@{
        scenario       = $Scenario
        name           = $Name
        status         = $Status
        expectedResult = $Expected
        observedResult = $Observed
        evidenceFile   = $EvidenceFile
        evidenceSource = $EvidenceSource
    }
}

function Get-DeviceValidationScenarios {
    return @(
        @{
            Id             = 1
            Name           = 'App installs and launches'
            EvidenceFiles  = @('Final_refresh_stats.txt')
            Expected       = 'Validation UI loaded with Connection: connected'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $conn = Test-DeviceUiMatch -Context $ctx -Pattern 'Connection:\s*connected'
                $banner = Test-DeviceUiMatch -Context $ctx -Pattern 'NON-PRODUCTION'
                if ($conn -and $banner) {
                    return @{ Pass = $true; Observed = 'Connection: connected; banner present'; Source = 'uiautomator' }
                }
                return @{ Pass = $false; Observed = 'Missing connection banner or connected state'; Source = 'uiautomator' }
            }
        },
        @{
            Id             = 2
            Name           = 'Empty-buffer fetch'
            EvidenceFiles  = @('Empty-buffer_fetch.txt', 'Five_remain_pending.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Fetch without ack: fetched 0, hasMore=false, seq=[]'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch without ack: fetched 0') {
                    return @{ Pass = $true; Observed = 'log: Fetch without ack: fetched 0'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'No empty-buffer fetch log line'; Source = 'logcat' }
            }
        },
        @{
            Id             = 3
            Name           = 'Generate one synthetic event'
            EvidenceFiles  = @('Generate_1_event.txt')
            Expected       = 'pendingCount=1 after generate'
            Evaluate       = {
                param($bundle)
                $pending = Get-DeviceStat -Context $bundle.Context -Key 'pendingCount'
                if ($pending -eq '1') {
                    return @{ Pass = $true; Observed = "pendingCount=$pending"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending"; Source = 'stats' }
            }
        },
        @{
            Id             = 4
            Name           = 'Fetch pending event'
            EvidenceFiles  = @('Fetch_and_ack_one.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Fetch + ack (full): fetched 1, seq=[1]'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch \+ ack \(full\): fetched 1') {
                    return @{ Pass = $true; Observed = 'log: Fetch + ack (full): fetched 1'; Source = 'logcat' }
                }
                $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
                if ($pending -eq '0' -and (Get-DeviceStat -Context $ctx -Key 'acknowledgedCount') -eq '1') {
                    return @{ Pass = $true; Observed = 'stats: acknowledgedCount=1, pendingCount=0 after fetch+ack'; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = 'No fetched-1 log or post-ack stats'; Source = 'logcat+stats' }
            }
        },
        @{
            Id             = 5
            Name           = 'Verify contract version and sequence'
            EvidenceFiles  = @('Contract_header.txt', 'Fetch_and_ack_one.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Contract verify PASS — API 1.0.0-prototype-c, major 1'
            Evaluate       = {
                param($bundle)
                if (Test-DeviceLogMatch -Context $bundle.Context -Pattern 'Contract verify PASS') {
                    return @{ Pass = $true; Observed = 'log: Contract verify PASS'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'Contract verify PASS not found in log corpus'; Source = 'logcat' }
            }
        },
        @{
            Id             = 6
            Name           = 'Acknowledge one event'
            EvidenceFiles  = @('Fetch_and_ack_one.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Auto-ack all fetched: ack=1'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Auto-ack all fetched: ack=1|ack=1, already=0') {
                    return @{ Pass = $true; Observed = 'log: ack=1'; Source = 'logcat' }
                }
                $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
                if ($ack -eq '1') {
                    return @{ Pass = $true; Observed = "stats: acknowledgedCount=$ack"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "ack=1 not found (acknowledgedCount=$ack)"; Source = 'logcat+stats' }
            }
        },
        @{
            Id             = 7
            Name           = 'Verify pending count becomes zero'
            EvidenceFiles  = @('Pending_zero_after_ack.txt')
            Expected       = 'pendingCount=0 after single-event ack'
            Evaluate       = {
                param($bundle)
                $pending = Get-DeviceStat -Context $bundle.Context -Key 'pendingCount'
                if ($pending -eq '0') {
                    return @{ Pass = $true; Observed = "pendingCount=$pending"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending"; Source = 'stats' }
            }
        },
        @{
            Id             = 8
            Name           = 'Generate ten-event burst'
            EvidenceFiles  = @('Generate_exactly_10.txt')
            Expected       = 'pendingCount=10 after generate exactly 10'
            Evaluate       = {
                param($bundle)
                $pending = Get-DeviceStat -Context $bundle.Context -Key 'pendingCount'
                if ($pending -eq '10') {
                    return @{ Pass = $true; Observed = "pendingCount=$pending"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending"; Source = 'stats' }
            }
        },
        @{
            Id             = 9
            Name           = 'Fetch in ordered batch'
            EvidenceFiles  = @('Ordered_fetch_ten.txt', 'Duplicate_counter.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Fetch without ack: fetched 10, seq=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Fetch without ack: fetched 10.*seq=\[1') {
                    return @{ Pass = $true; Observed = 'log: fetched 10 ordered seq=[1..10]'; Source = 'logcat' }
                }
                if (Test-DeviceUiMatch -Context $ctx -Pattern 'Last fetch cached: 10 events') {
                    return @{ Pass = $true; Observed = 'UI: Last fetch cached: 10 events'; Source = 'uiautomator' }
                }
                return @{ Pass = $false; Observed = 'No ordered fetch-10 evidence'; Source = 'logcat+uiautomator' }
            }
        },
        @{
            Id             = 10
            Name           = 'Partially acknowledge five'
            EvidenceFiles  = @('Ack_first_5.txt', 'Duplicate_counter.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Ack first 5: ack=5'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Ack first 5.*ack=5') {
                    return @{ Pass = $true; Observed = 'log: Ack first 5: ack=5'; Source = 'logcat' }
                }
                $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
                if ($ack -eq '5') {
                    return @{ Pass = $true; Observed = "stats: acknowledgedCount=$ack after first partial ack"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "No ack=5 log (acknowledgedCount=$ack)"; Source = 'logcat+stats' }
            }
        },
        @{
            Id             = 11
            Name           = 'Verify five remain pending'
            EvidenceFiles  = @('Five_remain_pending.txt', 'Ack_first_5.txt')
            Expected       = 'acknowledgedCount=5 with Last fetch cached: 10 events (5 unacked in cache)'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
                $cached = Test-DeviceUiMatch -Context $ctx -Pattern 'Last fetch cached: 10 events'
                if ($ack -eq '5' -and $cached) {
                    return @{ Pass = $true; Observed = "acknowledgedCount=$ack; Last fetch cached: 10 events"; Source = 'stats+uiautomator' }
                }
                return @{ Pass = $false; Observed = "acknowledgedCount=$ack; cached10=$cached"; Source = 'stats+uiautomator' }
            }
        },
        @{
            Id             = 12
            Name           = 'Acknowledge remaining five'
            EvidenceFiles  = @('All_ten_acked.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Ack remaining 5: ack=5; final acknowledgedCount=10, pendingCount=0'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
                $ack = Get-DeviceStat -Context $ctx -Key 'acknowledgedCount'
                $logOk = Test-DeviceLogMatch -Context $ctx -Pattern 'Ack remaining 5.*ack=5'
                if ($pending -eq '0' -and $ack -eq '10') {
                    $observed = "stats: pendingCount=$pending acknowledgedCount=$ack"
                    if ($logOk) { $observed += '; log: Ack remaining 5: ack=5' }
                    return @{ Pass = $true; Observed = $observed; Source = $(if ($logOk) { 'stats+logcat' } else { 'stats' }) }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending acknowledgedCount=$ack logAck=$logOk"; Source = 'stats+logcat' }
            }
        },
        @{
            Id             = 13
            Name           = 'Generate events while JS observation is stopped'
            EvidenceFiles  = @('Generate_10_while_stopped.txt', 'Stop_push_observation.txt')
            Expected       = 'Push observation stopped; pendingCount=10 after generate'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
                $stopped = (Test-DeviceUiMatch -Context $ctx -Pattern 'Push observation:\s*stopped') -or
                    (Test-DeviceLogMatch -Context $ctx -Pattern 'Push observation: STOPPED|Push observation: stopped')
                if ($pending -eq '10' -and $stopped) {
                    return @{ Pass = $true; Observed = "pendingCount=$pending; observation stopped"; Source = 'stats+uiautomator' }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending stopped=$stopped"; Source = 'stats+uiautomator' }
            }
        },
        @{
            Id             = 14
            Name           = 'Restart observation'
            EvidenceFiles  = @('Restart_push_observation.txt', 'Duplicate_counter.txt')
            Expected       = 'Push observation: ACTIVE'
            Evaluate       = {
                param($bundle)
                if (Test-DeviceLogMatch -Context $bundle.Context -Pattern 'Push observation: ACTIVE') {
                    return @{ Pass = $true; Observed = 'log: Push observation: ACTIVE'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'Push observation: ACTIVE not in log corpus'; Source = 'logcat' }
            }
        },
        @{
            Id             = 15
            Name           = 'Confirm events remain available through pull'
            EvidenceFiles  = @('Pull_without_push.txt', 'Duplicate_counter.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Fetch without ack: fetched 10 after observation restart'
            Evaluate       = {
                param($bundle)
                if (Test-DeviceLogMatch -Context $bundle.Context -Pattern 'Fetch without ack: fetched 10') {
                    return @{ Pass = $true; Observed = 'log: Fetch without ack: fetched 10'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'fetched 10 not found in log corpus'; Source = 'logcat' }
            }
        },
        @{
            Id             = 16
            Name           = 'Simulate JavaScript reload'
            EvidenceFiles  = @('Simulate_JS_restart.txt', 'Duplicate_counter.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'JS handler state cleared — native buffer unchanged'
            Evaluate       = {
                param($bundle)
                if (Test-DeviceLogMatch -Context $bundle.Context -Pattern 'JS handler state cleared') {
                    return @{ Pass = $true; Observed = 'log: JS handler state cleared'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'JS restart log missing'; Source = 'logcat' }
            }
        },
        @{
            Id             = 17
            Name           = 'Confirm unacknowledged events replay'
            EvidenceFiles  = @('Replay_unacknowledged.txt', 'Duplicate_counter.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Replay pull log or ack-able cache message'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Replay pull:|Replay: pull returned') {
                    return @{ Pass = $true; Observed = 'log: replay pull/cache path confirmed'; Source = 'logcat' }
                }
                return @{ Pass = $false; Observed = 'Replay log missing'; Source = 'logcat' }
            }
        },
        @{
            Id             = 18
            Name           = 'Simulate duplicate insertion'
            EvidenceFiles  = @('Duplicate_insertion.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Duplicate simulation: rejected=true OR duplicateRejectedCount incremented'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Duplicate simulation: rejected=true') {
                    return @{ Pass = $true; Observed = 'log: Duplicate simulation: rejected=true'; Source = 'logcat' }
                }
                $dup = Get-DeviceStat -Context $ctx -Key 'duplicateRejectedCount'
                if ($dup -and [int]$dup -ge 1) {
                    return @{ Pass = $true; Observed = "stats: duplicateRejectedCount=$dup"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "duplicateRejectedCount=$dup"; Source = 'logcat+stats' }
            }
        },
        @{
            Id             = 19
            Name           = 'Confirm duplicate is rejected or visibly counted'
            EvidenceFiles  = @('Duplicate_counter.txt')
            Expected       = 'duplicateRejectedCount>=1'
            Evaluate       = {
                param($bundle)
                $dup = Get-DeviceStat -Context $bundle.Context -Key 'duplicateRejectedCount'
                if ($dup -and [int]$dup -ge 1) {
                    return @{ Pass = $true; Observed = "duplicateRejectedCount=$dup"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "duplicateRejectedCount=$dup"; Source = 'stats' }
            }
        },
        @{
            Id             = 20
            Name           = 'Simulate unsupported schema'
            EvidenceFiles  = @('Unsupported_schema.txt', 'Export_diagnostics___privacy.txt')
            Expected       = 'Unsupported schema: rejected=true OR rejectedCount incremented'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                if (Test-DeviceLogMatch -Context $ctx -Pattern 'Unsupported schema: rejected=true') {
                    return @{ Pass = $true; Observed = 'log: Unsupported schema: rejected=true'; Source = 'logcat' }
                }
                $rej = Get-DeviceStat -Context $ctx -Key 'rejectedCount'
                if ($rej -and [int]$rej -ge 1) {
                    return @{ Pass = $true; Observed = "stats: rejectedCount=$rej"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "rejectedCount=$rej"; Source = 'logcat+stats' }
            }
        },
        @{
            Id             = 21
            Name           = 'Confirm event is rejected and not automatically acknowledged'
            EvidenceFiles  = @('Rejected_not_acked.txt')
            Expected       = 'rejectedCount>=1; pendingCount>=1 (rejection not auto-acked)'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $rej = Get-DeviceStat -Context $ctx -Key 'rejectedCount'
                $pending = Get-DeviceStat -Context $ctx -Key 'pendingCount'
                if ($rej -and [int]$rej -ge 1 -and $pending -and [int]$pending -ge 1) {
                    return @{ Pass = $true; Observed = "rejectedCount=$rej pendingCount=$pending"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "rejectedCount=$rej pendingCount=$pending"; Source = 'stats' }
            }
        },
        @{
            Id             = 22
            Name           = 'Export sanitized diagnostics'
            EvidenceFiles  = @('Export_diagnostics___privacy.txt')
            Expected       = 'Diagnostics exported with privacy PASS'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $export = (Test-DeviceLogMatch -Context $ctx -Pattern 'Diagnostics exported') -or
                    (Test-DeviceUiMatch -Context $ctx -Pattern 'Diagnostics exported')
                if ($export) {
                    return @{ Pass = $true; Observed = 'Diagnostics exported'; Source = 'logcat+uiautomator' }
                }
                return @{ Pass = $false; Observed = 'Diagnostics exported not found'; Source = 'logcat+uiautomator' }
            }
        },
        @{
            Id             = 23
            Name           = 'Confirm no coordinate fields appear'
            EvidenceFiles  = @('Export_diagnostics___privacy.txt')
            Expected       = 'Coordinate privacy check: PASS; no latitude/longitude in preview'
            Evaluate       = {
                param($bundle)
                $ctx = $bundle.Context
                $privacy = Test-DeviceUiMatch -Context $ctx -Pattern 'Coordinate privacy check:\s*PASS'
                $noCoords = -not ($ctx.FullCorpus -match 'latitude|longitude|"lat"|"lng"')
                if ($privacy -and $noCoords) {
                    return @{ Pass = $true; Observed = 'Coordinate privacy check: PASS; no coordinate fields'; Source = 'uiautomator' }
                }
                return @{ Pass = $false; Observed = "privacy=$privacy noCoords=$noCoords"; Source = 'uiautomator' }
            }
        },
        @{
            Id             = 24
            Name           = 'Clear prototype data'
            EvidenceFiles  = @('Final_clear_data.txt', 'Clear_prototype_data__baseline_.txt')
            Expected       = 'pendingCount=0 and acknowledgedCount=0 after clear'
            Evaluate       = {
                param($bundle)
                $pending = Get-DeviceStat -Context $bundle.Context -Key 'pendingCount'
                $ack = Get-DeviceStat -Context $bundle.Context -Key 'acknowledgedCount'
                if ($pending -eq '0' -and $ack -eq '0') {
                    return @{ Pass = $true; Observed = "pendingCount=$pending acknowledgedCount=$ack"; Source = 'stats' }
                }
                return @{ Pass = $false; Observed = "pendingCount=$pending acknowledgedCount=$ack"; Source = 'stats' }
            }
        }
    )
}

function Invoke-DeviceScenarioEvaluation {
    param(
        [Parameter(Mandatory)][string]$EvidenceDir
    )

    if (-not (Test-Path -LiteralPath $EvidenceDir)) {
        throw "Evidence directory not found: $EvidenceDir"
    }

    $scenarioResults = @()
    foreach ($scenario in Get-DeviceValidationScenarios) {
        $bundle = Resolve-DeviceEvidenceBundle -EvidenceDir $EvidenceDir -RelativePaths $scenario.EvidenceFiles
        if (-not $bundle) {
            $scenarioResults += New-DeviceScenarioResult -Scenario $scenario.Id -Name $scenario.Name `
                -Status 'fail' -Expected $scenario.Expected -Observed 'No evidence file found' `
                -EvidenceFile ($scenario.EvidenceFiles -join ' | ') -EvidenceSource 'missing'
            continue
        }

        $eval = & $scenario.Evaluate $bundle
        $scenarioResults += New-DeviceScenarioResult -Scenario $scenario.Id -Name $scenario.Name `
            -Status $(if ($eval.Pass) { 'pass' } else { 'fail' }) `
            -Expected $scenario.Expected -Observed $eval.Observed `
            -EvidenceFile $bundle.Path -EvidenceSource $eval.Source
    }

    return $scenarioResults
}

function Write-DeviceValidationSummary {
    param(
        [Parameter(Mandatory)][string]$EvidenceDir,
        [Parameter(Mandatory)][array]$ScenarioResults,
        [string]$RunMode = 'evidence-only'
    )

    $passed = @($ScenarioResults | Where-Object { $_.status -eq 'pass' }).Count
    $failed = @($ScenarioResults | Where-Object { $_.status -eq 'fail' }).Count
    $summary = [ordered]@{
        generatedAt   = (Get-Date).ToUniversalTime().ToString('o')
        runMode       = $RunMode
        evidenceDir   = (Resolve-Path -LiteralPath $EvidenceDir).Path
        scenarioCount = $ScenarioResults.Count
        passed        = $passed
        failed        = $failed
        scenarios     = $ScenarioResults
    }

    $summaryPath = Join-Path $EvidenceDir 'validation-summary.json'
    $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $summaryPath -Encoding UTF8
    return $summaryPath
}

function Get-DeviceValidationLogcatTail {
    param(
        [Parameter(Mandatory)][string]$AdbPath,
        [string]$Serial = '',
        [int]$TailLines = 120
    )

    if ($Serial) {
        $raw = (& $AdbPath -s $Serial logcat -d -t $TailLines 2>&1 | Out-String).Trim()
    } else {
        $raw = (& $AdbPath logcat -d -t $TailLines 2>&1 | Out-String).Trim()
    }

    return ($raw -split "`n" | Where-Object {
            $_ -match 'ReactNativeJS|PrototypeBridge|milerecover|AccessibilityNodeInfoDumper'
        }) -join "`n"
}
