---
type: Reference
title: "Test Factory Improvements Plan"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/test-factory-improvements.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
<!-- ARCHIVED (2026-07-13): Plan fully implemented and exceeded. faker.seed() is in src/__tests__/setup.ts, benchmark.factory.ts and timedBlock.factory.ts exist (with more coverage than planned — Amrap/Emom/Tabata/Cardio blocks, Complete<T> helper in src/__tests__/helpers/types.ts), benchmark-flows.spec.ts was split into focused specs (benchmark-management, benchmark-execution, etc.) that use the factories, and no manual `Date.now()+Math.random()` ID generation remains anywhere in src/__tests__/. -->
## Test Factory Improvements Plan

> **Assignee:** Junior Developer
> **Estimated effort:** 2-3 hours
> **Priority:** Medium
> **Created:** 2025-12-14

## Overview

This task improves our test factory infrastructure to follow best practices from the [Mock Factories Make Better Tests](https://www.nearform.com/digital-community/mock-factories-make-better-tests/) article.

### Goals

1. Add faker seed for reproducible randomization
2. Create missing factories for benchmarks and timed blocks
3. Refactor tests to use factories instead of inline object creation
4. Add a `Complete<T>` type helper for compile-time safety

### Why This Matters

- **Reproducibility**: Random test data should be consistent across runs
- **DRY**: Factories eliminate duplicate test setup code
- **Maintainability**: Centralized ID generation is easier to update
- **Type Safety**: Catch missing fields at compile time, not runtime

---

## Background Context

### Current Factory Pattern

We use function-based factories with `Partial<T>` overrides:

```typescript
export function createSet(overrides: Partial<Set> = {}): Set {
  return { ...DEFAULTS, ...overrides }
}
```

### Current Issue

In `benchmark-flows.spec.ts`, there's manual ID generation like this:

```typescript
id: `block-${Date.now()}-${Math.random().toString(36).substring(7)}`
```

This should use our `generateId()` utility via proper factories.

### Key Files to Understand First

- `src/__tests__/factories/set.factory.ts` - Example of our factory pattern
- `src/__tests__/factories/dbWorkout.factory.ts` - Example with builder pattern
- `src/db/schema.ts` - Database types (lines 84-192 for benchmarks/blocks)

---

## Phase 1: Quick Wins

### 1.1 Add Faker Seed

**File:** `src/__tests__/setup.ts`

```typescript
import { faker } from '@faker-js/faker'
faker.seed(12345)
```

### 1.2 Export `generateId()` from Factory Index

**File:** `src/__tests__/factories/index.ts`

```typescript
export { generateId } from '@/db'
```

---

## Phase 2: New Factories

### 2.1 `benchmark.factory.ts` (Schema Updated — Rounds-Based)

> **Note**: The benchmark schema changed to a **rounds-based** structure after this plan was written. `DbBenchmark.exercises[]` was replaced by `DbBenchmark.rounds: DbBenchmarkRound[]` where each round contains `exercises: DbBenchmarkRoundExercise[]`. The `amrap` type was removed; benchmarks are `fortime` only. The factory was implemented but uses the new schema — do NOT use the old signature below.

**Actual exports in `src/__tests__/factories/benchmark.factory.ts`:**

- `createDbBenchmarkRoundExercise(overrides?)` — a single exercise within a round
- `createDbBenchmarkRound(overrides?)` — a round with exercises
- `createDbBenchmark(overrides?)` — full benchmark (rounds-based, `type: 'fortime'`)

**Old design below (DO NOT USE — schema changed):**

```typescript
// STALE: uses DbBenchmarkExercise (no longer exists)
export function createDbBenchmarkExercise(...): DbBenchmarkExercise { ... }
export function createDbAmrapBenchmark(...): DbBenchmark { ... } // 'amrap' type removed
```

### 2.2 Create `timedBlock.factory.ts`

**File:** `src/__tests__/factories/timedBlock.factory.ts`

```typescript
import type {
  DbBlockExercise,
  DbForTimeBlock,
  DbForTimeResult,
  DbAmrapBlock,
  DbAmrapResult,
} from '@/db/schema'
import { generateId } from '@/db'

// Block Exercise (shared by all timed blocks)
export function createDbBlockExercise(overrides: Partial<DbBlockExercise> = {}): DbBlockExercise {
  return {
    id: generateId(),
    name: 'Thrusters',
    prescribedReps: 21,
    load: null,
    thumbnail: '🏋️',
    ...overrides,
  }
}

// ForTime Block
const FORTIME_DEFAULTS: Readonly<Omit<DbForTimeBlock, 'id' | 'exercises'>> = {
  kind: 'fortime',
  config: { timeCapSeconds: null },
  result: null,
  orderIndex: 0,
}

export function createDbForTimeBlock(overrides: Partial<DbForTimeBlock> = {}): DbForTimeBlock {
  return {
    id: generateId(),
    ...FORTIME_DEFAULTS,
    exercises: [createDbBlockExercise()],
    ...overrides,
  }
}

export function createDbForTimeResult(overrides: Partial<DbForTimeResult> = {}): DbForTimeResult {
  return {
    completionTime: 180,
    completed: true,
    splitTimes: [],
    ...overrides,
  }
}

// AMRAP Block (for future use)
const AMRAP_DEFAULTS: Readonly<Omit<DbAmrapBlock, 'id' | 'exercises'>> = {
  kind: 'amrap',
  config: { durationSeconds: 600 },
  result: null,
  orderIndex: 0,
}

export function createDbAmrapBlock(overrides: Partial<DbAmrapBlock> = {}): DbAmrapBlock {
  return {
    id: generateId(),
    ...AMRAP_DEFAULTS,
    exercises: [createDbBlockExercise()],
    ...overrides,
  }
}
```

### 2.3 Update Factory Index

**File:** `src/__tests__/factories/index.ts`

Add exports:

```typescript
// Benchmark factories
export {
  createDbBenchmark,
  createDbBenchmarkExercise,
  createDbForTimeBenchmark,
  createDbAmrapBenchmark,
} from './benchmark.factory'

// Timed block factories
export {
  createDbBlockExercise,
  createDbForTimeBlock,
  createDbForTimeResult,
  createDbAmrapBlock,
} from './timedBlock.factory'

// Utility
export { generateId } from '@/db'
```

---

## Phase 3: Refactor Tests

### 3.1 Refactor `benchmark-flows.spec.ts`

**File:** `src/__tests__/integration/benchmark-flows.spec.ts`

**Before (lines 28-47):**

```typescript
async function createForTimeBenchmark(...) {
  return getBenchmarksRepository().create({
    name: options?.name ?? 'Fran',
    type: 'fortime',
    // ... manual inline creation
  })
}
```

**After:**

```typescript
import { createDbForTimeBenchmark, createDbBenchmarkExercise } from '@/__tests__/factories'

async function createForTimeBenchmark(options?: {
  name?: string
  exercises?: Array<{ name: string; reps: number }>
}): Promise<DbBenchmark> {
  return getBenchmarksRepository().create(
    createDbForTimeBenchmark({
      name: options?.name,
      exercises: options?.exercises?.map((ex) =>
        createDbBenchmarkExercise({
          name: ex.name,
          prescribedReps: ex.reps,
        }),
      ),
    }),
  )
}
```

**Before (lines 150-178):**

```typescript
const forTimeBlock: DbForTimeBlock = {
  kind: 'fortime',
  id: `block-${Date.now()}-${Math.random()...}`,
  // ... 30 lines of manual object creation
}
```

**After:**

```typescript
import {
  createDbForTimeBlock,
  createDbBlockExercise,
  createDbForTimeResult,
} from '@/__tests__/factories'

const forTimeBlock = createDbForTimeBlock({
  exercises: benchmark.exercises.map((ex) =>
    createDbBlockExercise({
      name: ex.name,
      prescribedReps: ex.prescribedReps,
      thumbnail: ex.thumbnail,
    }),
  ),
  result: createDbForTimeResult({
    completionTime,
    splitTimes: splitTimes ?? [],
  }),
})
```

---

## Phase 4: Type Helper (Optional)

### 4.1 Create `Complete<T>` Helper

**File:** `src/__tests__/helpers/types.ts`

```typescript
/**
 * Makes all properties required and non-undefined.
 * Use in factories to catch missing fields at compile time.
 */
export type Complete<T> = {
  [P in keyof Required<T>]: T[P]
}
```

### 4.2 Example Usage in Existing Factory

**File:** `src/__tests__/factories/set.factory.ts` (optional update)

```typescript
import type { Complete } from '@/__tests__/helpers/types'

export function createSet(overrides: Partial<Set> = {}): Set {
  const result: Complete<Set> = {
    id: 1,
    kg: '100',
    reps: '8',
    rir: '2',
    status: 'active',
    ...overrides,
  }
  return result
}
```

---

## Files Summary

| Action | File                                                | Phase |
| ------ | --------------------------------------------------- | ----- |
| Modify | `src/__tests__/setup.ts`                            | 1     |
| Modify | `src/__tests__/factories/index.ts`                  | 1, 2  |
| Create | `src/__tests__/factories/benchmark.factory.ts`      | 2     |
| Create | `src/__tests__/factories/timedBlock.factory.ts`     | 2     |
| Modify | `src/__tests__/integration/benchmark-flows.spec.ts` | 3     |
| Create | `src/__tests__/helpers/types.ts`                    | 4     |

---

## Acceptance Criteria

### Must Have

- [ ] `faker.seed(12345)` added to `src/__tests__/setup.ts`
- [ ] `benchmark.factory.ts` created with `createDbBenchmark`, `createDbForTimeBenchmark`, `createDbAmrapBenchmark`
- [ ] `timedBlock.factory.ts` created with `createDbForTimeBlock`, `createDbBlockExercise`, `createDbForTimeResult`
- [ ] All new factories exported from `src/__tests__/factories/index.ts`
- [ ] `benchmark-flows.spec.ts` refactored to use new factories (no more `Date.now() + Math.random()` IDs)
- [ ] All tests pass: `pnpm type-check && pnpm lint && pnpm test`

### Nice to Have

- [ ] `Complete<T>` helper created in `src/__tests__/helpers/types.ts`
- [ ] At least one existing factory updated to use `Complete<T>`

---

## Testing Your Changes

```bash
# Run all tests
pnpm test

# Run specific test file you're refactoring
pnpm test src/__tests__/integration/benchmark-flows.spec.ts

# Type check (catch any type errors in factories)
pnpm type-check

# Lint (auto-fix style issues)
pnpm lint
```

---

## Common Pitfalls

### 1. Import Path

Use the `@/` alias for imports:

```typescript
// ✅ Correct
import { generateId } from '@/db'

// ❌ Wrong - relative paths are fragile
import { generateId } from '../../../db'
```

### 2. Don't Forget `Readonly` for Defaults

```typescript
// ✅ Correct - prevents accidental mutation
const DEFAULTS: Readonly<Omit<DbBenchmark, 'id' | 'exercises'>> = { ... }

// ❌ Wrong - could be mutated
const DEFAULTS: Omit<DbBenchmark, 'id' | 'exercises'> = { ... }
```

### 3. Spread Order Matters

Overrides must come LAST to actually override:

```typescript
// ✅ Correct - overrides win
return { id: generateId(), ...DEFAULTS, ...overrides }

// ❌ Wrong - overrides get overwritten by DEFAULTS
return { id: generateId(), ...overrides, ...DEFAULTS }
```

### 4. Database Types Use `null`, Not `undefined`

```typescript
// ✅ Correct for DB types
lastUsedAt: null

// ❌ Wrong - IndexedDB doesn't support undefined
lastUsedAt: undefined
```

---

## Questions?

If you get stuck:

1. Look at existing factories for patterns: `src/__tests__/factories/dbSet.factory.ts`
2. Check the database schema: `src/db/schema.ts`
3. Ask in the team channel or tag the senior dev who created this plan
