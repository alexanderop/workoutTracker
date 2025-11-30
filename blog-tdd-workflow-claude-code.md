# How I Created a Custom TDD Workflow with Claude Code for My Vue Project

I've been using Claude Code for my Vue.js workout tracker project, and I wanted to enforce strict Test-Driven Development (TDD) practices. The problem? Claude, like many developers, tends to jump straight to implementation. So I built a custom skill system that forces the classic Red-Green-Refactor cycle with dedicated subagents handling each phase.

Here's how I did it, and how you can create similar workflows for your own projects.

## The Problem with AI-Assisted TDD

When you ask an AI assistant to "implement feature X," it naturally wants to write the implementation first. But TDD flips this on its head—you write the test first, watch it fail, then write minimal code to make it pass.

I needed a way to:
1. **Force the test-first approach** - No implementation before a failing test exists
2. **Keep each phase focused** - The test writer shouldn't be thinking about implementation details
3. **Ensure the refactor phase happens** - It's easy to skip "code cleanup" when the feature works

## The Solution: Skills + Subagents

Claude Code supports two powerful concepts I combined:

- **Skills** (`.claude/skills/`): High-level workflows that orchestrate complex tasks
- **Agents** (`.claude/agents/`): Specialized workers that handle specific jobs

My architecture looks like this:

```
tdd-integration (skill)
    ├── tdd-test-writer (agent)    → RED phase
    ├── tdd-implementer (agent)    → GREEN phase
    └── tdd-refactorer (agent)     → REFACTOR phase
```

## Setting Up the TDD Skill

First, I created the orchestrating skill at `.claude/skills/tdd-integration/skill.md`:

```markdown
---
name: tdd-integration
description: Enforce Test-Driven Development with strict Red-Green-Refactor cycle
  using integration tests. Auto-triggers when implementing new features or
  functionality. Trigger phrases include "implement", "add feature", "build",
  "create functionality", or any request to add new behavior. Does NOT trigger
  for bug fixes, documentation, or configuration changes.
---

# TDD Integration Testing

Enforce strict Test-Driven Development using the Red-Green-Refactor cycle
with dedicated subagents.

## Mandatory Workflow

Every new feature MUST follow this strict 3-phase cycle. Do NOT skip phases.

### Phase 1: RED - Write Failing Test

```
🔴 RED PHASE: Delegating to tdd-test-writer...
```

Invoke the `tdd-test-writer` subagent with:
- Feature requirement from user request
- Expected behavior to test

The subagent returns:
- Test file path
- Failure output confirming test fails
- Summary of what the test verifies

**Do NOT proceed to Green phase until test failure is confirmed.**

### Phase 2: GREEN - Make It Pass

```
🟢 GREEN PHASE: Delegating to tdd-implementer...
```

Invoke the `tdd-implementer` subagent with:
- Test file path from RED phase
- Feature requirement context

The subagent returns:
- Files modified
- Success output confirming test passes
- Implementation summary

**Do NOT proceed to Refactor phase until test passes.**

### Phase 3: REFACTOR - Improve

```
🔵 REFACTOR PHASE: Delegating to tdd-refactorer...
```

Invoke the `tdd-refactorer` subagent with:
- Test file path
- Implementation files from GREEN phase

The subagent returns either:
- Changes made + test success output, OR
- "No refactoring needed" with reasoning

**Cycle complete when refactor phase returns.**

## Multiple Features

Complete the full cycle for EACH feature before starting the next:

```
Feature 1: 🔴 → 🟢 → 🔵 ✓
Feature 2: 🔴 → 🟢 → 🔵 ✓
Feature 3: 🔴 → 🟢 → 🔵 ✓
```

## Phase Violations

Never:
- Write implementation before the test
- Proceed to Green without seeing Red fail
- Skip Refactor evaluation
- Start a new feature before completing the current cycle
```

The key elements:
- **description field**: Contains trigger phrases so Claude automatically activates this skill when I say things like "implement" or "add feature"
- **Strict gating**: Each phase explicitly states "Do NOT proceed until..."
- **Visual markers**: The 🔴🟢🔵 emojis make it easy to track progress in the conversation

## The Test Writer Agent (RED Phase)

The test writer at `.claude/agents/tdd-test-writer.md` focuses solely on writing failing tests:

