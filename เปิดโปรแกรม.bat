@echo off
title Quotation App - do not close this window
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

node "scripts\launch.mjs"
if errorlevel 1 pause
