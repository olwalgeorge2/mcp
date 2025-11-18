# Quick Start Guide - Automated Issue Pipeline

## 🚀 Getting Started in 5 Minutes

### Prerequisites

- Node.js 18+ installed
- GitHub Personal Access Token
- OpenAI API Key
- Git repository with issues

### Step 1: Install Node.js (if needed)

Download from: https://nodejs.org/

Verify installation:
```powershell
node --version
npm --version
```

### Step 2: Install Dependencies

```powershell
cd c:\Users\PC\coding\mvp\mcp-servers\issue-pipeline-orchestrator
npm install
```

### Step 3: Configure Environment

Create `.env` file:
```powershell
Copy-Item .env.example .env
```

Edit `.env` with your credentials:
```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=mvp
OPENAI_API_KEY=sk-your_key_here
```

### Step 4: Build the Project

```powershell
npm run build
```

### Step 5: Test the MCP Server

Test with a sample issue:
```powershell
node dist/cli.js analyze-complexity 1
```

## 📋 Usage Examples

### Process an Issue Automatically

```powershell
# Full pipeline
node dist/cli.js process-issue 42

# Skip analyst (if requirements are clear)
node dist/cli.js process-issue 42 --skip-analyst

# Skip architect (for simple changes)
node dist/cli.js process-issue 42 --skip-architect

# Dry run (no PR created)
node dist/cli.js process-issue 42 --dry-run
```

### Check Pipeline Status

```powershell
node dist/cli.js get-status 42
```

### Analyze Issue Complexity

```powershell
node dist/cli.js analyze-complexity 42
```

## 🎯 GitHub Integration

### Option 1: VS Code + GitHub Copilot (Recommended)

Add to `.vscode/settings.json`:
```json
{
  "github.copilot.chat.mcpServers": {
    "chiro-erp-pipeline": {
      "command": "node",
      "args": [
        "c:/Users/PC/coding/mvp/mcp-servers/issue-pipeline-orchestrator/dist/index.js"
      ]
    }
  }
}
```

Then in Copilot Chat:
```
@workspace use the process_issue tool for issue #42
```

### Option 2: GitHub Actions (Automatic)

The workflow is already set up in `.github/workflows/auto-pipeline.yml`.

**To trigger automatic processing:**
1. Create an issue
2. Add the `auto-implement` label
3. The pipeline starts automatically!

**To trigger with comment:**
```
/pipeline process
/pipeline process --skip-analyst
/pipeline process --dry-run
```

### Option 3: Manual CLI

Run directly from terminal:
```powershell
$env:GITHUB_TOKEN="your_token"
$env:GITHUB_OWNER="your_username"
$env:GITHUB_REPO="mvp"
$env:OPENAI_API_KEY="your_key"

node dist/cli.js process-issue 42
```

## 📝 Creating Issues for Auto-Implementation

### Good Issue Format

```markdown
# Title: Add patient search by phone number

## Description
We need to add a search feature that allows users to search for patients by their phone number.

## Acceptance Criteria
- [ ] User can enter phone number in search field
- [ ] System returns matching patients
- [ ] Search supports partial matches
- [ ] Results show patient name, DOB, and last visit

## Technical Notes
- Should be in Patient Management context
- Use existing query pattern
- Add index on PhoneNumber field

## Labels
- enhancement
- patient-management
- auto-implement
```

### Label Strategy

- `auto-implement` - Triggers automatic pipeline
- `bug` - Simple bug fix (usually low complexity)
- `enhancement` - New feature
- `breaking-change` - High complexity, needs review
- `security` - Security-related, needs careful review

## 🎛️ Configuration Options

### Complexity Thresholds

Edit `src/orchestrator.ts`:
```typescript
// Auto-implement threshold
const autoImplementable = score < 8;

// Adjust scoring in analyzeComplexity method
```

### Agent Customization

Edit `src/agents/roles.ts`:
```typescript
// Modify prompts, tools, or add new agents
export const AGENT_ROLES: Record<string, AgentRole> = {
  analyst: { ... },
  architect: { ... },
  // Add your custom agent
}
```

### Pipeline Stages

Edit `src/orchestrator.ts` in `initializePipeline`:
```typescript
const stages: PipelineStage[] = [
  { name: 'Analysis', agent: 'analyst', status: 'pending' },
  // Add or remove stages
];
```

## 🔍 Monitoring & Debugging

### View Pipeline Progress

Pipeline updates are posted as comments on the GitHub issue. Watch the issue for real-time progress.

### Check Logs

GitHub Actions logs show detailed execution:
1. Go to Actions tab
2. Find your workflow run
3. View logs for each step

### Common Issues

**Issue: Rate limit exceeded**
- Solution: Add delays between API calls or upgrade OpenAI plan

**Issue: Pipeline stuck**
- Solution: Use retry command or check GitHub issue comments

**Issue: Agent produces incorrect output**
- Solution: Review agent prompts in `roles.ts` and provide more context

## 💰 Cost Estimation

Typical costs per issue (using GPT-4):
- Simple bug (skip analyst/architect): ~$0.10-0.30
- Standard feature: ~$0.50-1.50
- Complex feature: ~$2.00-5.00

Ways to reduce costs:
- Use GPT-3.5-turbo for simpler stages
- Skip unnecessary stages
- Provide clearer requirements (less back-and-forth)

## 🔒 Security Best Practices

1. **Never commit `.env` file**
   ```powershell
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use GitHub Secrets for Actions**
   - Settings → Secrets → Actions
   - Add: `OPENAI_API_KEY`

3. **Rotate tokens regularly**

4. **Review sensitive changes manually**

## 🎓 Next Steps

1. ✅ Test with a simple issue first
2. ✅ Review the generated PR
3. ✅ Adjust agent prompts for your domain
4. ✅ Set up GitHub Actions for automation
5. ✅ Train your team on the workflow

## 📚 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [GitHub REST API](https://docs.github.com/rest)
- [OpenAI API](https://platform.openai.com/docs)

## 🆘 Getting Help

- Check the README.md for detailed documentation
- Review agent outputs in GitHub issue comments
- Adjust complexity thresholds if needed
- Start with dry-run mode to test without creating PRs

---

**Happy Automating! 🤖✨**