```markdown
---
name: tdd-test-writer
description: Write failing integration tests for TDD RED phase. Use when
  implementing new features with TDD. Returns only after verifying test FAILS.
tools: Read, Glob, Grep, Write, Edit, Bash
skills: vue-integration-testing
---

# TDD Test Writer (RED Phase)

Write a failing integration test that verifies the requested feature behavior.

## Process

1. Understand the feature requirement from the prompt
2. Write an integration test in `src/__tests__/integration/`
3. Run `pnpm test:unit <test-file>` to verify it fails
4. Return the test file path and failure output

## Test Structure

```typescript
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'

describe('Feature Name', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('describes the user journey', async () => {
    const app = await createTestApp()

    // Act: User interactions
    await app.user.click(app.getByRole('button', { name: /action/i }))

    // Assert: Verify outcomes
    expect(app.router.currentRoute.value.path).toBe('/expected')

    app.cleanup()
  })
})
```

## Requirements

- Test must describe user behavior, not implementation details
- Use `createTestApp()` for full app integration
- Use Testing Library queries (`getByRole`, `getByText`)
- Test MUST fail when run - verify before returning

## Return Format

Return:
- Test file path
- Failure output showing the test fails
- Brief summary of what the test verifies
```

Notice:
- **Limited tools**: Only what's needed to write and run tests
- **skills field**: References my `vue-integration-testing` skill for additional context
- **Explicit return format**: Ensures consistent handoff to the next phase

## The Implementer Agent (GREEN Phase)

The implementer at `.claude/agents/tdd-implementer.md` writes minimal code to pass:

```markdown
---
name: tdd-implementer
description: Implement minimal code to pass failing tests for TDD GREEN phase.
  Write only what the test requires. Returns only after verifying test PASSES.
tools: Read, Glob, Grep, Write, Edit, Bash
---

# TDD Implementer (GREEN Phase)

Implement the minimal code needed to make the failing test pass.

## Process

1. Read the failing test to understand what behavior it expects
2. Identify the files that need changes
3. Write the minimal implementation to pass the test
4. Run `pnpm test:unit <test-file>` to verify it passes
5. Return implementation summary and success output

## Principles

- **Minimal**: Write only what the test requires
- **No extras**: No additional features, no "nice to haves"
- **Test-driven**: If the test passes, the implementation is complete
- **Fix implementation, not tests**: If the test fails, fix your code

## Return Format

Return:
- Files modified with brief description of changes
- Test success output
- Summary of the implementation
```

The key principle here: **"If the test passes, the implementation is complete."** This prevents over-engineering during the GREEN phase.

## The Refactorer Agent (REFACTOR Phase)

The refactorer at `.claude/agents/tdd-refactorer.md` evaluates and improves:

```markdown
---
name: tdd-refactorer
description: Evaluate and refactor code after TDD GREEN phase. Improve code
  quality while keeping tests passing. Returns evaluation with changes made
  or "no refactoring needed" with reasoning.
tools: Read, Glob, Grep, Write, Edit, Bash
skills: vue-composables
---

# TDD Refactorer (REFACTOR Phase)

Evaluate the implementation for refactoring opportunities and apply
improvements while keeping tests green.

## Process

1. Read the implementation and test files
2. Evaluate against refactoring checklist
3. Apply improvements if beneficial
4. Run `pnpm test:unit <test-file>` to verify tests still pass
5. Return summary of changes or "no refactoring needed"

## Refactoring Checklist

Evaluate these opportunities:

- **Extract composable**: Reusable logic that could benefit other components
- **Simplify conditionals**: Complex if/else chains that could be clearer
- **Improve naming**: Variables or functions with unclear names
- **Remove duplication**: Repeated code patterns
- **Thin components**: Business logic that should move to composables

## Decision Criteria

Refactor when:
- Code has clear duplication
- Logic is reusable elsewhere
- Naming obscures intent
- Component contains business logic

Skip refactoring when:
- Code is already clean and simple
- Changes would be over-engineering
- Implementation is minimal and focused

## Return Format

If changes made:
- Files modified with brief description
- Test success output confirming tests pass
- Summary of improvements

If no changes:
- "No refactoring needed"
- Brief reasoning (e.g., "Implementation is minimal and focused")
```

This agent has a **decision framework** for whether to refactor. Sometimes "no refactoring needed" is the right answer, and the agent explains why.

## Real-World Example: Adding Workout Detail View

