---
name: fix-test
description: |
  Diagnose and fix failing Vitest tests. Use when tests fail, are flaky, or have timing issues.
  Triggers: "test failing", "fix test", "flaky test", "test timeout", "element not found",
  "assertion failed", "test passes alone but fails with others", "test broken", "test error",
  "can't find element", "locator timeout", "query not found".
---

# Fix Test Skill

Systematic approach to diagnosing and fixing failing tests in this project.

## Quick Diagnostic Checklist

Run through these questions first:

1. **Is it isolated?** Does it pass when run alone?
   ```bash
   pnpm test src/__tests__/integration/my-test.spec.ts
   ```

2. **Is it flaky?** Does it fail intermittently?
   ```bash
   pnpm test --repeat=5 src/__tests__/integration/my-test.spec.ts
   ```

3. **Is it environment-specific?** Does it fail in Happy-DOM but pass in browser (or vice versa)?
   ```bash
   pnpm test        # Happy-DOM (default)
   pnpm test:browser  # Browser mode
   ```

4. **Can you see it?** Run headed mode to watch the failure:
   ```bash
   pnpm test:headed src/__tests__/integration/my-test.spec.ts
   ```

## Run Commands Reference

| Command | Use Case |
|---------|----------|
| `pnpm test path/to/test.spec.ts` | Run single test file (Happy-DOM) |
| `pnpm test:browser path/to/test.spec.ts` | Run in real browser |
| `pnpm test:headed path/to/test.spec.ts` | Run with visible browser (debugging) |
| `pnpm test --repeat=N` | Detect flaky tests |
| `pnpm test -t "test name"` | Run by test name pattern |
| `pnpm test --reporter=verbose` | Full output for debugging |

## Failure Pattern Reference

### Pattern 1: Element Not Found

**Symptoms:**
- `Locator.click: Element not found`
- `null is not an element`
- Query returns nothing

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Element hasn't rendered yet | Use `expectElement(...).toBeVisible()` before interacting |
| Wrong query | Check query priority: `getByRole` > `getByText` > `getByTestId` |
| Element in dialog/portal | Use `common.waitForDialog()` first |
| Element scrolled off-screen (virtualized list) | Use elements at start of alphabet (A-B) or scroll first |
| Partial name matches wrong element | Use exact full names: "Bodyweight Squat" not "Squat" |

**Debug:**
```typescript
// Add before the failing line
console.log(document.body.innerHTML)
```

### Pattern 2: Flaky/Timing Issues

**Symptoms:**
- Passes alone, fails with other tests
- Passes sometimes, fails in CI
- "Test timed out"

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Missing await | Add `await` to async operations |
| Wrong assertion type | Use `expectPoll` for async state, `expectElement` for DOM |
| Arbitrary timeout | Replace `setTimeout` with `expectPoll` |
| Animation not complete | Wait for animation or use state-based assertion |
| Race condition | Use `expectPoll` to wait for condition |

**Debug:**
```typescript
// Use expectPoll instead of immediate assertion
await expectPoll(() => app.router.currentRoute.value.path).toBe('/workout')

// NOT
expect(app.router.currentRoute.value.path).toBe('/workout')  // FLAKY
```

### Pattern 3: State Pollution

**Symptoms:**
- Passes in isolation, fails when run with others
- Different results depending on test order
- "Expected X but got Y" with stale data

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Missing database reset | Add `await resetDatabase()` in `beforeEach` |
| Store not reset | Use `setupIntegrationTest()` helper |
| Global state leak | Check `createGlobalState` stores are reset |
| Timer state leak | Verify timer cleanup in `afterEach` |

**Debug:**
```bash
# Find which test creates pollution
pnpm test --sequence --shard=1/1 --reporter=verbose
```

### Pattern 4: Wrong Assertion Type

**Symptoms:**
- Assertion passes but shouldn't
- Assertion fails with "not a function"
- Incorrect timeout behavior

**Rules:**

| Assert This | Use This |
|-------------|----------|
| Element visible/exists | `await expectElement(locator).toBeVisible()` |
| Element NOT visible | `await expectElement(locator).not.toBeVisible()` |
| Router path | `await expectPoll(() => router.path).toBe('/x')` |
| Database value | `await expectPoll(async () => db.get()).toBe(x)` |
| Store value | `await expectPoll(() => store.value).toBe(x)` |
| Boolean predicate | `expect(common.isDialogOpen()).toBe(false)` |

### Pattern 5: Dialog Overlay Blocking

**Symptoms:**
- Click fails after closing dialog
- "Element is obscured by another element"
- Works in headed mode but fails headless

**Fix:**
```typescript
// WRONG - dialog overlay still present
await userEvent.click(closeButton)
await userEvent.click(nextElement)  // BLOCKED

// RIGHT - wait for overlay removal
await userEvent.click(closeButton)
await common.waitForDialogClose()  // Waits for dialog AND overlay
await userEvent.click(nextElement)
```

### Pattern 6: Navigation Race Condition

**Symptoms:**
- Route assertion fails
- "Expected /workout but got /builder"
- Works with added delay

**Fix:**
```typescript
// WRONG - route hasn't changed yet
await userEvent.click(startButton)
expect(router.path).toBe('/workout')  // FAILS

// RIGHT - poll for route change
await userEvent.click(startButton)
await expectPoll(() => app.router.currentRoute.value.path).toMatch(/^\/workout/)
```

### Pattern 7: Seed Data Changed

**Symptoms:**
- Assertions on specific exercises fail
- Count assertions wrong
- "Expected 'Deadlift' but got 'Romanian Deadlift'"

