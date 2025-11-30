---
name: vue-integration-testing
description: Write Vue 3 integration tests using Testing Library and createTestApp helper. Use when asked to "write integration tests", "test user flows", "add integration specs", or test complete user journeys through the app. Covers navigation, dialog interactions, form submissions, and multi-step workflows with real routing and state.
---

# Vue Integration Testing

Write integration tests that verify complete user flows through the Vue application using Testing Library with the `createTestApp` helper.

## Test File Structure

Place integration tests in `src/__tests__/integration/`:

```typescript
import { waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'

describe('Feature Name', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    // Reset body styles left by dialogs (prevents pointer-events: none issues)
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('describes the user journey being tested', async () => {
    const app = await createTestApp()

    // Test user interactions
    await app.user.click(app.getByRole('button', { name: /action/i }))

    // Assert outcomes
    expect(app.router.currentRoute.value.path).toBe('/expected-path')

    app.cleanup()
  })
})
```

## Test Isolation

Tests use `fake-indexeddb` polyfill (configured in `src/__tests__/setup.ts`). Always reset state in `afterEach`:
- `resetWorkout()` - Clears the singleton workout ref
- `resetDatabase()` - Clears all IndexedDB tables
- Reset body styles - Dialogs add `pointer-events: none` to body; must clear for subsequent tests

```typescript
afterEach(async () => {
  resetWorkout()
  await resetDatabase()
  // Reset body styles left by dialogs
  document.body.style.cssText = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
})
```

## createTestApp API

The helper returns a `TestApp` object with:

### Core Properties
- `router` - Vue Router instance for route assertions
- `user` - userEvent instance for simulating interactions

### Query Methods
Use Testing Library role-based queries:
- `getByRole(role, options)` - Find by ARIA role (throws if not found)
- `queryByRole(role, options)` - Find by role (returns null if not found)
- `findByRole(role, options)` - Async find by role (waits for element)
- `getByText`, `queryByText`, `findByText` - Text-based queries

### Dialog Helpers
- `waitForDialog()` - Wait for dialog to appear, returns dialog element
- `getDialogButton(text)` - Find button within current dialog by text content
- `assertDialogClosed()` - Assert no dialog is open

### Navigation
- `navigateTo(path)` - Programmatic navigation
- `waitForRoute(pattern)` - Wait for route to match a regex pattern (useful after async actions)

### Cleanup
- `cleanup()` - Call in afterEach or at test end

## Interaction Patterns

### Click Buttons
```typescript
await app.user.click(app.getByRole('button', { name: /submit/i }))
```

### Dialog Flow
```typescript
await app.user.click(app.getByRole('button', { name: /open dialog/i }))
await app.waitForDialog()
await app.user.click(app.getDialogButton('Confirm'))
app.assertDialogClosed()
```

### Form Input
```typescript
await app.user.type(app.getByRole('textbox', { name: /email/i }), 'test@example.com')
await app.user.clear(app.getByRole('textbox', { name: /email/i }))
```

### Check Toggle State
```typescript
const activeBtn = app.getByRole('button', { name: /item/i, pressed: true })
const inactiveBtn = app.getByRole('button', { name: /other/i, pressed: false })
```

### Route Assertions
```typescript
expect(app.router.currentRoute.value.path).toBe('/expected')
expect(app.router.currentRoute.value.params.id).toBe('123')
```

### Wait for Async Navigation
```typescript
// After clicking a button that triggers async work + navigation
await app.user.click(app.getDialogButton('Submit'))
await app.waitForRoute(/^\/success\//)
```

### Wait for Async UI Updates
Use `waitFor` from `@testing-library/vue` for UI state changes after interactions:

```typescript
import { waitFor } from '@testing-library/vue'

// After mode transitions (builder → active)
await app.startWorkout()
await waitFor(() => {
  expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
})

// After button clicks that change UI state
await app.user.click(startButton)
await waitFor(() => {
  expect(app.queryByRole('button', { name: /pause/i })).toBeTruthy()
})

// After navigation between blocks
await app.user.click(nextBlockButton)
await waitFor(() => {
  expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
})
```

### Dropdown Menu Interaction
For dropdown menus, wait for menu items to appear before clicking:

```typescript
// Find and click the dropdown trigger
await waitFor(() => {
  const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
  expect(trigger).toBeTruthy()
})
const menuTrigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
if (!(menuTrigger instanceof HTMLElement)) throw new Error('Menu trigger not found')
await app.user.click(menuTrigger)

// Wait for menu to open, then click item
await waitFor(() => {
  expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
})
await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))
```

## Query Selection Guide

| Need | Query |
|------|-------|
| Button by label | `getByRole('button', { name: /label/i })` |
| Link | `getByRole('link', { name: /text/i })` |
| Heading | `getByRole('heading', { name: /title/i })` |
| Text input | `getByRole('textbox', { name: /label/i })` |
| Checkbox | `getByRole('checkbox', { name: /label/i })` |
| Toggle button | `getByRole('button', { pressed: true/false })` |
| Any text | `getByText(/partial text/i)` |
| Menu item | `getByRole('menuitem', { name: /text/i })` |
| Dialog title | `getByRole('heading', { name: /title/i })` |

Use case-insensitive regex (`/text/i`) for resilience against text changes.

### Avoiding Multiple Element Matches

When text appears in multiple elements (e.g., "Finish Workout" as both dialog title and button), `queryByText` throws an error. Use specific role queries:

```typescript
// BAD: Matches both dialog title and button
expect(app.queryByText(/finish workout/i)).toBeTruthy()

// GOOD: Specifically target the heading
expect(app.queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

// GOOD: Use getDialogButton for buttons within dialogs
await app.user.click(app.getDialogButton('Finish Workout'))
```

### Type-Safe Element Selection

ESLint forbids type assertions (`as`). Use helper functions with `instanceof` checks:

```typescript
// Helper function for footer navigation buttons
function findFooterButton(selector: 'next' | 'prev'): HTMLElement {
  const svgClass = selector === 'next' ? 'lucide-chevron-right' : 'lucide-chevron-left'
  const buttons = [...document.querySelectorAll('footer button')]
  for (const btn of buttons) {
    if (btn.querySelector(`svg.${svgClass}`) && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error(`Footer ${selector} button not found`)
}

// Usage
await app.user.click(findFooterButton('next'))
```

## Starting at Different Routes

```typescript
const app = await createTestApp({ initialRoute: '/workout/active' })
```

## Factory Usage

Import factories for test data when needed:

```typescript
import { createExercise, createWorkout, WorkoutBuilder } from '../factories'

const exercise = createExercise({ name: 'Custom Exercise' })
const workout = new WorkoutBuilder().withExercise(exercise).build()
```

See `src/__tests__/factories/` for available factories.
