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

---

## Dual Environment Testing

This project supports running integration tests in two environments:

| Environment | Command | Use Case |
|-------------|---------|----------|
| **Happy-DOM** | `pnpm test` | Fast local development, pre-commit hooks |
| **Browser Mode** | `pnpm test:browser` | Full browser fidelity, CI pipeline |

### When to Use Each Environment

**Happy-DOM (fast, simulated)**
- Local development for quick feedback
- Pre-commit hooks
- Debugging test logic
- When you don't need real browser APIs

**Browser Mode (Playwright)**
- CI pipeline for full confidence
- Testing browser-specific behavior
- Visual regression testing
- Accessibility testing with real browser APIs

### Test Commands

```bash
pnpm test              # Happy-DOM (default for local dev)
pnpm test:watch        # Happy-DOM in watch mode
pnpm test:browser      # Browser mode (Playwright)
pnpm test:browser:ui   # Browser mode with Vitest UI
pnpm test:ci           # Browser mode for CI (used by GitHub Actions)
pnpm test:all          # Both environments
```

### Abstraction Layer

Tests use an abstraction layer that provides a unified API across both environments. Import from these modules instead of directly from `vitest/browser`:

```ts
// ✅ Correct - uses abstraction layer
import { page, userEvent } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'

// ❌ Avoid - browser-specific imports
import { page, userEvent } from 'vitest/browser'
```

#### Locator API

The abstraction layer provides the same query methods as Vitest browser mode:

```ts
// Query methods (return Locator objects)
page.getByRole('button', { name: 'Submit' })
page.getByText('Hello World')
page.getByLabelText('Email')
page.getByPlaceholder('Enter email')
page.getByTestId('submit-btn')

// Locator interactions
await locator.click()
await locator.fill('text')
await locator.clear()
await locator.hover()

// Collection methods
const buttons = page.getByRole('button').all()
const first = page.getByRole('listitem').first()
const third = page.getByRole('listitem').nth(2)
```

#### Assertion API

Use `expectElement()` instead of `expect.element()` and `expectPoll()` instead of `expect.poll()`:

```ts
// Element assertions (with automatic retry)
await expectElement(page.getByRole('button')).toBeVisible()
await expectElement(dialog).toHaveTextContent('Success')
await expectElement(input).toHaveValue('test@example.com')
await expectElement(button).not.toBeDisabled()

// Poll assertions (for async values)
await expectPoll(() => items.length).toBe(5)
await expectPoll(() => store.isLoading).toBeFalsy()
```

**Supported element matchers:**
- `toBeInTheDocument()` / `not.toBeInTheDocument()`
- `toBeVisible()` / `not.toBeVisible()`
- `toBeDisabled()` / `not.toBeDisabled()`
- `toHaveTextContent(text)` / `not.toHaveTextContent(text)`
- `toHaveValue(value)` / `not.toHaveValue(value)`
- `toHaveAttribute(attr, value?)` / `not.toHaveAttribute(attr, value?)`
- `toHaveClass(...classNames)` / `not.toHaveClass(...classNames)`

**Supported poll matchers:**
- `toBe(expected)`, `toEqual(expected)`
- `toBeTruthy()`, `toBeFalsy()`, `toBeDefined()`
- `toBeGreaterThan(n)`, `toBeGreaterThanOrEqual(n)`, `toBeLessThan(n)`
- `toContain(item)`, `toBeCloseTo(n, digits?)`

#### Working with Page Objects

Page Objects still import from `vitest/browser` and return `HTMLElement` objects. When interacting with elements from Page Objects, use native `userEvent`:

```ts
import { page, userEvent } from '../helpers/locator'
import { expectElement } from '../helpers/assertions'

// Page Objects return HTMLElements
const input = common.getSetRowInput(0, 'kg')  // HTMLElement

// Use native userEvent for HTMLElements
await userEvent.fill(input, '100')
await userEvent.click(submitButton)

// Use abstracted methods for Locators from page.getByRole()
const dialog = page.getByRole('dialog')
await dialog.getByRole('button', { name: 'Confirm' }).click()
```

### Known Limitations of Happy-DOM

Happy-DOM is a lightweight DOM implementation that lacks some browser APIs:

| API | Status | Workaround |
|-----|--------|------------|
| `matchMedia` | Mocked | Returns `{ matches: false }` |
| `IntersectionObserver` | Mocked | No-op observer |
| `ResizeObserver` | Mocked | No-op observer |
| `canvas` | Not supported | Use browser mode for canvas tests |
| Real layout/scroll | Not available | Use browser mode for scroll tests |
| CSS animations | Not supported | Use browser mode for animation tests |

The setup file (`setup.happy-dom.ts`) provides polyfills for commonly needed APIs.

### Troubleshooting

#### Test passes in browser but fails in Happy-DOM

1. **Check for browser-specific APIs**: The test may rely on APIs not available in Happy-DOM (canvas, real layout, etc.)
2. **Check for timing issues**: Happy-DOM executes synchronously; use `await` and proper assertions
3. **Check scroll/intersection**: Virtual scroll and lazy loading need real browser

#### Test fails with "Cannot read properties of null"

This usually means the element wasn't found. In Happy-DOM:
- Ensure component is fully rendered before querying
- Check that async data has loaded
- Verify the query selector is correct

#### Type errors with Locator types

The abstraction layer exports native Vitest objects at runtime but uses abstraction layer types for TypeScript. This is expected behavior. If you see type errors like `Type 'Locator' is missing properties`, the code will still work at runtime.

#### Page Object tests fail in Happy-DOM

Page Objects currently import from `vitest/browser`, which only works in browser mode. This is a known limitation (US-009 in the PRD). Integration tests work around this by using native `userEvent` for HTMLElements from Page Objects.

### Architecture

```
src/__tests__/helpers/
├── locator/
│   ├── types.ts       # Unified Locator/Page interfaces
│   ├── browser.ts     # Browser mode implementation (wraps vitest/browser)
│   ├── happy-dom.ts   # Happy-DOM implementation (uses @testing-library)
│   └── index.ts       # Environment-aware exports
├── render/
│   ├── types.ts       # Unified RenderResult interface
│   ├── browser.ts     # Browser mode render (vitest-browser-vue)
│   ├── happy-dom.ts   # Happy-DOM render (@testing-library/vue)
│   └── index.ts       # Environment-aware exports
├── assertions/
│   ├── types.ts       # Unified assertion interfaces
│   ├── browser.ts     # Browser mode (native expect.element/poll)
│   ├── happy-dom.ts   # Happy-DOM (waitFor + jest-dom matchers)
│   └── index.ts       # Environment-aware exports
└── pages/             # Page Objects (currently browser-only)
```

The abstraction layer detects the environment at runtime using `window.__vitest_browser__` and dynamically loads the appropriate implementation.

### CI Configuration

The CI pipeline runs browser tests for full confidence:

```yaml
test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  steps:
    - run: pnpm vitest --project=default --shard=${{ matrix.shard }}/4

test-happy-dom:
  continue-on-error: true  # Optional until Page Objects migrated
  steps:
    - run: pnpm vitest --project=happy-dom
```

Browser tests are sharded across 4 runners for parallel execution. Happy-DOM tests run as an optional validation job.
