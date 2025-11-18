#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { PipelineOrchestrator } from './orchestrator.js';
import { GitHubService } from './services/github.js';
import { getCostTracker } from './utils/cost-tracker.js';
import { getGitHubMCPClient } from './integrations/github-mcp.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'OPENAI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize services
const githubService = new GitHubService(
  process.env.GITHUB_TOKEN!,
  process.env.GITHUB_OWNER!,
  process.env.GITHUB_REPO!
);

const orchestrator = new PipelineOrchestrator(
  githubService,
  process.env.OPENAI_API_KEY!,
  process.env.GITHUB_OWNER!,
  process.env.GITHUB_REPO!,
  process.env.PERPLEXITY_API_KEY // Optional Perplexity for analyst
);

// Initialize GitHub MCP client (if enabled)
const githubMCP = getGitHubMCPClient();
githubMCP.connect().catch(err => {
  console.warn('GitHub MCP Server connection failed:', err.message);
});

// Define MCP tools
const TOOLS: Tool[] = [
  {
    name: 'process_issue',
    description: 'Automatically process a GitHub issue through the full development pipeline with role-based AI agents',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number to process'
        },
        skipAnalyst: {
          type: 'boolean',
          description: 'Skip the analyst agent (use for simple bugs with clear requirements)',
          default: false
        },
        skipArchitect: {
          type: 'boolean',
          description: 'Skip the architect agent (use for simple changes with no design impact)',
          default: false
        },
        dryRun: {
          type: 'boolean',
          description: 'Run the pipeline without creating a PR (for testing)',
          default: false
        }
      },
      required: ['issueNumber']
    }
  },
  {
    name: 'get_pipeline_status',
    description: 'Get the current status of an issue in the pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number'
        }
      },
      required: ['issueNumber']
    }
  },
  {
    name: 'analyze_issue_complexity',
    description: 'Analyze an issue and determine its complexity score and recommended approach',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number to analyze'
        }
      },
      required: ['issueNumber']
    }
  },
  {
    name: 'approve_pipeline_stage',
    description: 'Approve a pipeline stage that requires human review',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number'
        },
        stage: {
          type: 'string',
          description: 'The pipeline stage to approve',
          enum: ['analysis', 'design', 'implementation', 'testing', 'review']
        },
        approved: {
          type: 'boolean',
          description: 'Whether to approve or reject'
        },
        comments: {
          type: 'string',
          description: 'Optional feedback or instructions'
        }
      },
      required: ['issueNumber', 'stage', 'approved']
    }
  },
  {
    name: 'retry_pipeline_stage',
    description: 'Retry a failed pipeline stage with optional modifications',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number'
        },
        stage: {
          type: 'string',
          description: 'The pipeline stage to retry',
          enum: ['analysis', 'design', 'implementation', 'testing', 'review']
        },
        instructions: {
          type: 'string',
          description: 'Additional instructions for the retry'
        }
      },
      required: ['issueNumber', 'stage']
    }
  },
  {
    name: 'get_cost_report',
    description: 'Get a detailed cost report of OpenAI API usage for the current month',
    inputSchema: {
      type: 'object',
      properties: {
        detailed: {
          type: 'boolean',
          description: 'Include detailed breakdown by agent',
          default: true
        }
      }
    }
  },
  {
    name: 'list_github_mcp_tools',
    description: 'List available tools from GitHub MCP server (if enabled)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'chiro-erp-issue-pipeline',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'process_issue': {
        const { issueNumber, skipAnalyst, skipArchitect, dryRun } = args as any;
        
        console.error(`[MCP] Processing issue #${issueNumber}`);
        
        const result = await orchestrator.processIssue(issueNumber, {
          skipAnalyst: skipAnalyst || false,
          skipArchitect: skipArchitect || false,
          dryRun: dryRun || false
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_pipeline_status': {
        const { issueNumber } = args as any;
        const status = await orchestrator.getStatus(issueNumber);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2)
            }
          ]
        };
      }

      case 'analyze_issue_complexity': {
        const { issueNumber } = args as any;
        const analysis = await orchestrator.analyzeComplexity(issueNumber);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2)
            }
          ]
        };
      }

      case 'approve_pipeline_stage': {
        const { issueNumber, stage, approved, comments } = args as any;
        const result = await orchestrator.approveStage(issueNumber, stage, approved, comments);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'retry_pipeline_stage': {
        const { issueNumber, stage, instructions } = args as any;
        const result = await orchestrator.retryStage(issueNumber, stage, instructions);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_cost_report': {
        const { detailed } = args as any;
        const costTracker = getCostTracker();
        const report = detailed ? costTracker.getDetailedReport() : JSON.stringify(costTracker.getSummary(), null, 2);

        return {
          content: [
            {
              type: 'text',
              text: report
            }
          ]
        };
      }

      case 'list_github_mcp_tools': {
        if (!githubMCP.isEnabled()) {
          return {
            content: [
              {
                type: 'text',
                text: 'GitHub MCP Server is not enabled. Set USE_GITHUB_MCP_SERVER=true in .env to enable.'
              }
            ]
          };
        }

        const tools = await githubMCP.listTools();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tools, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`[MCP] Error executing ${name}:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            stack: error.stack
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Chiro ERP Issue Pipeline Orchestrator started');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
