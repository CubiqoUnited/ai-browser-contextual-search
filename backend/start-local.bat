@echo off
chcp 65001 >nul
echo.
echo 🚀 Starting AI Browser Local Development Environment
echo ==================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [✗] Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [✓] Node.js %NODE_VERSION% detected
echo.

REM Install backend dependencies
echo [i] Installing backend dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo [✗] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [✓] Backend dependencies installed
echo.

REM Start local test server
echo [i] Starting local test server...
start /B node local-test.js
timeout /t 3 /nobreak >nul

REM Check if server started
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:3001/health' -Method GET; if ($response.status -eq 'healthy') { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo [✓] Local test server running on http://localhost:3001
) else (
    echo [✗] Failed to start local test server
    pause
    exit /b 1
)
echo.

REM Test API endpoints
echo [i] Testing API endpoints...
powershell -Command "$response = Invoke-RestMethod -Uri 'http://localhost:3001/health' -Method GET; Write-Host '[✓] Health check:' $response.status"
echo.

echo 📋 Local Development Environment Ready
echo =====================================
echo.
echo 🌐 Backend API:
echo    - URL: http://localhost:3001
echo    - Health: http://localhost:3001/health
echo    - Test: curl -X POST http://localhost:3001/api/analyze ^
echo            -H "Content-Type: application/json" ^
echo            -d "{\"type\":\"text-analysis\",\"data\":\"Test\",\"privacyLevel\":\"medium\"}"
echo.
echo 🔧 Browser Extension Setup:
echo    1. Open Chrome → chrome://extensions/
echo    2. Enable 'Developer mode' (toggle top right)
echo    3. Click 'Load unpacked'
echo    4. Select the 'extension' folder
echo.
echo 🎯 Features Available:
echo    - Video analysis (click 🔍 button on videos)
echo    - Contextual search (right-click text)
echo    - Privacy controls (three levels)
echo    - Content aggregation
echo.
echo ⚡ Quick Test:
echo    1. Visit YouTube or any video site
echo    2. Look for 🔍 AI Analyze button on videos
echo    3. Click to test video analysis
echo.
echo 🛑 To stop: Press Ctrl+C in this window
echo.

REM Keep window open
pause