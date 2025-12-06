# Research: Claude Code Setup Optimization

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

How can we improve the Claude Code configuration for this Vue.js workout tracker project? The goal is to optimize skills, subagents, slash commands, and CLAUDE.md to maximize development efficiency and code quality enforcement.

## Current Setup Analysis

### Existing Assets (Already Configured)

| Category | Count | Status |
|----------|-------|--------|
| Slash Commands | 14 | Well-organized |
| Specialized Agents | 3 | Focused and effective |
| Pre-tool Hooks | 3 | Enforcing code standards |
| Post-tool Hooks | 1 | Batched type-checking |
| Custom Skills | 14 | Domain-specific |
| Memory Items | 2 | Institutional knowledge |
| Handoff Files | 2 | Session continuity |

### Current Strengths

1. **Multi-layered Code Quality Enforcement** - Hooks block violations before they happen
2. **Comprehensive Documentation** - CLAUDE.md is detailed and reference-quality
3. **Smart Command Architecture** - Parallel subagent coordination works well
4. **Institutional Knowledge Preservation** - Memory and handoff systems capture learnings
5. **Specialized Agents** - Each agent has domain expertise (Fowler, Vue patterns, tests)

## Key Findings

### 1. Skills Best Practices

**Hierarchical Skill Dependencies**

Add explicit dependency documentation in SKILL.md frontmatter:

```yaml
---
name: tdd-integration
description: Enforce Test-Driven Development...
dependencies:
  - vue-composable-testing
  - vue-integration-testing
---
```

**Progressive Disclosure Structure**

For complex skills, use this file organization:

```
.claude/skills/skill-name/
├── SKILL.md              # Essential instructions
├── QUICK_START.md        # Common use reference
├── ADVANCED.md           # Experienced users
├── references/
│   ├── workflows.md      # Detailed processes
│   └── output-patterns.md # Examples
└── scripts/              # Supporting utilities
```

**Skill Versioning**

Track changes to complex skills:

```yaml
---
name: tdd-integration
version: "2.0.0"
changelog: |
  v2.0.0 - Enhanced Red-Green-Refactor cycle
  v1.5.0 - Added auto-trigger detection
  v1.0.0 - Initial TDD framework
---
```

### 2. Subagent Optimization

**Model-Specific Agent Tuning**

Create fast agents using haiku for cost optimization:

```markdown
.claude/agents/fast-code-analyzer.md
---
name: fast-code-analyzer
description: Quick code analysis for obvious issues
tools: Read, Grep, Glob, Bash
model: haiku
---

Focus on linting violations, obvious bugs, format issues.
Skip deep design analysis.
```

**Permission-Gated Agents**

Create read-only agents for safe analysis:

```markdown
.claude/agents/read-only-reviewer.md
---
name: read-only-reviewer
description: Safe code analysis without write access
tools: Read, Grep, Glob
permissionMode: plan
---

You can analyze and report but CANNOT modify files.
```

**Agent Chaining Documentation**

Document multi-phase review workflows in CLAUDE.md:

```markdown
## Multi-Phase Review Workflow

1. fast-code-analyzer → quick format check
2. kcd-test-reviewer → test quality
3. vue-reviewer → component patterns
4. fowler-refactoring-reviewer → structural improvements
```

### 3. Slash Command Advanced Patterns

**Command Arguments with Conditional Logic**

```markdown
.claude/commands/review.md
---
description: Review PR code
argument-hint: [pr-number] [type: vue|test|refactor]
allowed-tools: Read, Grep, Glob, Bash(git:*)
---

Review PR #$1 with focus on $2:
- If "$2" is "vue": Use vue-reviewer agent
- If "$2" is "test": Use kcd-test-reviewer agent
- If "$2" is "refactor": Use fowler-refactoring-reviewer agent
```

**Thinking Mode for Complex Commands**

Enable extended thinking for planning commands:

```markdown
.claude/commands/plan-feature.md
---
description: Plan a feature with extended thinking
---

!thinking

Plan this feature step-by-step considering:
- Current architecture in @src/features/
- Type safety requirements
- Integration test implications
```

**Inline Bash Execution**

Embed dynamic context in commands:

```markdown
.claude/commands/pr-review.md

Current git status:
!`git status --short`

Recent commits:
!`git log --oneline -5`
```

### 4. CLAUDE.md Enhancements

**Add Skill & Agent Integration Matrix**

