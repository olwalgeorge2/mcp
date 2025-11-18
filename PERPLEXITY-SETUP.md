# Perplexity Integration for Business Analyst

## Overview

The **Business Analyst** agent now uses **Perplexity AI** for real-time web research capabilities, while other agents continue to use OpenAI. This gives your analyst agent access to up-to-date information when analyzing requirements.

## Benefits

- 🌐 **Real-time Web Search**: Analyst can research current technologies, frameworks, and best practices
- 💰 **Cost-Effective**: Perplexity pricing is generally lower than GPT-4 (~$0.001/1K tokens vs $0.01/1K tokens)
- 📊 **Current Information**: Access to latest documentation, API changes, and industry trends
- 🎯 **Specialized Models**: Sonar models designed specifically for research and information retrieval

## Setup Instructions

### 1. Get Perplexity API Key

1. Go to https://www.perplexity.ai/settings/api
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the key

### 2. Update `.env` File

Open your `.env` file and add:

```bash
# Perplexity Configuration (for Business Analyst)
PERPLEXITY_API_KEY=pplx-your-actual-api-key-here

# Recommended model (optional, defaults to this)
PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online
```

### 3. Available Perplexity Models

Choose the model that fits your needs:

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| `llama-3.1-sonar-small-128k-online` | ⚡⚡⚡ | ⭐⭐ | 💰 | Quick research |
| `llama-3.1-sonar-large-128k-online` | ⚡⚡ | ⭐⭐⭐ | 💰💰 | **Recommended** |
| `llama-3.1-sonar-huge-128k-online` | ⚡ | ⭐⭐⭐⭐ | 💰💰💰 | Deep research |

### 4. Test Your Setup

```bash
# Test the pipeline with an issue
npm run cli -- analyze 1
```

The Business Analyst will use Perplexity, and you'll see:
```
[Business Analyst] Using Perplexity for real-time research...
```

## How It Works

### Agent Routing

```typescript
// Analyst uses Perplexity for research
if (roleName === 'analyst' && perplexityKey) {
  this.perplexity = new OpenAI({
    apiKey: perplexityKey,
    baseURL: 'https://api.perplexity.ai'
  });
}

// Other agents continue using OpenAI
const client = this.role.name === 'Business Analyst' && this.perplexity 
  ? this.perplexity 
  : this.openai;
```

### Cost Tracking

Both OpenAI and Perplexity costs are tracked separately:

```bash
# View cost report
npm run cli -- cost-report

# Output includes:
# Costs by Provider:
#   - openai: $0.0234
#   - perplexity: $0.0012
```

## Example Use Cases

### 1. Technology Research
```
Issue: "Implement OAuth2 authentication using latest best practices"

Analyst with Perplexity:
✅ Researches latest OAuth2 standards
✅ Finds current security vulnerabilities
✅ Checks framework-specific implementations
✅ References recent documentation
```

### 2. API Integration
```
Issue: "Integrate with Stripe Payment Gateway"

Analyst with Perplexity:
✅ Gets latest Stripe API version
✅ Finds current best practices
✅ Checks for breaking changes
✅ References up-to-date examples
```

### 3. Framework Updates
```
Issue: "Migrate from Quarkus 2.x to 3.x"

Analyst with Perplexity:
✅ Researches migration guides
✅ Finds common pitfalls
✅ Checks breaking changes
✅ References recent community discussions
```

## Optional: Disable Perplexity

If you want to use only OpenAI for all agents:

1. Simply don't set `PERPLEXITY_API_KEY` in `.env`
2. Or remove the key
3. Analyst will automatically fall back to OpenAI

## Pricing Comparison

| Provider | Model | Cost per 1K tokens | Use Case |
|----------|-------|-------------------|----------|
| Perplexity | sonar-large-128k-online | ~$0.001 | Research & Analysis |
| OpenAI | gpt-4-turbo-preview | ~$0.01 | Code Generation |
| OpenAI | gpt-3.5-turbo | ~$0.0015 | Fast Tasks |

**Example Pipeline Cost:**
- Analyst (Perplexity): $0.0012
- Architect (OpenAI GPT-4): $0.0089
- Developer (OpenAI GPT-4): $0.0156
- Tester (OpenAI GPT-4): $0.0134
- Reviewer (OpenAI GPT-4): $0.0098
- **Total**: ~$0.0489 per issue

## Troubleshooting

### Error: "Missing Perplexity API key"
- Check `.env` file has `PERPLEXITY_API_KEY=...`
- Restart the MCP server after updating `.env`

### Error: "Invalid API key"
- Verify your key at https://www.perplexity.ai/settings/api
- Make sure there are no extra spaces in `.env`

### Analyst Still Using OpenAI
- Check console output for: `[Business Analyst] Using Perplexity for real-time research...`
- Verify `PERPLEXITY_API_KEY` is set in `.env`
- Rebuild: `npm run build`

## Next Steps

1. ✅ Get Perplexity API key
2. ✅ Update `.env` file
3. ✅ Test with: `npm run cli -- analyze 1`
4. ✅ Monitor costs: `npm run cli -- cost-report`
5. ✅ Enjoy better research capabilities!

## Resources

- **Perplexity API Docs**: https://docs.perplexity.ai/
- **API Dashboard**: https://www.perplexity.ai/settings/api
- **Pricing**: https://www.perplexity.ai/pricing

---

**Questions?** Check the main README or open an issue on GitHub.
