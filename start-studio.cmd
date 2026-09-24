@echo off
cd /d "%~dp0"
echo.
echo Birthday Card Studio
echo Open http://127.0.0.1:4173/ in your browser.
echo Keep this window open while editing. Press Ctrl+C to stop.
echo.
node studio\server.js
echo.
pause
