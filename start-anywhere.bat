@echo off
title AnyDrop - Global Any-Network File Transfer
cd /d "%~dp0"

echo ==============================================================
echo    Starting AnyDrop in GLOBAL ANY-NETWORK Mode...
echo    Works across Cellular 5G/4G, LTE, Different Wi-Fi, Anywhere!
echo ==============================================================
echo.

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
"%NODE_EXE%" server.js --anywhere

pause
