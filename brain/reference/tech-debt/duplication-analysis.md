---
type: Reference
title: "Code Duplication Analysis"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/tech-debt/duplication-analysis.md
tags: [reference, tech-debt]
timestamp: 2026-06-28T08:10:00Z
---
## Code Duplication Analysis

Generated: 2025-12-21

**Tool:** jscpd (`pnpm cpd`)
**Current state:** 186 clones, 5.21% duplication

---

## 1. Block Creation / Block List Functions (High Impact - 20 clones)

**Status:** Partially addressed.

- Block construction now lives in `src/lib/workoutBlockFactory.ts`, with shared factories used by active workouts and past-workout logging.
- Block-list invariants now live in `src/lib/workoutBlockList.ts`, covering next-id generation, append-and-select, remove-and-repair-selection, and reorder-and-track-selection.
- Remaining work: keep new workout-kind creation cascades pointed at these modules instead of recreating local `generateBlockId`, append, remove, or reorder helpers.

**Files:**

- `src/features/workout/composables/useWorkout.ts`
- `src/features/log-past-workout/composables/usePastWorkout.ts`
- `src/lib/workoutBlockFactory.ts`
- `src/lib/workoutBlockList.ts`

**Historical pattern (pre-refactor, no longer in the codebase):**

```ts
function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>) {
  const newBlock: AmrapBlock = {
    kind: 'amrap',
    id: generateBlockId(),
    config,
    exercises: [...exercises],
    result: null,
  }
  const newBlocks = [...workout.value.blocks, newBlock]
  updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
}

function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>) {
  const newBlock: EmomBlock = {
    kind: 'emom',
    id: generateBlockId(),
    config,
    exercises: [...exercises],
    result: null,
  }
  const newBlocks = [...workout.value.blocks, newBlock]
  updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
}
// ... repeated for tabata, fortime — and also addCardioBlock (5th pattern)
```

