@echo off
cd /d "%~dp0"

:: Launch RustDesk minimized to tray (no visible window)
start "" "C:\Program Files\RustDesk\rustdesk.exe" --tray

:: Start the web dashboard
npm start
pause
