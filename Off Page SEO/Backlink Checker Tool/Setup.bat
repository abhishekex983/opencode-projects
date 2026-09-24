@echo off
setlocal

echo.
echo ============================================================
echo   Backlink Checker - First Time Setup
echo ============================================================
echo.

REM ── Check Python is installed ──────────────────────────────────
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not on PATH.
    echo.
    echo Please install Python 3.10 or newer from:
    echo   https://www.python.org/downloads/
    echo.
    echo During installation, check the box "Add Python to PATH".
    echo After installing, run Setup.bat again.
    echo.
    pause
    exit /b 1
)

echo [1/2] Python is installed - good.
python --version
echo.

REM ── Install dependencies ───────────────────────────────────────
echo [2/2] Installing Python dependencies...
echo       (This runs once - about 30-60 seconds.)
echo.

python -m pip install --upgrade pip >nul
python -m pip install -r "%~dp0requirements.txt"

if errorlevel 1 (
    echo.
    echo [ERROR] Could not install dependencies.
    echo Check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Setup complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Open config.json in any text editor
echo   2. Replace the PASTE_... values with your actual credentials
echo      (README.txt has step-by-step instructions)
echo   3. Double-click "Run Check.bat" to crawl your URLs
echo.
pause
