# Testing Guide

## Directory Structure

```
src/__tests__/
├── composables/         # Unit tests for composables
│   ├── timers/          # Timer composable tests
│   └── *.spec.ts
├── integration/         # Full user flow tests
├── factories/           # Test data builders
├── helpers/             # Test utilities
└── setup.ts             # Global test setup
```

## Test Setup

Tests use `fake-indexeddb` for database isolation. Import `resetDatabase` to clear tables between tests:

```ts
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

## Unit Testing Composables

### Direct Testing (Independent Composables)

Test composables that don't need Vue lifecycle directly:

```ts
import { useRestTimer } from '@/features/timers'

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

Use `createTestApp()` for full app rendering with router and Pinia:

```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'

it('navigates through workout flow', async () => {
  const app = await createTestApp({ initialRoute: '/' })

  // Navigation
  await app.navigateTo('/workout')
  await app.waitForRoute(/\/workout/)

  // Dialog interactions
  await app.waitForDialog()
  await app.user.click(app.getDialogButton('Confirm'))
  app.assertDialogClosed()

  // Workout interactions
  await app.startWorkout()
  await app.fillSet(0, { kg: 100, reps: 8, rir: 2 })

  app.cleanup()
})
```

Location: `src/__tests__/helpers/createTestApp.ts`

### createTestApp API

| Method | Description |
|--------|-------------|
| `navigateTo(path)` | Navigate to a route |
| `waitForRoute(pattern)` | Wait for route to match regex |
| `waitForDialog()` | Wait for dialog to appear |
| `getDialogButton(text)` | Get button inside dialog |
| `assertDialogClosed()` | Assert no dialog is open |
| `startWorkout()` | Click "Start Workout" button |
| `openWorkoutMenu()` | Open the three-dot menu |
| `getSetRow(index)` | Get inputs for a set row |
| `fillSet(index, values)` | Fill kg/reps/rir for a set |
| `getCarouselExerciseButtons()` | Get exercise buttons in carousel |
| `getPlaylistBlockButtons()` | Get block buttons in playlist |
| `cleanup()` | Clean up after test |

## Test Factories

Factories create test data with sensible defaults. Two categories:

### In-Memory Factories (for useWorkout tests)

```ts
import {
  createSet,
  createStrengthBlock,
  createWorkout,
  WorkoutBuilder
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
import {
  createDbSet,
  createDbStrengthBlock,
  DbWorkoutBuilder
} from '@/__tests__/factories'

const dbWorkout = dbWorkoutBuilder()
  .withExercise('Deadlift', 3)
  .completed()
  .build()
```

Location: `src/__tests__/factories/index.ts`

## Running Tests

```bash
pnpm test:unit                          # Run all tests
pnpm test:unit <file>                   # Run single file
pnpm test:unit --watch                  # Watch mode
pnpm test:unit --coverage               # With coverage
```
