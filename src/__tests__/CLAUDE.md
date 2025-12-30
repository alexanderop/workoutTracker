# Testing Guide

AI agent guidance for testing in this Vue 3 PWA.

## Stack

**Framework**: Vitest 4 with **Playwright browser mode** (NOT jsdom)

**Libraries**: vitest-browser-vue, Vitest Browser locators (`page.getBy*`), fake-indexeddb

## Commands

```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode
pnpm test:headed         # Visible browser (debugging)
pnpm test:ui             # Interactive UI
pnpm test:coverage       # With coverage
pnpm test path/to/file   # Specific file
```

## Test Directories

| Directory | Purpose |
|-----------|---------|
| `composables/` | Direct composable unit tests |
| `integration/` | Full user flows with router + Pinia |
| `factories/` | Test data builders |
| `helpers/` | `createTestApp`, `withSetup`, page objects |

## Core Patterns

### Reset Database Between Tests

```ts
import { resetDatabase } from '@/__tests__/setup'

beforeEach(async () => {
  await resetDatabase()
})
```

### Test Composables Directly (No Lifecycle)

```ts
import { useRestTimer } from '@/composables/timers/useRestTimer'

it('starts timer', () => {
  const { start, isRunning } = useRestTimer()
  start(60)
  expect(isRunning.value).toBe(true)
})
```

### Use `withSetup()` for Lifecycle Composables

```ts
import { withSetup } from '@/__tests__/helpers/withSetup'

it('runs onMounted', () => {
  const [result, app] = withSetup(() => useMyComposable())
  expect(result.initialized.value).toBe(true)
  app.unmount()
})
```

### Use `createTestApp()` for Integration Tests

```ts
import { createTestApp } from '@/__tests__/helpers/createTestApp'
import { page } from 'vitest/browser'

it('navigates workout flow', async () => {
  const app = await createTestApp({ initialRoute: '/' })

  await app.navigateTo('/workout/active')
  await app.workout.clickStartWorkout()

  await expect.element(page.getByRole('button', { name: /start/i })).toBeVisible()

  app.cleanup() // REQUIRED
})
```

### Use Page Objects

```ts
const app = await createTestApp()

// Page objects for common workflows
await app.benchmarks.navigateToList()
await app.workout.fillSet(0, { kg: 100, reps: 8 })
await app.queue.openDrawer()
await app.common.waitForDialog()
```

**Files**: `src/__tests__/helpers/pages/`

### Use Factories for Test Data

```ts
// In-memory workout
import { workoutBuilder } from '@/__tests__/factories/workout.builder'
const workout = workoutBuilder()
  .withStrengthBlock({ exerciseName: 'Squat' })
  .build()

// Database workout
import { dbWorkoutBuilder } from '@/__tests__/factories/dbWorkout.factory'
const dbWorkout = await dbWorkoutBuilder()
  .withExercise('Deadlift', 3)
  .build()
```

## Query Priority

Use `page` from `vitest/browser`:

1. `page.getByRole` (best) - Accessible queries
2. `page.getByLabelText` - Form fields
3. `page.getByText` - Non-interactive elements
4. `page.getByTestId` (last resort)

```ts
import { page } from 'vitest/browser'

// ✅ GOOD
page.getByRole('button', { name: /start workout/i })

// ❌ LAST RESORT
page.getByTestId('workout-timer')
```

## Assertions

```ts
import { page } from 'vitest/browser'

// DOM visibility - use expect.element()
await expect.element(page.getByText(/block 1/i)).toBeVisible()
await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

// Non-DOM state - use expect.poll()
await expect.poll(() => app.router.currentRoute.value.path).toBe('/workout')

// Database - use expect.poll() with async
await expect.poll(async () => {
  const template = await db.templates.get('id')
  return template?.name
}).toBe('My Template')

// With timeout
await expect.element(page.getByText(/loading/i), { timeout: 5000 }).toBeVisible()
```

## Gotchas

### 1. Always Reset Database

Tests share fake-indexeddb. Without reset, data leaks between tests.

### 2. Always Cleanup

```ts
it('my test', async () => {
  const app = await createTestApp()
  // ... test ...
  app.cleanup() // ✅ REQUIRED
})
```

### 3. Use userEvent (Not fireEvent)

```ts
import { userEvent, page } from 'vitest/browser'

// ✅ Pass locators directly - they retry automatically
await userEvent.click(page.getByRole('button'))
await userEvent.fill(page.getByRole('textbox'), 'text')

// ✅ Locator's click method also works
await page.getByRole('button').click()

// ❌ DON'T use .element() for userEvent - no retry, more verbose
await userEvent.click(await button.element())
```

### 4. When to Use `.element()`

Only use `.element()` when you need the actual DOM element:

```ts
// ✅ DOM property access - MUST use .element()
const el = await input.element()
return el.value
return el.textContent
return el.classList.contains('active')

// ✅ DOM traversal - MUST use .element()
const card = (await page.getByText('name').element()).closest('.card')

// ✅ Pass to helper expecting Element
const dialog = await page.getByRole('dialog').element()
await assertNoViolations(dialog)

// ❌ DON'T use for userEvent - locators work directly
await userEvent.click(await btn.element())  // Bad
await userEvent.click(btn)                   // Good
```

### 5. No jsdom APIs

Tests run in Playwright browser:

```ts
// ❌ BAD
document.querySelector('.my-class')

// ✅ GOOD
page.getByRole('button')
```

### 6. Exercise Selection in Tests

The exercise seed data changes over time. Tests can break when new exercises are added due to:
1. **Partial name matching** - "Squat" might match "Belt Squat Machine" before "Bodyweight Squat"
2. **Virtualized lists** - Exercise dialogs only render visible items; exercises may scroll off-screen

