# Fix Node.js PATH Issue
# Run this script as Administrator

Write-Host "=== Node.js PATH Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js exists
$nodePath = "C:\Program Files\nodejs"
if (-not (Test-Path "$nodePath\node.exe")) {
    Write-Host "ERROR: Node.js not found at $nodePath" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js found at: $nodePath" -ForegroundColor Green
Write-Host "Version: " -NoNewline
& "$nodePath\node.exe" --version
Write-Host ""

# Check current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "Checking PATH..." -ForegroundColor Cyan

if ($currentPath -like "*$nodePath*") {
    Write-Host "Node.js is already in System PATH" -ForegroundColor Green
} elseif ($userPath -like "*$nodePath*") {
    Write-Host "Node.js is already in User PATH" -ForegroundColor Green
} else {
    Write-Host "Node.js is NOT in PATH - Adding it now..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try to add to User PATH (doesn't require admin)
    try {
        $newUserPath = $userPath + ";" + $nodePath
        [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
        Write-Host "SUCCESS! Added Node.js to User PATH" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: You must restart PowerShell/VS Code for changes to take effect!" -ForegroundColor Yellow
    } catch {
        Write-Host "ERROR: Could not modify PATH" -ForegroundColor Red
        Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or manually add to PATH:" -ForegroundColor Cyan
        Write-Host "1. Press Win + X, select 'System'" -ForegroundColor White
        Write-Host "2. Click 'Advanced system settings'" -ForegroundColor White
        Write-Host "3. Click 'Environment Variables'" -ForegroundColor White
        Write-Host "4. Under 'User variables', select 'Path'" -ForegroundColor White
        Write-Host "5. Click 'Edit', then 'New'" -ForegroundColor White
        Write-Host "6. Add: C:\Program Files\nodejs" -ForegroundColor White
        Write-Host "7. Click OK on all dialogs" -ForegroundColor White
        Write-Host "8. Restart PowerShell/VS Code" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== Testing Node.js ===" -ForegroundColor Cyan
Write-Host ""

# Test with full path (should work)
Write-Host "Direct test (full path):" -ForegroundColor White
& "$nodePath\node.exe" --version
& "$nodePath\npm.cmd" --version

Write-Host ""
Write-Host "=== Quick Fix for Current Session ===" -ForegroundColor Cyan
Write-Host "To use Node.js in THIS PowerShell session, run:" -ForegroundColor Yellow
Write-Host ""
Write-Host '$env:Path = "C:\Program Files\nodejs;" + $env:Path' -ForegroundColor White
Write-Host ""
Write-Host "Then you can use 'node' and 'npm' normally" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
