@echo off
title Arena Hunt Game Launcher
cd /d "%~dp0"

echo ===================================================
echo               ARENA HUNT - GAME LAUNCHER            
echo ===================================================
echo.

echo [INFO] Starting local Web Server on port 8000...
start "Arena Hunt Server" /B python -m http.server 8000
ping 127.0.0.1 -n 3 >nul

echo [INFO] Opening Chrome with Remote Debugging (port 9222)...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "Chrome Debug" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome_dev_profile" "http://localhost:8000"
) else (
    start "" "http://localhost:8000"
)

echo.
echo ===================================================
echo [SUCCESS] Server active at http://localhost:8000
echo Chrome Remote Debugging active at port 9222!
echo Keep this window open while playing!
echo ===================================================
echo.
pause
