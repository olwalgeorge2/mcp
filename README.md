# Chiro ERP - Issue Pipeline Orchestrator

MCP Server for automated issue-to-PR pipeline with role-based AI agents.

## Overview

This MCP server automates the software development workflow by processing GitHub issues through a multi-stage pipeline with specialized AI agents:

- **Analyst Agent**: Analyzes requirements and creates user stories
- **Architect Agent**: Designs technical solutions following DDD/CQRS patterns
- **Developer Agent**: Implements features in C#
- **Tester Agent**: Creates comprehensive tests
- **Reviewer Agent**: Reviews code for quality and compliance

## Features

- 🤖 Automated issue-to-PR workflow
- 🎯 Role-based AI agents with domain expertise
- 🏗️ Architecture-aware (follows your ADRs and patterns)
- 🔒 HIPAA compliance checks
- 🧪 Automatic test generation
- 👀 Code review automation
- 🎛️ Human approval gates for complex changes
- 📊 Complexity analysis
- 🔄 Retry and approval mechanisms

## Setup

### 1. Install Dependencies

```bash
cd mcp-servers/issue-pipeline-orchestrator
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `GITHUB_TOKEN`: GitHub Personal Access Token with repo access
- `GITHUB_OWNER`: Your GitHub username or organization
- `GITHUB_REPO`: Repository name
- `OPENAI_API_KEY`: OpenAI API key

### 3. Build

```bash
npm run build
```

### 4. Configure MCP in VS Code

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "mcpServers": {
    "chiro-erp-pipeline": {
      "command": "node",
      "args": [
        "c:/Users/PC/coding/mvp/mcp-servers/issue-pipeline-orchestrator/dist/index.js"
      ],
      "env": {
        "GITHUB_TOKEN": "your_token",
        "GITHUB_OWNER": "your_username",
        "GITHUB_REPO": "mvp",
        "OPENAI_API_KEY": "your_key"
      }
    }
  }
}
```

## Usage

### Process an Issue Automatically

```typescript
// In GitHub Copilot Chat
@workspace /tools process_issue --issueNumber 42
```

### Check Pipeline Status

```typescript
@workspace /tools get_pipeline_status --issueNumber 42
```

### Analyze Issue Complexity

```typescript
@workspace /tools analyze_issue_complexity --issueNumber 42
```

### Approve a Stage

```typescript
@workspace /tools approve_pipeline_stage --issueNumber 42 --stage "architecture" --approved true
```

### Retry a Failed Stage

```typescript
@workspace /tools retry_pipeline_stage --issueNumber 42 --stage "implementation"
```

## GitHub Actions Integration

Create `.github/workflows/auto-pipeline.yml`:

```yaml
name: Automated Issue Pipeline

on:
  issues:
    types: [labeled]

jobs:
  auto-implement:
    if: contains(github.event.issue.labels.*.name, 'auto-implement')
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install MCP Server
        run: |
          cd mcp-servers/issue-pipeline-orchestrator
          npm install
          npm run build
      
      - name: Process Issue
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node mcp-servers/issue-pipeline-orchestrator/dist/index.js << EOF
          {
            "method": "tools/call",
            "params": {
              "name": "process_issue",
              "arguments": {
                "issueNumber": ${{ github.event.issue.number }}
              }
            }
          }
          EOF
```

## Pipeline Stages

### 1. Analysis (Analyst Agent)
- Extracts requirements from issue
- Creates user stories
- Defines acceptance criteria
- Identifies dependencies

### 2. Architecture (Architect Agent)
- Designs technical solution
- Follows DDD/CQRS patterns
- Updates ADRs if needed
- Defines integration points

### 3. Implementation (Developer Agent)
- Generates C# code
- Follows project structure
- Implements CQRS handlers
- Creates domain events

### 4. Testing (Tester Agent)
- Generates unit tests
- Creates integration tests
- Ensures test coverage
- Tests edge cases

### 5. Code Review (Reviewer Agent)
- Reviews code quality
- Checks security issues
- Validates HIPAA compliance
- Provides feedback

## Complexity Scoring

The system automatically analyzes issues and assigns complexity scores:

- **Low (0-4)**: Simple bugs, minor enhancements - auto-implement
- **Medium (5-9)**: Standard features - auto-implement with review
- **High (10+)**: Complex changes - requires human oversight

## Human Approval Gates

Approval is automatically required for:
- Breaking changes
- Architectural decisions
- Security-sensitive code
- HIPAA compliance implications
- High complexity scores

## Customization

### Adding New Agent Roles

Edit `src/agents/roles.ts`:

```typescript
export const AGENT_ROLES: Record<string, AgentRole> = {
  // ... existing roles
  
  myCustomAgent: {
    name: "My Custom Agent",
    description: "Does something specific",
    systemPrompt: "You are...",
    tools: ["tool1", "tool2"],
    maxTokens: 2000,
    temperature: 0.3
  }
};
```

### Modifying Pipeline Stages

Edit `src/orchestrator.ts` in the `initializePipeline` method.

## Troubleshooting

### Pipeline Stuck

Check the pipeline status and use retry:

```typescript
@workspace /tools retry_pipeline_stage --issueNumber 42 --stage "implementation"
```

### Rate Limits

The system respects GitHub and OpenAI rate limits. If you hit limits:
- Reduce parallel processing
- Add delays between stages
- Use a higher-tier OpenAI plan

### Agent Errors

Check agent outputs in GitHub issue comments. Common issues:
- Insufficient context
- Ambiguous requirements
- Missing dependencies

## Best Practices

1. **Label Issues Appropriately**: Use labels like `auto-implement`, `bug`, `enhancement` to help complexity analysis

2. **Clear Issue Descriptions**: Provide detailed requirements and acceptance criteria

3. **Review Generated PRs**: Even with automation, human review is valuable

4. **Start Small**: Begin with simple issues to calibrate the system

5. **Monitor Costs**: Track OpenAI API usage as complex issues can use significant tokens

## Security

- Never commit `.env` file
- Use GitHub Secrets for CI/CD
- Rotate tokens regularly
- Review security-sensitive changes manually

## License

MIT
