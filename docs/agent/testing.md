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
await expect.element(repsLabel).not.toBeInTheDocument()  // Fails!

// ✅ Only matches the actual input label
const repsInput = dialog.getByLabelText(/^target reps$/i)
await expect.element(repsInput).not.toBeInTheDocument()  // Correct
```

#### Keep Test Data Factories in Sync with Schema

When adding new fields to domain types (e.g., `targetDuration`, `targetWeight` for isometric exercises), update test helper functions that create mock data:

```ts
// validation.spec.ts helper must include all required fields
function createValidStrengthBlock(overrides = {}) {
  return {
    kind: 'strength',
    targetReps: 8,
    targetDuration: null,  // Added for isometric support
    targetWeight: null,    // Added for isometric support
    // ...other fields
  }
}
```
