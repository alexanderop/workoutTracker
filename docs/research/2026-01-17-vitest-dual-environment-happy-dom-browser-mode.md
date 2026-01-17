# Research: Running Vitest Tests in Both Happy-DOM and Browser Mode

**Date:** 2026-01-17
**Status:** Complete

## Problem Statement

The goal is to run the same integration tests in two environments:
1. **Happy-DOM (local development)** - Fast feedback loop during development
2. **Browser Mode with Playwright (CI pipeline)** - Full browser fidelity for CI

This dual-environment approach provides faster local development while maintaining comprehensive browser testing in CI.

## Key Findings

### 1. Vitest Projects Configuration (Recommended Approach)

Vitest 3.2+ supports the `projects` configuration, which replaces the deprecated `vitest.workspace.ts`. To run the **same test files** in different environments, configure two projects pointing to the same `root`:

```typescript
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      // Project 1: Happy-DOM (fast, simulated)
      {
        test: {
          name: 'happy-dom',
          root: './src/__tests__',
          include: ['**/*.spec.ts'],
          environment: 'happy-dom',
          setupFiles: ['./setup.happy-dom.ts'],
        },
      },
      // Project 2: Browser Mode (real browser)
      {
        test: {
          name: 'browser',
          root: './src/__tests__',
          include: ['**/*.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
          setupFiles: ['./setup.browser.ts'],
        },
      },
    ],
  },
})
```

Run specific projects:
```bash
pnpm vitest --project=happy-dom    # Fast local tests
pnpm vitest --project=browser      # Full browser tests
pnpm vitest                         # Run all projects
```

### 2. Performance Comparison

| Aspect | Happy-DOM | JSDOM | Browser Mode |
|--------|-----------|-------|--------------|
| Speed | Fastest | Medium | Slowest (startup overhead) |
| API Completeness | Limited | More complete | Full browser APIs |
| Accuracy | May have discrepancies | Better than Happy-DOM | Real browser fidelity |
| CI Compatibility | Excellent | Excellent | Requires Playwright |

### 3. Known Limitations of Happy-DOM

Missing or incomplete APIs that may cause tests to fail:
- `matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `fetch` (partial support)
- `canvas`
- `PerformanceObserver`
- `HTMLDialogElement`
- `Pointer Lock`
- Timer methods don't fully integrate with Vitest's fake timers

### 4. API Differences Between Environments

The **critical blocker** for this project: the current test suite uses **browser-specific APIs** that don't exist in Happy-DOM/JSDOM:

| Browser Mode API | Happy-DOM/JSDOM Equivalent |
|-----------------|---------------------------|
| `page.getByRole()` | `screen.getByRole()` from Testing Library |
| `page.getByText()` | `screen.getByText()` from Testing Library |
| `page.render()` (vitest-browser-vue) | `mount()` from @vue/test-utils |
| `expect.poll()` | `waitFor()` from Testing Library |
| `Locator` objects | `HTMLElement` or `@testing-library/vue` queries |

## Codebase Patterns

### Current Setup

The project uses a **browser-first testing strategy** with 4 projects:
- **default**: Integration tests (90+ files) - Playwright/Chromium
- **a11y**: Accessibility tests - Playwright
- **visual**: Visual regression - Playwright (macOS for screenshots)
- **arch**: Architecture tests - Node.js (no browser)

**Key dependencies used:**
- `vitest-browser-vue` for `render()`
- `@vitest/browser-playwright` for browser automation
- `page.getByRole()` for accessible queries
- `expect.poll()` for async assertions

**Test helper pattern** (`createTestApp.ts`):
```typescript
// Returns Page Objects that use browser-specific Locator API
export async function createTestApp() {
  const container = page.render(AppView, { global: { plugins: [...] } })
  return {
    builderPO: new BuilderPO(page),
    activeWorkoutPO: new ActiveWorkoutPO(page),
    // ... more page objects using page.getByRole(), page.getByText()
  }
}
```

### CI Configuration

Tests are sharded across 4 runners:
```yaml
test:
  strategy:
    matrix:
      shard: [1/4, 2/4, 3/4, 4/4]
  steps:
    - run: pnpm vitest --project=default --shard=${{ matrix.shard }}