Here's how this played out when I asked Claude to add a workout detail view feature. My request was simple:

> "When a user is on the Workouts page, they should be able to click on a past workout and see a detail view of what exercises and sets they completed."

### 🔴 RED Phase Output

The `tdd-test-writer` agent produced this test:

```typescript
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { db, generateId } from '@/db'
import type { DbCompletedWorkout, DbWorkoutExercise, DbSet } from '@/db/schema'

describe('Workout History Detail View', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('navigates to detail view when clicking a completed workout', async () => {
    // Arrange: Create a completed workout in the database
    const completedSet: DbSet = {
      id: generateId(),
      kg: '100',
      reps: '10',
      rir: '2',
      status: 'completed',
      completedAt: Date.now(),
    }

    const benchPressExercise: DbWorkoutExercise = {
      id: generateId(),
      exerciseDefinitionId: null,
      name: 'Bench Press',
      equipment: 'Barbell',
      targetReps: 8,
      thumbnail: '🏋️',
      sets: [completedSet],
      orderIndex: 0,
    }

    const completedWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: 'Push Day',
      exercises: [benchPressExercise],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      durationSeconds: 3600,
      notes: '',
    }

    await db.workouts.add(completedWorkout)

    // Act: Navigate and click
    const app = await createTestApp()
    const workoutsNavButton = app.getByRole('button', { name: /workouts/i })
    await app.user.click(workoutsNavButton)

    const workoutCard = await app.findByText('Push Day')
    await app.user.click(workoutCard)

    // Assert: Verify navigation and content
    expect(app.router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)
    expect(app.getByText('Push Day')).toBeDefined()
    expect(app.getByText('Bench Press')).toBeDefined()
    expect(app.getByText('100')).toBeDefined()
    expect(app.getByText('10')).toBeDefined()

    app.cleanup()
  })
})
```

The test failed with:
```
AssertionError: expected '/workouts' to be '/workouts/d747077d-c8a5-422d-96f6-2f30676d983c'
```

Exactly what we want.

### 🟢 GREEN Phase Output

The `tdd-implementer` created:
- `WorkoutDetailView.vue` - New detail view component
- Modified `TheWorkoutsView.vue` - Added click handlers
- Modified `router/index.ts` - Added `/workouts/:id` route

Test passed.

### 🔵 REFACTOR Phase Output

The `tdd-refactorer` made several improvements:
- **Extracted `useWorkoutDetail` composable** - Reusable data fetching with discriminated union states
- **Created shared formatters** - Pulled duplicate `formatDuration` and `formatDate` functions into `lib/formatters.ts`
- **Added accessibility** - Keyboard navigation (Enter/Space) for clickable cards

All 26 tests still passed after refactoring.

## The Test Helper That Makes It Work

A crucial piece is my `createTestApp()` helper that provides a complete testing environment:

```typescript
export async function createTestApp(): Promise<TestApp> {
  const pinia = createPinia()
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  const user = userEvent.setup()

  render(App, {
    global: {
      plugins: [router, pinia],
    },
  })

  await router.isReady()

  return {
    router,
    user,
    getByRole: screen.getByRole,
    getByText: screen.getByText,
    // ... more helpers
    waitForDialog: () => waitFor(() => screen.getByRole('dialog')),
    waitForRoute: (pattern) => waitFor(() => {
      if (!pattern.test(router.currentRoute.value.path)) {
        throw new Error(`Route mismatch`)
      }
    }),
    // ... domain-specific helpers
    fillSet: async (index, values) => { /* ... */ },
    getSetRow: (index) => { /* ... */ },
  }
}
```

This gives agents a consistent API for:
- Rendering the full app with routing and state
- Simulating user interactions
- Waiting for async operations
- Domain-specific helpers like `fillSet()` for workout-specific actions

## The Missing Piece: Hooks for Deterministic Skill Activation

Even with well-designed skills, I noticed Claude would sometimes skip skill evaluation and jump straight to implementation. The skill activation rate was around 20%—not good enough for a disciplined workflow.

The solution? **Hooks.** Claude Code supports hooks that run at various lifecycle points. I created a `UserPromptSubmit` hook that injects instructions forcing Claude to explicitly evaluate each skill before proceeding.

### Hook Configuration

