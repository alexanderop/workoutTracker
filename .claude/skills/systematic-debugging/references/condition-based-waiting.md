# Condition-Based Waiting

## Overview

Flaky tests often guess at timing with arbitrary delays. This creates race conditions where tests pass locally but fail in CI.

**Core principle:** Wait for the actual condition you care about, not a guess about how long it takes.

## Vitest's expect.poll()

This project uses Vitest 4 with `expect.poll()` - the built-in condition-based waiting.

### Basic Pattern

```ts
// BAD: Guessing at timing
await new Promise(r => setTimeout(r, 100))
expect(result).toBeDefined()

// GOOD: Wait for condition
await expect.poll(() => result).toBeDefined()
```

### DOM vs Non-DOM

```ts
import { page } from 'vitest/browser'

// DOM visibility - use expect.element()
await expect.element(page.getByText(/block 1/i)).toBeVisible()

// Non-DOM state - use expect.poll()
await expect.poll(() => app.router.currentRoute.value.path).toBe('/workout')
```

### Async Conditions

```ts
// Database queries - async callback
await expect.poll(async () => {
  const template = await db.templates.get('id')
  return template?.name
}).toBe('My Template')

// Repository operations
await expect.poll(async () => {
  const workouts = await workoutsRepository.getAll()
  return workouts.length
}).toBeGreaterThan(0)
```

## Common Patterns

| Scenario | Pattern |
|----------|---------|
| Wait for route | `await expect.poll(() => router.currentRoute.value.path).toBe('/path')` |
| Wait for database | `await expect.poll(async () => (await db.table.get(id))?.field).toBe(value)` |
| Wait for count | `await expect.poll(() => items.length).toBeGreaterThanOrEqual(5)` |
| Wait for element | `await expect.element(page.getByText('text')).toBeVisible()` |
| Wait for state | `await expect.poll(() => composable.isReady.value).toBe(true)` |

## When Timeout IS Correct

Sometimes you're testing actual timing behavior:

```ts
// Testing debounce - need actual timing
await userEvent.type(input, 'search term')
// Debounce is 300ms, wait for it
await new Promise(r => setTimeout(r, 350))
// Now check debounced result
```

**Requirements:**
1. Based on known timing (debounce interval, animation duration)
2. Comment explaining WHY
3. Still use expect.poll() for the final assertion

## Animation Testing

```ts
// Wait for animation class
await expect.poll(() => {
  // eslint-disable-next-line no-restricted-syntax -- Testing animation class
  return document.querySelector('.animate-ping') !== null
}).toBe(true)
```

## Common Mistakes

**Stale data:**
```ts
// BAD: Captured value doesn't update
const count = items.length
await expect.poll(() => count).toBe(5) // Never updates!

// GOOD: Fresh read each poll
await expect.poll(() => items.length).toBe(5)
```

**Polling DOM incorrectly:**
```ts
// BAD: Using poll for DOM visibility
await expect.poll(() => element.isVisible()).toBe(true)

// GOOD: Use expect.element() for DOM
await expect.element(element).toBeVisible()
```

**Missing async:**
```ts
// BAD: Async operation not awaited
await expect.poll(() => db.templates.get(id)).toBeDefined()

// GOOD: Async callback
await expect.poll(async () => await db.templates.get(id)).toBeDefined()
```

## Vue-Specific Patterns

### Reactivity Updates

```ts
import { nextTick } from 'vue'

// After reactive state change
state.value = newValue
await nextTick()
// DOM now reflects change
```

### Composable State

```ts
const { isLoading, data } = useWorkout()

// Wait for loading to complete
await expect.poll(() => isLoading.value).toBe(false)
// Now data is available
expect(data.value).toBeDefined()
```

### Router Navigation

```ts
// After programmatic navigation
await router.push('/workout')
await expect.poll(() => router.currentRoute.value.path).toBe('/workout')
```
