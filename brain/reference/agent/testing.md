---
type: Reference
title: "Testing Guide"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/agent/testing.md
tags: [reference, agent]
timestamp: 2026-06-28T08:10:00Z
---
## Testing Guide

## Directory Structure

```
src/__tests__/
├── a11y/                # Accessibility tests (vitest project=a11y)
├── architecture/        # Architecture boundary tests (vitest project=arch)
├── browser/             # Browser-specific tests
├── components/          # Component tests
├── composables/         # Unit tests for composables
├── db/                  # Database layer tests
├── factories/           # Test data builders
├── features/            # Feature-level tests
├── helpers/             # Test utilities
├── integration/         # Full user flow tests
├── lib/                 # Library utility tests
├── stores/              # Store tests
├── visual/              # Visual regression tests (vitest project=visual)
└── setup.ts             # Global test setup (re-exports helpers for compat)
```

## Test Setup

Tests use `fake-indexeddb` for database isolation. Import `resetDatabase` to clear tables between tests:

```ts
import { resetDatabase } from '@/__tests__/helpers/resetDatabase'

beforeEach(async () => {
  await resetDatabase()
})
```

`resetDatabase` clears all DB tables, localStorage seeding markers, and resets all VueUse `createGlobalState` singletons (settings, exercises, onboarding, workout state, timers). The canonical import path is `@/__tests__/helpers/resetDatabase`; `setup.ts` re-exports it only for backwards compatibility.

## Unit Testing Composables

### Direct Testing (Independent Composables)

Test composables that don't need Vue lifecycle directly:

```ts
import { useRestTimer } from '@/composables/timers/useRestTimer'

it('starts a timer', () => {
  const { start, isRunning } = useRestTimer()
  start(60)
  expect(isRunning.value).toBe(true)
})
```

### withSetup Helper (Lifecycle-Dependent Composables)

For composables using `onMounted`, `onUnmounted`, etc., use `withSetup`:

```ts
import { withSetup } from '@/__tests__/helpers/withSetup'

it('runs onMounted hook', () => {
  const [result, app] = withSetup(() => useMyComposable())
  expect(result.initialized.value).toBe(true)
  app.unmount() // Clean up to trigger onUnmounted
})
```

Location: `src/__tests__/helpers/withSetup.ts`

## Integration Testing

### createTestApp Helper

Use `createTestApp()` for full app rendering with router and i18n. The project does NOT use Pinia — state is managed via VueUse `createGlobalState` singletons. It returns a **Page Object** structure, not flat helper methods:

```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'

it('navigates through workout flow', async () => {
  const { common, builder, workout, queue, navigateTo, cleanup } =
    await createTestApp({ initialRoute: '/' })

  // Navigation
  await navigateTo('/workout')

  // Builder interactions via BuilderPO
  await builder.addStrengthBlock('Bench Press')
  await builder.startWorkout()

  // Active workout via ActiveWorkoutPO
  await workout.fillSet(0, { kg: 100, reps: 8, rir: 2 })

  // Common helpers (dialogs, selects)
  await common.selectExercise('Deadlift')
  await common.getDialogButton('Confirm').click()

  cleanup()
})
```

Location: `src/__tests__/helpers/createTestApp.ts`

### createTestApp return value

| Property          | Type               | Description                                       |
| ----------------- | ------------------ | ------------------------------------------------- |
| `common`          | `CommonPO`         | Shared helpers: dialogs, exercise picker, selects |
| `builder`         | `BuilderPO`        | Workout builder screen interactions               |
| `workout`         | `ActiveWorkoutPO`  | Active workout execution interactions             |
| `queue`           | `QueuePO`          | Block queue/playlist interactions                 |
| `benchmarks`      | `BenchmarksPO`     | Benchmarks list interactions                      |
| `benchmarkForm`   | `BenchmarkFormPO`  | Create/edit benchmark form                        |
| `benchmarkDetail` | `BenchmarkDetailPO`| Benchmark detail & run interactions               |
| `logPastWorkout`  | `LogPastWorkoutPO` | Log past workout screen                           |
| `exercises`       | `ExercisesPO`      | Exercises list/search/filter                      |
| `weight`          | `WeightPO`         | Weight tracking screen                            |
| `progressions`    | `ProgressionsPO`   | Progressions screen                               |
| `router`          | `Router`           | Vue Router instance                               |
| `navigateTo(to)`  | helper             | Navigate to a route                               |
| `cleanup()`       | helper             | Unmount and clean up after test                   |
| `getByRole` etc.  | raw queries        | Direct `page.getBy*` passthrough (avoid for new code) |

Page Object files live in `src/__tests__/helpers/pages/`.

## Test Factories

Factories create test data with sensible defaults. Two categories:

### In-Memory Factories (for useWorkout tests)

```ts
import {
  createSet,
  createStrengthBlock,
  createWorkout,
  WorkoutBuilder,
} from '@/__tests__/factories'

// Simple creation
const set = createSet({ kg: '100', status: 'completed' })
const block = createStrengthBlock({ name: 'Bench Press' })

// Builder pattern for complex workouts
const workout = workoutBuilder()
  .withStrengthBlock('Squat', 3)
  .withStrengthBlock('Bench', 3)
  .inActiveMode()
  .build()
```

