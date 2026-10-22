@echo off
cd /d "%~dp0.."
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org then try again. & pause & exit /b 1)
node defense\cli.mjs backup %*
if errorlevel 1 (echo. & echo Something went wrong - see defense\TROUBLESHOOTING.md & pause & exit /b 1)
pause