```

## Recommended Approach

### Option A: Abstraction Layer (Complex but Full Compatibility)

Create an abstraction over DOM queries that works in both environments:

```typescript
// src/__tests__/helpers/queries.ts
import { page } from '@vitest/browser/context'
import { screen } from '@testing-library/vue'

const isBrowser = typeof page !== 'undefined' && page.getByRole

export const getByRole = isBrowser
  ? page.getByRole.bind(page)
  : screen.getByRole

export const getByText = isBrowser
  ? page.getByText.bind(page)
  : screen.getByText
```

**Pros:** Same test files work in both environments
**Cons:** Significant refactoring of all 90+ integration tests, potential Locator vs HTMLElement type conflicts

### Option B: Separate Test Suites (Pragmatic)

Keep browser tests as-is, add a **fast subset** of tests for Happy-DOM:

```typescript
// vitest.config.ts
projects: [
  {
    test: {
      name: 'unit',
      environment: 'happy-dom',
      include: ['src/__tests__/lib/**', 'src/__tests__/stores/**'],
    },
  },
  {
    test: {
      name: 'integration',
      browser: { enabled: true, provider: playwright() },
      include: ['src/__tests__/integration/**'],
    },
  },
]
```

**Pros:** No refactoring, fast unit tests in Happy-DOM, integration in browser
**Cons:** Doesn't achieve the goal of running integration tests in both environments

### Option C: Testing Library Everywhere (Recommended for New Projects)

Migrate from `vitest-browser-vue` to `@testing-library/vue` which works in both:

```typescript
// Works in both Happy-DOM and Browser Mode
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'

test('example', async () => {
  render(MyComponent)
  await userEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Clicked')).toBeInTheDocument()
})
```

**Pros:** Single API for both environments, well-documented, community standard
**Cons:** Major migration effort, loses some browser-specific capabilities

### Recommended Path Forward

Given the current codebase investment in browser-specific APIs, I recommend a **phased approach**:

#### Phase 1: Parallel Unit Tests (Low Effort)
Add Happy-DOM project for unit tests that don't need browser:
```json
"test:unit": "vitest run --project=unit",
"test:integration": "vitest run --project=default"
```

#### Phase 2: Evaluate Migration Cost
Before migrating integration tests, prototype the abstraction layer with 5-10 tests to validate the approach.

#### Phase 3: Gradual Migration (If Worthwhile)
If Phase 2 succeeds, migrate tests file-by-file, prioritizing high-value tests.

### Alternative: Skip Happy-DOM Entirely

The Vitest team recommends browser mode for component/integration testing because:
1. Simulated environments have subtle differences that cause false positives/negatives
2. Browser mode startup overhead is a one-time cost
3. CI caching makes Playwright installation fast

Consider using **Vitest's Preview provider** for local development:
```typescript
browser: {
  provider: process.env.CI ? playwright() : preview(),
}
```

## Sources

**Official Documentation:**
- [Vitest Test Projects Guide](https://vitest.dev/guide/projects)
- [Vitest Test Environment Guide](https://vitest.dev/guide/environment)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Why Browser Mode](https://vitest.dev/guide/browser/why)
- [Browser Config Reference](https://vitest.dev/config/browser)

**GitHub Discussions:**
- [Mixing browser tests and Node unit tests](https://github.com/vitest-dev/vitest/discussions/5461) - Real-world example
- [jsdom vs happy-dom](https://github.com/vitest-dev/vitest/discussions/1607) - Performance comparison
- [VS Code Extension Issue #516](https://github.com/vitest-dev/vscode/issues/516) - Duplicate test entries

**Articles:**
- [Vitest Browser Mode vs Playwright - Epic Web Dev](https://www.epicweb.dev/vitest-browser-mode-vs-playwright)
- [Vitest 4.0 with Stable Browser Mode - InfoQ](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/)
- [Component Testing with Vitest Browser Mode](https://mayashavin.com/articles/component-testing-browser-vitest)

**Real-World Examples:**
- [aria-live-capture](https://github.com/AriPerkkio/aria-live-capture) - Dual environment workspace setup
