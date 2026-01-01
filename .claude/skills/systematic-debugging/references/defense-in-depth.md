# Defense-in-Depth Validation

## Overview

When you fix a bug caused by invalid data, adding validation at one place feels sufficient. But that single check can be bypassed by different code paths, refactoring, or mocks.

**Core principle:** Validate at EVERY layer data passes through. Make the bug structurally impossible.

## The Four Layers

### Layer 1: Entry Point Validation

Reject invalid input at API boundary (component props, repository methods).

```ts
// Repository method
async save(workout: Workout): Promise<void> {
  if (!workout.id) {
    throw new Error('Workout must have an id')
  }
  if (workout.blocks.length === 0) {
    throw new Error('Workout must have at least one block')
  }
  // ... proceed
}
```

### Layer 2: Converter Validation

Ensure data integrity during transformation.

```ts
// Domain to database converter
function toDbWorkout(workout: Workout): DbWorkout {
  if (!workout.startedAt) {
    throw new Error('Cannot persist workout without startedAt')
  }
  return {
    id: workout.id,
    startedAt: workout.startedAt.toISOString(),
    // ...
  }
}
```

### Layer 3: Database Schema Constraints

Use Dexie indexes and structure to prevent invalid data.

```ts
// db/schema.ts
const db = new Dexie('workoutTracker')
db.version(1).stores({
  workouts: 'id, startedAt, templateId',  // id is required (primary key)
  templates: 'id, name',
})
```

### Layer 4: Test Isolation Guards

Prevent test pollution with strict isolation.

```ts
// In test setup
beforeEach(async () => {
  await resetDatabase()  // ALWAYS reset first

  // Guard against pollution
  const workoutCount = await db.workouts.count()
  if (workoutCount > 0) {
    throw new Error('Database not clean - test pollution detected')
  }
})
```

## Applying to Test Isolation

Bug: Tests pass individually but fail when run together.

**Data flow:**
1. Test A adds workout
2. Test A doesn't clean up
3. Test B expects empty state
4. Test B fails

**Four layers:**
- **Layer 1:** `beforeEach` calls `resetDatabase()`
- **Layer 2:** Factory methods create unique IDs
- **Layer 3:** Each test uses isolated data
- **Layer 4:** Assertions verify expected count, not just existence

```ts
// FRAGILE - assumes empty database
const workouts = await db.workouts.toArray()
expect(workouts.length).toBe(1)

// RESILIENT - tests specific data
const workout = await db.workouts.get(testWorkoutId)
expect(workout).toBeDefined()
```

## Repository Pattern Example

Bug: Empty ID passed to repository causes unexpected behavior.

**Four layers added:**

```ts
// Layer 1: Repository method validates
async get(id: string): Promise<Workout | undefined> {
  if (!id || id.trim() === '') {
    throw new Error('Workout ID cannot be empty')
  }
  return this.db.workouts.get(id)
}

// Layer 2: Converter validates
function fromDbWorkout(db: DbWorkout): Workout {
  if (!db.id) {
    throw new Error('Database workout missing id')
  }
  return { id: db.id, /* ... */ }
}

// Layer 3: Schema enforces
// Primary key 'id' automatically required

// Layer 4: Debug logging
async get(id: string): Promise<Workout | undefined> {
  console.debug('Repository.get called with:', { id })
  // ...
}
```

## Vue Component Validation

Bug: Component receives undefined prop and renders incorrectly.

**Four layers:**

```ts
// Layer 1: Prop validation with required
const props = defineProps<{
  workout: Workout  // Required by TypeScript
}>()

// Layer 2: Runtime check in setup
if (!props.workout.id) {
  throw new Error('Workout component requires valid workout')
}

// Layer 3: Template guard
<template>
  <div v-if="workout">
    <!-- Only render if workout exists -->
  </div>
</template>

// Layer 4: Test verifies
it('throws when workout missing', () => {
  expect(() => mount(WorkoutCard, { props: {} }))
    .toThrow()
})
```

## Key Insight

All layers are necessary. During testing, each layer catches bugs the others miss:
- Different code paths bypass entry validation
- Mocks bypass converter checks
- Edge cases slip through schema
- Debug logging identifies usage patterns

**Don't stop at one validation point.** Add checks at every layer.
