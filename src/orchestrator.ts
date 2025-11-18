import { GitHubService, GitHubIssue } from './services/github.js';
import { AIAgent, AgentContext } from './agents/ai-agent.js';
import { AGENT_ROLES } from './agents/roles.js';
import fs from 'fs';
import path from 'path';
import { PipelineStateManager } from './state-manager.js';

export interface PipelineOptions {
  skipAnalyst?: boolean;
  skipArchitect?: boolean;
  dryRun?: boolean;
}

export interface PipelineStage {
  name: string;
  agent: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped' | 'awaiting-approval';
  output?: string;
  artifacts?: any;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface PipelineState {
  issueNumber: number;
  stages: PipelineStage[];
  currentStage?: string;
  createdAt: Date;
  updatedAt: Date;
  pullRequestNumber?: number;
  branchName?: string;
  artifacts?: any[];
}

export class PipelineOrchestrator {
  private github: GitHubService;
  private stateManager: PipelineStateManager;
  private openaiApiKey: string;
  private perplexityApiKey?: string;
  private owner: string;
  private repo: string;

  constructor(github: GitHubService, openaiApiKey: string, owner: string, repo: string, perplexityApiKey?: string) {
    this.github = github;
    this.stateManager = new PipelineStateManager(github);
    this.openaiApiKey = openaiApiKey;
    this.perplexityApiKey = perplexityApiKey;
    this.owner = owner;
    this.repo = repo;
  }

  async processIssue(issueNumber: number, options: PipelineOptions = {}): Promise<any> {
    console.log(`\n🚀 Starting pipeline for issue #${issueNumber}`);

    try {
      // Load existing state or initialize new pipeline
      let pipeline = await this.stateManager.loadPipelineState(issueNumber);
      
      if (!pipeline) {
        // Fetch issue details
        const issue = await this.github.getIssue(issueNumber);
        
        // Initialize pipeline state
        pipeline = this.initializePipeline(issueNumber, options);
        await this.stateManager.savePipelineState(issueNumber, pipeline);

        // Add initial comment
        await this.github.addComment(
          issueNumber,
          `🤖 **Automated Pipeline Started**\n\nI'm processing this issue through the automated development pipeline with specialized AI agents.\n\n**Pipeline Stages:**\n${this.formatPipelineStatus(pipeline)}\n\nI'll update this issue with progress as I work through each stage.`
        );

        // Add label
        await this.github.addLabel(issueNumber, 'pipeline:in-progress');

        // Create feature branch
        const branchName = `feature/issue-${issueNumber}`;
        pipeline.branchName = branchName;
        
        try {
          await this.github.createBranch(branchName);
          console.log(`✅ Created branch: ${branchName}`);
        } catch (error: any) {
          if (!error.message?.includes('already exists')) {
            throw error;
          }
          console.log(`ℹ️  Branch ${branchName} already exists, using existing branch`);
        }
        
        await this.stateManager.savePipelineState(issueNumber, pipeline);
      }

      // Load project context
      const issue = await this.github.getIssue(issueNumber);
      const context = await this.loadProjectContext(issue);

      // Execute pipeline stages
      await this.executePipeline(issue, pipeline, context, options);

      // Create Pull Request (if not dry run and we have code changes)
      if (!options.dryRun && pipeline.stages.every(s => s.status === 'completed' || s.status === 'skipped')) {
        await this.pushArtifactsOrFail(pipeline);
        // Verify we have commits before creating PR
        const hasCommits = await this.verifyBranchHasCommits(pipeline.branchName!, 'main');
        if (hasCommits) {
          await this.createPullRequest(issue, pipeline);
        } else {
          throw new Error('No code changes were generated. Pipeline completed but no commits were made to the branch.');
        }
      }

      // Final update
      await this.github.removeLabel(issueNumber, 'pipeline:in-progress');
      await this.github.addLabel(issueNumber, 'pipeline:completed');
      
      await this.github.addComment(
        issueNumber,
        `✅ **Pipeline Completed Successfully**\n\n${options.dryRun ? '*(Dry run - no PR created)*' : `Pull Request: #${pipeline.pullRequestNumber}`}\n\n**Final Status:**\n${this.formatPipelineStatus(pipeline)}`
      );

      console.log(`\n✅ Pipeline completed for issue #${issueNumber}`);

      return {
        success: true,
        issueNumber,
        pullRequestNumber: pipeline.pullRequestNumber,
        branchName: pipeline.branchName,
        stages: pipeline.stages
      };

    } catch (error: any) {
      console.error(`\n❌ Pipeline failed for issue #${issueNumber}:`, error);

      await this.github.removeLabel(issueNumber, 'pipeline:in-progress');
      await this.github.addLabel(issueNumber, 'pipeline:failed');
      
      await this.github.addComment(
        issueNumber,
        `❌ **Pipeline Failed**\n\nError: ${error.message}\n\nPlease review the logs and retry if appropriate.`
      );

      return {
        success: false,
        issueNumber,
        error: error.message
      };
    }
  }

