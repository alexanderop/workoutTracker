# Root Cause Tracing

## Overview

Bugs often manifest deep in the call stack (Dexie error, Vue reactivity issue, test assertion failure). Your instinct is to fix where the error appears, but that's treating a symptom.

**Core principle:** Trace backward through the call chain until you find the original trigger, then fix at the source.

## The Tracing Process

### 1. Observe the Symptom
```
Error: Cannot read property 'name' of undefined
  at WorkoutCard.vue:42
```

### 2. Find Immediate Cause
What code directly causes this?
```ts
// WorkoutCard.vue:42
<div>{{ workout.name }}</div>  // workout is undefined
```

### 3. Ask: What Passed This Value?
```ts
// Parent component
<WorkoutCard :workout="currentWorkout" />
// Where does currentWorkout come from?
```

### 4. Keep Tracing Up
```ts
// Composable
const { currentWorkout } = useActiveWorkout()
// What returns undefined?

// Store
const activeWorkout = computed(() => workouts.value.find(w => w.isActive))
// Why is there no active workout?
```

### 5. Find Original Trigger
```ts
// Test setup
beforeEach(async () => {
  // Missing: await db.workouts.add(testWorkout)
})
```

**Root cause:** Test didn't seed required data.

## Adding Stack Traces

When you can't trace manually:

```ts
// Before the problematic operation
async function getWorkout(id: string) {
  console.error('DEBUG getWorkout:', {
    id,
    stack: new Error().stack,
  })
  return await db.workouts.get(id)
}
```

Run test and capture:
```bash
pnpm test 2>&1 | grep 'DEBUG getWorkout'
```

## Common Trace Patterns

### Vue Component Hierarchy

```
Symptom: Component shows wrong data
  ↑ Parent passes wrong prop
    ↑ Parent's computed returns stale value
      ↑ Composable not reactive
        ↑ Missing ref() wrapper
```

### Dexie/Database Chain

```
Symptom: Data not found in database
  ↑ Repository.get() returns undefined
    ↑ ID mismatch (string vs number)
      ↑ Converter strips prefix
        ↑ Schema expects different format
```

### Test Isolation Chain

```
Symptom: Test fails when run with others
  ↑ Extra data in database
    ↑ Previous test didn't clean up
      ↑ Missing resetDatabase() in beforeEach
```

## Vue-Specific Tracing

### Reactivity Issues

```ts
// Symptom: UI doesn't update
// Add watchers to trace
watch(
  () => state.value,
  (newVal, oldVal) => {
    console.error('State changed:', { oldVal, newVal, stack: new Error().stack })
  },
  { deep: true }
)
```

### Composable Dependencies

```ts
// Trace what triggers recomputation
const result = computed(() => {
  console.error('Recomputing result:', {
    dependency1: dep1.value,
    dependency2: dep2.value,
  })
  return /* ... */
})
```

## Dexie-Specific Tracing

### Transaction Issues

```ts
// Trace transaction state
await db.transaction('rw', db.workouts, async () => {
  console.error('In transaction:', {
    tableName: 'workouts',
    mode: 'rw',
  })
  // ... operations
})
```

### Query Debugging

```ts
// Log actual query
const results = await db.workouts
  .where('startedAt')
  .above(startDate)
  .toArray()

console.error('Query results:', {
  condition: `startedAt > ${startDate}`,
  count: results.length,
  firstResult: results[0],
})
```

## Finding Which Test Pollutes

Use the bisection script in `scripts/find-polluter.sh`:

```bash
./scripts/find-polluter.sh 'path/to/pollution' 'src/**/*.test.ts'
```

Or manual bisection:
```bash
# Run first half of tests
pnpm test src/features/workout

# Check if pollution exists
# If yes, problem is in workout tests
# If no, problem is elsewhere
```

## Key Principle

```
Found immediate cause
  ↓
Can trace one level up?
  ↓ yes                    ↓ no
Trace backwards         Add console.error
  ↓                      for more context
Is this the source?
  ↓ yes
Fix at source
  ↓
Add validation at each layer (defense-in-depth)
```

**NEVER fix just where the error appears.** Trace back to find the original trigger.
