@echo off
title Lotus Lantern PC - Local Runner
echo ========================================================
echo   Lotus Lantern PC - Smart LED Studio (Local Desktop)
echo ========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not detected on your system.
    echo Please install Node.js from https://nodejs.org/ to run the development server.
    echo.
    echo Alternatively, you can open the Standalone Offline version directly in any browser!
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo [INFO] Starting Lotus Lantern PC local dev server...
start "" "http://localhost:3000"
call npm run dev

pause
