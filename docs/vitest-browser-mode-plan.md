# Vitest Browser Mode Implementation Plan

## Overview

Add Vitest Browser Mode to run integration tests in real browsers, enabling testing of Web APIs that jsdom cannot simulate (Web Audio, Wake Lock, drag-drop, CSS animations).

## Current State

- Vitest 3.2.4 with jsdom environment
- Heavy mocking of Web APIs in `src/__tests__/setup.ts`
- Integration tests use `createTestApp` helper with fake-indexeddb

## Phase 1: Setup & Configuration

### Install Dependencies

```bash
pnpm install -D vitest@latest @vitest/browser-playwright vitest-browser-vue
pnpm exec playwright install chromium
```

### Update vitest.config.ts

```typescript
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      root: fileURLToPath(new URL('./', import.meta.url)),
      exclude: [...configDefaults.exclude, 'e2e/**'],
      fileParallelism: false,

      projects: [
        // Fast unit/composable tests in jsdom
        {
          name: 'unit',
          test: {
            include: [
              'src/__tests__/composables/**/*.spec.ts',
              'src/__tests__/unit/**/*.spec.ts',
            ],
            environment: 'jsdom',
            setupFiles: ['./src/__tests__/setup.ts'],
          },
        },
        // Integration tests in real browser
        {
          name: 'browser',
          test: {
            include: ['src/__tests__/browser/**/*.spec.ts'],
            setupFiles: ['vitest-browser-vue', './src/__tests__/browser/setup.ts'],
            browser: {
              enabled: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
              headless: process.env.CI === 'true',
            },
          },
        },
      ],

      coverage: {
        provider: 'v8',
        reporter: ['text'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/components/ui/**'],
      },
    },
  }),
)
```

### Add Package.json Scripts

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:browser": "vitest run --project=browser",
    "test:jsdom": "vitest run --project=unit",
    "test:browser:ui": "vitest --browser.headless=false --project=browser"
  }
}
```

### Create Browser Test Setup

Create `src/__tests__/browser/setup.ts`:

```typescript
import { config } from 'vitest-browser-vue'

// Global stubs for shadcn-vue components that use Teleport
config.global.stubs = {
  Teleport: true,
}

// Mock i18n if needed
config.global.mocks = {
  $t: (key: string) => key,
}
```

---

## Phase 2: High Priority Tests (jsdom Cannot Test)

### Test 1: Web Audio API (`useTimerAudio`)

**File:** `src/__tests__/browser/timer-audio.spec.ts`

**What to test:**
- AudioContext creates and starts successfully
- Oscillator frequencies match expected values (880Hz, 440Hz, 660Hz)
- Gain node ramps volume correctly
- Sequential beeps play with correct timing
- Audio stops when timer pauses/completes
- Context cleanup on unmount

**Example structure:**
```typescript
import { render } from 'vitest-browser-vue'
import { describe, it, expect } from 'vitest'
import { useTimerAudio } from '@/composables/timers/useTimerAudio'

describe('useTimerAudio (browser)', () => {
  it('creates AudioContext and plays beep sequence', async () => {
    // Test real AudioContext behavior
  })

  it('stops audio when pause is called', async () => {
    // Verify oscillator stops
  })

  it('cleans up AudioContext on unmount', async () => {
    // Verify no memory leaks
  })
})
```

### Test 2: Screen Wake Lock (`useScreenWakeLock`)

**File:** `src/__tests__/browser/wake-lock.spec.ts`

**What to test:**
- Native Wake Lock API requests lock successfully (where supported)
- Video fallback plays silent video on unsupported browsers
- Wake lock releases on visibility change
- PWA detection via matchMedia works
- Mobile detection via navigator.maxTouchPoints works

**Example structure:**
```typescript
describe('useScreenWakeLock (browser)', () => {
  it('requests native wake lock when API available', async () => {
    // May need to check navigator.wakeLock existence first
  })

  it('falls back to video playback on iOS Safari', async () => {
    // Test video element plays base64 silent video
  })

  it('releases lock when page becomes hidden', async () => {
    // Test visibilitychange handling
  })
})
```

### Test 3: Drag & Drop Reordering

**File:** `src/__tests__/browser/drag-reorder.spec.ts`

**What to test:**
- Drag handle responds to mousedown
- Ghost class applies during drag (opacity-50)
- Items reorder on drop
- Reorder callback fires with correct oldIndex/newIndex
- Disabled state prevents dragging

**Example structure:**
```typescript
import { render } from 'vitest-browser-vue'
import { page, userEvent } from '@vitest/browser/context'
import WorkoutBlockPlaylist from '@/features/workout/components/WorkoutBlockPlaylist.vue'

