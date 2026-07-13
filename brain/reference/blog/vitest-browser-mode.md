---
type: Reference
title: "jsdom Tests Are Dead, Long Live Vitest Browser Mode"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/blog/vitest-browser-mode.md
tags: [reference, blog]
timestamp: 2026-06-28T08:10:00Z
---
## jsdom Tests Are Dead, Long Live Vitest Browser Mode

I don't write code anymore. Claude Code does.

A few weeks ago, I started building a workout tracking PWA. Existing apps frustrated me—they required accounts, sent my data to servers, and lacked the timed workout modes I actually use: AMRAP, EMOM, Tabata. I wanted something that works offline, keeps my data on my device, and handles CrossFit-style timers properly.

So I described what I wanted to Claude Code, and it built it. Vue 3, TypeScript, IndexedDB for persistence, PWA for offline support. The AI writes the components, the composables, the database layer.

But here's the thing: **how do I know it works?**

## Tests Are My Safety Net

When an AI writes your code, tests become essential. I can't review every line Claude generates. But I can run a test suite that verifies the app behaves correctly.

I write integration tests that simulate real user flows: opening the app, adding exercises, filling in weights, completing sets, running timers. If a test passes, I trust the feature works. If it fails, I ask Claude to fix it.

This approach requires fast tests. Slow tests break the feedback loop. When I prompt Claude to add a feature, I want to verify it works within seconds, not minutes.

For weeks, I ran all my tests in jsdom. It worked. Then I tried Vitest's browser mode with Playwright—and discovered my "fast" jsdom tests were actually the slow ones.

## The Setup That Changed Everything

My app has 73 integration tests covering complete user journeys: adding exercises, filling in weights, navigating between workout blocks, running timers. Here's what happened when I ran the same tests in both environments:

| Environment           | Time  | Tests |
| --------------------- | ----- | ----- |
| jsdom                 | ~16s  | 73    |
| Playwright (Chromium) | ~7.6s | 69    |

**The real browser ran 2x faster than the JavaScript simulation.**

## Why jsdom Is Slower

I assumed jsdom would win. No browser startup, no IPC overhead, everything in one process. I was wrong.

**jsdom simulates the DOM in JavaScript.** Every `createElement`, every `appendChild`, every style calculation runs through JS code. Real browsers use highly optimized C++ engines. Chromium's Blink engine handles DOM operations with native code and GPU acceleration.

My Vue components trigger hundreds of DOM operations per test. In jsdom, each operation pays the JavaScript interpretation tax. In Chromium, they execute at native speed.

**IndexedDB tells the same story.** I use Dexie for persistence and `fake-indexeddb` as a polyfill. The pure JS implementation adds overhead that real browser storage doesn't have.

## The Mock Problem

jsdom doesn't implement everything. My workout app uses:

- **AudioContext** for timer beeps
- **Wake Lock API** to keep the screen on during workouts
- **matchMedia** for responsive layouts
- **HTMLMediaElement** for video fallback

My jsdom setup file grew to 49 lines of mocks:

```typescript
// jsdom setup - 49 lines of faking browser APIs
import 'fake-indexeddb/auto'
import { setupAudioContextMock } from './helpers/audioMock'

setupAudioContextMock() // 101 more lines in a separate file!

window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

// ... more mocks for pause, load, etc.
```

My browser setup file? **9 lines:**

```typescript
// Browser setup - real APIs, no mocks needed
import 'fake-indexeddb/auto'

export { resetDatabase } from '../helpers/resetDatabase'
```

That's an 82% reduction in test infrastructure code.

## Real APIs Beat Mocks

My AudioContext mock couldn't verify oscillator frequencies. I created a `MockOscillator` class that tracked `frequency.value`, but it couldn't catch bugs where I passed the wrong Hz value.

In browser mode, I spy on the real `AudioContext.prototype`:

```typescript
it('creates oscillator with correct frequency for work beep', () => {
  const spy = vi.spyOn(AudioContext.prototype, 'createOscillator')

  const { playWorkBeep } = useTimerAudio()
  playWorkBeep()

  const oscillator = spy.mock.results[0]?.value
  expect(oscillator?.frequency.value).toBe(880) // Real frequency!
})
```