```ts
// ❌ BAD - partial names are fragile
await userEvent.click(common.getDialogButton('Squat'))

// ❌ BAD - "Bench Press" may be scrolled off-screen in large lists
await expect.element(page.getByText('Bench Press')).toBeVisible()

// ✅ GOOD - use full exact names
await userEvent.click(common.getDialogButton('Bodyweight Squat'))

// ✅ GOOD - use exercises at START of alphabet (A-B visible without scrolling)
await expect.element(page.getByText('Assisted Pull-up Machine')).toBeVisible()
await expect.element(page.getByText('Barbell Row')).toBeVisible()
```

**Best practices:**
- Use complete exercise names when selecting specific exercises
- For visibility checks, use exercises starting with A-B (visible without scrolling)
- When testing search/filter behavior, search first then check results
- Consider that the exercise list has 130+ items and is virtualized

### 6a. Seed Data Resilience (IMPORTANT)

Seed data (exercises, templates, benchmarks) evolves as features are added. Tests that make assumptions about specific seed data are fragile and break unexpectedly.

**Pattern: Test Invariants, Not Specific Data**

```ts
// ❌ FRAGILE - assumes exactly 1 "Deadlift" exists (breaks when variants added)
const matches = buttons.filter(btn => btn.textContent?.includes('Deadlift'))
expect(matches.length).toBe(1)

// ✅ RESILIENT - tests the actual invariant (no duplicates)
const names = buttons.map(btn => btn.textContent?.trim())
const uniqueNames = new Set(names)
expect(names.length).toBe(uniqueNames.size) // All names are unique
```

**Pattern: Create Controlled Test Data**

When you need specific data for assertions, create it in the test rather than relying on seed data:

```ts
// ❌ FRAGILE - depends on seed data having exactly these exercises
await userEvent.fill(searchInput, 'Deadlift')
await expect.element(page.getByText('Deadlift', { exact: true })).toBeVisible()
expect(results.length).toBe(1)

// ✅ RESILIENT - create custom exercise with unique name
const { db } = await createTestApp()
await db.exercises.add({
  id: 'test-unique-exercise',
  name: 'Zzzz Unique Test Exercise',
  muscle: 'chest',
  equipment: 'barbell',
})
await userEvent.fill(searchInput, 'Zzzz Unique')
await expect.element(page.getByText('Zzzz Unique Test Exercise')).toBeVisible()
```

**Pattern: Test Behavior, Not Implementation**

```ts
// ❌ FRAGILE - tests specific count that changes with seed data
expect(exercises.length).toBe(134)

// ✅ RESILIENT - tests the behavior that matters
expect(exercises.length).toBeGreaterThan(0)
expect(exercises.every(e => e.name && e.muscle)).toBe(true)
```

**Pattern: Use Exact Matches When Filtering**

```ts
// ❌ FRAGILE - partial match catches unexpected exercises
const deadlifts = exercises.filter(e => e.name.includes('Deadlift'))

// ✅ RESILIENT - exact match or explicit list
const deadlift = exercises.find(e => e.name === 'Deadlift')

// ✅ RESILIENT - if testing "variants exist", be explicit
const deadliftVariants = exercises.filter(e =>
  e.name === 'Deadlift' ||
  e.name === 'Romanian Deadlift' ||
  e.name.includes('Single Leg Deadlift')
)
```

**When seed data tests ARE appropriate:**

1. **Smoke tests** - Verify seed data loads correctly
2. **Regression tests** - Specific exercises must exist for features to work
3. **Data integrity tests** - Check for duplicates, missing fields, etc.

For these, put them in a dedicated file (`seedExercises.spec.ts`) with clear documentation that they intentionally depend on seed data.

### 7. Test Realistic User Flows (Not Just Happy Paths)

Tests should mirror real user behavior, not idealized flows. Common gap: testing only the "complete everything" path.

**Workout Testing Example:**
```ts
// ❌ HAPPY PATH ONLY - user completes all sets before finishing
await workout.completeMultipleSets(3, { weight: '80', reps: '10', rir: '2' })
// Dialog auto-opens after completing all sets

// ✅ REALISTIC - user enters data but finishes early via menu
const setRow = workout.getSet(0)
await setRow.fill({ kg: 80, reps: 10, rir: 2 })  // Enter data, DON'T click complete
await workout.openMenu()
await page.getByRole('menuitem', { name: /end workout/i }).click()  // Finish early
```

**Why this matters:**
- The app auto-completes sets with data when finishing early (`autoCompleteSetsWithData`)
- If you only test "complete all sets", you miss bugs in the early-finish path
- Real users often enter data for a set, then finish without completing every set

**Key flows to test for workouts:**
1. Complete all sets → finish (happy path)
2. Enter data → finish early via menu (realistic)
3. No data entered → finish early (edge case)

### 8. Navigation Reliability

UI button clicks for navigation can be flaky. Prefer direct router navigation when navigation isn't the behavior being tested:

```ts
// ❌ FLAKY - clicking UI buttons for navigation
await userEvent.click(page.getByRole('button', { name: /go back/i }))
await expect.element(page.getByRole('button', { name: /other button/i })).toBeVisible()

// ✅ RELIABLE - direct router navigation
await navigateTo('/exercises')
await expect.element(page.getByRole('button', { name: /other button/i })).toBeVisible()
```

Use UI navigation only when testing the navigation behavior itself.

## Quick Find

```bash
find src/__tests__/integration -name "*.spec.ts"   # Integration tests
ls src/__tests__/helpers/pages                      # Page objects
ls src/__tests__/factories                          # Factories
```