```markdown
## Skill & Agent Quick Reference

| Task | Skill | Trigger |
|------|-------|---------|
| New composable | vue-composables | "create", "write", "extract" |
| Test composable | vue-composable-testing | Tests for `use*` functions |
| Test user flow | vue-integration-testing | Navigation, forms, dialogs |
| New feature TDD | tdd-integration | Starting fresh features |
| Refactor code | refactor-component | Large component splitting |
| Design UI | frontend-design | Building components/pages |
| Plan tasks | writingPlan | Implementation steps |
```

**Document Auto-Enforced Type Safety**

```markdown
## Type Safety - Auto-Enforced

Hooks automatically prevent:
- `as T` assertions (except `as const`)
- `else`/`else if` statements
- `any` types

See `.claude/hooks/` for enforcement scripts.
```

**Feature Import Rules Checklist**

```markdown
## Feature Import Rules

✅ Features CAN import from:
- `src/components/`, `src/composables/`, `src/types/`
- `src/db/`, `src/lib/`, `src/stores/`

❌ Features CANNOT import from:
- Other features
- Views (only views use features)
```

### 5. Missing Components to Add

**Performance Agent**

```markdown
.claude/agents/performance-analyzer.md

Analyze bundle size, runtime performance, memory leaks.
Check for:
- Large component renders
- Unnecessary watchers
- Memory leak patterns in composables
```

**Accessibility Agent**

```markdown
.claude/agents/a11y-reviewer.md

Review ARIA attributes, semantic HTML, keyboard navigation.
Check for:
- Missing aria-labels
- Focus management
- Screen reader compatibility
```

**New Slash Commands**

| Command | Purpose |
|---------|---------|
| `/a11y [file]` | Accessibility review |
| `/perf [file]` | Performance analysis |
| `/deps` | Dependency health check |
| `/security` | Security audit |
| `/metrics` | Code complexity metrics |

### 6. Hooks Enhancements

**Vue 3.5 Pattern Enforcement**

```typescript
// .claude/hooks/pre-tool-vue-3-5-check.ts
// Ensure new Vue files use Vue 3.5+ patterns:
// - defineProps with destructuring
// - defineModel for v-model
// - useTemplateRef instead of ref()
```

**Progressive PostToolUse Checks**

```json
{
  "PostToolUse": [
    {
      "matcher": "Write.*\\.vue$",
      "hooks": [
        { "command": "pnpm type-check", "timeout": 30 },
        { "command": "pnpm lint --fix", "timeout": 20 }
      ]
    }
  ]
}
```

### 7. Permission System Refinements

**Graduated Permissions**

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *:*)",
      "Bash(git *:*)",
      "Read(**/*.vue)",
      "Skill(vue-*)"
    ],
    "ask": [
      "Bash(pnpm build:*)",
      "Bash(rm:*)"
    ],
    "deny": [
      "Read(.env*)",
      "Read(.git/config)"
    ]
  }
}
```

## Codebase Patterns

The project follows a **Bulletproof feature-based architecture** with:

- **Feature modules** in `src/features/` (exercises, settings, templates, timers, workout)
- **ESLint-enforced boundaries** preventing cross-feature imports
- **Singleton composables** in `src/composables/` for shared state
- **Discriminated unions** via `kind` property for type-safe blocks

Current hooks enforce:
- No `else`/`else if` (early returns only)
- No type assertions (except `as const`)
- Protected shadcn-vue components in `src/components/ui/`

## Recommended Approach

### Quick Wins (Implement Today)

1. **Add skill versioning** to complex skills (tdd-integration, skill-creator, writingPlan)
2. **Create fast-path agent** using `model: haiku` for quick analysis
3. **Add skill activation matrix** table to CLAUDE.md
4. **Document skill dependencies** in SKILL.md frontmatter

### Medium-Term Improvements

1. **Create a11y-reviewer agent** for accessibility checks
2. **Create performance-analyzer agent** for bundle/runtime analysis
3. **Add `/a11y` and `/perf` slash commands**
4. **Implement Vue 3.5 pattern enforcement hook**

### Long-Term Enhancements

1. **Add MCP server integrations** (GitHub, database)
2. **Create command namespacing** by moving to subdirectories
3. **Build documentation generator command** for API docs
4. **Implement security audit command**

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Skill activation matrix in CLAUDE.md | Low | High |
| 2 | Fast haiku agent for quick checks | Low | Medium |
| 3 | Skill versioning & dependencies | Low | Medium |
| 4 | A11y reviewer agent | Medium | High |
| 5 | Performance analyzer agent | Medium | High |
| 6 | Vue 3.5 enforcement hook | Medium | Medium |
| 7 | MCP server integrations | High | High |

## Sources

- Claude Code Official Documentation (claude-code-guide agent)
- Codebase analysis of `.claude/` directory structure
- Review of existing 14 slash commands and 3 agents
- Analysis of current hook implementations
