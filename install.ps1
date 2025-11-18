#!/usr/bin/env pwsh
# Installation script for Issue Pipeline Orchestrator

Write-Host "Installing dependencies for Issue Pipeline Orchestrator..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Node.js found:" -ForegroundColor Green
node --version
Write-Host "NPM found:" -ForegroundColor Green
npm --version
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Dependencies installed." -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Building TypeScript..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Build completed." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Copy .env.example to .env"
        Write-Host "2. Edit .env with your GitHub and OpenAI tokens"
        Write-Host "3. Run: node dist/cli.js analyze-complexity 1"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Build failed. Check the errors above." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Installation failed. Check the errors above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
