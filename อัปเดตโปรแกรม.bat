@echo off
title Update Quotation App
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed on this computer.
  echo   Install the LTS version from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

node "scripts\update.mjs"
pause
