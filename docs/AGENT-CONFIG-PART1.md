# Agent Configuration Guide

## 🤖 Current Agent Setup

Your pipeline uses **6 specialized AI agents**, each with different roles, expertise, and AI parameters.

---

## Agent 1: Business Analyst

**Role**: Requirements analysis for enterprise ERP  
**Model Settings**:
- Temperature: `0.3` (focused, deterministic)
- Max Tokens: `2500`

**Expertise**:
- Analyzes GitHub issues for business requirements
- Maps features to bounded contexts (Financial, Inventory, HR, etc.)
- Creates user stories in Given-When-Then format
- Validates multi-tenancy implications

**System Prompt Summary**:
```
- SAP-grade ERP for all industries
- References ADR-001 (CQRS), ADR-002 (DB per context), ADR-005 (Multi-tenancy)
- Outputs: Requirements, Context Mapping, User Stories, Business Rules
```

**Customization Options**:
```typescript
// In src/agents/roles.ts
analyst: {
  temperature: 0.3,  // Lower = more focused (0.0-1.0)
  maxTokens: 2500,   // Output length limit
  // Add industry-specific prompts here
}
```

---

## Agent 2: Solutions Architect

**Role**: DDD and event-driven architecture design  
**Model Settings**:
- Temperature: `0.2` (very focused, technical precision)
- Max Tokens: `3000`

**Expertise**:
- Designs aggregates, entities, value objects
- Creates command/query definitions
- Designs event schemas
- Ensures ADR compliance (especially ADR-001: NO command bus)

**System Prompt Summary**:
```
- Hexagonal Architecture (Domain → Application → Infrastructure)
- Pragmatic CQRS with direct use cases
- Jakarta Bean Validation at REST boundary
- Outputs: Aggregate Design, Commands/Queries, Events, APIs
```

**Customization Options**:
```typescript
architect: {
  temperature: 0.2,  // Very precise for architecture decisions
  maxTokens: 3000,
  // Add architectural patterns here
}
```

---

## Agent 3: Senior Developer

**Role**: Kotlin/Quarkus implementation  
**Model Settings**:
- Temperature: `0.1` (highly deterministic, code generation)
- Max Tokens: `4000` (largest - needs to generate full code)

**Expertise**:
- Generates production-ready Kotlin code
- Uses Quarkus CDI, Panache repositories
- Implements use cases with @Transactional
- Follows immutable data class patterns

**System Prompt Summary**:
```
- Kotlin + Quarkus + PostgreSQL stack
- Immutable data classes for Commands/Queries
- Use cases with @Inject and @Transactional
- Outputs: Production Kotlin code with error handling
```

**Customization Options**:
```typescript
developer: {
  temperature: 0.1,  // Lowest - code must be consistent
  maxTokens: 4000,   // Highest - generates full files
  // Add code patterns here
}
```

---

## Configuration File Location

**File**: `src/agents/roles.ts`

Each agent has this structure:
```typescript
export interface AgentRole {
  name: string;           // Display name
  description: string;    // What this agent does
  systemPrompt: string;   // AI instructions (most important!)
  tools: string[];        // Available capabilities
  maxTokens: number;      // Max response length
  temperature: number;    // Creativity (0.0 = deterministic, 1.0 = creative)
}
```

---

## Next Steps

Would you like me to:
1. Show Agent 4 (Tester), 5 (Reviewer), 6 (Orchestrator)?
2. Create a tool to easily modify agent settings?
3. Add more specialized agents (e.g., Security Auditor, Performance Optimizer)?
4. Show how to test agents individually?
5. Configure different AI models per agent (e.g., GPT-4 for architect, GPT-3.5 for tester)?
