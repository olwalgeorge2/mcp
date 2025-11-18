/**
 * API Connection Test Script
 * Tests OpenAI and Perplexity API connections
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface TestResult {
  service: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  cost?: number;
  tokens?: number;
}

async function testOpenAI(): Promise<TestResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      service: 'OpenAI',
      status: 'skipped',
      message: '❌ OPENAI_API_KEY not found in .env file'
    };
  }

  try {
    console.log('\n🔄 Testing OpenAI connection...');
    console.log(`   Model: ${process.env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
    
    const openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: false,
      maxRetries: 2,
      timeout: 30000
    });
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" in one word.' }
      ],
      max_tokens: 10,
      temperature: 0.1
    });

    const usage = response.usage;
    const cost = usage 
      ? (usage.prompt_tokens * 0.0015 + usage.completion_tokens * 0.002) / 1000 
      : 0;

    return {
      service: 'OpenAI',
      status: 'success',
      message: `✅ Connected successfully! Model: ${response.model}`,
      cost,
      tokens: usage?.total_tokens
    };
  } catch (error: any) {
    // If it's a quota error with gpt-5.1-codex, try with gpt-4o-mini as fallback
    if (error.status === 429 && process.env.OPENAI_MODEL === 'gpt-5.1-codex') {
      try {
        console.log('   ⚠️  Quota issue with gpt-5.1-codex, trying gpt-4o-mini...');
        const openai = new OpenAI({ apiKey });
        const fallbackResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "Hello" in one word.' }
          ],
          max_tokens: 10,
          temperature: 0.1
        });
        
        return {
          service: 'OpenAI',
          status: 'success',
          message: `✅ Connected successfully! Model: ${fallbackResponse.model} (fallback from gpt-5.1-codex due to quota)`,
          cost: 0,
          tokens: fallbackResponse.usage?.total_tokens
        };
      } catch (fallbackError: any) {
        return {
          service: 'OpenAI',
          status: 'failed',
          message: `❌ Connection failed: ${error.message}\n   Fallback also failed: ${fallbackError.message}`
        };
      }
    }
    
    return {
      service: 'OpenAI',
      status: 'failed',
      message: `❌ Connection failed: ${error.message}`
    };
  }
}

async function testPerplexity(): Promise<TestResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    return {
      service: 'Perplexity',
      status: 'skipped',
      message: '⚠️  PERPLEXITY_API_KEY not found (optional - using OpenAI for all agents)'
    };
  }

  try {
    console.log('\n🔄 Testing Perplexity connection...');
    const perplexity = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai'
    });
    
    const response = await perplexity.chat.completions.create({
      model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the current date? Answer in one sentence.' }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const usage = response.usage;
    const cost = usage 
      ? (usage.prompt_tokens * 0.001 + usage.completion_tokens * 0.001) / 1000 
      : 0;

    return {
      service: 'Perplexity',
      status: 'success',
      message: `✅ Connected successfully! Model: ${response.model}`,
      cost,
      tokens: usage?.total_tokens
    };
  } catch (error: any) {
    return {
      service: 'Perplexity',
      status: 'failed',
      message: `❌ Connection failed: ${error.message}`
    };
  }
}

async function testGitHub(): Promise<TestResult> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  
  if (!token || !owner || !repo) {
    return {
      service: 'GitHub',
      status: 'skipped',
      message: '❌ GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO not found in .env file'
    };
  }

  try {
    console.log('\n🔄 Testing GitHub connection...');
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      service: 'GitHub',
      status: 'success',
      message: `✅ Connected successfully! Repo: ${data.full_name} (${data.visibility})`
    };
  } catch (error: any) {
    return {
      service: 'GitHub',
      status: 'failed',
      message: `❌ Connection failed: ${error.message}`
    };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   🧪 API Connection Test Suite                        ║');
  console.log('║   Issue Pipeline Orchestrator                          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const results: TestResult[] = [];

  // Test all services
  results.push(await testOpenAI());
  results.push(await testPerplexity());
  results.push(await testGitHub());

  // Print summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  let totalCost = 0;
  let totalTokens = 0;
  
  for (const result of results) {
    console.log(`\n${result.service}:`);
    console.log(`  Status: ${result.message}`);
    
    if (result.cost) {
      console.log(`  Cost: $${result.cost.toFixed(6)}`);
      totalCost += result.cost;
    }
    
    if (result.tokens) {
      console.log(`  Tokens: ${result.tokens}`);
      totalTokens += result.tokens;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📈 TOTALS');
  console.log('═'.repeat(60));
  console.log(`Total Cost: $${totalCost.toFixed(6)}`);
  console.log(`Total Tokens: ${totalTokens}`);
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 FINAL STATUS');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`⚠️  Skipped: ${skippedCount}`);
  
  if (failedCount > 0) {
    console.log('\n❌ Some tests failed. Please check your .env configuration.');
    process.exit(1);
  } else if (successCount === 0) {
    console.log('\n⚠️  No tests passed. Please configure your .env file.');
    process.exit(1);
  } else {
    console.log('\n✅ All configured services are working!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run cli -- analyze <issue-number>');
    console.log('   2. Check cost report: npm run cli -- cost-report');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
