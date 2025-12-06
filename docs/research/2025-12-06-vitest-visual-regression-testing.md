# Research: Visual Regression Testing with Vitest Browser Mode

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

How to implement visual regression testing in a Vue 3 workout tracker app using Vitest browser mode, and which components should have visual regression tests.

## Key Findings

### Vitest 4.0 Native Support

Vitest 4.0 (released October 2025) introduced **stable Browser Mode** with **native visual regression testing** through the `toMatchScreenshot()` assertion. Your project already uses Vitest 4.0.15 with Playwright browser mode, making adoption straightforward.

#### Basic Usage

```typescript
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'

test('button looks correct', async () => {
  const button = page.getByRole('button')
  await expect(button).toMatchScreenshot('primary-button')
})
```

#### Configuration

Add to your `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            threshold: 0.2,                    // Color difference tolerance (0-1)
            allowedMismatchedPixelRatio: 0.01, // 1% pixel tolerance
          },
          resolveScreenshotPath: ({ arg, browserName, ext, testFileName }) =>
            `src/__tests__/__screenshots__/${testFileName}/${arg}-${browserName}${ext}`,
        },
      },
    },
  },
})
```

### How Screenshot Stabilization Works

Vitest automatically handles page stability through an iterative comparison process:

1. Takes initial screenshot (or uses reference if exists)
2. Compares in a loop until page stabilizes
3. Uses backoff timing: `[0, 100, 250, 500]` ms, then 1000ms
4. Generates diff images on failure

This handles images loading, animations finishing, fonts rendering, and layout settling automatically.

### Cross-Platform Challenge & Docker Solution

Visual regression tests produce different results across macOS, Windows, and Linux due to font rendering differences.

**Solution: Use Docker for consistency**

```yaml
# docker-compose.yml
services:
  vitest:
    image: mcr.microsoft.com/playwright:v1.57.0-focal
    volumes:
      - .:/app
    working_dir: /app
    command: pnpm test:visual
```

### Masking Dynamic Content

```typescript
await expect(page.getByTestId('dashboard')).toMatchScreenshot({
  screenshotOptions: {
    mask: [
      page.getByTestId('current-time'),
      page.getByTestId('session-id'),
    ],
    animations: 'disabled', // Default for Playwright
  },
})
```

## Codebase Patterns

### Current Test Configuration

- **Vitest 4.0.15** with Playwright browser mode (already configured)
- **Sequential execution**: `fileParallelism: false` (prevents state interference)
- **Real Chromium browser** via `@vitest/browser-playwright`
- **No existing visual tests** - this is a new capability to add

### Test Infrastructure Already in Place

| Component | Status |
|-----------|--------|
| Browser mode | Configured and working |
| Playwright provider | Installed (v1.57.0) |
| Test factories | `workoutBuilder()`, `dbWorkoutBuilder()` |
| Page Objects | CommonPO, BuilderPO, ActiveWorkoutPO |
| Test helpers | `createTestApp()`, `withSetup()` |

## Components Recommended for Visual Regression Testing

Based on codebase analysis, these components benefit most from visual regression testing:

### High Priority - Timer Components

These components have complex visual states, animations, and SVG rendering:

| Component | Path | Visual Complexity |
|-----------|------|-------------------|
| **WorkoutCircularTimer** | `src/components/timers/WorkoutCircularTimer.vue` | SVG circular progress with stroke-dasharray animation, color transitions, pulse effects |
| **WorkoutAmrapView** | `src/components/timers/WorkoutAmrapView.vue` | Circular progress, time display (HH:MM:SS), round counter, urgent state (≤10s) |
| **WorkoutEmomView** | `src/components/timers/WorkoutEmomView.vue` | Minute-based progress, exercise rotation, urgent styling (≤5s) |
| **WorkoutTabataView** | `src/components/timers/WorkoutTabataView.vue` | Work/rest phases with color-coded badges (emerald/amber), round tracking |
| **WorkoutForTimeView** | `src/components/timers/WorkoutForTimeView.vue` | Open-ended timer with optional time cap display |

**Test Scenarios:**
- Progress at 0%, 25%, 50%, 75%, 100%
- Urgent state transitions
- Color changes between phases

### High Priority - Set Tracking Components

Critical for data entry accuracy:

| Component | Path | Visual Complexity |
|-----------|------|-------------------|
| **WorkoutSetTable** | `src/features/workout/components/WorkoutSetTable.vue` | Table layout with responsive columns |
| **WorkoutSetTableRow** | `src/features/workout/components/WorkoutSetTableRow.vue` | Active/completed states, completion animations |
| **WorkoutActiveStrengthView** | `src/features/workout/components/WorkoutActiveStrengthView.vue` | Hero weight input (text-7xl), progress dots, responsive layout |

**Test Scenarios:**
- Empty table, single set, multiple sets
- Active set highlighting
- Completed sets with opacity changes

### Medium Priority - Builder Components

| Component | Path | Visual Complexity |
|-----------|------|-------------------|
| **WorkoutBlockPlaylist** | `src/features/workout/components/WorkoutBlockPlaylist.vue` | Drag-and-drop list, selection highlighting |
| **WorkoutBlockPlaylistItem** | `src/features/workout/components/WorkoutBlockPlaylistItem.vue` | Type-specific icons/colors, drag handle |
| **WorkoutTimedBlockCard** | `src/features/workout/components/WorkoutTimedBlockCard.vue` | Block type previews with color coding |

