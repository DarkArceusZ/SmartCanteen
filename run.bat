@echo off
echo ========================================================
echo        SmartCanteen AI - Starting Services
echo ========================================================
echo.

if not exist ".env.local" (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local
)

echo [1/2] Starting local MongoDB instance in background...
start "SmartCanteen Mongo DB" cmd /k "node scripts/start-db.mjs"

echo [2/2] Starting Next.js Web Application...
start "SmartCanteen Next.js" cmd /k "pnpm play"

echo.
echo ========================================================
echo  All services started!
echo  Opening browser at http://localhost:3000...
echo ========================================================
timeout /t 3 >nul
start http://localhost:3000

