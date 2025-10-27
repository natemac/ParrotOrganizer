@echo off
setlocal EnableDelayedExpansion
REM ParrotOrganizer Launcher (Node.js version)
REM Requires Node.js to be installed

echo ========================================
echo   ParrotOrganizer - TeknoParrot Manager
echo ========================================
echo.

REM Check if Node.js is installed (no parentheses to avoid parse issues)
where /q node
if %ERRORLEVEL%==0 goto node_ok
echo [ERROR] Node.js is not installed or not in PATH
echo.
echo Please install Node.js from: https://nodejs.org/
echo Or use start.bat (Python version) instead
echo.
pause
exit /b 1

:node_ok

REM Double-check node actually runs
node -v >nul 2>&1
if not %ERRORLEVEL%==0 goto node_missing

echo [1/3] Scanning for games...
echo.

REM Create storage directory if it doesn't exist (user-specific data)
if not exist "storage" mkdir storage

REM Detect current folder name (supports ParrotOrganizer, ParrotOrganizer-1.2.1, etc.)
for %%I in (.) do set APP_FOLDER=%%~nxI

REM Generate game lists in storage folder (user-specific)
cd ..\GameProfiles 2>nul
if %errorlevel% equ 0 (
    dir /b *.xml 2>nul > ..\%APP_FOLDER%\storage\gameProfiles_temp.txt
    cd ..\%APP_FOLDER%

    REM Remove .xml extension using PowerShell
    powershell -Command "$temp='storage\gameProfiles_temp.txt'; $out='storage\gameProfiles.txt'; if(Test-Path $temp){(Get-Content $temp) -replace '\.xml$','' | Set-Content $out; Remove-Item $temp}" >nul 2>&1
    echo    Scanned GameProfiles folder
)

cd ..\UserProfiles 2>nul
if %errorlevel% equ 0 (
    dir /b *.xml 2>nul > ..\%APP_FOLDER%\storage\userProfiles_temp.txt 2>nul
    cd ..\%APP_FOLDER%
    REM Remove .xml extension using PowerShell
    powershell -Command "$temp='storage\userProfiles_temp.txt'; $out='storage\userProfiles.txt'; if(Test-Path $temp){(Get-Content $temp) -replace '\.xml$','' | Set-Content $out; Remove-Item $temp}else{'' | Set-Content $out}" >nul 2>&1
    echo    Scanned UserProfiles folder
) else (
    cd %APP_FOLDER% 2>nul
    echo.> storage\userProfiles.txt
)

echo.
echo [2/3] Checking environment...
echo.
if not exist "..\TeknoParrotUi.exe" (
    echo    [WARNING] TeknoParrotUi.exe not found in TeknoParrot root. One-click launch will fail.
    echo             Expected at: ..\TeknoParrotUi.exe
)

REM Choose port (fallback if 8000 is busy)
set PORT=8000
set PORT_IN_USE=
for /f "tokens=*" %%A in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do set PORT_IN_USE=1
if defined PORT_IN_USE (
    set PORT=8001
)

echo [3/3] Starting local web server...
echo.
echo ParrotOrganizer will open in your browser at:
echo http://localhost:%PORT%/%APP_FOLDER%/
echo.
echo Server is also accessible on your local network at:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do set IP=%%a
echo http://%IP::=%:%PORT%/%APP_FOLDER%/
echo.
echo Press Ctrl+C to stop the server when done.
echo ========================================
echo.

REM Start Node.js HTTP server from TeknoParrot root (so it can access all folders)
cd ..
set BIND_ADDR=0.0.0.0
start http://localhost:%PORT%/%APP_FOLDER%/
set PORT=%PORT%
set BIND_ADDR=%BIND_ADDR%
node %APP_FOLDER%\server.js

REM Server has stopped - exit immediately without pause
exit

goto :eof

:node_missing
echo [ERROR] Node is not functional (node -v failed). Please install Node.js:
echo   https://nodejs.org/
echo Or use start.bat (Python version) instead.
echo.
pause
exit /b 1