### Lower Priority - Summary Components

| Component | Path |
|-----------|------|
| **WorkoutDetailExerciseCard** | `src/features/workout/components/WorkoutDetailExerciseCard.vue` |
| **WorkoutDetailSetTable** | `src/features/workout/components/WorkoutDetailSetTable.vue` |
| **WorkoutDetailStatsRow** | `src/features/workout/components/WorkoutDetailStatsRow.vue` |

## Recommended Approach

### Phase 1: Basic Setup

1. **Add visual test directory**: `src/__tests__/visual/`

2. **Update vitest.config.ts**:
```typescript
export default defineConfig({
  test: {
    browser: {
      // ... existing config
      expect: {
        toMatchScreenshot: {
          comparatorOptions: {
            threshold: 0.2,
            allowedMismatchedPixelRatio: 0.02, // 2% tolerance
          },
          resolveScreenshotPath: ({ arg, browserName, ext, testFileName }) =>
            `src/__tests__/__screenshots__/${testFileName}/${arg}-${browserName}${ext}`,
        },
      },
    },
  },
})
```

3. **Create pilot test** for WorkoutCircularTimer:
```typescript
// src/__tests__/visual/WorkoutCircularTimer.spec.ts
import { render } from 'vitest-browser-vue'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import WorkoutCircularTimer from '@/components/timers/WorkoutCircularTimer.vue'

test('circular timer at 50% progress', async () => {
  render(WorkoutCircularTimer, {
    props: { progress: 50, colorClass: 'text-primary' }
  })

  await expect(page.getByTestId('circular-timer')).toMatchScreenshot('timer-50-percent')
})

test('circular timer urgent state', async () => {
  render(WorkoutCircularTimer, {
    props: { progress: 90, colorClass: 'text-destructive', urgent: true }
  })

  await expect(page.getByTestId('circular-timer')).toMatchScreenshot('timer-urgent')
})
```

### Phase 2: Docker Integration

1. **Create docker-compose.yml**:
```yaml
services:
  vitest-visual:
    image: mcr.microsoft.com/playwright:v1.57.0-focal
    volumes:
      - .:/app
    working_dir: /app
    environment:
      - CI=true
    command: pnpm test:visual
```

2. **Add npm script**:
```json
{
  "scripts": {
    "test:visual": "vitest run --project=visual",
    "test:visual:update": "vitest run --project=visual --update"
  }
}
```

### Phase 3: CI/CD Integration

**GitHub Actions workflow** (`.github/workflows/visual-tests.yml`):

```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-24.04

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run visual regression tests
        run: pnpm test:visual

      - name: Upload diff images on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff-screenshots
          path: src/__tests__/__screenshots__/**/*-diff.png
          retention-days: 7
```

### Alternative: Cloud Services

For teams needing AI-powered comparison and PR review workflows:

| Service | Best For |
|---------|----------|
| **Argos CI** | Official Vitest integration (Sep 2025), open-source alternative |
| **Percy** | CI-first, robust cross-browser testing |
| **Chromatic** | Component-focused, tight Storybook integration |

## Common Pitfalls to Avoid

1. **Environment Inconsistency**: Use Docker with pinned Playwright image
2. **Animation Flakiness**: Playwright auto-disables animations for screenshots
3. **Git History Bloat**: Consider Git LFS for screenshots or cloud services
4. **Missing Review Process**: Require PR approval for screenshot changes
5. **Overly Strict Thresholds**: Start with 2% pixel tolerance, adjust based on false positives

## Vue 3 Specific Gotchas

1. **Teleported Content**: Modals/tooltips may need full-page screenshots
2. **Async Components**: Wait for loading indicators before capturing
3. **CSS Must Load**: Don't disable CSS in browser mode for visual tests

## Sources

- [Visual Regression Testing | Vitest](https://vitest.dev/guide/browser/visual-regression-testing)
- [Vitest 4.0 Release Blog](https://vitest.dev/blog/vitest-4)
- [Browser Expect Config | Vitest](https://vitest.dev/config/browser/expect)
- [Visual Regression Testing with Vue and Vitest | alexop.dev](https://alexop.dev/posts/visual-regression-testing-with-vue-and-vitest-browser/)
- [Visual Regression Testing With Vitest | Markus Oberlehner](https://markus.oberlehner.net/blog/visual-regression-testing-with-vitest)
- [Effective Visual Regression Testing: Vitest vs Playwright | Maya Shavin](https://mayashavin.com/articles/visual-testing-vitest-playwright)
- [Vitest 4.0 Announcement | InfoQ](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/)
- [Argos CI Vitest Integration](https://argos-ci.com/changelog/2025-09-15-storybook-vitest)
- [vitest-plugin-vis | npm](https://www.npmjs.com/package/vitest-plugin-vis)
- [GitHub: vitest-dev/vitest #8041 - toMatchScreenshot PR](https://github.com/vitest-dev/vitest/pull/8041)
