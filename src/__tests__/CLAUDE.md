# Testing Guide

AI agent guidance for testing in this Vue 3 PWA.

## Testing Stack

**Framework**: Vitest 4 with **Playwright browser mode** (NOT jsdom)

**Libraries**: vitest-browser-vue, Vitest Browser locators (`page.getBy*`), fake-indexeddb

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
import { page, userEvent } from 'vitest/browser'

it('navigates through workout flow', async () => {
  const app = await createTestApp({ initialRoute: '/' })

  // Navigate
  await app.navigateTo('/workout/active')

  // Use page objects
  await app.workout.clickStartWorkout()
  await app.workout.fillExerciseInput('Squat')

  // Use Vitest Browser locators (page.getBy*) for queries and assertions
  await expect.element(page.getByRole('button', { name: /start/i })).toBeVisible()
  await page.getByRole('button', { name: /start/i }).click()

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
import { page, userEvent } from 'vitest/browser'

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
await userEvent.click(confirmButton)
app.common.assertDialogClosed()
```

**Files**: `src/__tests__/helpers/pages/` (page object implementations)

### ✅ DO: Use Vitest Browser Locator Query Priority

Follow query priority using `page` from `vitest/browser`:

1. **`page.getByRole`** (best) - Accessible queries
2. **`page.getByLabelText`** - Form fields
3. **`page.getByPlaceholderText`** - Form fields
4. **`page.getByText`** - Non-interactive elements
5. **`page.getByTestId`** (last resort) - Only when no other option

```ts
import { page } from 'vitest/browser'

// ✅ GOOD - accessible
const button = page.getByRole('button', { name: /start workout/i })

// ⚠️ OK - for non-interactive text
const heading = page.getByText('My Workout')

// ❌ LAST RESORT - only when necessary
const element = page.getByTestId('workout-timer')
```

### ❌ DON'T: Use jsdom-Specific APIs

Tests run in **Playwright browser**, not jsdom:

```ts
import { page } from 'vitest/browser'

// ❌ BAD - avoid raw DOM queries
document.querySelector('.my-class')

// ✅ GOOD - use Vitest Browser locators
page.getByRole('button', { name: /submit/i })
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

### 2. Wait for Async Operations with `expect.element` / `expect.poll`

Use Vitest Browser's built-in retry-able assertions (NOT `waitFor` from `@testing-library/vue`):

```ts
import { page } from 'vitest/browser'

// ✅ Element visibility - use expect.element() with retry
await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()
await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

// ✅ Non-DOM state (router, objects) - use expect.poll()
await expect.poll(() => app.router.currentRoute.value.path).toBe('/workout')

// ✅ Database assertions - use expect.poll() with async callback
await expect.poll(async () => {
  const template = await db.templates.get('id')
  return template?.name
}).toBe('My Template')

// ✅ Element state checks - use expect.poll() for non-locator values
await expect.poll(() => workout.getCompletedSetCount()).toBe(2)

// ✅ Spy/mock call counts - use expect.poll()
await expect.poll(() => spy.mock.calls.length).toBeGreaterThan(0)

// ✅ Custom timeout when needed
await expect.element(page.getByText(/loading/i), { timeout: 5000 }).toBeVisible()
await expect.poll(() => spy.mock.calls.length, { timeout: 1000 }).toBe(3)
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

### 4. Use Vitest Browser `userEvent` and Locators

```ts
import { page, userEvent } from 'vitest/browser'

// ❌ BAD - fireEvent is low-level
fireEvent.click(button)

// ✅ GOOD - userEvent uses real browser automation
await userEvent.click(button)
await userEvent.fill(input, 'text') // fill() clears then types
await userEvent.keyboard('{Escape}')

// ✅ EVEN BETTER - use locators directly for clicks
await page.getByRole('button', { name: /start/i }).click()
```

Import `page` and `userEvent` from `vitest/browser` in any test file.

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
- [ ] Waits for async: `expect.element()` for DOM, `expect.poll()` for state
- [ ] Uses `page.getByRole` for interactive elements (prefer over Testing Library queries)
