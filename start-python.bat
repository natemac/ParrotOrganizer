@echo off
setlocal EnableDelayedExpansion
REM ParrotOrganizer Launcher
REM This script starts a local web server and opens the app

echo ========================================
echo   ParrotOrganizer - TeknoParrot Manager
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [1/2] Scanning for games...
echo.

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

REM Generate game lists from GameProfiles and UserProfiles
cd ..\GameProfiles 2>nul
if %errorlevel% equ 0 (
    dir /b *.xml 2>nul | findstr /v /c:":" > ..\ParrotOrganizer\data\gameProfiles_temp.txt
    cd ..\ParrotOrganizer

    REM Remove .xml extension using PowerShell
    powershell -Command "(Get-Content data\gameProfiles_temp.txt -ErrorAction SilentlyContinue) -replace '\.xml$', '' | Set-Content data\gameProfiles.txt" >nul 2>&1
    del data\gameProfiles_temp.txt 2>nul

    REM Count games
    for /f %%A in ('find /c /v "" ^< data\gameProfiles.txt') do set GAME_COUNT=%%A
    echo    Found !GAME_COUNT! games
) else (
    echo    [WARNING] GameProfiles folder not found
)

REM Generate UserProfiles list
cd ..\UserProfiles 2>nul
if %errorlevel% equ 0 (
    dir /b *.xml 2>nul | findstr /v /c:":" > ..\ParrotOrganizer\data\userProfiles_temp.txt 2>nul
    cd ..\ParrotOrganizer

    if exist data\userProfiles_temp.txt (
        powershell -Command "(Get-Content data\userProfiles_temp.txt -ErrorAction SilentlyContinue) -replace '\.xml$', '' | Set-Content data\userProfiles.txt" >nul 2>&1
        del data\userProfiles_temp.txt 2>nul

        REM Count installed games
        for /f %%A in ('find /c /v "" ^< data\userProfiles.txt 2^>nul') do set INSTALLED_COUNT=%%A
        if defined INSTALLED_COUNT (
            echo    Found !INSTALLED_COUNT! installed games
        )
    ) else (
        echo.> data\userProfiles.txt
        echo    No installed games yet
    )
) else (
    cd ParrotOrganizer 2>nul
    echo.> data\userProfiles.txt
)

echo.
echo [2/2] Starting local web server...
echo.

REM Choose port (fallback if 8000 is busy)
set PORT=8000
set PORT_IN_USE=
for /f "tokens=*" %%A in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do set PORT_IN_USE=1
if defined PORT_IN_USE (
    set PORT=8001
)

echo ParrotOrganizer will open in your browser at:
echo http://localhost:%PORT%/ParrotOrganizer/
echo.
echo Press Ctrl+C to stop the server when done.
echo ========================================
echo.

REM Start Python HTTP server from TeknoParrot root (so it can access all folders)
cd ..

REM Launch server in a new window bound to 127.0.0.1
start "ParrotOrganizer Server" cmd /c python -m http.server %PORT% --bind 127.0.0.1

REM Give server a moment to start
powershell -Command "Start-Sleep -Milliseconds 700"

REM Open the app directly
start http://localhost:%PORT%/ParrotOrganizer/

pause