  private initializePipeline(issueNumber: number, options: PipelineOptions): PipelineState {
    const stages: PipelineStage[] = [
      { name: 'Analysis', agent: 'analyst', status: options.skipAnalyst ? 'skipped' : 'pending' },
      { name: 'Architecture', agent: 'architect', status: options.skipArchitect ? 'skipped' : 'pending' },
      { name: 'Implementation', agent: 'developer', status: 'pending' },
      { name: 'Testing', agent: 'tester', status: 'pending' },
      { name: 'Code Review', agent: 'reviewer', status: 'pending' }
    ];

    return {
      issueNumber,
      stages,
      createdAt: new Date(),
      updatedAt: new Date(),
      artifacts: []
    };
  }

  private async loadProjectContext(issue: GitHubIssue): Promise<AgentContext> {
    console.log('📚 Loading project context...');

    // Load architecture documentation
    const architecture = this.redactSensitiveData(await this.github.getFileContent('docs/ARCHITECTURE.md'));
    
    // Load ADRs
    const adrFiles = await this.github.listADRFiles();
    const adrs: string[] = [];
    
    for (const adrFile of adrFiles) {
      const content = await this.github.getFileContent(`docs/adr/${adrFile}`);
      adrs.push(`## ${adrFile}\n${this.redactSensitiveData(content)}`);
    }

    return {
      projectRoot: `https://github.com/${this.owner}/${this.repo}`,
      architecture,
      adrs,
      issueContext: { ...issue, body: this.redactSensitiveData(issue.body) },
      previousAgentOutputs: new Map()
    };
  }

  private async executePipeline(
    issue: GitHubIssue,
    pipeline: PipelineState,
    context: AgentContext,
    options: PipelineOptions
  ): Promise<void> {
    for (const stage of pipeline.stages) {
      if (stage.status === 'skipped' || stage.status === 'completed') {
        console.log(`⏭️  Skipping stage: ${stage.name}`);
        continue;
      }

      if (stage.status === 'awaiting-approval') {
        console.log(`⏸️  Awaiting approval for stage: ${stage.name}`);
        break;
      }

      pipeline.currentStage = stage.name;
      pipeline.updatedAt = new Date();
      
      // Save state before starting stage
      await this.stateManager.savePipelineState(pipeline.issueNumber, pipeline);

      console.log(`\n📍 Executing stage: ${stage.name}`);
      
      stage.status = 'in-progress';
      stage.startedAt = new Date();

      // Update issue with progress
      await this.github.addComment(
        issue.number,
        `⏳ **${stage.name}** - In Progress\n\nThe ${AGENT_ROLES[stage.agent].name} is working...`
      );

      try {
        // Execute agent (with Perplexity for analyst)
        const agent = new AIAgent(stage.agent, this.openaiApiKey, this.perplexityApiKey);
        const task = this.buildTaskForStage(stage.name, issue, context);
        
        const response = await agent.execute(task, context);

        // Store output for next agents
        context.previousAgentOutputs.set(stage.agent, response.output);

        stage.status = 'completed';
        stage.completedAt = new Date();
        stage.output = response.output;
        stage.artifacts = response.artifacts;
        if (response.artifacts) {
          pipeline.artifacts = pipeline.artifacts || [];
          pipeline.artifacts.push(response.artifacts);
        }
        
        // Save state after completing stage
        await this.stateManager.savePipelineState(pipeline.issueNumber, pipeline);

        console.log(`✅ Completed stage: ${stage.name}`);

        // Update issue with results
        await this.github.addComment(
          issue.number,
          `✅ **${stage.name}** - Completed\n\n<details>\n<summary>View Output</summary>\n\n${response.output}\n\n</details>`
        );

        // Check if human approval is needed
        if (response.requiresHumanApproval) {
          stage.status = 'awaiting-approval';
          
          // Save state before waiting for approval
          await this.stateManager.savePipelineState(pipeline.issueNumber, pipeline);
          
          await this.github.addComment(
            issue.number,
            `⚠️ **Human Approval Required**\n\nThis stage requires human review before proceeding. Please review the output above and use the approval tool to continue.`
          );
          
          // Wait for approval (in real implementation, this would be event-driven)
          console.log(`⏸️  Waiting for approval on stage: ${stage.name}`);
          break; // Stop pipeline until approved
        }

      } catch (error: any) {
        stage.status = 'failed';
        stage.completedAt = new Date();
        stage.error = error.message;
        
        // Save state after error
        await this.stateManager.savePipelineState(pipeline.issueNumber, pipeline);

        console.error(`❌ Failed stage: ${stage.name}`, error);

        await this.github.addComment(
          issue.number,
          `❌ **${stage.name}** - Failed\n\nError: ${error.message}\n\nThe pipeline has been halted. Use the retry tool to continue.`
        );

        throw error;
      }
    }
  }

