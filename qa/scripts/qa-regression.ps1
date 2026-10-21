param(
    [string]$FocusedFile = "",
    [string]$Pattern = "",
    [string[]]$RelatedTests = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Backend = Join-Path $RepoRoot "backend"

$ReportDir = Join-Path $env:TEMP "SISTEMAHOTEL-QA"
New-Item -ItemType Directory -Force $ReportDir | Out-Null

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Report = Join-Path $ReportDir "regression-$Timestamp.txt"

function Invoke-Checked {
    param(
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host ""
    Write-Host ">>> $Command $($Arguments -join ' ')"

    & $Command @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "Comando falló: $Command $($Arguments -join ' ')"
    }
}

$BeforeStatus = (
    & git -C $RepoRoot status --porcelain=v1
) -join "`n"

Start-Transcript -Path $Report -Force | Out-Null

try {
    Write-Host "======================================="
    Write-Host " SISTEMAHOTEL QA REGRESSION"
    Write-Host "======================================="

    Push-Location $Backend

    Write-Host ""
    Write-Host "=== DATABASE GUARD ==="

    $GuardScript = Join-Path $RepoRoot "qa\scripts\assert-test-db.cjs"

Invoke-Checked "node" @($GuardScript)
    Write-Host ""
    Write-Host "=== MIGRATION STATUS ==="

    Invoke-Checked "npx" @(
        "sequelize-cli",
        "db:migrate:status",
        "--env",
        "test"
    )

    if ($FocusedFile) {
        Write-Host ""
        Write-Host "=== FOCUSED TEST ==="

        $FocusedArgs = @(
            "test",
            "--",
            $FocusedFile
        )

        if ($Pattern) {
            $FocusedArgs += @("-t", $Pattern)
        }

        Invoke-Checked "npm" $FocusedArgs
    }

    if ($RelatedTests.Count -gt 0) {
        Write-Host ""
        Write-Host "=== RELATED TESTS ==="

        $RelatedArgs = @("test", "--")
        $RelatedArgs += $RelatedTests

        Invoke-Checked "npm" $RelatedArgs
    }

    Write-Host ""
    Write-Host "=== FULL BACKEND TEST SUITE ==="

    Invoke-Checked "npm" @("test")

    Write-Host ""
    Write-Host "=== TYPESCRIPT ==="

    Invoke-Checked "npm" @(
        "exec",
        "tsc",
        "--",
        "--noEmit"
    )

    Pop-Location

    Write-Host ""
    Write-Host "=== GIT DIFF CHECK ==="

    Invoke-Checked "git" @(
        "-C",
        $RepoRoot,
        "diff",
        "--check"
    )

    Invoke-Checked "git" @(
        "-C",
        $RepoRoot,
        "diff",
        "--cached",
        "--check"
    )

    $AfterStatus = (
        & git -C $RepoRoot status --porcelain=v1
    ) -join "`n"

    Write-Host ""
    Write-Host "=== READ-ONLY CHECK ==="

    if ($BeforeStatus -ne $AfterStatus) {
        Write-Host ""
        Write-Host "ANTES:"
        Write-Host $BeforeStatus

        Write-Host ""
        Write-Host "DESPUÉS:"
        Write-Host $AfterStatus

        throw "La regresión modificó el working tree."
    }

    Write-Host "Working tree sin cambios nuevos."

    Write-Host ""
    Write-Host "======================================="
    Write-Host " QA REGRESSION RESULT: PASS"
    Write-Host " REPORT: $Report"
    Write-Host "======================================="
}
finally {
    while ((Get-Location).Path -ne $RepoRoot) {
        Pop-Location
    }

    Stop-Transcript | Out-Null
}