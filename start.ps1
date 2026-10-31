# AnyDrop PowerShell Launcher
Set-Location -Path $PSScriptRoot

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   AnyDrop - Universal File Transfer                  " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your connection mode:"
Write-Host "  [1] Any-Network Mode (Works on 5G, LTE, Different Wi-Fi, Anywhere) - RECOMMENDED" -ForegroundColor Green
Write-Host "  [2] Local Network Mode (Same Wi-Fi / LAN only)" -ForegroundColor Yellow
Write-Host ""

$mode = Read-Host "Enter your choice (1 or 2, default is 1)"
if (-not $mode) { $mode = "1" }

$nodeCmd = "$env:APPDATA\Antigravity\bin\agy-node.cmd"
if (-not (Test-Path $nodeCmd)) {
    $nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
}

if (-not $nodeCmd) {
    Write-Host "[ERROR] Could not find Node runtime." -ForegroundColor Red
    exit 1
}

Start-Process "http://localhost:3000"

if ($mode -eq "2") {
    Write-Host "Starting in Local Network Mode..." -ForegroundColor Yellow
    & $nodeCmd server.js
} else {
    Write-Host "Starting in Any-Network Global Mode..." -ForegroundColor Green
    & $nodeCmd server.js --anywhere
}
