# Timer Workout Logging - Test Coverage Summary

This document summarizes the comprehensive test coverage added for the timer workout logging feature.

## Files Changed in the Branch

1. **`src/features/timers/composables/useTimerWorkoutLogger.ts`** (NEW)
   - New composable for logging standalone timer sessions as workouts
   - Converts timer blocks + results into `DbCompletedWorkout` records

2. **`src/features/timers/components/StandaloneTimerRunner.vue`** (MODIFIED)
   - Added workout logging functionality to timer completion screen
   - Integrated `useTimerWorkoutLogger` composable
   - Added "Log Workout" button with state management

3. **`src/__tests__/integration/timer-workout-logging.spec.ts`** (NEW)
   - Integration tests for timer workout logging UI flows

4. **Configuration files** (package.json, pnpm-lock.yaml, CI workflows)
   - Dependency updates and CI configuration changes

## Test Files Created/Modified

### 1. Unit Tests: `src/__tests__/composables/useTimerWorkoutLogger.spec.ts` (NEW)

**Coverage: 896 lines, 34 comprehensive unit tests**

#### Test Suites:

- **Initial State** (2 tests)
  - Verifies `isLogged` and `isSaving` start as `false`

- **logAmrap()** (7 tests)
  - Saves AMRAP workout to database
  - Sets `isLogged` flag after save
  - Saves correct result data (rounds, partialReps)
  - Generates proper workout names
  - Calculates duration from timestamps
  - Prevents duplicate saves
  - Guards against concurrent saves

- **logEmom()** (5 tests)
  - Saves EMOM workout to database
  - Stores completed/missed minutes correctly
  - Generates proper workout names
  - Sets `isLogged` flag
  - Handles edge case of all minutes missed

- **logTabata()** (5 tests)
  - Saves Tabata workout to database
  - Stores reps per round data
  - Generates proper workout names
  - Sets `isLogged` flag
  - Uses placeholder exercise for standalone timers

- **logForTime()** (6 tests)
  - Saves For Time workout to database
  - Stores completion data and split times
  - Handles incomplete workouts (time cap exceeded)
  - Generates names with/without time cap
  - Sets `isLogged` flag

- **reset()** (3 tests)
  - Resets `isLogged` to false
  - Allows saving again after reset
  - Does not affect existing database records

- **Error Handling** (2 tests)
  - Returns null on database errors
  - Sets `isSaving` back to false even on failure

- **Concurrent Operations** (1 test)
  - Multiple composable instances work independently

- **Workout Metadata** (3 tests)
  - Saves empty notes
  - Saves null benchmarkId
  - Generates unique IDs for workouts and blocks

### 2. Integration Tests: `src/__tests__/integration/timer-workout-logging.spec.ts` (UPDATED)

**Coverage: 460 lines, 15 total tests (9 original + 6 added)**

#### Original Test Suites:

- **Log Workout button on completion** (6 tests)
  - Button visibility on timer completion
  - Button state change to "Logged ✓"
  - Database persistence
  - Workflow with "Again" button
  - State reset with "Done" button

- **Logged workout data** (3 tests)
  - Correct AMRAP block structure
  - Auto-generated workout names
  - Proper timestamp handling

#### New Test Suites Added:

- **Edge cases and error scenarios** (6 tests)
  - Rapid clicking protection
  - Pause/resume timer preservation
  - State management with Done button
  - Timestamp accuracy in test mode
  - Multiple workout instances
  - Reset button state handling

- **Different timer types** (3 tests)
  - EMOM timer logging
  - Tabata timer logging
  - For Time timer logging

## Test Coverage Statistics

### Unit Tests (useTimerWorkoutLogger)
- **Total Tests:** 34
- **Lines of Test Code:** 896
- **Coverage Areas:**
  - All 4 timer types (AMRAP, EMOM, Tabata, For Time)
  - State management (isLogged, isSaving)
  - Database operations
  - Error handling
  - Concurrent operations
  - ID generation
  - Name generation
  - Timestamp handling

