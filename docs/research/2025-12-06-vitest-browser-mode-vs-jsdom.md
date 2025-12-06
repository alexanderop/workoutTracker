# Research: Why Vitest Browser Mode vs jsdom

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

Understanding the performance characteristics and trade-offs between Vitest browser mode and jsdom for testing Vue applications. The question assumes browser mode is "faster" than jsdom, but the reality is more nuanced.

## Key Findings

### The "Faster" Misconception

**Vitest browser mode is NOT faster than jsdom in raw execution speed.** Browser mode has longer initialization overhead because it spins up a real browser instance. However, "faster" should be reframed as **"more efficient for development velocity"** due to accuracy and reliability benefits.

### jsdom Performance Issues

| Issue | Impact |
|-------|--------|
| Pure JavaScript emulation | Every DOM operation simulates browser behavior in JS instead of native C++ |
| `getComputedStyle()` bottleneck | ~5ms per call, causing test suites to go from 14s to 70s in some cases |
| Version regressions | jsdom 23.2.0 doubled test times; v11.6+ showed 5x slowdown vs v11.5 |
| Startup cost | ~500ms require time per test file |
| Memory leaks | setTimeout/setInterval and MutationObserver can leak 15MB+ per test |

Real-world comparison: Same tests running in **Chrome headless: 20s** vs **jsdom: 70s**.

### Why Real Browsers Are More Efficient

1. **Native C++ engines** - Browser engines (V8, SpiderMonkey, WebKit) have decades of optimization for DOM operations that JavaScript cannot match

2. **No polyfill overhead** - jsdom is essentially a polyfill library implementing WHATWG standards; every operation goes through simulation

3. **Eliminates false positives/negatives** - Tests in jsdom can pass when code fails in production (or vice versa), wasting debugging time

4. **Complete API support** - jsdom cannot implement every browser feature; real browsers provide up-to-date implementations of Web Audio, Canvas, Wake Lock, etc.

### Performance Comparison

| Environment | Startup | Execution | Accuracy |
|-------------|---------|-----------|----------|
| **happy-dom** | Fastest | 2-5x faster than jsdom | Lowest (missing APIs) |
| **jsdom** | Fast | Baseline | Medium (approximation) |
| **Browser Mode** | Slowest | Native speed once running | Highest (real browser) |

### When Browser Mode Wins

Browser mode provides net time savings when:

- Tests require accurate CSS layout calculations
- Testing browser-specific APIs (Web Audio, Canvas, IndexedDB, Wake Lock)
- False positives in jsdom cause debugging cycles
- Integration tests need real user interaction simulation
- Cross-browser compatibility testing is needed

## Codebase Patterns

This project already uses a **dual testing strategy**:

```
vitest.config.ts
├── unit (jsdom)           → Composables, state logic, stores
├── browser (Chromium)     → Web API tests (Wake Lock, audio)
└── integration-browser    → Full integration tests
```

**Browser mode tests in this codebase:**
- `wake-lock.spec.ts` - Native Wake Lock API (not available in jsdom)
- `drag-reorder.spec.ts` - Real drag-and-drop events
- `timer-audio.spec.ts` - Web Audio API playback

**Why this split makes sense:**
- jsdom runs ~100ms per test for logic-only tests
- Browser mode handles APIs that jsdom cannot accurately simulate
- Pre-bundling (`workbox-window`) prevents Vite reload overhead

## Recommended Approach

### Use jsdom/happy-dom When:
- Testing pure logic with minimal DOM interaction
- Running thousands of simple unit tests where startup matters
- Budget constraints prevent browser infrastructure
- Tests don't require layout calculations or CSS rendering

### Use Browser Mode When:
- Testing component rendering and visual behavior
- Accurate CSS layout calculations needed
- Browser-specific APIs required (Web Audio, Canvas, IndexedDB, Wake Lock)
- Eliminating false positives/negatives is critical
- Integration tests simulating real user interactions

### Performance Tips

1. **Parallel execution** - Playwright provider supports running browser tests in parallel
2. **Headless mode** - Run without GUI overhead in CI
3. **Selective projects** - Run `--project=unit` for fast feedback, full suite in CI
4. **Pre-bundle dependencies** - Avoid Vite reloads during browser tests

## The Real Value Proposition

Browser mode trades **startup time for accuracy**:

| Metric | jsdom | Browser Mode |
|--------|-------|--------------|
| Initialization | ~500ms | ~2-5s |
| Per-test speed | Varies by complexity | Native browser speed |
| Debugging time | Higher (false results) | Lower (accurate results) |
| API coverage | Incomplete | Complete |
| Confidence | Medium | High |

As Kent C. Dodds advises: "Write tests. Not too many. Mostly integration." Browser mode enables high-confidence integration tests that accurately represent production behavior.

## Historical Context

jsdom was created in 2010 when browser automation was expensive and slow. Modern tools like Playwright and Vitest Browser Mode make real browser testing performant and accessible. Vitest 4.0 (November 2025) marked Browser Mode as **stable** after being experimental.

## Sources

### Official Documentation
- [Browser Mode | Vitest](https://vitest.dev/guide/browser/) - Architecture and setup
- [Why Browser Mode | Vitest](https://vitest.dev/guide/browser/why.html) - Motivation and benefits
- [Improving Performance | Vitest](https://vitest.dev/guide/improving-performance) - Optimization tips
- [Announcing Vitest 4.0](https://vitest.dev/blog/vitest-4) - Stable browser mode release

### Performance Analysis
- [Vitest Introduces Browser Mode as Alternative to JSDOM - InfoQ](https://www.infoq.com/news/2025/06/vitest-browser-mode-jsdom/)
- [Why I Won't Use JSDOM | Epic Web Dev](https://www.epicweb.dev/why-i-won-t-use-jsdom) - Kent C. Dodds' perspective
- [jsdom vs happy-dom | Sean Coughlin](https://blog.seancoughlin.me/jsdom-vs-happy-dom-navigating-the-nuances-of-javascript-testing)

### GitHub Issues
- [Performance impact of jsdom 23.2.0 · Issue #3659](https://github.com/jsdom/jsdom/issues/3659)
- [Performance regression v11.6+ · Issue #2350](https://github.com/jsdom/jsdom/issues/2350)
- [Memory Leak · Issue #784](https://github.com/jsdom/jsdom/issues/784)
- [getComputedStyle performance · Issue #390](https://github.com/testing-library/dom-testing-library/issues/390)

### Community Resources
- [From JSDOM to Real Browsers | Scott Spence](https://scottspence.com/posts/testing-with-vitest-browser-svelte-guide)
- [Reliable Component Testing with Vitest Browser Mode | Maya Shavin](https://mayashavin.com/articles/component-testing-browser-vitest)
- [Improving Vitest Performance | DEV Community](https://dev.to/thejaredwilcurt/improving-vitest-performance-42c6)
