param(
    [Parameter(Mandatory = $true)]
    [string]$TestFile,

    [string]$Pattern = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Backend = Join-Path $RepoRoot "backend"

$ReportDir = Join-Path $env:TEMP "SISTEMAHOTEL-QA"
New-Item -ItemType Directory -Force $ReportDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Report = Join-Path $ReportDir "focused-$Timestamp.txt"

function Invoke-Checked {
    param(
        [string]$Command,
        [string[]]$Arguments
    )

    & $Command @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Comando falló: $Command $($Arguments -join ' ')"
    }
}

Start-Transcript -Path $Report -Force | Out-Null

try {
    Push-Location $Backend

    Write-Host ""
    Write-Host "=== QA DATABASE GUARD ==="

$GuardScript = Join-Path $RepoRoot "qa\scripts\assert-test-db.cjs"

Invoke-Checked "node" @($GuardScript)

    Write-Host ""
    Write-Host "=== FOCUSED TEST ==="

    $Args = @(
        "test",
        "--",
        $TestFile
    )

    if ($Pattern) {
        $Args += @("-t", $Pattern)
    }

    Invoke-Checked "npm" $Args

    Write-Host ""
    Write-Host "FOCUSED RESULT: PASS"
    Write-Host "REPORT: $Report"
}
finally {
    Pop-Location
    Stop-Transcript | Out-Null
}