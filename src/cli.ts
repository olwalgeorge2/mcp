#!/usr/bin/env node
/**
 * CLI interface for the Issue Pipeline Orchestrator
 * Used by GitHub Actions and for manual testing
 */

import dotenv from 'dotenv';
import { PipelineOrchestrator } from './orchestrator.js';
import { GitHubService } from './services/github.js';

dotenv.config();

const args = process.argv.slice(2);
const command = args[0];
const issueNumber = parseInt(args[1], 10);

if (!command) {
  console.error('Usage: cli.js <command> <issueNumber> [options]');
  console.error('Commands:');
  console.error('  process-issue         - Process issue through full pipeline');
  console.error('  analyze-complexity    - Analyze issue complexity');
  console.error('  get-status           - Get pipeline status');
  console.error('  retry-stage          - Retry a failed stage');
  process.exit(1);
}

// Initialize services
const github = new GitHubService(
  process.env.GITHUB_TOKEN!,
  process.env.GITHUB_OWNER!,
  process.env.GITHUB_REPO!
);

const orchestrator = new PipelineOrchestrator(
  github,
  process.env.OPENAI_API_KEY!,
  process.env.GITHUB_OWNER!,
  process.env.GITHUB_REPO!
);

async function main() {
  try {
    switch (command) {
      case 'process-issue': {
        const skipAnalyst = args.includes('--skip-analyst');
        const skipArchitect = args.includes('--skip-architect');
        const dryRun = args.includes('--dry-run');

        const result = await orchestrator.processIssue(issueNumber, {
          skipAnalyst,
          skipArchitect,
          dryRun
        });

        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
        break;
      }

      case 'analyze-complexity': {
        const result = await orchestrator.analyzeComplexity(issueNumber);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'get-status': {
        const status = await orchestrator.getStatus(issueNumber);
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      case 'retry-stage': {
        const stage = args[2];
        if (!stage) {
          console.error('Usage: retry-stage <issueNumber> <stage>');
          process.exit(1);
        }
        const result = await orchestrator.retryStage(issueNumber, stage);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
