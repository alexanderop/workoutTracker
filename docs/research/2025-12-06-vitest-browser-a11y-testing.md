# Research: Automatic Accessibility Testing with Vitest Browser Mode

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

We want to add automated accessibility (a11y) testing to our Vitest browser mode test suite. This enables catching common WCAG violations early in development, integrated with our existing component and integration tests.

## Key Findings

### Recommended Approach: vitest-axe

**vitest-axe** is the best choice for this project because:
- Works directly with Testing Library's DOM container
- Native TypeScript types for Vitest
- Minimal setup (one import in setup file)
- Integrates with existing `createTestApp` pattern
- Works in both jsdom and browser mode

### Quick Decision Matrix

| Test Level | Tool | Performance | Use Case |
|-----------|------|-------------|----------|
| Component tests | vitest-axe + jsdom | Fast | Design system components |
| Integration tests | vitest-axe + browser mode | Medium | User flows with real browser APIs |
| E2E audits | @axe-core/playwright | Slower | Full page accessibility audits |

### Critical Limitation

Automated testing catches only **~30% of accessibility barriers** (57% of WCAG issues). You still need:
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver, NVDA)
- User testing with assistive technology users

## Codebase Patterns

### Current Test Infrastructure

The project uses multi-environment Vitest with three test projects:

| Project | Environment | Setup File |
|---------|-------------|------------|
| `unit` | jsdom | `src/__tests__/setup.ts` |
| `browser` | Playwright/Chromium | `src/__tests__/browser/setup.ts` |
| `integration-browser` | Playwright/Chromium | `src/__tests__/browser/setup.ts` |

### Existing Accessibility Code

The codebase already has 43 ARIA attribute occurrences across 19 files:
- `WorkoutSetTableRow.vue`: aria-labels on inputs (weight, reps, RIR)
- `WorkoutBlockPlaylistItem.vue`: `role="button"`, `aria-pressed`, `aria-hidden`
- `drag-reorder.spec.ts`: Tests for ARIA attributes

### Existing Test Patterns

```typescript
// Integration test pattern (createTestApp)
const { builder, container, cleanup } = await createTestApp()
await builder.addStrengthBlock('Squat')
// ... assertions
cleanup()

// Browser test pattern (withSetup)
const [result, app] = withSetup(() => useMyComposable())
app.unmount()
```

## Recommended Approach

### 1. Installation

```bash
pnpm add -D vitest-axe
```

### 2. Configuration

Add to `/src/__tests__/browser/setup.ts`:

```typescript
import 'fake-indexeddb/auto'
import '@/style.css'
import 'vitest-axe/extend-expect'  // Add this line
```

### 3. Basic Usage

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { axe } from 'vitest-axe'
import { createTestApp } from '@/__tests__/helpers/createTestApp'

describe('Workout Builder Accessibility', () => {
  it('has no a11y violations', async () => {
    const { container, cleanup } = await createTestApp()

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    cleanup()
  })
})
```

### 4. Test Helper (Optional)

Create `/src/__tests__/helpers/a11y.ts`:

```typescript
import { axe } from 'vitest-axe'
import { expect } from 'vitest'
import type { AxeResults } from 'axe-core'

/**
 * Assert no a11y violations with helpful error logging
 */
export async function assertNoViolations(container: HTMLElement): Promise<void> {
  const results = await axe(container)

  if (results.violations.length > 0) {
    console.error('Accessibility violations:')
    results.violations.forEach(v => {
      console.error(`- ${v.id} (${v.impact}): ${v.description}`)
      console.error(`  Help: ${v.helpUrl}`)
      v.nodes.forEach(n => console.error(`  Element: ${n.html}`))
    })
  }

  expect(results).toHaveNoViolations()
}

/**
 * Run axe with WCAG 2.1 AA rules only
 */
export async function checkWcagAA(container: HTMLElement): Promise<AxeResults> {
  return axe(container, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
    }
  })
}
```

### 5. Integration Test Example

```typescript
// src/__tests__/integration/workout-builder-a11y.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { axe } from 'vitest-axe'
import { screen } from '@testing-library/vue'
import { resetDatabase } from '@/__tests__/helpers/resetDatabase'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { createTestApp } from '@/__tests__/helpers/createTestApp'

describe('Workout Builder Accessibility', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
  })

  it('builder page has no violations', async () => {
    const { container, cleanup } = await createTestApp({ initialRoute: '/' })

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    cleanup()
  })

  it('exercise selection dialog is accessible', async () => {
    const { builder, user, getByRole, cleanup } = await createTestApp()

    await builder.navigateTo()
    await user.click(getByRole('button', { name: /add exercise/i }))

    const dialog = await screen.findByRole('dialog')
    const results = await axe(dialog)
    expect(results).toHaveNoViolations()

    cleanup()
  })

  it('active workout with sets is accessible', async () => {
    const { builder, container, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Squat')
    await builder.startWorkout()

    const results = await axe(container)
    expect(results).toHaveNoViolations()

    cleanup()
  })
})
```

## Known Gotchas

### 1. Happy-DOM Incompatibility

vitest-axe does NOT work with happy-dom due to `Node.prototype.isConnected` bug. Use jsdom or browser mode (which we already do).

### 2. Wait for Async Content

Always wait for content to render before running axe:

```typescript
// ❌ Bad - axe runs before content loads
const { container } = render(AsyncComponent)
expect(await axe(container)).toHaveNoViolations()

// ✅ Good - wait for content first
const { container } = render(AsyncComponent)
await screen.findByRole('heading')
expect(await axe(container)).toHaveNoViolations()
```

### 3. Color Contrast Performance

The `color-contrast` rule is slow and can have false positives. Disable in unit tests if needed:

```typescript
const results = await axe(container, {
  rules: { 'color-contrast': { enabled: false } }
})
```

### 4. Test Components in Context

Test inputs with their labels, not in isolation:

```typescript
// ❌ May pass incorrectly
render(Input)

// ✅ Test with label context
render(() => (
  <div>
    <label for="weight">Weight</label>
    <Input id="weight" />
  </div>
))
```

## Implementation Plan

### Phase 1: Setup

1. Install vitest-axe: `pnpm add -D vitest-axe`
2. Add import to `src/__tests__/browser/setup.ts`
3. Create `src/__tests__/helpers/a11y.ts` helper

### Phase 2: Critical Paths

Add a11y tests for:
1. Workout builder (exercise selection, block creation)
2. Active workout (set logging, block navigation)
3. Settings dialogs (import/export)

### Phase 3: Component Library

Test all design system components in `src/components/ui/` variants and states.

### Phase 4: CI Integration

Add `pnpm test:a11y` script that runs a11y-specific test files.

## Sources

- [vitest-axe GitHub](https://github.com/chaance/vitest-axe) - Primary package
- [vitest-axe npm](https://www.npmjs.com/package/vitest-axe) - Installation docs
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing) - E2E patterns
- [Vitest Browser Mode Guide](https://vitest.dev/guide/browser/) - Browser mode setup
- [axe-core API Docs](https://www.deque.com/axe/core-documentation/api-documentation/) - Rule configuration
- [Vue Accessibility Testing Tutorial](https://alexop.dev/posts/how-to-improve-accessibility-with-testing-library-and-jest-axe-for-your-vue-application/) - Vue-specific patterns
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) - Standards reference
