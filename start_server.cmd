@echo off
cd /d "%~dp0"
start "Arena Survival Server" /B python -m http.server 8080
echo Server started at http://localhost:8080
start http://localhost:8080
pause
