@echo off
echo Installing dependencies for Issue Pipeline Orchestrator...
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo NPM found:
npm --version
echo.

echo Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Dependencies installed.
    echo.
    echo Building TypeScript...
    call npm run build
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS! Build completed.
        echo.
        echo Next steps:
        echo 1. Copy .env.example to .env
        echo 2. Edit .env with your GitHub and OpenAI tokens
        echo 3. Run: npm run cli analyze-complexity 1
    ) else (
        echo.
        echo Build failed. Check the errors above.
    )
) else (
    echo.
    echo Installation failed. Check the errors above.
)

echo.
pause
