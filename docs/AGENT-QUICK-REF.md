# Agent Quick Reference

## 📋 Agent Roles at a Glance

```
Issue Created
    ↓
[Orchestrator] → Analyzes complexity, routes to agents
    ↓
[Analyst] → "What needs to be built?"
    ↓
[Architect] → "How should it be structured?"
    ↓
[Developer] → "Let me write the code"
    ↓
[Tester] → "Let me verify it works"
    ↓
[Reviewer] → "Is it production-ready?"
    ↓
Pull Request Created ✅
```

---

## 🎯 Quick Config

**File**: `src/agents/roles.ts`

**Most Common Changes**:

### 1. Make Developer More Creative
```typescript
developer: {
  temperature: 0.3,  // Change from 0.1 → 0.3
  // More creative solutions, less rigid patterns
}
```

### 2. Make Tester More Thorough
```typescript
tester: {
  maxTokens: 5000,  // Change from 3000 → 5000
  // Generate more test cases
}
```

### 3. Add Industry-Specific Rules
```typescript
analyst: {
  systemPrompt: `...existing prompt...
  
INDUSTRY RULES:
- Healthcare: HIPAA compliance required
- Finance: SOX audit trails mandatory
- Retail: PCI-DSS for payments
  `
}
```

---

## 🔧 How to Modify Agents

### Step 1: Edit Agent Configuration
```bash
# Open the configuration file
code src/agents/roles.ts
```

### Step 2: Rebuild
```bash
npm run build
```

### Step 3: Test
```bash
# Test with a simple issue
npm run cli -- process 1
```

---

## 💡 Tips

**Want faster responses?**
- Lower `maxTokens` for all agents

**Want higher quality?**
- Use `gpt-4` instead of `gpt-4-turbo-preview`
- Lower `temperature` (0.1-0.2)

**Want more creative solutions?**
- Increase `temperature` (0.5-0.7)
- Add examples to `systemPrompt`

**Want specialized behavior?**
- Add more context to `systemPrompt`
- Reference specific ADRs
- Include code examples

---

## 📖 Read Full Guides

- **Part 1**: Analyst, Architect, Developer
  - File: `docs/AGENT-CONFIG-PART1.md`
  
- **Part 2**: Tester, Reviewer, Orchestrator
  - File: `docs/AGENT-CONFIG-PART2.md`

---

## 🚀 What You Can Do Now

1. **View current configuration**:
   ```bash
   code src/agents/roles.ts
   ```

2. **Test a single agent** (coming soon):
   ```bash
   npm run test-agent -- analyst "Add invoice generation"
   ```

3. **Modify and rebuild**:
   ```bash
   npm run build
   ```

4. **Run full pipeline**:
   ```bash
   npm run cli -- process <issue-number>
   ```

Tell me what you want to configure! 🎯
