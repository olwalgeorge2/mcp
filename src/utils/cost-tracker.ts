/**
 * Cost Tracker for OpenAI API Usage
 * Monitors token usage and estimates costs to help manage budget
 */

import fs from 'fs/promises';
import path from 'path';

interface ApiCall {
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  agent?: string;
  operation?: string;
  provider?: string;
}

interface CostSummary {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  callsByModel: Record<string, number>;
  costsByAgent: Record<string, number>;
  costsByProvider: Record<string, number>;
  monthlyBudgetUsed: number;
}

// Pricing per 1K tokens (as of Nov 2024)
const TOKEN_PRICING: Record<string, { prompt: number; completion: number }> = {
  // OpenAI
  'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
  'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
  
  // Perplexity (approximate pricing)
  'llama-3.1-sonar-small-128k-online': { prompt: 0.0002, completion: 0.0002 },
  'llama-3.1-sonar-large-128k-online': { prompt: 0.001, completion: 0.001 },
  'llama-3.1-sonar-huge-128k-online': { prompt: 0.005, completion: 0.005 },
};

export class CostTracker {
  private calls: ApiCall[] = [];
  private logFile: string;
  private monthlyBudget: number;
  private enabled: boolean;

  constructor(
    logFile: string = './logs/api-costs.json',
    monthlyBudget: number = 50
  ) {
    this.logFile = logFile;
    this.monthlyBudget = monthlyBudget;
    this.enabled = process.env.ENABLE_COST_TRACKING !== 'false';
    
    if (this.enabled) {
      this.loadHistory();
    }
  }

  /**
   * Track an API call
   */
  async trackCall(
    model: string,
    promptTokens: number,
    completionTokens: number,
    agent?: string,
    operation?: string,
    provider: string = 'openai'
  ): Promise<void> {
    if (!this.enabled) return;

    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);

    const call: ApiCall = {
      timestamp: new Date().toISOString(),
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      agent,
      operation,
      provider,
    };

    this.calls.push(call);
    await this.saveHistory();

    // Check budget warning
    const summary = this.getSummary();
    if (summary.monthlyBudgetUsed >= 0.8) {
      console.warn(
        `⚠️  Budget Warning: ${(summary.monthlyBudgetUsed * 100).toFixed(1)}% of monthly budget used ($${summary.totalCost.toFixed(2)} / $${this.monthlyBudget})`
      );
    }
  }

  /**
   * Calculate cost for a specific API call
   */
  private calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-3.5-turbo'];
    
    const promptCost = (promptTokens / 1000) * pricing.prompt;
    const completionCost = (completionTokens / 1000) * pricing.completion;
    
    return promptCost + completionCost;
  }

  /**
   * Get summary of current month's usage
   */
  getSummary(): CostSummary {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthCalls = this.calls.filter(
      call => call.timestamp.startsWith(currentMonth)
    );

    const totalCalls = monthCalls.length;
    const totalTokens = monthCalls.reduce((sum, call) => sum + call.totalTokens, 0);
    const totalCost = monthCalls.reduce((sum, call) => sum + call.estimatedCost, 0);

    const callsByModel: Record<string, number> = {};
    const costsByAgent: Record<string, number> = {};
    const costsByProvider: Record<string, number> = {};

    for (const call of monthCalls) {
      callsByModel[call.model] = (callsByModel[call.model] || 0) + 1;
      if (call.agent) {
        costsByAgent[call.agent] = (costsByAgent[call.agent] || 0) + call.estimatedCost;
      }
      if (call.provider) {
        costsByProvider[call.provider] = (costsByProvider[call.provider] || 0) + call.estimatedCost;
      }
    }

    return {
      totalCalls,
      totalTokens,
      totalCost,
      callsByModel,
      costsByAgent,
      costsByProvider,
      monthlyBudgetUsed: totalCost / this.monthlyBudget,
    };
  }

  /**
   * Get detailed report
   */
  getDetailedReport(): string {
    const summary = this.getSummary();
    const currentMonth = new Date().toISOString().slice(0, 7);

    let report = `\n📊 AI API Cost Report (${currentMonth})\n`;
    report += '='.repeat(50) + '\n\n';
    
    report += `Total API Calls: ${summary.totalCalls}\n`;
    report += `Total Tokens Used: ${summary.totalTokens.toLocaleString()}\n`;
    report += `Estimated Cost: $${summary.totalCost.toFixed(4)}\n`;
    report += `Budget Used: ${(summary.monthlyBudgetUsed * 100).toFixed(1)}% of $${this.monthlyBudget}\n\n`;

    report += `Calls by Model:\n`;
    for (const [model, count] of Object.entries(summary.callsByModel)) {
      report += `  - ${model}: ${count} calls\n`;
    }

    report += `\nCosts by Agent:\n`;
    for (const [agent, cost] of Object.entries(summary.costsByAgent)) {
      report += `  - ${agent}: $${cost.toFixed(4)}\n`;
    }

    report += `\nCosts by Provider:\n`;
    for (const [provider, cost] of Object.entries(summary.costsByProvider)) {
      report += `  - ${provider}: $${cost.toFixed(4)}\n`;
    }

    report += '\n' + '='.repeat(50) + '\n';

    return report;
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.logFile, 'utf-8');
      this.calls = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.calls = [];
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(): Promise<void> {
    try {
      const dir = path.dirname(this.logFile);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.logFile, JSON.stringify(this.calls, null, 2));
    } catch (error) {
      console.error('Failed to save cost tracking data:', error);
    }
  }

  /**
   * Clear old data (older than 90 days)
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    this.calls = this.calls.filter(call => call.timestamp >= cutoffString);
    await this.saveHistory();
  }
}

// Singleton instance
let trackerInstance: CostTracker | null = null;

export function getCostTracker(): CostTracker {
  if (!trackerInstance) {
    trackerInstance = new CostTracker(
      process.env.COST_LOG_FILE || './logs/api-costs.json',
      parseFloat(process.env.MONTHLY_BUDGET_LIMIT || '50')
    );
  }
  return trackerInstance;
}
