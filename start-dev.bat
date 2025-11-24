@echo off
REM Focus App Development Server Starter
REM For Windows Command Prompt

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║             Focus App - Development Server             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Node.js not found! Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo ✗ .env file not found!
    echo ✓ Creating .env from .env.example...
    copy .env.example .env
    echo ⚠️  Please edit .env with your database credentials!
    pause
)

REM Start the development server
echo ✓ Starting development server...
echo.
npm run dev

pause
