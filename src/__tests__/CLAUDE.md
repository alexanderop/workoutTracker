# Testing Guide

AI agent guidance for testing in this Vue 3 PWA.

## Testing Stack

**Framework**: Vitest 4 with **Playwright browser mode** (NOT jsdom)

**Libraries**: Testing Library (Vue), fake-indexeddb, Vitest Browser userEvent

**Test Types**:
- **Unit tests** (`src/__tests__/composables/`) - Direct composable testing
- **Integration tests** (`src/__tests__/integration/`) - Full user flow tests with router + Pinia
- **Component tests** (`src/__tests__/components/`) - Isolated component tests
- **Feature tests** (`src/__tests__/features/`) - Feature module tests
- **Accessibility tests** (`src/__tests__/a11y/`) - A11y compliance tests
- **Browser tests** (`src/__tests__/browser/`) - Browser-specific behavior tests
- **Database tests** (`src/db/__tests__/`) - Repository pattern tests

## Setup & Run

```bash
# Run all tests (Playwright browser mode)
pnpm test

# Watch mode
pnpm test:watch

# Headed browser (visible, for debugging)
pnpm test:headed

# Interactive UI
pnpm test:ui

# Coverage
pnpm test:coverage

# Run specific test file
pnpm test src/__tests__/integration/benchmark-timer-flow.spec.ts

# Run tests for a feature
pnpm test src/features/workout
```

## Patterns & Conventions

### ✅ DO: Reset Database Between Tests

All tests use `fake-indexeddb` for isolation. **Always** reset between tests:

```ts
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

**File**: `src/__tests__/setup.ts`

### ✅ DO: Test Independent Composables Directly

For composables without lifecycle hooks, test directly:

```ts
import { useRestTimer } from '@/composables/timers/useRestTimer'

it('starts a timer', () => {
  const { start, isRunning, timeRemaining } = useRestTimer()

  start(60)

  expect(isRunning.value).toBe(true)
  expect(timeRemaining.value).toBe(60)
})
```

**Examples**: `src/__tests__/composables/timers/` tests

### ✅ DO: Use `withSetup()` for Lifecycle-Dependent Composables

For composables using `onMounted`, `onUnmounted`, `inject`, etc.:

```ts
import { withSetup } from '@/__tests__/helpers/withSetup'
import { useMyComposable } from '@/composables/useMyComposable'

it('runs onMounted hook', () => {
  const [result, app] = withSetup(() => useMyComposable())

  expect(result.initialized.value).toBe(true)

  app.unmount() // Clean up (triggers onUnmounted)
})
```

**File**: `src/__tests__/helpers/withSetup.ts`

### ✅ DO: Use `createTestApp()` for Integration Tests

For full app rendering with router, Pinia, and i18n:

```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'

import { userEvent } from '@vitest/browser/context'

it('navigates through workout flow', async () => {
  const app = await createTestApp({ initialRoute: '/' })

  // Navigate
  await app.navigateTo('/workout/active')

  // Use page objects
  await app.workout.clickStartWorkout()
  await app.workout.fillExerciseInput('Squat')

  // Or use raw Testing Library queries
  const button = app.getByRole('button', { name: /start/i })
  await userEvent.click(button)

  app.cleanup()
})
```

**File**: `src/__tests__/helpers/createTestApp.ts`

**Example**: `src/__tests__/integration/benchmark-timer-flow.spec.ts:12-60`

### ✅ DO: Use Test Factories for Data

**In-memory workouts** (for `useWorkout()` tests):

```ts
import { workoutBuilder } from '@/__tests__/factories/workout.builder'

const workout = workoutBuilder()
  .withName('My Workout')
  .withStrengthBlock({ exerciseName: 'Squat' })
  .withExerciseAndSets([
    { kg: 100, reps: 5, rir: 2, completed: true },
    { kg: 100, reps: 5, rir: 2, completed: false },
  ])
  .selectBlock(0)
  .build()
```

**Database workouts** (for integration tests):

```ts
import { dbWorkoutBuilder } from '@/__tests__/factories/dbWorkout.factory'

