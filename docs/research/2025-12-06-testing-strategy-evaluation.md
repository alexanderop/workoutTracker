# Research: Testing Strategy Evaluation

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

Evaluate the current testing strategy for the Vue 3 workout tracking PWA to identify strengths, gaps, and opportunities for improvement based on industry best practices.

## Executive Summary

The codebase demonstrates **professional-grade testing infrastructure** with a sophisticated 3-tier approach (unit/integration/browser). The strategy aligns well with Kent C. Dodds' Testing Trophy methodology, emphasizing integration tests for maximum confidence. However, gaps exist in utility function coverage, component isolation tests, and store unit tests.

## Current Test Infrastructure

### Statistics
| Metric | Count |
|--------|-------|
| Test files | 32 |
| Test suites (describe blocks) | 131 |
| Test cases | 328 |
| Integration tests | 16 files / 3,438 LOC |
| Composable tests | 9 files / 1,565 LOC |
| Browser tests | 4 files / 599 LOC |
| Test infrastructure (helpers/factories) | ~2,000 LOC |

### Test Distribution
```
Integration Tests  ████████████████████  (~60%)
Composable Tests   ██████                (~25%)
Browser Tests      ███                   (~10%)
Type Tests         █                     (~5%)
```

### Three-Tier Test Configuration

The `vitest.config.ts` implements a well-structured projects configuration:

1. **Unit Project** - Composables and integration tests in jsdom (fast iteration)
2. **Browser Project** - Browser-specific Web API tests with Playwright
3. **Integration-Browser Project** - Full integration tests in real Chromium

**Key Configuration Strengths:**
- Sequential file execution (`fileParallelism: false`) prevents singleton state interference
- Bail on first failure for rapid feedback
- V8 coverage provider (fastest for Chromium)
- Excluded shadcn-vue components from coverage
- Playwright as browser provider (recommended over Preview/WebdriverIO)

## Key Findings

### Strengths

#### 1. Testing Trophy Alignment
The heavy focus on integration tests (60%) aligns perfectly with Kent C. Dodds' recommendation: "Write tests. Not too many. Mostly integration."

#### 2. Page Object Model Implementation
Excellent abstraction layer for integration tests:
- `CommonPO` - Shared navigation, dialog handling, route waiting
- `BuilderPO` - Workout builder interactions
- `ActiveWorkoutPO` - Set entry, timer controls
- `QueuePO` - Workout queue management

#### 3. Test Factory Patterns
Two factory categories serve different needs:
- **In-memory factories** (`WorkoutBuilder`) - For composable unit tests
- **Database factories** (`DbWorkoutBuilder`) - For integration tests with persistence

#### 4. Composable Testing Helpers
The `withSetup` helper correctly handles lifecycle-dependent composables:
```ts
const [result, app] = withSetup(() => useMyComposable())
app.unmount() // Cleanup triggers onUnmounted
```

#### 5. Proper Test Isolation
- `resetWorkout()` clears singleton workout ref
- `resetDatabase()` clears all IndexedDB tables
- Body style cleanup prevents dialog-related test pollution

#### 6. Browser API Mocking
Comprehensive mocks for Audio API, matchMedia, and HTMLMediaElement enable reliable testing of complex browser features.

### Coverage Gaps

#### 1. Utility Functions (0% coverage)
| File | Purpose | Tests |
|------|---------|-------|
| `exerciseLabels.ts` | Display labels | None |
| `formatters.ts` | Value formatting | None |
| `unitConversion.ts` | Unit conversions | None |
| `utils.ts` | General utilities | None |
| `workout-utils.ts` | Workout helpers | None |
| `workoutName.ts` | Name generation | None |

**Impact:** Pure functions are the easiest to test and provide excellent documentation through tests.

#### 2. Untested Composables
| Composable | Reason |
|------------|--------|
| `useAnimatedCounter` | Animation logic |
| `useExerciseSearch` | Search/filter |
| `useGlobalWakeLock` | Browser API |
| `useExerciseForm` | Form state |
| `useTheme` | Theme management |
| `useTemplateDetail` | Detail view |
| `useWorkoutPersistence` | Persistence |
| `useAmrapTimer` | Timer logic |

#### 3. Vue Components (0 unit tests)
- 92 Vue components exist
- All tested through integration tests only
- No isolated component tests