In `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsx \"$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-skill-eval.ts\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

The empty `matcher` means this hook runs on every user prompt.

### The Hook Script

At `.claude/hooks/user-prompt-skill-eval.ts`:

```typescript
#!/usr/bin/env npx tsx
/**
 * Claude Code UserPromptSubmit Hook - Force Skill Evaluation
 *
 * Forces Claude to explicitly evaluate each skill before proceeding,
 * improving skill activation rates from ~20% to ~84%.
 */

import { readFileSync } from 'node:fs'
import { stdout } from 'node:process'

function readStdin(): string {
  return readFileSync(0, 'utf-8')
}

function main(): void {
  readStdin()

  const instruction = `
INSTRUCTION: MANDATORY SKILL ACTIVATION SEQUENCE

Step 1 - EVALUATE (do this in your response):
For each skill in <available_skills>, state: [skill-name] - YES/NO - [reason]

Step 2 - ACTIVATE (do this immediately after Step 1):
IF any skills are YES → Use Skill(skill-name) tool for EACH relevant skill NOW
IF no skills are YES → State "No skills needed" and proceed

Step 3 - IMPLEMENT:
Only after Step 2 is complete, proceed with implementation.

CRITICAL: You MUST call Skill() tool in Step 2. Do NOT skip to implementation.
The evaluation (Step 1) is WORTHLESS unless you ACTIVATE (Step 2) the skills.

Example of correct sequence:
- brainstorm: NO - not a brainstorming task
- vue-composables: YES - need to create composable
- vue-composable-testing: YES - need to test composable

[Then IMMEDIATELY use Skill() tool:]
> Skill(vue-composables)
> Skill(vue-composable-testing)

[THEN and ONLY THEN start implementation]
`

  stdout.write(instruction.trim())
}

main()
```

### How It Works

1. **Every prompt triggers the hook** - Before Claude processes my request, this hook runs
2. **The hook outputs instructions** - These appear as a `<system-reminder>` that Claude sees
3. **Forced evaluation** - Claude must explicitly state YES/NO for each available skill
4. **Accountability** - The reasoning is visible in the conversation, so I can see if it's making good decisions

### The Result

With this hook in place, skill activation jumped from ~20% to ~84%. Now when I say "implement the workout detail view," Claude:

1. Evaluates: "tdd-integration: YES - implementing new feature"
2. Activates the skill
3. Follows the Red-Green-Refactor cycle

Without the hook, it would often skip straight to writing code.

### Other Useful Hooks

My project also uses hooks for:

- **PreToolUse (Write|Edit)** - Prevents accidental modification of shadcn-ui components
- **Notification** - Desktop notifications when Claude needs permission or goes idle
- **Stop** - Quality checks when Claude finishes a task

The hook system turns Claude from "helpful but inconsistent" into "reliable and predictable."

## Tips for Building Your Own TDD Workflow

1. **Be explicit about phase transitions** - Claude needs clear "Do NOT proceed until..." gates

2. **Give agents limited scope** - Each agent should focus on one job. The test writer doesn't need to know about implementation patterns.

3. **Include verification steps** - Each agent runs tests and reports output. This creates a paper trail.

4. **Use skills for additional context** - The refactorer has access to my `vue-composables` skill, so it knows project patterns when extracting logic.

5. **Define return formats** - Consistent output from each agent makes handoffs smooth.

6. **Create domain-specific test helpers** - The more your test API matches your domain (workouts, sets, exercises), the more readable your tests become.

7. **Use hooks for consistency** - Don't rely on Claude remembering to use skills. Inject reminders via hooks to make skill activation deterministic.

## Conclusion

This TDD workflow has fundamentally changed how I build features with Claude Code. Instead of getting a blob of implementation that I have to verify manually, I get:

1. A clear test that documents expected behavior
2. Minimal implementation focused on the requirements
3. Thoughtful refactoring with explicit reasoning

The agents act as guardrails, preventing the natural tendency to skip straight to implementation. And because each phase produces artifacts (test files, implementation files, refactoring decisions), I have a complete audit trail of how each feature was built.

You can adapt this pattern for your own projects—swap out the Vue-specific helpers for your framework, adjust the refactoring checklist for your codebase patterns, and customize the trigger phrases for your workflow.

The key insight: **AI assistants follow instructions well when those instructions are explicit and phased.** By breaking TDD into three specialized agents with clear handoff points, you get disciplined test-driven development instead of implementation-first coding.
