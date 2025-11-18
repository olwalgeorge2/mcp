/**
 * GitHub MCP Server Integration
 * 
 * This module provides integration with GitHub's official MCP server
 * for enhanced GitHub operations beyond what Octokit provides.
 * 
 * Installation:
 *   npm install @modelcontextprotocol/server-github
 * 
 * Configuration:
 *   Set USE_GITHUB_MCP_SERVER=true in .env
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class GitHubMCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();
  private enabled: boolean;
  private serverPath: string;

  constructor() {
    super();
    this.enabled = process.env.USE_GITHUB_MCP_SERVER === 'true';
    this.serverPath = process.env.GITHUB_MCP_SERVER_PATH || 
      './node_modules/@modelcontextprotocol/server-github/dist/index.js';
  }

  /**
   * Initialize and connect to GitHub MCP server
   */
  async connect(): Promise<void> {
    if (!this.enabled) {
      console.log('ℹ️  GitHub MCP Server integration is disabled');
      return;
    }

    try {
      // Spawn the GitHub MCP server process
      this.process = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GITHUB_TOKEN: process.env.GB_TOKEN, // Use GB_TOKEN for GitHub Copilot/MCP integrations
        },
      });

      // Handle stdout (responses from server)
      this.process.stdout?.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      // Handle stderr (error messages)
      this.process.stderr?.on('data', (data) => {
        console.error('GitHub MCP Server Error:', data.toString());
      });

      // Handle process exit
      this.process.on('exit', (code) => {
        console.log(`GitHub MCP Server exited with code ${code}`);
        this.cleanup();
      });

      // Initialize connection
      await this.initialize();
      console.log('✅ Connected to GitHub MCP Server');
    } catch (error) {
      console.warn('⚠️  Failed to connect to GitHub MCP Server:', error);
      console.log('💡 Falling back to standard GitHub operations');
    }
  }

  /**
   * Initialize the MCP protocol connection
   */
  private async initialize(): Promise<void> {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: true,
        },
      },
      clientInfo: {
        name: 'chiro-erp-pipeline-orchestrator',
        version: '1.0.0',
      },
    });

    return response;
  }

  /**
   * List available tools from GitHub MCP server
   */
  async listTools(): Promise<any[]> {
    if (!this.enabled || !this.process) {
      return [];
    }

    try {
      const response = await this.sendRequest('tools/list', {});
      return response.tools || [];
    } catch (error) {
      console.error('Failed to list GitHub MCP tools:', error);
      return [];
    }
  }

  /**
   * Call a tool on the GitHub MCP server
   */
  async callTool(toolName: string, params: any): Promise<any> {
    if (!this.enabled || !this.process) {
      throw new Error('GitHub MCP Server is not enabled or connected');
    }

    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: params,
    });
  }

  /**
   * Enhanced GitHub operations using MCP server
   */
  
  /**
   * Search repositories with advanced filters
   */
  async searchRepositories(query: string, filters?: any): Promise<any> {
    return this.callTool('search_repositories', { query, ...filters });
  }

  /**
   * Get comprehensive repository insights
   */
  async getRepositoryInsights(owner: string, repo: string): Promise<any> {
    return this.callTool('get_repository_insights', { owner, repo });
  }

  /**
   * Analyze pull request with AI insights
   */
  async analyzePullRequest(owner: string, repo: string, prNumber: number): Promise<any> {
    return this.callTool('analyze_pull_request', { owner, repo, pull_number: prNumber });
  }

  /**
   * Get code review suggestions
   */
  async getReviewSuggestions(owner: string, repo: string, prNumber: number): Promise<any> {
    return this.callTool('get_review_suggestions', { owner, repo, pull_number: prNumber });
  }

  /**
   * Send a request to the MCP server
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin) {
        reject(new Error('MCP server is not connected'));
        return;
      }

      const id = ++this.requestId;
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Send request to server
      this.process.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle response from MCP server
   */
  private handleResponse(data: string): void {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        const response: MCPResponse = JSON.parse(line);
        const pending = this.pendingRequests.get(response.id as number);

        if (pending) {
          this.pendingRequests.delete(response.id as number);

          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse MCP response:', error);
    }
  }

  /**
   * Disconnect from GitHub MCP server
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.process = null;
    this.pendingRequests.clear();
  }

  /**
   * Check if GitHub MCP server is available
   */
  isEnabled(): boolean {
    return this.enabled && this.process !== null;
  }
}

// Singleton instance
let mcpClient: GitHubMCPClient | null = null;

export function getGitHubMCPClient(): GitHubMCPClient {
  if (!mcpClient) {
    mcpClient = new GitHubMCPClient();
  }
  return mcpClient;
}