**Fix:**
```typescript
// FRAGILE - depends on seed data
await userEvent.fill(search, 'Deadlift')
expect(results.length).toBe(1)

// RESILIENT - create unique test data
await db.exercises.add({
  id: 'test-unique',
  name: 'Zzzz Test Exercise',
  muscle: 'chest',
  equipment: 'barbell',
})
await userEvent.fill(search, 'Zzzz Test')
await expectElement(page.getByText('Zzzz Test Exercise')).toBeVisible()
```

## Environment Differences

### Happy-DOM vs Browser Mode

This project supports **dual environment testing**:
- `pnpm test` - Happy-DOM (fast, simulated, default for local dev)
- `pnpm test:browser` - Playwright (real browser, used in CI)

**Key Differences:**

| Feature | Happy-DOM | Browser Mode |
|---------|-----------|--------------|
| Speed | ~10x faster | Full browser overhead |
| APIs | Limited (no matchMedia, IntersectionObserver) | Full browser APIs |
| Visual debugging | Not available | Use `pnpm test:headed` |
| Real layout | No | Yes |
| Real focus/click | Simulated | Real events |

**If test fails only in Happy-DOM:**
1. Check if it uses unsupported APIs (see list above)
2. Check if it relies on real layout calculations
3. Consider marking as browser-only with `@vitest-environment browser`

**If test fails only in Browser Mode:**
1. Check for timing issues (browser has real network, rendering delays)
2. Use `expectElement`/`expectPoll` instead of immediate assertions
3. Run headed to observe: `pnpm test:headed`

### Abstraction Layer

Tests use an abstraction layer for cross-environment compatibility:

| Browser API | Abstracted As | File |
|-------------|---------------|------|
| `expect.element()` | `expectElement()` | `assertions/browser.ts` or `assertions/happy-dom.ts` |
| `expect.poll()` | `expectPoll()` | Same |
| `page.getByRole()` | `Locator` interface | `locator/types.ts` |

When modifying test helpers, update both:
- `src/__tests__/helpers/assertions/browser.ts`
- `src/__tests__/helpers/assertions/happy-dom.ts`

## Query Troubleshooting

### Query Priority

Always try queries in this order:

1. **`getByRole`** (preferred) - Tests accessibility
   ```typescript
   page.getByRole('button', { name: /start workout/i })
   ```

2. **`getByLabelText`** - Form fields
   ```typescript
   page.getByLabelText('Email')
   ```

3. **`getByText`** - Non-interactive elements
   ```typescript
   page.getByText(/workout complete/i)
   ```

4. **`getByTestId`** (last resort) - When above don't work
   ```typescript
   page.getByTestId('workout-timer')
   ```

### Scoped Queries

When multiple elements match, scope your query:

```typescript
// WRONG - might match multiple buttons
page.getByRole('button', { name: /remove/i })

// RIGHT - scope to specific card first
const card = page.getByRole('article', { name: 'Bench Press' })
card.getByRole('button', { name: /remove/i })
```

### Virtualized Lists

Exercise list has 130+ items and is virtualized. Elements may not be in DOM:

```typescript
// FRAGILE - element may be scrolled off
await expectElement(page.getByText('Zercher Squat')).toBeVisible()

// SAFE - use elements at start of alphabet (visible without scrolling)
await expectElement(page.getByText('Assisted Pull-up Machine')).toBeVisible()
```

## Page Object Modifications

### When to Fix PO vs Test

**Fix the Page Object when:**
- Multiple tests need the same interaction
- The interaction is complex (multi-step)
- The DOM structure changed project-wide

**Fix the Test when:**
- Only one test uses this interaction
- The test is testing incorrect behavior
- The PO is correct, test is wrong

### Adding PO Methods

```typescript
// src/__tests__/helpers/pages/ActiveWorkoutPO.ts

// 1. Add method to the PO class
async completeSetWithValues(values: { kg: number; reps: number; rir: number }) {
  const activeSet = await this.getActiveSet()
  if (!activeSet) throw new Error('No active set found')
  await activeSet.fill(values)
  await activeSet.complete()
}

// 2. Update both abstraction layers if needed
// - browser.ts
// - happy-dom.ts
```

### Locator Abstraction

Page objects use the `Locator` interface (`src/__tests__/helpers/locator/types.ts`):

```typescript
interface Locator {
  click(): Promise<void>
  fill(value: string): Promise<void>
  getByRole(role: string, options?: object): Locator
  getByText(text: string | RegExp): Locator
  // ... etc
}
```

When adding browser-specific behavior, update both implementations.

## Database/State Issues

### Reset Pattern

Always reset state in beforeEach:

```typescript
import { setupIntegrationTest, cleanupIntegrationTest } from '../helpers/integrationSetup'

describe('My Feature', () => {
  beforeEach(setupIntegrationTest)  // Resets DB, stores, timers
  afterEach(cleanupIntegrationTest) // Cleans up DOM

  it('test', async () => {
    const app = await createTestApp()
    // ... test
    app.cleanup()  // Always cleanup at end
  })
})
```

### What setupIntegrationTest Resets

1. Database (via `resetDatabase()`)
2. Workout state store
3. Benchmark state store
4. Timer state
5. Any active workout

### Debugging State Issues

```typescript
// Log database contents
import { db } from '@/db'
console.log('Workouts:', await db.workouts.toArray())
console.log('Templates:', await db.templates.toArray())

// Log store state
import { useWorkoutState } from '@/stores/workoutState'
console.log('Workout state:', useWorkoutState().value)
```

## Related Skills

- `systematic-debugging` - Full debugging framework (use for complex bugs)
- `testing-conventions` - Query priority, expect.poll patterns, gotchas
- `vue-integration-testing` - How to write new integration tests
- `vue-composable-testing` - Testing composables specifically
- `vitest-mocking` - Mocking patterns and test doubles
