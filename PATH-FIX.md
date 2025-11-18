# 🔧 Node.js PATH Issue - SOLVED

## Problem
Node.js is installed but not in your system PATH, so PowerShell can't find it.

## ✅ Quick Fix (Current Session Only)

Run this in PowerShell:
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

Now test:
```powershell
node --version
npm --version
```

You should see:
```
v24.11.1
10.x.x
```

## ✅ Permanent Fix (Recommended)

### Option 1: Run Fix Script
```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
.\fix-nodejs-path.ps1
```

This will add Node.js to your PATH permanently.

### Option 2: Manual Fix
1. Press `Win + X`, select **System**
2. Click **Advanced system settings**
3. Click **Environment Variables**
4. Under **User variables**, select **Path**
5. Click **Edit**, then **New**
6. Add: `C:\Program Files\nodejs`
7. Click **OK** on all dialogs
8. **Restart PowerShell and VS Code**

## 🚀 After PATH is Fixed

Then install dependencies:
```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator

# Add Node to PATH for current session
$env:Path = "C:\Program Files\nodejs;" + $env:Path

# Install dependencies
npm install

# Build the project
npm run build
```

## 📋 Verify Everything Works

```powershell
# Check Node.js
node --version          # Should show: v24.11.1

# Check npm
npm --version           # Should show: 10.x.x

# Check build
dir dist               # Should see compiled JavaScript files

# Test CLI
node dist/cli.js --help
```

## 💡 Why This Happened

Your PATH environment variable doesn't include `C:\Program Files\nodejs`, which is where Node.js is installed. This can happen when:
- Node.js was installed without admin rights
- PATH was manually modified
- Installation didn't complete properly
- Recent Windows update reset PATH

## ⚡ TL;DR

**For now (quick fix):**
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
npm install
npm run build
```

**For permanent fix:**
Run `.\fix-nodejs-path.ps1` or manually add to PATH via System Settings.

---

**Your Node.js version (v24.11.1) is perfect for this project!** ✨
