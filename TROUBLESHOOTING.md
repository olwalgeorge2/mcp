# Compilation Issues - Troubleshooting Guide

## Issue: TypeScript Compilation Errors

### Problem
You're seeing errors like:
- `Cannot find module '@modelcontextprotocol/sdk/...'`
- `Cannot find module 'dotenv'`
- `Cannot find name 'process'`

### Root Cause
The npm packages are not installed yet.

---

## ✅ Solution 1: Use Installation Script (Recommended)

### Windows PowerShell:
```powershell
cd mcp-servers/issue-pipeline-orchestrator
.\install.ps1
```

### Windows Command Prompt:
```cmd
cd mcp-servers\issue-pipeline-orchestrator
install.bat
```

This script will:
1. Check if Node.js is installed
2. Install all npm dependencies
3. Build the TypeScript project
4. Show you next steps

---

## ✅ Solution 2: Manual Installation

### Step 1: Check Node.js
```powershell
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

### Step 2: Navigate to Directory
```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
```

### Step 3: Install Dependencies
```powershell
npm install
```

This will install:
- `@modelcontextprotocol/sdk` - MCP server framework
- `@octokit/rest` - GitHub API client
- `dotenv` - Environment variable loader
- `openai` - OpenAI API client
- `zod` - Schema validation
- `@types/node` - TypeScript types for Node.js
- `typescript` - TypeScript compiler

### Step 4: Build
```powershell
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

---

## 🔍 Verify Installation

After installation, you should see:
- ✅ `node_modules/` folder created
- ✅ `dist/` folder created (after build)
- ✅ No TypeScript errors

Test it:
```powershell
# Check if build was successful
dir dist

# Test the CLI
node dist/cli.js --help
```

---

## 🐛 Common Issues

### Issue: "npm is not recognized"
**Solution**: Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### Issue: "Cannot find module" after npm install
**Solution**: Run build command
```powershell
npm run build
```

### Issue: "EACCES: permission denied"
**Solution**: Run as administrator or fix npm permissions
```powershell
# Windows: Run PowerShell as Administrator
```

### Issue: Build succeeds but still shows errors in VS Code
**Solution**: Reload VS Code window
- Press `Ctrl+Shift+P`
- Type "Reload Window"
- Press Enter

### Issue: "Cannot find type definition file for 'node'"
**Solution**: This is already fixed in tsconfig.json, just run:
```powershell
npm install
```

---

## 📋 Checklist

Before running the pipeline, ensure:

- [ ] Node.js 18+ installed
- [ ] npm install completed successfully
- [ ] npm run build completed without errors
- [ ] .env file created and configured
- [ ] GitHub token has repo access
- [ ] OpenAI API key is valid

---

## 🚀 Quick Start After Installation

1. **Configure Environment**
```powershell
Copy-Item .env.example .env
# Edit .env with your tokens
```

2. **Test the System**
```powershell
# Analyze an issue
node dist/cli.js analyze-complexity 1

# Dry run (no PR created)
node dist/cli.js process-issue 1 --dry-run
```

3. **Start Using**
```powershell
# Process a real issue
node dist/cli.js process-issue 42
```

---

## 📞 Still Having Issues?

1. Check that all dependencies are installed:
   ```powershell
   npm list
   ```

2. Try cleaning and reinstalling:
   ```powershell
   Remove-Item -Recurse -Force node_modules, dist
   npm install
   npm run build
   ```

3. Check TypeScript version:
   ```powershell
   npx tsc --version
   ```

4. Verify tsconfig.json has `"types": ["node"]` in compilerOptions

5. Check that all source files exist:
   - src/index.ts
   - src/cli.ts
   - src/orchestrator.ts
   - src/agents/ai-agent.ts
   - src/agents/roles.ts
   - src/services/github.ts

---

## ✅ Expected Result

After successful installation and build:

```
mcp-servers/issue-pipeline-orchestrator/
├── node_modules/          ← Dependencies installed
├── dist/                  ← Compiled JavaScript
│   ├── index.js
│   ├── cli.js
│   ├── orchestrator.js
│   └── agents/
│       ├── ai-agent.js
│       └── roles.js
├── src/                   ← TypeScript source (no errors)
├── package.json
├── tsconfig.json
└── .env                   ← Your configuration
```

---

**You're ready to go when you see no errors and `dist/` folder is populated!** 🎉
