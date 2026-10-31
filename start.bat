@echo off
title AnyDrop - Universal File Transfer
cd /d "%~dp0"

echo ======================================================
echo    AnyDrop - Universal File Transfer
echo ======================================================
echo.
echo Choose your connection mode:
echo.
echo  [1] Any-Network Mode (Works on 5G, LTE, Different Wi-Fi, Globe)
echo  [2] Local Network Mode (Same Wi-Fi / LAN only)
echo.
set /p MODE="Enter your choice (1 or 2, default is 1): "

if "%MODE%"=="" set MODE=1

set NODE_EXE=
if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
    set "NODE_EXE=%APPDATA%\Antigravity\bin\agy-node.cmd"
) else (
    where node >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "NODE_EXE=node"
    )
)

if "%NODE_EXE%"=="" (
    echo [ERROR] Node.js runtime was not found!
    pause
    exit /b 1
)

start "" http://localhost:3000

if "%MODE%"=="2" (
    echo Starting in Local Network Mode...
    "%NODE_EXE%" server.js
) else (
    echo Starting in Any-Network Global Mode...
    "%NODE_EXE%" server.js --anywhere
)

pause
