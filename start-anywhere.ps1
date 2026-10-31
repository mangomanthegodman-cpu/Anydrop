# AnyDrop PowerShell Launcher - Any-Network Global Mode
Set-Location -Path $PSScriptRoot

Write-Host "==============================================================" -ForegroundColor Green
Write-Host "   Starting AnyDrop in GLOBAL ANY-NETWORK Mode...             " -ForegroundColor Green
Write-Host "   Works across Cellular 5G/4G, LTE, Different Wi-Fi, Globe!  " -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""

$nodeCmd = "$env:APPDATA\Antigravity\bin\agy-node.cmd"
if (-not (Test-Path $nodeCmd)) {
    $nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
}

if (-not $nodeCmd) {
    Write-Host "[ERROR] Could not find Node runtime." -ForegroundColor Red
    exit 1
}

Start-Process "http://localhost:3000"
& $nodeCmd server.js --anywhere
