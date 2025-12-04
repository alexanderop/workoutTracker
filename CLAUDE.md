# Workout Tracker

Vue 3 PWA for tracking strength and CrossFit-style workouts with block-based programming.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Type-check + build
pnpm test:unit        # Run tests (add <file> for single file)
pnpm lint             # oxlint + eslint with auto-fix
```

## Architecture

### Block-Based System

Workouts consist of ordered **blocks** (discriminated union via `kind`):
- **Strength** (`kind: 'strength'`): Set/rep tracking with kg, reps, RIR
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

Types: `src/types/blocks.ts` (runtime), `src/db/schema.ts` (persistence, `Db` prefix)

### State Management

- **Workout state**: Singleton ref in `src/composables/useWorkout.ts`
- **Pinia stores**: Exercises and settings only
- **Persistence**: Dexie IndexedDB in `src/db/` with repositories

### Modes

`'builder'` (configure blocks) → `'active'` (execute workout)

### Key Locations

- `src/composables/` - Core logic, timers
- `src/components/ui/` - shadcn-vue primitives (do not modify)
- `src/components/{feature}/` - Feature components with parent-prefixed names

## Documentation

Read before working on specific areas:
- `docs/agent/testing.md` - Test helpers (withSetup, createTestApp), factories
- `docs/agent/composables.md` - useWorkout API, timer state machines

## Problem-Solving Strategy

### When Stuck on a Problem

If you're blocked or looping on the same issue without progress:

1. **Detect the loop** - If you've attempted the same approach 2-3 times without success, STOP
2. **Spawn parallel subagents** to investigate independently:
   - One subagent to search the web for similar issues/solutions
   - One subagent to analyze the codebase for related patterns
   - One subagent to reason about alternative approaches
3. **Set a time/attempt limit** - Maximum 3 attempts per approach before pivoting
4. **Synthesize findings** - Combine subagent results and choose the best path forward

### Subagent Prompts (Copy-Paste Templates)

**Web Search Subagent:**
```
Search the web for: "[specific error message or problem description]"
Focus on: Vue 3, TypeScript, [relevant library] solutions
Return: Top 3 solutions with code examples and source links
```

**Codebase Analysis Subagent:**
```
Search the codebase for similar patterns to: [problem description]
Look in: composables, components, existing implementations
Return: Relevant code patterns and how they solved similar issues
```

**Alternative Approach Subagent:**
```
Think about alternative solutions for: [problem description]
Constraints: [list any constraints]
Return: 3 different approaches with pros/cons for each
```

### Anti-Loop Rules

- **Never retry the exact same code change** more than once
- **If tests fail 3 times**, step back and re-read the test requirements
- **If a file edit fails**, check if the file content matches your expectations
- **When import errors persist**, use semantic_search to find correct paths
- **If build fails repeatedly**, check `tsconfig.json` and `vite.config.ts` for config issues