describe('WorkoutBlockPlaylist drag-drop (browser)', () => {
  it('reorders blocks via drag and drop', async () => {
    const screen = render(WorkoutBlockPlaylist, {
      props: { blocks: [...], disabled: false }
    })

    const dragHandle = screen.getByTestId('drag-handle-0')
    const dropTarget = screen.getByTestId('block-2')

    // Simulate drag operation
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: dragHandle },
      { coords: { x: 0, y: 100 } }, // drag down
      { keys: '[/MouseLeft]', target: dropTarget },
    ])

    // Verify reorder callback fired
  })
})
```

---

## Phase 3: Medium Priority Tests

### Test 4: SVG Circular Timer Animation

**File:** `src/__tests__/browser/circular-timer.spec.ts`

**What to test:**
- stroke-dashoffset calculates correctly for progress values
- CSS transition animates smoothly (no jumps)
- Urgent color applies when time low
- SVG renders at correct dimensions

### Test 5: IndexedDB Persistence

**File:** `src/__tests__/browser/data-persistence.spec.ts`

**What to test:**
- Data persists after page navigation
- Transactions complete atomically
- Large data sets don't exceed quota
- Import/export via FileReader works

### Test 6: CSS Animations

**File:** `src/__tests__/browser/animations.spec.ts`

**What to test:**
- Bottom sheet slide-up animation completes
- Confetti animation plays on workout complete
- Modal transitions don't flash

---

## Phase 4: Migration of Existing Integration Tests

### Candidate Tests for Browser Mode

Current integration tests in `src/__tests__/integration/`:

| File | Benefit from Browser Mode |
|------|---------------------------|
| `exercise-picker.spec.ts` | Moderate - search/select interactions |
| `data-management.spec.ts` | High - file import/export |
| `template-flow.spec.ts` | Low - mostly navigation |
| `unit-display.spec.ts` | Low - display logic |
| `timed-block-exercise-list.spec.ts` | Moderate - list interactions |

**Recommendation:** Start with `data-management.spec.ts` since it tests file import/export which uses FileReader API.

---

## Directory Structure After Implementation

```
src/__tests__/
├── browser/                    # NEW: Browser mode tests
│   ├── setup.ts               # Browser-specific setup
│   ├── timer-audio.spec.ts    # Web Audio API tests
│   ├── wake-lock.spec.ts      # Wake Lock API tests
│   ├── drag-reorder.spec.ts   # Drag & drop tests
│   ├── circular-timer.spec.ts # SVG animation tests
│   ├── data-persistence.spec.ts # IndexedDB tests
│   └── animations.spec.ts     # CSS animation tests
├── composables/               # Keep in jsdom (fast)
├── integration/               # Evaluate case-by-case
├── helpers/                   # Shared test utilities
├── factories/                 # Test data factories
└── setup.ts                   # jsdom setup (existing)
```

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Upgrade vitest to 4.x
- [ ] Install @vitest/browser-playwright
- [ ] Install vitest-browser-vue
- [ ] Run playwright install chromium
- [ ] Update vitest.config.ts with projects configuration
- [ ] Create src/**tests**/browser/setup.ts
- [ ] Add npm scripts for browser tests
- [ ] Verify existing jsdom tests still pass

### Phase 2: High Priority Tests
- [ ] Create timer-audio.spec.ts (Web Audio API)
- [ ] Create wake-lock.spec.ts (Screen Wake Lock)
- [ ] Create drag-reorder.spec.ts (Sortable.js)

### Phase 3: Medium Priority Tests
- [ ] Create circular-timer.spec.ts (SVG animations)
- [ ] Create data-persistence.spec.ts (IndexedDB)
- [ ] Create animations.spec.ts (CSS keyframes)

### Phase 4: Migration
- [ ] Evaluate each integration test for browser mode benefit
- [ ] Migrate data-management.spec.ts first
- [ ] Update CI pipeline for browser tests

---

## CI Configuration

Add to GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: pnpm exec playwright install chromium --with-deps

- name: Run Browser Tests
  run: pnpm test:browser
  env:
    CI: true
```

---

## Notes

- **Playwright recommended** over WebdriverIO (faster, simpler)
- **Headless in CI**, headed locally for debugging
- **Don't migrate all tests** - keep fast jsdom tests for quick feedback
- **Locators not elements** - use `await expect.element(locator)` in browser tests
- **Increase CI timeouts** - browser startup adds overhead
