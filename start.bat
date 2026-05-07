@echo off
title Parrot Organizer v2.0
cd /d "%~dp0"

:: Kill any existing process on port 8000 so we always start fresh
echo Checking for existing server on port 8000...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 "') do (
  taskkill /PID %%a /F >nul 2>&1
)

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Download from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Parrot Organizer v2.0...
echo.

:: Start server and wait for it to be ready before opening browser
start "Parrot Organizer Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/ParrotOrganizer/"

echo Server started. Close the "Parrot Organizer Server" window to stop it.