const dbWorkout = await dbWorkoutBuilder()
  .withExercise('Deadlift', 3)
  .completed()
  .build()
```

**Files**: `src/__tests__/factories/`

### ✅ DO: Use Page Objects for Complex Interactions

The `createTestApp()` helper provides page objects for common workflows:

```ts
const app = await createTestApp()

// Benchmark page object
await app.benchmarks.navigateToList()
await app.benchmarkForm.fillName('Fran')
await app.benchmarkForm.addExercise('Thrusters', 21)

// Workout page object
await app.workout.clickStartWorkout()
await app.workout.fillSet(0, { kg: 100, reps: 8, rir: 2 })

// Queue page object
await app.queue.openDrawer()
await app.queue.selectBlock(0)

// Common page object (dialogs, navigation)
await app.common.waitForDialog()
const confirmButton = app.common.getDialogButton('Confirm')
await userEvent.click(confirmButton) // import { userEvent } from '@vitest/browser/context'
app.common.assertDialogClosed()
```

**Files**: `src/__tests__/helpers/pages/` (page object implementations)

### ✅ DO: Use Testing Library Query Priority

Follow Testing Library's query priority:

1. **`getByRole`** (best) - Accessible queries
2. **`getByLabelText`** - Form fields
3. **`getByPlaceholderText`** - Form fields
4. **`getByText`** - Non-interactive elements
5. **`getByTestId`** (last resort) - Only when no other option

```ts
// ✅ GOOD - accessible
const button = app.getByRole('button', { name: /start workout/i })

// ⚠️ OK - for non-interactive text
const heading = app.getByText('My Workout')

// ❌ LAST RESORT - only when necessary
const element = app.getByTestId('workout-timer')
```

### ❌ DON'T: Use jsdom-Specific APIs

Tests run in **Playwright browser**, not jsdom:

```ts
// ❌ BAD - jsdom-specific
document.querySelector('.my-class')

// ✅ GOOD - Testing Library queries
app.getByRole('button', { name: /submit/i })
```

### ❌ DON'T: Forget to Clean Up

Always clean up after integration tests:

```ts
it('my test', async () => {
  const app = await createTestApp()

  // ... test code ...

  app.cleanup() // ✅ REQUIRED
})
```

Or use setup/teardown:

```ts
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

beforeEach(setupIntegrationTest)
afterEach(cleanupIntegrationTest) // Cleans up automatically
```

## Touch Points / Key Files

### Test Helpers
- **Full app**: `src/__tests__/helpers/createTestApp.ts` - Router + Pinia + i18n
- **Lifecycle**: `src/__tests__/helpers/withSetup.ts` - Composables with hooks
- **Setup/teardown**: `src/__tests__/helpers/integrationSetup.ts`
- **Database reset**: `src/__tests__/helpers/resetDatabase.ts` and `src/__tests__/setup.ts`
- **Audio mocking**: `src/__tests__/helpers/audioMock.ts` - Mock audio for timer tests
- **Repository mocks**: `src/__tests__/helpers/mockRepositories.ts` - Mock database repositories
- **Accessibility**: `src/__tests__/helpers/a11y.ts` - A11y testing utilities

### Page Objects
- **Common**: `src/__tests__/helpers/pages/CommonPO.ts` - Dialogs, navigation
- **Builder**: `src/__tests__/helpers/pages/BuilderPO.ts` - Workout builder
- **Active workout**: `src/__tests__/helpers/pages/ActiveWorkoutPO.ts`
- **Benchmarks list**: `src/__tests__/helpers/pages/BenchmarksPO.ts`
- **Benchmark detail**: `src/__tests__/helpers/pages/BenchmarkDetailPO.ts`
- **Benchmark form**: `src/__tests__/helpers/pages/BenchmarkFormPO.ts`
- **Queue**: `src/__tests__/helpers/pages/QueuePO.ts`

### Test Factories
- **In-memory workout**: `src/__tests__/factories/workout.builder.ts`
- **Workout factory**: `src/__tests__/factories/workout.factory.ts`
- **Database workout**: `src/__tests__/factories/dbWorkout.factory.ts`
- **Blocks**: `src/__tests__/factories/block.factory.ts`
- **DB Blocks**: `src/__tests__/factories/dbBlock.factory.ts`
- **Sets**: `src/__tests__/factories/set.factory.ts`
- **DB Sets**: `src/__tests__/factories/dbSet.factory.ts`
- **Exercises**: `src/__tests__/factories/exercise.factory.ts`
- **DB Exercises**: `src/__tests__/factories/dbExercise.factory.ts`
- **Custom exercises**: `src/__tests__/factories/customExercise.factory.ts`
- **Templates**: `src/__tests__/factories/template.factory.ts`

### Example Tests
- **Integration tests**: `src/__tests__/integration/`
  - `benchmark-flows.spec.ts` - Benchmark workout flows
  - `strength-workflows.spec.ts` - Strength workout flows
  - `timed-block-workflows.spec.ts` - Timed block flows
  - `timer-audio-playback.spec.ts` - Timer audio tests
  - `workout-management.spec.ts` - Workout CRUD operations
- **Composable test**: `src/__tests__/composables/timers/useRestTimer.spec.ts`
- **Database test**: `src/db/__tests__/` (repository tests)

## JIT Index Hints

```bash
# Find integration tests
find src/__tests__/integration -name "*.spec.ts"

