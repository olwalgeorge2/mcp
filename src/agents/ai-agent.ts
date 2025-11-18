import OpenAI from 'openai';
import { AgentRole, getAgentRole } from './roles.js';
import { getCostTracker } from '../utils/cost-tracker.js';

export interface AgentContext {
  projectRoot: string;
  architecture: string;
  adrs: string[];
  issueContext: any;
  previousAgentOutputs: Map<string, any>;
}

export interface AgentResponse {
  role: string;
  output: string;
  artifacts?: any;
  nextAgent?: string;
  requiresHumanApproval?: boolean;
}

export class AIAgent {
  private openai: OpenAI;
  private perplexity?: OpenAI;
  private role: AgentRole;

  constructor(roleName: string, apiKey: string, perplexityKey?: string) {
    this.role = getAgentRole(roleName);
    this.openai = new OpenAI({ apiKey });
    
    // Initialize Perplexity for analyst agent
    if (roleName === 'analyst' && perplexityKey) {
      this.perplexity = new OpenAI({
        apiKey: perplexityKey,
        baseURL: 'https://api.perplexity.ai'
      });
    }
  }

  async execute(
    task: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    if (process.env.OFFLINE_MODE === 'true') {
      return {
        role: this.role.name,
        output: 'Offline mode enabled—skipping API call.',
        artifacts: undefined,
        nextAgent: undefined,
        requiresHumanApproval: false
      };
    }

    console.log(`[${this.role.name}] Starting task...`);

    // Build the full context for the agent
    const fullContext = this.buildContext(context);
    
    // Use Perplexity for analyst (real-time research) or OpenAI for others
    const client = this.role.name === 'Business Analyst' && this.perplexity 
      ? this.perplexity 
      : this.openai;
    
    const model = this.role.name === 'Business Analyst' && this.perplexity
      ? process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-large-128k-online'
      : process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    if (this.role.name === 'Business Analyst' && this.perplexity) {
      console.log(`[${this.role.name}] Using Perplexity for real-time research...`);
    }
    
    // Call AI API with the agent's specialized prompt
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: this.role.systemPrompt },
        { role: 'system', content: 'Always respond in JSON with fields: summary (string), files (array of {path, content} if code changes), requiresHumanApproval (boolean).' },
        { role: 'user', content: fullContext },
        { role: 'user', content: task }
      ],
      max_tokens: this.role.maxTokens,
      temperature: this.role.temperature
    });

    // Track cost
    const usage = response.usage;
    if (usage) {
      const costTracker = getCostTracker();
      const provider = this.role.name === 'Business Analyst' && this.perplexity ? 'perplexity' : 'openai';
      await costTracker.trackCall(
        response.model,
        usage.prompt_tokens,
        usage.completion_tokens,
        this.role.name,
        'execute_task',
        provider
      );

      if (process.env.VERBOSE_AGENT_LOGS === 'true') {
        console.log(`[${this.role.name}] Token usage: ${usage.total_tokens} (prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens})`);
      }
    }

    const rawOutput = response.choices[0].message.content || '';
    const parsed = this.tryParseJson(rawOutput);
    const output = parsed?.summary || rawOutput;
    
    console.log(`[${this.role.name}] Task completed`);

    // Parse the output to determine next steps
    const nextAgent = this.determineNextAgent(output);
    const requiresApproval = parsed?.requiresHumanApproval ?? this.checkIfApprovalNeeded(output);

    return {
      role: this.role.name,
      output,
      nextAgent,
      artifacts: parsed?.files ? { files: parsed.files } : undefined,
      requiresHumanApproval: requiresApproval
    };
  }

  private buildContext(context: AgentContext): string {
    const parts = [
      '=== PROJECT CONTEXT ===',
      '',
      '## Architecture Overview',
      context.architecture,
      '',
      '## Relevant ADRs',
      ...context.adrs,
      '',
      '## Issue Context',
      JSON.stringify(context.issueContext, null, 2),
      ''
    ];

    // Include previous agent outputs
    if (context.previousAgentOutputs.size > 0) {
      parts.push('## Previous Agent Outputs', '');
      context.previousAgentOutputs.forEach((output, agent) => {
        parts.push(`### ${agent}`, output, '');
      });
    }

    return parts.join('\n');
  }

  private determineNextAgent(output: string): string | undefined {
    // Simple heuristic - can be made more sophisticated
    const lowerOutput = output.toLowerCase();
    
    if (this.role.name === 'Business Analyst') {
      return 'architect';
    } else if (this.role.name === 'Solutions Architect') {
      return 'developer';
    } else if (this.role.name === 'Senior Developer') {
      return 'tester';
    } else if (this.role.name === 'QA Engineer') {
      return 'reviewer';
    }
    
    return undefined;
  }

  private checkIfApprovalNeeded(output: string): boolean {
    const lowerOutput = output.toLowerCase();
    
    // Keywords that indicate human approval might be needed
    const approvalKeywords = [
      'breaking change',
      'architectural decision',
      'security concern',
      'hipaa',
      'compliance',
      'human review needed',
      'requires approval'
    ];

    return approvalKeywords.some(keyword => lowerOutput.includes(keyword));
  }

  private tryParseJson(output: string): any | null {
    try {
      const cleaned = output.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  async callTool(toolName: string, args: any): Promise<any> {
    // Tool implementations would go here
    console.log(`[${this.role.name}] Calling tool: ${toolName}`);
    
    switch (toolName) {
      case 'analyze_requirements':
        return this.analyzeRequirements(args);
      case 'create_user_stories':
        return this.createUserStories(args);
      case 'design_components':
        return this.designComponents(args);
      case 'generate_code':
        return this.generateCode(args);
      case 'generate_tests':
        return this.generateTests(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async analyzeRequirements(args: any): Promise<any> {
    // Implementation for requirements analysis
    return { status: 'analyzed', details: args };
  }

  private async createUserStories(args: any): Promise<any> {
    // Implementation for user story creation
    return { status: 'created', stories: [] };
  }

  private async designComponents(args: any): Promise<any> {
    // Implementation for component design
    return { status: 'designed', components: [] };
  }

  private async generateCode(args: any): Promise<any> {
    // Implementation for code generation
    return { status: 'generated', files: [] };
  }

  private async generateTests(args: any): Promise<any> {
    // Implementation for test generation
    return { status: 'generated', tests: [] };
  }
}
