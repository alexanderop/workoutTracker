# Timer Workout Logging - Test Documentation

## Overview

This directory contains comprehensive test coverage for the timer workout logging feature, which allows users to save standalone timer sessions (AMRAP, EMOM, Tabata, For Time) as completed workouts in their workout history.

## Test Files

### 1. Unit Tests
**File:** `src/__tests__/composables/useTimerWorkoutLogger.spec.ts`

Tests the `useTimerWorkoutLogger` composable in isolation with mocked dependencies.

**Key Features Tested:**
- State management (isLogged, isSaving)
- Database persistence for all 4 timer types
- Workout name generation
- Timestamp handling
- Error handling and recovery
- Concurrent operation prevention
- Unique ID generation

**Run Command:**
```bash
pnpm test useTimerWorkoutLogger
```

### 2. Integration Tests
**File:** `src/__tests__/integration/timer-workout-logging.spec.ts`

Tests the complete user flow from timer completion to workout logging in a real browser environment.

**Key Features Tested:**
- UI interactions (button clicks, state changes)
- End-to-end workout logging flow
- Database persistence verification
- Multi-timer type support
- Edge cases (rapid clicking, pause/resume, reset)

**Run Command:**
```bash
pnpm test timer-workout-logging
```

## Test Statistics

| Metric | Unit Tests | Integration Tests | Total |
|--------|------------|-------------------|-------|
| Test Cases | 35 | 17 | 52 |
| Lines of Code | 896 | 460 | 1,356 |
| Timer Types Covered | 4 | 4 | 4 |
| Suites | 9 | 4 | 13 |

## Coverage by Timer Type

### AMRAP (As Many Rounds As Possible)
- ✅ Saves rounds and partial reps
- ✅ Generates "X min AMRAP" workout name
- ✅ Captures duration from config
- ✅ Stores empty exercises array for standalone timer

### EMOM (Every Minute On the Minute)
- ✅ Saves completed and missed minutes
- ✅ Generates "X min EMOM" workout name
- ✅ Supports both exercise rotation modes
- ✅ Handles edge case of all minutes missed

### Tabata
- ✅ Saves reps per round array
- ✅ Generates "TABATA XxY/Z" workout name
- ✅ Uses placeholder "Conditioning" exercise
- ✅ Stores work/rest intervals in config

### For Time
- ✅ Saves completion time and completed flag
- ✅ Optionally stores split times
- ✅ Generates name with/without time cap
- ✅ Handles incomplete workouts (time cap exceeded)

## Test Patterns Used

### 1. Database Reset Pattern
```typescript
beforeEach(async () => {
  await resetDatabase()
})
```
Ensures clean state between tests to prevent interference.

### 2. Type Guard Pattern
```typescript
function isAmrapBlock(block: { kind: string }): block is DbAmrapBlock {
  return block.kind === 'amrap'
}
```
Provides runtime type safety for discriminated unions.

### 3. Polling Pattern
```typescript
await expect.poll(async () => await db.workouts.count()).toBe(1)
```
Waits for async operations to complete before asserting.

### 4. Test Helper Pattern
```typescript
async function startAmrapTimer() {
  await userEvent.click(page.getByRole('button', { name: /AMRAP/i }))
  await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
  await userEvent.click(page.getByRole('button', { name: /Quick burst/i }))
  await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
}
```
Encapsulates common test workflows for reusability.

### 5. Error Simulation Pattern
```typescript
vi.spyOn(db.workouts, 'add').mockRejectedValueOnce(new Error('Database error'))
```
Uses Vitest mocking to simulate error conditions.

## Running Tests

### Run All Tests
```bash
pnpm test
```

### Run in Watch Mode
```bash
pnpm test:watch
```

### Run with UI
```bash
pnpm test:ui
```

### Run with Coverage
```bash
pnpm test:coverage
```

### Run Specific Test Suite
```bash
# Unit tests only
pnpm test useTimerWorkoutLogger

# Integration tests only
pnpm test timer-workout-logging

# Specific test by name
pnpm test -t "saves AMRAP workout to database"
```

### Run in Headed Browser (See Tests Execute)
```bash
pnpm test:headed
```

## Test Environment

- **Test Runner:** Vitest 4.0.15
- **Browser:** Playwright with Chromium
- **Database:** Dexie (IndexedDB) with in-memory storage
- **Component Testing:** vitest-browser-vue
- **Assertions:** Vitest expect API with browser extensions

## Key Test Helpers

### Database Helpers
- `resetDatabase()` - Clears all data from IndexedDB
- `db.workouts.toArray()` - Gets all saved workouts
- `db.workouts.count()` - Gets workout count

### Test App Helpers
- `createTestApp()` - Creates Vue app with router and stores
- `setupIntegrationTest()` - Prepares test environment
- `cleanupIntegrationTest()` - Cleans up after tests

### Timer Helpers (Integration)
- `goToTimersPage()` - Navigates to timer selection
- `startAmrapTimer()` - Starts AMRAP with preset
- `completeTimer()` - Triggers test-mode instant completion

## Debugging Tests

### Enable Debug Logs
```bash
DEBUG=vitest:* pnpm test
```

### Run Single Test
```bash
pnpm test -t "saves AMRAP workout to database"
```

### Run in Headed Mode
```bash
pnpm test:headed
```
Watch the browser execute tests in real-time.

### Check Test Output
Tests output detailed information on failure:
- Expected vs actual values
- Database state
- Component state
- DOM snapshots

## Common Issues and Solutions

### Issue: Tests fail with "No workout found"
**Solution:** Ensure `resetDatabase()` is called in `beforeEach` to clear old data.

### Issue: Integration tests time out
**Solution:** Check that selectors match actual UI elements. Use `page.getByRole()` for reliable selection.

### Issue: Unit tests pass but integration tests fail
**Solution:** The integration environment is more realistic. Check for missing state initialization or async timing issues.

### Issue: "Element not found" errors
**Solution:** Add `await expect.element(...).toBeVisible()` before interacting with elements.

## Contributing Tests

When adding new timer features:

1. **Add unit tests** for composable logic
2. **Add integration tests** for UI flows
3. **Test all timer types** if applicable
4. **Include edge cases** (errors, rapid clicks, etc.)
5. **Update this README** with new patterns

## Test Coverage Goals

- **Unit Tests:** 100% of composable methods
- **Integration Tests:** All critical user paths
- **Edge Cases:** Known failure modes and race conditions
- **Error Handling:** All error paths exercised

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Detailed test coverage report

## Maintenance

Tests should be updated when:
- Timer feature behavior changes
- New timer types are added
- Database schema changes
- UI component structure changes
- Error handling is modified

Last Updated: December 2024