  private buildTaskForStage(stageName: string, issue: GitHubIssue, context: AgentContext): string {
    switch (stageName) {
      case 'Analysis':
        return `Analyze this issue and provide structured requirements:\n\n**Title:** ${issue.title}\n\n**Description:**\n${issue.body}\n\n**Labels:** ${issue.labels.join(', ')}`;
      
      case 'Architecture':
        return `Design the technical solution for this feature based on the analysis provided. Ensure it follows our architectural patterns and integrates properly with existing bounded contexts.`;
      
      case 'Implementation':
        return `Implement the solution based on the architectural design. Generate complete, production-ready Kotlin/Quarkus code following our project structure and patterns. Return JSON: {"summary": "...", "files": [{"path": "...", "content": "..."}]}.`;
      
      case 'Testing':
        return `Create comprehensive tests for the implementation using Kotlin (JUnit 5/Testcontainers). Return JSON: {"summary": "...", "files": [{"path": "...", "content": "..."}]}.`;
      
      case 'Code Review':
        return `Review the implementation and tests. Check for code quality, security issues, HIPAA compliance, and best practices. Provide approval or feedback. Return JSON: {"summary": "...", "issues": [...]}.`;
      
      default:
        return `Process this issue: ${issue.title}`;
    }
  }

  private async createPullRequest(issue: GitHubIssue, pipeline: PipelineState): Promise<void> {
    console.log('\n📝 Creating pull request...');

    const prBody = this.buildPRDescription(issue, pipeline);

    const prNumber = await this.github.createPullRequest({
      title: `[Issue #${issue.number}] ${issue.title}`,
      body: prBody,
      head: pipeline.branchName!,
      base: 'main',
      draft: false
    });

    pipeline.pullRequestNumber = prNumber;

    console.log(`✅ Created PR #${prNumber}`);

    // Link PR to issue
    await this.github.addComment(
      issue.number,
      `🔗 Pull Request created: #${prNumber}`
    );
  }

  private buildPRDescription(issue: GitHubIssue, pipeline: PipelineState): string {
    const sections = [
      `## Related Issue`,
      `Closes #${issue.number}`,
      ``,
      `## Description`,
      issue.body,
      ``,
      `## Automated Pipeline Summary`,
      `This PR was generated by the automated development pipeline using specialized AI agents.`,
      ``
    ];

    // Add outputs from each stage
    for (const stage of pipeline.stages) {
      if (stage.status === 'completed' && stage.output) {
        sections.push(`### ${stage.name}`);
        sections.push(`<details>`);
        sections.push(`<summary>View ${stage.name} Details</summary>`);
        sections.push(``);
        sections.push(stage.output);
        sections.push(``);
        sections.push(`</details>`);
        sections.push(``);
      }
    }

    sections.push(`## Checklist`);
    sections.push(`- [x] Code follows project patterns and conventions`);
    sections.push(`- [x] Tests have been added/updated`);
    sections.push(`- [x] Code review completed by AI reviewer`);
    sections.push(`- [ ] Human review (if required)`);

    return sections.join('\n');
  }

  private formatPipelineStatus(pipeline: PipelineState): string {
    const statusEmoji = {
      pending: '⏳',
      'in-progress': '🔄',
      completed: '✅',
      failed: '❌',
      skipped: '⏭️',
      'awaiting-approval': '⏸️'
    };

    return pipeline.stages
      .map(stage => `${statusEmoji[stage.status]} **${stage.name}**: ${stage.status}`)
      .join('\n');
  }

  async getStatus(issueNumber: number): Promise<PipelineState | null> {
    return await this.stateManager.loadPipelineState(issueNumber);
  }

  async analyzeComplexity(issueNumber: number): Promise<any> {
    const issue = await this.github.getIssue(issueNumber);
    
    // Simple complexity scoring
    let score = 0;
    const factors: string[] = [];

    // Check keywords
    const complexKeywords = ['architecture', 'refactor', 'migration', 'breaking change'];
    const body = (issue.title + ' ' + issue.body).toLowerCase();
    
    complexKeywords.forEach(keyword => {
      if (body.includes(keyword)) {
        score += 3;
        factors.push(`Contains keyword: ${keyword}`);
      }
    });

    // Check labels
    if (issue.labels.includes('enhancement')) score += 2;
    if (issue.labels.includes('breaking-change')) score += 5;
    if (issue.labels.includes('security')) score += 4;

    // Length of description
    if (issue.body.length > 1000) {
      score += 2;
      factors.push('Long description');
    }

    const complexity = score < 5 ? 'low' : score < 10 ? 'medium' : 'high';
    const autoImplementable = score < 8;

    return {
      issueNumber,
      complexityScore: score,
      complexity,
      autoImplementable,
      factors,
      recommendation: autoImplementable 
        ? 'This issue can be automatically implemented'
        : 'This issue should have human oversight during implementation'
    };
  }

