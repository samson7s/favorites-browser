@echo off

REM This is a minimal version update launcher
REM It only starts the Node.js update script

REM Start Node.js update script
node "%~dp0update-version.js"

REM Wait for user to press a key before exiting
pause