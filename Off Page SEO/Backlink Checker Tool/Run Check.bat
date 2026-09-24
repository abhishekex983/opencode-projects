@echo off
setlocal

cd /d "%~dp0"

echo.
echo ============================================================
echo   Running Backlink Live Checker
echo ============================================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Run Setup.bat first.
    pause
    exit /b 1
)

if not exist "config.json" (
    echo [ERROR] config.json is missing. Open README.txt for setup.
    pause
    exit /b 1
)

python link_checker.py %*

echo.
pause
