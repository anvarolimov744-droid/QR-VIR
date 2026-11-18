@echo off
cd /d "%~dp0"
if not exist .env copy .env.example .env
npm install
if errorlevel 1 pause & exit /b 1
npm run dev
pause