The test runs against actual Web Audio. If Chrome's AudioContext behavior changes, my tests catch it.

## The Vitest Configuration

**Update:** The setup below reflects an earlier snapshot. I've since gone all-in on browser mode — the `unit`/jsdom project is gone entirely. Every project in `vitest.config.ts` now runs in Playwright/Chromium, split by concern (`default`, `a11y`, `visual`) plus a Node-only `arch` project for filesystem-based architecture checks:

```typescript
// vitest.config.ts (current shape)
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'default', include: ['src/__tests__/**/*.spec.ts'], browser: { enabled: true, provider: playwright(), instances: [{ browser: 'chromium' }] } } },
      { test: { name: 'a11y', include: ['src/__tests__/a11y/**/*.spec.ts'], browser: { enabled: true, provider: playwright(), instances: [{ browser: 'chromium' }] } } },
      { test: { name: 'visual', include: ['src/__tests__/visual/**/*.spec.ts'], browser: { enabled: true, provider: playwright(), instances: [{ browser: 'chromium' }] } } },
      { test: { name: 'arch', include: ['src/__tests__/architecture/**/*.test.ts'] } }, // Node, no browser — filesystem analysis
    ],
  },
})
```

My npm scripts today:

```json
{
  "test": "vitest run --project=default",
  "test:a11y": "vitest run --project=a11y",
  "test:visual": "vitest run --project=visual",
  "test:arch": "vitest run --project=arch",
  "test:headed": "vitest --project=default --browser.headless=false"
}
```

`pnpm test` is the everyday command now — it already runs in Chromium. There's no separate jsdom-vs-browser split to think about anymore.

## When jsdom Still Makes Sense

I used to keep a few pure-composable tests in jsdom for speed. In practice the project fully moved to browser mode — even architecture/lint-style checks that don't need a DOM run as a dedicated Node-only Vitest project (`arch`) rather than jsdom. `jsdom` remains a dependency (some tooling still touches it), but there's no active jsdom test project in `vitest.config.ts` today.

## Update: Timer Audio Tests Are Faster in Browser Mode Too

I initially kept timer audio tests in jsdom, thinking the mock setup gave me more control. Then I made them work in both environments using `vi.spyOn()` on the real `AudioContext.prototype`:

| Environment | Time   | Transform |
| ----------- | ------ | --------- |
| jsdom       | 12.48s | 1.18s     |
| Chromium    | 12.06s | 0ms       |

The browser version runs faster—and tests against real Web Audio behavior. The transform time difference (1.18s vs 0ms) shows browser mode's advantage: Vite serves ESM natively without Node.js transformation overhead.

## The Migration

Moving tests from jsdom to browser mode required zero code changes. My `createTestApp()` helper and page objects work identically in both environments:

```typescript
it('completes a workout flow', async () => {
  const { builder, workout, user, cleanup } = await createTestApp()

  await builder.addStrengthBlock('Squat')
  await builder.startWorkout()
  await workout.fillSet(0, { kg: 100, reps: 8, rir: 2 })

  expect(await screen.findByText('1/3')).toBeTruthy()

  cleanup()
})
```

This test runs in jsdom with mocked APIs. It runs in Chromium with real APIs. Same code, same assertions, different environments.

## Try It Yourself

Add browser mode to your Vitest config:

```bash
pnpm add -D @vitest/browser @vitest/browser-playwright playwright
```

```typescript
// vitest.config.ts
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
})
```

Run your tests. Compare the times. You might be surprised.

## Conclusion

jsdom served us well. It brought frontend testing to Node.js when browsers were slow and hard to automate. But Vitest's browser mode changes the calculus.

Real browsers are faster. Real APIs are more accurate. Less mocking means less maintenance.

For my workout tracker, browser mode cut test time in half and eliminated 150+ lines of mock code. The tests catch real bugs because they run against real browser behavior.

**For AI-assisted development, this matters even more.** When Claude Code generates a feature, I run `pnpm test` and know within seconds if it works. Fast feedback keeps the conversation flowing. I describe what I want, Claude implements it, tests verify it, and I move to the next feature.

The testing strategy that seemed like overhead became the foundation that makes AI-assisted development practical. I stopped reviewing every line of code. I started trusting the test suite.

jsdom tests are dead. Long live Vitest browser mode.