#### 4. Pinia Stores (integration-only)
- `exercises.ts` - No unit tests
- `settings.ts` - No unit tests
- `workoutState.ts` - No unit tests

### Questionable Patterns

#### 1. Inconsistent Test Placement
No clear convention for when composables need:
- Direct unit tests
- Integration test coverage only
- Both approaches

#### 2. Heavy Integration Test Reliance
While aligned with Testing Trophy, some simple utilities could benefit from faster unit test feedback.

## Codebase Patterns Analysis

### Good Patterns Observed

```ts
// Builder pattern for test data
workoutBuilder()
  .withStrengthBlock({name: 'Squat'})
  .withExerciseAndSets([{kg: '100', reps: '8'}])
  .build()

// Proper async handling
await fireEvent.click(button)
await waitFor(() => expect(element).toBeTruthy())

// Test isolation with cleanup
afterEach(async () => {
  resetWorkout()
  await resetDatabase()
  document.body.style.cssText = ''
})

// Fake timers for deterministic timer tests
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.useRealTimers()
```

### Patterns to Improve

```ts
// Consider: More granular timer testing
// Current: AMRAP tested via integration only
// Better: Unit test + integration test

// Consider: Store unit tests
// Current: Tested via component integration
// Better: Direct store action/getter tests
```

## Recommended Approach

### Priority 1: Quick Wins

**Add utility function tests** - High value, low effort:
```ts
// formatters.spec.ts
describe('formatDuration', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatDuration(90)).toBe('1:30')
  })
})
```

**Add coverage thresholds** to prevent regression:
```ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

### Priority 2: Targeted Expansion

**Test missing composables** - Focus on:
1. `useAmrapTimer` - Complex timer state machine
2. `useExerciseSearch` - Filter/search logic
3. `useWorkoutPersistence` - Critical persistence logic

**Add store unit tests** for:
- Store action edge cases
- Getter computation logic
- State mutations

### Priority 3: Documentation

**Establish testing conventions:**
1. Pure functions → Unit tests
2. Simple composables (reactivity only) → Direct tests
3. Lifecycle composables → withSetup tests
4. User flows → Integration tests
5. Browser APIs → Browser mode tests

### Configuration Enhancements

```ts
// vitest.config.ts additions
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json-summary'],
  experimentalAstAwareRemapping: true, // Vitest 3.2+ performance
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

Consider adding ESLint plugin:
```bash
pnpm add -D eslint-plugin-testing-library
```

## Test Distribution Recommendation

Based on Testing Trophy and current architecture:

| Type | Target | Current | Notes |
|------|--------|---------|-------|
| Integration | 60% | ~60% | On target |
| Unit (composables) | 25% | ~20% | Add timer/form composables |
| Unit (utilities) | 10% | ~0% | **Gap** - Add utility tests |
| Browser | 5% | ~5% | On target |

## Anti-Patterns to Avoid

Based on community research:

1. **Don't test implementation details** - Test behavior, not internal state
2. **Don't use `setTimeout` in tests** - Use `waitFor`, `nextTick`, `flushPromises`
3. **Don't forget cleanup** - Always reset mocks, timers, and mounted components
4. **Don't ignore async updates** - Always `await fireEvent` in Vue
5. **Don't mock everything** - Only mock external dependencies
6. **Don't increase timeouts blindly** - Investigate root cause of slow tests

## Sources

### Official Documentation
- [Vitest Browser Mode](https://vitest.dev/guide/browser/) - Browser testing setup
- [Vitest Coverage](https://vitest.dev/guide/coverage) - Coverage configuration
- [Vue Testing Library](https://testing-library.com/docs/vue-testing-library/intro/) - Testing patterns
- [Vue Test Utils](https://test-utils.vuejs.org/guide/) - Vue-specific testing

### Testing Philosophy
- [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests) - Kent C. Dodds
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) - Test distribution
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) - Anti-patterns

### Community Resources
- [Mastering Vue 3 Composables Testing](https://dylanbritz.dev/writing/testing-vue-composables-lifecycle/) - withSetup pattern
- [Vitest Best Practices](https://betterstack.com/community/guides/testing/vitest-explained/) - Configuration
- [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB) - IndexedDB testing

### Codebase References
- `vitest.config.ts` - Test configuration
- `src/__tests__/helpers/createTestApp.ts` - Integration test helper
- `src/__tests__/helpers/withSetup.ts` - Composable test helper
- `src/__tests__/factories/` - Test data builders