# Find composable unit tests
find src/__tests__/composables -name "*.spec.ts"

# Find tests for a specific feature
rg -n "describe.*workout" src/__tests__ --type ts

# Find page object files
ls src/__tests__/helpers/pages

# Find factory files
ls src/__tests__/factories

# Find test helper files
ls src/__tests__/helpers

# Search for a specific test by name
rg -n "it\('.*timer" src/__tests__ --type ts

# Find a11y tests
find src/__tests__/a11y -name "*.spec.ts"

# Find browser-specific tests
find src/__tests__/browser -name "*.spec.ts"

# List all test directories
ls src/__tests__/
```

## Common Gotchas

### 1. `fake-indexeddb` Requires Reset

```ts
// ❌ BAD - tests will interfere with each other
it('test 1', async () => {
  await workoutRepository.create(workout)
})

it('test 2', async () => {
  const workouts = await workoutRepository.getAll()
  // Fails! Includes workout from test 1
})

// ✅ GOOD - reset between tests
beforeEach(async () => {
  await resetDatabase()
})
```

### 2. Wait for Async Operations

```ts
// ❌ BAD - doesn't wait for navigation
await app.navigateTo('/workout')
expect(app.router.currentRoute.value.path).toBe('/workout') // May fail

// ✅ GOOD - wait for route change
await app.navigateTo('/workout')
await waitFor(() => {
  expect(app.router.currentRoute.value.path).toBe('/workout')
})
```

### 3. Cleanup Is Required

```ts
// ❌ BAD - memory leak, affects other tests
it('my test', async () => {
  const app = await createTestApp()
  // ... test code ...
  // No cleanup!
})

// ✅ GOOD - always clean up
it('my test', async () => {
  const app = await createTestApp()
  // ... test code ...
  app.cleanup()
})
```

### 4. Use Vitest Browser `userEvent`, Not `fireEvent`

```ts
import { userEvent } from '@vitest/browser/context'

// ❌ BAD - fireEvent is low-level
fireEvent.click(button)

// ✅ GOOD - userEvent uses real browser automation
await userEvent.click(button)
await userEvent.fill(input, 'text') // fill() clears then types
await userEvent.keyboard('{Escape}')
```

Import `userEvent` from `@vitest/browser/context` in any test file where you need user interactions.

## Pre-PR Checks

Run tests before creating a PR:

```bash
# All tests
pnpm test

# With coverage (aim for >80%)
pnpm test:coverage

# Lint test files
pnpm lint src/__tests__
```

**Integration test checklist:**
- [ ] Database reset in `beforeEach`
- [ ] `app.cleanup()` called at end of test
- [ ] Uses page objects (not raw DOM queries)
- [ ] Waits for async operations (`waitFor`, `flushPromises`)
- [ ] Uses `getByRole` for interactive elements
