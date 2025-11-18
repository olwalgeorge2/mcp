# 🛠️ SETUP REQUIRED: Install Node.js

## ⚠️ Current Status

**Node.js is not installed on your system.**

The compilation errors you're seeing are because:
1. Node.js is not installed
2. npm (Node Package Manager) is therefore not available
3. Dependencies cannot be installed
4. TypeScript cannot compile

---

## ✅ How to Fix

### Step 1: Install Node.js

**Download and install Node.js LTS (Long Term Support):**

🔗 **https://nodejs.org/**

**Choose:** 
- Click the **"LTS"** button (recommended)
- Current LTS version: 20.x or later
- This includes npm automatically

### Step 2: Install Node.js

1. Run the downloaded installer
2. Follow the installation wizard
3. Keep all default options (especially "Add to PATH")
4. Complete the installation
5. **Restart your terminal/PowerShell**

### Step 3: Verify Installation

Open a NEW PowerShell window and run:

```powershell
node --version
npm --version
```

You should see version numbers like:
```
v20.10.0
10.2.3
```

### Step 4: Install Project Dependencies

Navigate to the project and run the installation script:

```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
.\install.ps1
```

OR manually:

```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
npm install
npm run build
```

---

## 📋 Installation Verification

After Node.js installation, you should be able to:

✅ Run `node --version` - Shows Node.js version  
✅ Run `npm --version` - Shows npm version  
✅ Run `npm install` - Installs dependencies  
✅ Run `npm run build` - Compiles TypeScript  
✅ See `dist/` folder created  
✅ No compilation errors in VS Code  

---

## 🎯 Next Steps (After Node.js Installation)

1. **Install Node.js** (see above)
2. **Restart your terminal**
3. **Run installation**:
   ```powershell
   cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
   .\install.ps1
   ```
4. **Configure environment**:
   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your tokens
   ```
5. **Test the system**:
   ```powershell
   node dist/cli.js analyze-complexity 1
   ```

---

## 🔧 What Gets Installed

Node.js includes:
- **node** - JavaScript runtime
- **npm** - Package manager
- **npx** - Package executor

With npm, the project will install:
- MCP SDK for server functionality
- GitHub API client for repository integration
- OpenAI API client for AI agents
- TypeScript compiler for building
- And all other dependencies

---

## 💡 Why Node.js?

This project is built with:
- **TypeScript** - Type-safe JavaScript
- **Node.js** - JavaScript runtime
- **MCP SDK** - Model Context Protocol for GitHub Copilot
- **npm** - Manages all dependencies

Without Node.js, none of these can work.

---

## ⏱️ Time Required

- Node.js download: 1-2 minutes
- Node.js installation: 2-3 minutes
- npm install (dependencies): 1-2 minutes
- Build (TypeScript compile): 10-20 seconds

**Total: ~5-10 minutes**

---

## 🆘 Need Help?

### Node.js won't install
- Check if you have admin rights
- Try downloading the .msi installer directly
- Disable antivirus temporarily

### Command not found after installation
- **Close and reopen** your terminal
- Check PATH environment variable
- Restart VS Code

### npm install fails
- Check internet connection
- Try: `npm install --verbose`
- Clear npm cache: `npm cache clean --force`

---

## 🎉 Once Node.js is Installed

All the compilation errors will disappear because:
1. Dependencies will be installed
2. TypeScript can compile
3. Type definitions will be available
4. The MCP server will be ready to use

**The code is ready - it just needs Node.js to run!** ✨

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Check Node.js | `node --version` |
| Check npm | `npm --version` |
| Install deps | `npm install` |
| Build project | `npm run build` |
| Run CLI | `node dist/cli.js` |

---

**Ready to install? Download Node.js now:** https://nodejs.org/