**Code Smell:** [Duplicated Code](https://refactoring.guru/smells/duplicate-code)

### Refactoring Techniques

#### Option A: Extract Method + Parameterize Method — ✅ Done

`src/features/workout/composables/useWorkout.ts` now does exactly this: each
`addXBlock` is a one-line call into `createXWorkoutBlock` (from
`workoutBlockFactory.ts`) piped through a shared `appendBlock()` helper, with
`getNextWorkoutBlockId()` (from `workoutBlockList.ts`) replacing the old
`generateBlockId()`:

```ts
function addAmrapBlock(config: AmrapConfig, blockExercises: ReadonlyArray<BlockExercise>) {
  appendBlock(
    createAmrapWorkoutBlock(config, blockExercises, getNextWorkoutBlockId(workout.value.blocks)),
  )
}
```

**Benefit:** Reduces duplication in the "add to blocks" logic.

#### Option B: Factory Function with Discriminated Union

Create block factories using TypeScript's discriminated unions:

```ts
// src/features/workout/lib/blockFactory.ts
type TimedBlockInput =
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<BlockExercise> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<BlockExercise> }
  | { kind: 'tabata'; config: TabataConfig; exercise: BlockExercise }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<BlockExercise> }

function createTimedBlock(input: TimedBlockInput, id: number): TimedBlock {
  const base = { id, result: null }

  switch (input.kind) {
    case 'amrap':
      return { ...base, kind: 'amrap', config: input.config, exercises: [...input.exercises] }
    case 'emom':
      return { ...base, kind: 'emom', config: input.config, exercises: [...input.exercises] }
    case 'tabata':
      return { ...base, kind: 'tabata', config: input.config, exercise: input.exercise }
    case 'fortime':
      return { ...base, kind: 'fortime', config: input.config, exercises: [...input.exercises] }
  }
}
```

**Benefit:** Single factory, type-safe, exhaustive switch.

#### Option C: Builder Pattern (if blocks become more complex)

```ts
const block = new BlockBuilder('amrap').withConfig(config).withExercises(exercises).build()
```

**Benefit:** Fluent API, good for complex construction. Overkill for current needs.

### Recommended Approach

**Option A** for quick win, **Option B** if we want stronger type guarantees.

---

## 2. Validation Schemas — ✅ Done

**Status:** Fixed. The shared module was created as
`src/features/settings/utils/validation/blockConfigSchemas.ts`, exporting
`dbAmrapConfigSchema`, `dbEmomConfigSchema`, `dbTabataConfigSchema`,
`dbForTimeConfigSchema`, `dbCardioConfigSchema`, plus shared field groups
(`blockExerciseFieldsBase`, `strengthBlockFieldsBase`). Both
`blockSchemas.ts` and `templateSchema.ts` import from it (`blockSchemas.ts`
aliases the imports, e.g. `dbAmrapConfigSchema as databaseAmrapConfigSchema`)
instead of redefining the schemas — no more duplication here.

---

## 3. Timer Composables (Medium Impact - 10 clones)

**Files:**

- `src/composables/timers/useEmomTimer.ts`
- `src/composables/timers/useForTimeTimer.ts`
- `src/composables/timers/useAmrapTimer.ts`

**Current Pattern:**
Similar timer state (elapsed, isRunning, isPaused) and control logic (start, pause, resume, stop).

**Code Smell:** [Duplicated Code](https://refactoring.guru/smells/duplicate-code), potentially [Large Class](https://refactoring.guru/smells/large-class)

### Refactoring Techniques

#### Option A: Extract Superclass (Composition) ✅ Done

`useBaseTimer` is implemented at `src/composables/timers/useBaseTimer.ts`. The four timer composables (Amrap, Emom, Tabata, ForTime) all extend it. Existing duplication is resolved.

```ts
// src/composables/timers/useBaseTimer.ts (implemented)
export function useBaseTimer() {
  const elapsed = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)

  function start() {
    isRunning.value = true
  }
  function pause() {
    isPaused.value = true
  }
  function resume() {
    isPaused.value = false
  }
  function stop() {
    isRunning.value = false
    elapsed.value = 0
  }

  return { elapsed, isRunning, isPaused, start, pause, resume, stop }
}

// src/composables/timers/useEmomTimer.ts
export function useEmomTimer(config: EmomConfig) {
  const base = useBaseTimer()
  const currentMinute = ref(1)

  // EMOM-specific logic using base.elapsed, base.isRunning, etc.

  return { ...base, currentMinute }
}
```

**Benefit:** DRY timer foundation, specific timers only add their unique logic.

#### Option B: Strategy Pattern

If timer behavior varies significantly:

```ts
interface TimerStrategy {
  onTick(elapsed: number): void
  isComplete(elapsed: number): boolean
}

function useTimer(strategy: TimerStrategy) {
  // Common timer loop
  // Delegates to strategy for specific behavior
}
```

### Recommended Approach

**Option A** - composition is idiomatic Vue and handles current needs.

---

## 4. Database Repositories (Medium Impact - 13 clones)

**Files:**

- `src/db/implementations/dexie/templates.ts`
- `src/db/implementations/dexie/benchmarks.ts`
- `src/db/converters.ts`

**Current Pattern:**
Similar CRUD operations with minor variations:

```ts
async getAll() {
  return this.table.toArray()
}

async getById(id: string) {
  return this.table.get(id)
}

async create(item: T) {
  await this.table.add(item)
}
```

**Code Smell:** [Duplicated Code](https://refactoring.guru/smells/duplicate-code)

### Refactoring Techniques

#### Option A: Generic Base Repository

```ts
// src/db/implementations/dexie/BaseRepository.ts
export class BaseDexieRepository<T extends { id: string }> {
  constructor(protected table: Dexie.Table<T, string>) {}

  async getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  async create(item: T): Promise<void> {
    await this.table.add(item)
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    await this.table.update(id, changes)
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id)
  }
}

// src/db/implementations/dexie/templates.ts
export class DexieTemplatesRepository
  extends BaseDexieRepository<DbTemplate>
  implements TemplatesRepository
{
  // Only override methods that need custom behavior
  async getWithBlocks(id: string) {
    // Template-specific logic
  }
}
```

**Benefit:** CRUD is inherited, only special cases need implementation.

#### Option B: Repository Factory

```ts
function createRepository<T extends { id: string }>(table: Dexie.Table<T, string>) {
  return {
    getAll: () => table.toArray(),
    getById: (id: string) => table.get(id),
    create: (item: T) => table.add(item),
    // ...
  }
}
```

### Recommended Approach

**Option A** if we want class-based inheritance (current pattern).
**Option B** for functional approach.

---

## 5. Configure Block Dialogs (Low-Medium Impact - 11 clones)

**Files:**

- `src/components/blocks/ConfigureEmomDialog.vue`
- `src/components/blocks/ConfigureAmrapDialog.vue`
- `src/components/blocks/ConfigureForTimeDialog.vue`
- `src/components/blocks/ConfigureCardioDialog.vue`

**Current Pattern:**
Similar dialog structure with form fields, validation, save/cancel.

**Code Smell:** [Duplicated Code](https://refactoring.guru/smells/duplicate-code) in templates

### Refactoring Techniques

#### Option A: Renderless Component / Composable

Extract dialog logic to a composable:

```ts
// src/composables/useConfigDialog.ts
export function useConfigDialog<T>(props: { open: boolean }, emit: Function) {
  const config = ref<T>()
  const isValid = computed(() => /* validation */)

  function save() {
    if (isValid.value) emit('save', config.value)
  }

  function cancel() {
    emit('update:open', false)
  }

  return { config, isValid, save, cancel }
}
```

#### Option B: Slot-based Dialog Shell

```vue
<!-- ConfigureBlockDialog.vue -->
<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>

      <slot />
      <!-- Form fields injected here -->

      <DialogFooter>
        <Button variant="outline" @click="cancel">Cancel</Button>
        <Button :disabled="!isValid" @click="save">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### Recommended Approach

**Option B** - keeps Vue template patterns, reduces boilerplate.

Note: Some template duplication is acceptable in Vue - over-abstracting can hurt readability.

---

## 6. Type Definitions (Original Concern)

**Files:**

- `src/types/blocks.ts`
- `src/db/schema.ts`

**Current Pattern:**
Domain types (`AmrapConfig`) duplicated as DB types (`DbAmrapConfig`) when they're identical.

**Code Smell:** [Duplicated Code](https://refactoring.guru/smells/duplicate-code)

### Refactoring Techniques

#### Use Type Aliases for Identical Types

```ts
// src/db/schema.ts
import type { AmrapConfig, EmomConfig } from '@/types/blocks'

// Only alias when DB and domain are identical
export type DbAmrapConfig = AmrapConfig
export type DbEmomConfig = EmomConfig

// Keep separate when they differ
export type DbTemplateBlockExercise = {
  exerciseDefinitionId: string | null // Different from domain
  name: string
  // ...
}
```

### Recommended Approach

Audit all `Db*` types, alias identical ones, keep separate only when they truly differ.

---

## Priority Matrix

| Area               | Impact             | Effort | Risk   | Priority |
| ------------------ | ------------------ | ------ | ------ | -------- |
| Block creation     | High (20 clones)   | Medium | Low    | **1**    |
| Type definitions   | Medium             | Low    | Low    | **2**    |
| Validation schemas | Medium (5 clones)  | Low    | Low    | **3**    |
| Timer composables  | Medium (10 clones) | Medium | Medium | **4**    |
| DB repositories    | Medium (13 clones) | High   | Medium | **5**    |
| Dialog templates   | Low                | Medium | Low    | **6**    |

---

## Commands

```bash
# Run duplication check
pnpm cpd

# View specific file duplications
pnpm cpd 2>&1 | grep "useWorkout.ts"

# Check threshold compliance (currently 6%)
pnpm cpd --threshold 5
```