### Database Factories (for integration tests)

```ts
import { createDbSet, createDbStrengthBlock, DbWorkoutBuilder } from '@/__tests__/factories'

const dbWorkout = dbWorkoutBuilder().withExercise('Deadlift', 3).completed().build()
```

Location: `src/__tests__/factories/index.ts`

### Factory Files

All factory files in `src/__tests__/factories/`:

- `benchmark.factory.ts` — benchmark test data
- `block.factory.ts` — in-memory block builders (strength, timed, etc.)
- `customExercise.factory.ts` — custom exercise records
- `dbBlock.factory.ts` — DB-persisted block records
- `dbExercise.factory.ts` — DB-persisted exercise records
- `dbSet.factory.ts` — DB-persisted set records
- `dbWeightEntry.factory.ts` — DB-persisted weight entries
- `dbWorkout.factory.ts` — DB-persisted workout records
- `exercise.factory.ts` — in-memory exercise objects
- `image.ts` — test image helpers
- `index.ts` — barrel re-export
- `set.factory.ts` — in-memory set objects
- `template.factory.ts` — workout template data
- `timedBlock.factory.ts` — timed block (EMOM/Tabata/etc.) builders
- `workout.builder.ts` — `WorkoutBuilder` class for complex workout construction
- `workout.factory.ts` — simple in-memory workout objects

## Running Tests

```bash
pnpm test                # Run all tests (vitest run --project=default)
pnpm test:watch          # Watch mode
pnpm test:headed         # Headed browser mode
pnpm test:ui             # Vitest UI
pnpm test:coverage       # With coverage
pnpm test:a11y           # Accessibility tests
pnpm test:visual         # Visual regression tests
pnpm test:arch           # Architecture tests
```

## Component-Specific Testing Patterns

### shadcn-vue DropdownMenu

DropdownMenu uses `@select` event, not `@click`:

```vue
<!-- ✅ Correct -->
<DropdownMenuItem @select="handleAction">Action</DropdownMenuItem>

<!-- ❌ Won't work -->
<DropdownMenuItem @click="handleAction">Action</DropdownMenuItem>
```

When testing, wait for `role="menu"` (not dialog):

```ts
await userEvent.click(menuButton)
await expect.element(page.getByRole('menu')).toBeVisible()
```

### MobileNumberPicker

Uses preset buttons, not spinbutton input. Click presets directly:

```ts
// ✅ Click preset button
const presetButton = page.getByRole('button', { name: String(reps), exact: true })
await userEvent.click(presetButton)

// ❌ Won't work - no spinbutton exists
const input = page.getByRole('spinbutton')
```

### Single-Visible-Element Pattern

When UI shows one item at a time (tabs, carousels), don't index into element arrays. Navigate first, then interact:

```ts
// ✅ Navigate first, then interact with single visible element
async openRoundMenu(roundIndex: number): Promise<void> {
  if (roundCount > 1) {
    await this.navigateToRound(roundIndex)
  }
  // Now there's only ONE menu button visible
  const menuButton = page.getByRole('button', { name: /options/i })
  await userEvent.click(menuButton)
}

// ❌ Don't try to index into array of elements that aren't all visible
const roundHeaders = await page.getByText(/round \d+/i).all()
const targetHeader = roundHeaders[roundIndex]  // May not exist!
```

### Avoiding Regex Collisions

Use distinct patterns for tabs vs headers to avoid matching both:

```ts
// Header: "Round 1/3"
const roundHeader = page.getByText(/round \d+\/\d+/i)

// Tabs: "R1", "R2", "R3" (compact to avoid matching header)
const tab = page.getByRole('tab', { name: new RegExp(`^R${index + 1}$`) })
```

### Exercise Selection & Form Field Queries

#### Use `selectExercise()` for Exact Exercise Names

`getDialogButton()` uses `includes()` matching, which can select wrong exercises when names overlap:

```ts
// ❌ May select "Barbell Romanian Deadlift" instead (alphabetically first)
await userEvent.click(common.getDialogButton('Deadlift'))

// ✅ Types exact name into search and uses exact matching
await common.selectExercise('Deadlift')
```

#### Use `getByLabelText` to Test Form Field Presence

When checking if a form field exists, use `getByLabelText()` not `getByText()`. Dialog descriptions may contain the same words:

```ts
// ❌ Matches dialog description "Adjust the target reps and number of sets"
const repsLabel = dialog.getByText(/target reps/i)
await expect.element(repsLabel).not.toBeInTheDocument() // Fails!

// ✅ Only matches the actual input label
const repsInput = dialog.getByLabelText(/^target reps$/i)
await expect.element(repsInput).not.toBeInTheDocument() // Correct
```

#### Keep Test Data Factories in Sync with Schema

When adding new fields to domain types (e.g., `targetDuration`, `targetWeight` for isometric exercises), update test helper functions that create mock data:

```ts
// validation.spec.ts helper must include all required fields
function createValidStrengthBlock(overrides = {}) {
  return {
    kind: 'strength',
    targetReps: 8,
    targetDuration: null, // Added for isometric support
    targetWeight: null, // Added for isometric support
    // ...other fields
  }
}
```