  async approveStage(issueNumber: number, stage: string, approved: boolean, comments?: string): Promise<any> {
    const pipeline = await this.stateManager.loadPipelineState(issueNumber);
    if (!pipeline) {
      throw new Error(`No pipeline found for issue #${issueNumber}`);
    }

    const stageObj = pipeline.stages.find((s: PipelineStage) => s.name.toLowerCase() === stage.toLowerCase());
    if (!stageObj) {
      throw new Error(`Stage not found: ${stage}`);
    }

    if (approved) {
      stageObj.status = 'completed';
      await this.github.addComment(
        issueNumber,
        `✅ **${stageObj.name}** - Approved\n\n${comments || 'Stage approved, continuing pipeline...'}`
      );
      
      // Save state and resume pipeline
      await this.stateManager.savePipelineState(issueNumber, pipeline);
      
      // Resume pipeline execution
      const issue = await this.github.getIssue(issueNumber);
      const context = await this.loadProjectContext(issue);
      pipeline.stages
        .filter(s => s.status === 'completed' && s.output)
        .forEach(s => context.previousAgentOutputs.set(s.agent, s.output));
      await this.executePipeline(issue, pipeline, context, {});
      
    } else {
      stageObj.status = 'failed';
      await this.github.addComment(
        issueNumber,
        `❌ **${stageObj.name}** - Rejected\n\n${comments || 'Stage rejected, pipeline halted.'}`
      );
    }

    return { success: true, stage: stageObj.name, approved };
  }

  async retryStage(issueNumber: number, stage: string, instructions?: string): Promise<any> {
    const pipeline = await this.stateManager.loadPipelineState(issueNumber);
    if (!pipeline) {
      throw new Error(`No pipeline found for issue #${issueNumber}`);
    }

    const stageObj = pipeline.stages.find((s: PipelineStage) => s.name.toLowerCase() === stage.toLowerCase());
    if (!stageObj) {
      throw new Error(`Stage not found: ${stage}`);
    }

    stageObj.status = 'pending';
    stageObj.error = undefined;
    
    await this.stateManager.savePipelineState(issueNumber, pipeline);

    await this.github.addComment(
      issueNumber,
      `🔄 **Retrying ${stageObj.name}**\n\n${instructions || 'Retrying stage with original parameters...'}`
    );
    
    // Resume pipeline execution from this stage
    const issue = await this.github.getIssue(issueNumber);
    const context = await this.loadProjectContext(issue);
    pipeline.stages
      .filter(s => s.status === 'completed' && s.output)
      .forEach(s => context.previousAgentOutputs.set(s.agent, s.output));
    await this.executePipeline(issue, pipeline, context, {});

    return { success: true, stage: stageObj.name, status: 'pending' };
  }

  private async pushArtifactsOrFail(pipeline: PipelineState) {
    const files = (pipeline.artifacts || [])
      .flatMap((artifact: any) => artifact?.files || [])
      .filter((file: any) => file?.path && typeof file.path === 'string' && typeof file.content === 'string');

    if (!files.length) {
      throw new Error('Pipeline produced no code changes; aborting PR creation.');
    }

    await this.github.applyArtifactsAndPush(
      {
        files,
        commitMessage: `chore: apply pipeline artifacts for issue #${pipeline.issueNumber}`
      },
      pipeline.branchName!
    );
  }

  private async verifyBranchHasCommits(branch: string, baseBranch: string): Promise<boolean> {
    try {
      const comparison = await this.github.compareBranches(baseBranch, branch);
      return comparison.totalCommits > 0;
    } catch (error) {
      console.error('Error verifying branch commits:', error);
      return false;
    }
  }

  private async applyCodeChanges(branch: string, files: Map<string, string>, commitMessage: string): Promise<void> {
    for (const [filePath, content] of files.entries()) {
      await this.github.createOrUpdateFile(filePath, content, commitMessage, branch);
    }
  }

  private redactSensitiveData(content: string): string {
    if (!content) return content;
    return content
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
      .replace(/\+?\d[\d\s.-]{7,}\d/g, '[REDACTED_PHONE]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_ID]');
  }
}
