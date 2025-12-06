# Testing Guide for Claude

This guide explains how to write tests in this project. All tests run in **Playwright browser mode** using **Vitest** with **@testing-library/vue** and **fake-indexeddb**.

## Directory Structure

```
src/__tests__/
├── composables/         # Unit tests for composables
│   └── timers/          # Timer-specific composable tests
├── integration/         # Full user flow integration tests
├── factories/           # Test data factories and builders
├── helpers/
│   ├── pages/           # Page Object classes
│   ├── createTestApp.ts # Integration test app helper
│   ├── withSetup.ts     # Composable lifecycle helper
│   └── types.ts         # Shared test types
└── setup.ts             # Global test setup with mocks
```

## Test File Naming

- Use `.spec.ts` extension for all test files
- Name tests after the module: `useRestTimer.spec.ts`, `strength-workflows.spec.ts`

## Database Reset

Always reset the database between tests to ensure isolation:

```ts
import { resetDatabase } from '@/__tests__/setup'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'

beforeEach(async () => {
  resetInitState()
  await resetDatabase()
})

afterEach(async () => {
  resetWorkout()
  await resetDatabase()
})
```

## Testing Composables

### Direct Testing (No Lifecycle Dependencies)

Test composables that do not use `onMounted`, `onUnmounted`, or other lifecycle hooks directly:

```ts
import { useRestTimer } from '@/composables/timers/useRestTimer'

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in stopped state', () => {
    const { isRunning } = useRestTimer()
    expect(isRunning.value).toBe(false)
  })

  it('increments elapsed seconds while running', () => {
    const { start, elapsedSeconds } = useRestTimer()
    start()
    vi.advanceTimersByTime(3000)
    expect(elapsedSeconds.value).toBe(3)
  })
})
```

### withSetup Helper (Lifecycle-Dependent Composables)

Use `withSetup` for composables that rely on Vue lifecycle hooks:

```ts
import { withSetup } from '@/__tests__/helpers/withSetup'

it('initializes on mount', () => {
  const [result, app] = withSetup(() => useMyComposable())

  expect(result.initialized.value).toBe(true)

  app.unmount() // Triggers onUnmounted if needed
})
```

## Integration Testing

### createTestApp Helper

Use `createTestApp()` to render the full application with router, Pinia, and i18n:

```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'

it('completes a workout flow', async () => {
  const { builder, workout, user, getByRole, cleanup } = await createTestApp()

  // Navigate and add exercise
  await builder.addStrengthBlock('Bench Press')
  await builder.startWorkout()

  // Interact with workout UI
  const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
  await user.type(weightInput, '100')

  // Complete set
  await user.click(getByRole('button', { name: /complete set/i }))

  cleanup()
})
```

### Page Objects

Page Objects encapsulate page-specific queries and actions. Available page objects:

| Page Object | Purpose |
|-------------|---------|
| `CommonPO` | Shared: dialogs, route waiting |
| `BuilderPO` | Workout builder: add blocks, start workout |
| `ActiveWorkoutPO` | Active workout: fill sets, menu, navigation |
| `QueuePO` | Workout queue page |

**CommonPO methods:**

```ts
await common.waitForDialog()           // Wait for dialog to appear
common.getDialogButton('Confirm')      // Get button inside dialog
common.assertDialogClosed()            // Assert no dialog is open
await common.waitForRoute(/\/workout/) // Wait for route to match
```

**BuilderPO methods:**

```ts
await builder.navigateTo()                   // Click "Get Started"
await builder.addStrengthBlock('Squat')      // Add exercise block
await builder.startWorkout()                 // Click "Start Workout"
await builder.switchToTimedBlocksTab()       // Switch to timed blocks
builder.getCarouselExerciseButtons()         // Get exercise carousel buttons
```

**ActiveWorkoutPO methods:**

```ts
workout.getSetRow(0)                         // Get inputs for set at index
await workout.fillSet(0, { kg: 100, reps: 8, rir: 2 })
await workout.openMenu()                     // Open workout options menu
workout.getFooterButton('next')              // Get next/prev block buttons
```

### Query Priority (Testing Library)

Follow Testing Library's query priority:

1. **Accessible queries** (preferred):
   - `getByRole('button', { name: /submit/i })`
   - `getByRole('spinbutton', { name: /weight/i })`
   - `getByRole('heading', { name: /bench press/i })`

2. **Text queries** (when role is not available):
   - `getByText(/100kg × 8/)`

3. **Test IDs** (last resort):
   - `getByTestId('set-row-0')`

### Async Query Variants

| Variant | Use Case |
|---------|----------|
| `getBy*` | Element exists synchronously |
| `queryBy*` | Check if element exists (returns null) |
| `findBy*` | Wait for element to appear (async) |

```ts
// Assert element exists
expect(getByRole('button', { name: /start/i })).toBeDefined()

// Check if element might not exist
expect(queryByRole('button', { name: /loading/i })).toBeNull()

// Wait for element to appear
const heading = await findByRole('heading', { name: /workout/i })
```

## Test Factories

### In-Memory Factories (Composable Tests)

Create test data for `useWorkout` composable tests:

```ts
import {
  createSet,
  createStrengthBlock,
  workoutBuilder
} from '@/__tests__/factories'

// Simple factory
const set = createSet({ kg: '100', status: 'completed' })
const block = createStrengthBlock({ name: 'Squat', plannedSets: 5 })

// Builder pattern for complex workouts
const workout = workoutBuilder()
  .withStrengthBlock({ name: 'Squat' })
  .withStrengthBlock({ name: 'Bench Press' })
  .selectBlock(0)
  .build()
```

### Database Factories (Integration Tests)

Create data that persists to IndexedDB:

```ts
import {
  createDbStrengthBlock,
  dbWorkoutBuilder
} from '@/__tests__/factories'

const dbWorkout = dbWorkoutBuilder()
  .withExercise('Deadlift', 3)
  .completed()
  .build()
```

## Timer Testing with Fake Timers

Always use fake timers when testing timer composables:

```ts
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('counts down', () => {
  const { start, remainingSeconds } = useCountdownTimer()

  start(60)
  vi.advanceTimersByTime(10_000) // Advance 10 seconds

  expect(remainingSeconds.value).toBe(50)
})
```

## Integration Test Cleanup

Integration tests must clean up DOM and state:

```ts
afterEach(async () => {
  resetWorkout()
  await resetDatabase()
  document.body.style.cssText = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
})
```

## Common Patterns

### Wait for Async State

Use `waitFor` when state updates asynchronously:

```ts
import { waitFor } from '@testing-library/vue'

await waitFor(() => {
  expect(queryByRole('heading', { name: /squat/i })).toBeTruthy()
})
```

### Testing User Input

Use `userEvent` from the test app context:

```ts
const { user } = await createTestApp()

// Type into input
await user.type(input, '100')

// Clear and retype
await user.clear(input)
await user.type(input, '150')

// Click
await user.click(button)
```

### Flush Promises

After actions that trigger async Vue updates:

```ts
import { flushPromises } from '@vue/test-utils'

await user.click(submitButton)
await flushPromises()
```

## Running Tests

```bash
pnpm test                         # Run all tests (Playwright browser)
pnpm test useRestTimer            # Run tests matching pattern
pnpm test:watch                   # Watch mode
pnpm test:headed                  # Run with visible browser
pnpm test:ui                      # Vitest UI
pnpm test:coverage                # With coverage report
```
