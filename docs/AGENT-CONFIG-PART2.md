# Agent Configuration Guide - Part 2

## Agent 4: QA Engineer (Tester)

**Role**: Comprehensive testing for enterprise ERP  
**Model Settings**:
- Temperature: `0.2` (focused, consistent test patterns)
- Max Tokens: `3000`

**Expertise**:
- Generates JUnit 5 + Kotlin Test code
- Creates Testcontainers integration tests
- Writes RestAssured API tests
- Validates multi-tenancy isolation

**Test Categories**:
1. **Unit Tests** - Domain logic, validation rules
2. **Integration Tests** - Use cases with database
3. **API Tests** - REST endpoints
4. **Multi-tenancy Tests** - Tenant isolation verification

**System Prompt Summary**:
```
- JUnit 5, Kotlin Test, Testcontainers, RestAssured, MockK
- Test naming: methodName_scenario_expectedResult
- Given-When-Then structure
- Targets 80%+ code coverage
```

**Customization Options**:
```typescript
tester: {
  temperature: 0.2,  // Consistent test patterns
  maxTokens: 3000,
  // Add custom test patterns here
}
```

**Example Output**:
```kotlin
@Test
fun `createLedger_validCommand_returnsLedgerId`() {
    // Given
    val command = CreateLedgerCommand(tenantId, name)
    
    // When
    val result = useCase.execute(command)
    
    // Then
    assertNotNull(result)
    assertEquals(tenantId, result.tenantId)
}
```

---

## Agent 5: Code Reviewer

**Role**: Quality, security, and compliance review  
**Model Settings**:
- Temperature: `0.3` (balanced - catches issues but suggests alternatives)
- Max Tokens: `2500`

**Expertise**:
- Architecture compliance (DDD, CQRS patterns)
- Code quality (SOLID, Kotlin idioms)
- Security (SQL injection, tenant isolation, secret management)
- Performance (N+1 queries, indexing)
- Compliance (GDPR, SOX, industry regulations)

**Review Categories**:
1. **MUST FIX** - Blocking issues (security, data leakage)
2. **SHOULD FIX** - Important improvements (performance, maintainability)
3. **NICE TO HAVE** - Suggestions (code style, minor refactoring)
4. **APPROVED** - Ready to merge

**System Prompt Summary**:
```
- Reviews: Architecture, Code Quality, Security, Performance, Testing
- Focus: Multi-tenancy isolation, data leakage prevention
- Compliance: Industry-specific regulations
```

**Customization Options**:
```typescript
reviewer: {
  temperature: 0.3,  // Balanced for suggestions
  maxTokens: 2500,
  // Add review checklists here
}
```

**Example Output**:
```markdown
## MUST FIX
- Line 45: Missing tenant isolation check in query
- Line 78: Hardcoded database credentials

## SHOULD FIX
- Line 23: N+1 query detected, use JOIN FETCH
- Missing index on tenant_id + created_at

## APPROVED
✓ DDD patterns correctly applied
✓ Test coverage at 85%
```

---

## Agent 6: Pipeline Orchestrator

**Role**: Workflow coordination and decision-making  
**Model Settings**:
- Temperature: `0.4` (slightly higher - needs flexible routing decisions)
- Max Tokens: `2000`

**Expertise**:
- Complexity analysis (0-10 scale)
- Agent routing decisions
- Escalation triggers
- ADR compliance validation

**Decision Matrix**:
| Complexity | Workflow |
|-----------|----------|
| 0-4 | Auto: dev → test → review |
| 5-9 | Auto + Review: analyst → architect → dev → test → review |
| 10+ | Human Required: analyst → architect → APPROVAL → dev → test → review |

**Escalation Triggers**:
- Security vulnerabilities
- Breaking changes
- Cross-context architectural decisions
- Multi-tenant data leakage risks

**System Prompt Summary**:
```
- Analyzes issue complexity
- Routes to appropriate agents
- Validates ADR compliance
- Flags security/performance concerns
```

**Customization Options**:
```typescript
orchestrator: {
  temperature: 0.4,  // Flexible for routing
  maxTokens: 2000,
  // Add routing rules here
}
```

---

## Summary: All 6 Agents

| Agent | Temperature | Tokens | Purpose |
|-------|------------|--------|---------|
| Analyst | 0.3 | 2500 | Requirements → User Stories |
| Architect | 0.2 | 3000 | Design → Aggregates, Events |
| Developer | 0.1 | 4000 | Code → Kotlin/Quarkus |
| Tester | 0.2 | 3000 | Tests → Unit, Integration, API |
| Reviewer | 0.3 | 2500 | Review → Quality, Security |
| Orchestrator | 0.4 | 2000 | Routing → Workflow decisions |

---

## Configuration Tips

### Temperature Guidelines
- **0.0-0.2**: Code generation, architecture (need consistency)
- **0.3-0.5**: Requirements, reviews (need some creativity)
- **0.6-1.0**: Brainstorming, ideation (not recommended for production code)

### Token Guidelines
- **2000**: Status updates, routing decisions
- **2500-3000**: Analysis, reviews, test generation
- **4000+**: Full code file generation

### Model Selection (Future Enhancement)
```typescript
// Could configure different models per agent:
analyst: {
  model: "gpt-4-turbo-preview",  // Best reasoning
  temperature: 0.3
},
developer: {
  model: "gpt-4",  // Best code generation
  temperature: 0.1
},
tester: {
  model: "gpt-3.5-turbo",  // Good enough, cost effective
  temperature: 0.2
}
```

---

## What's Next?

Choose what you want to configure:
1. **Modify agent prompts** (add industry-specific rules)
2. **Adjust AI parameters** (temperature, tokens)
3. **Add new agents** (Security Auditor, Performance Optimizer)
4. **Test agents individually** (before running full pipeline)
5. **Configure model selection** (different OpenAI models per agent)