### Integration Tests (timer-workout-logging)
- **Total Tests:** 15 (9 original + 6 new)
- **Lines of Test Code:** 460
- **Coverage Areas:**
  - UI button interactions
  - State transitions
  - Database persistence
  - Multiple timer types
  - Edge cases and error scenarios
  - User workflows (Again, Done, Reset)

## Testing Framework

- **Framework:** Vitest v4.0.15
- **Browser Testing:** Playwright (Chromium)
- **Test Mode:** Browser integration tests run in real browser environment
- **Database:** Dexie (IndexedDB) with full reset between tests
- **Patterns Used:**
  - Page Object Model for UI interactions
  - Test helpers for common workflows
  - Type-safe assertions with TypeScript
  - Async/await for database operations
  - Vitest mocking for error simulation

## Key Test Patterns

### 1. Database Reset
```typescript
beforeEach(async () => {
  await resetDatabase()
})
```

### 2. Type Guards for Results
```typescript
function isAmrapBlock(block: { kind: string }): block is DbAmrapBlock {
  return block.kind === 'amrap'
}
```

### 3. Polling for Async Operations
```typescript
await expect.poll(async () => await db.workouts.count()).toBe(1)
```

### 4. Test-Only Mechanisms
- `data-testid="complete-timer-test"` button for instant timer completion
- `import.meta.env.MODE === 'test'` conditional rendering

## Running the Tests

```bash
# Run all default tests (including new unit tests)
pnpm test

# Run in watch mode during development
pnpm test:watch

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test useTimerWorkoutLogger
pnpm test timer-workout-logging
```

## Test Quality Metrics

✅ **Comprehensive Coverage:** Both unit and integration levels tested  
✅ **Edge Cases:** Rapid clicking, concurrent operations, error scenarios  
✅ **Type Safety:** Full TypeScript support with type guards  
✅ **Realistic Testing:** Browser-based tests with real DOM and IndexedDB  
✅ **Maintainability:** Clear test names, helper functions, Page Objects  
✅ **Fast Feedback:** Tests run sequentially to prevent state interference  
✅ **Documentation:** Clear test descriptions and inline comments  

## Test Scenarios Covered

### Happy Path
1. Complete timer → Click Log Workout → Workout saved with correct data
2. Log workout → Click Again → Complete → Log another workout
3. Each timer type (AMRAP, EMOM, Tabata, For Time) can be logged

### Edge Cases
1. Rapid clicking on Log Workout button (prevents duplicates)
2. Pause/resume timer before logging (preserves state)
3. Reset timer after logging (allows new workout)
4. Complete without logging → Done → Start new timer (reset state)
5. Multiple independent composable instances

### Error Handling
1. Database save failures don't mark as logged
2. Saving state resets even on error
3. Concurrent save attempts blocked

### Data Integrity
1. Timestamps match actual timer session
2. Block results preserve all data (rounds, reps, completion times)
3. Workout names auto-generated correctly for each timer type
4. Unique IDs generated for all records
5. Empty notes and null benchmarkId set correctly

## Future Test Considerations

1. **Performance Testing:** Timer accuracy under load
2. **Accessibility Testing:** Screen reader announcements for state changes
3. **Visual Regression:** Screenshot comparison for timer UI
4. **E2E Testing:** Full user journey from app launch to workout log
5. **Mobile Testing:** Touch interactions and mobile browser compatibility

## Related Files

- Implementation: `src/features/timers/composables/useTimerWorkoutLogger.ts`
- Component: `src/features/timers/components/StandaloneTimerRunner.vue`
- Database Schema: `src/db/schema.ts`
- Block Types: `src/types/blocks.ts`
- I18n Messages: `src/i18n/messages/en/timers.ts`, `src/i18n/messages/de/timers.ts`