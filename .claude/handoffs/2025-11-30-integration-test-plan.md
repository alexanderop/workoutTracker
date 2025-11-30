# Integration Test Plan

This document outlines recommended integration tests based on coverage analysis performed on 2025-11-30.

## Context

After adding unit tests for timer composables (useEmomTimer, useForTimeTimer, useTabataTimer), overall coverage improved from 71% to 77%. Integration tests are needed to exercise full user flows and improve coverage on UI components.

### Current Integration Tests
- `full-workout-flow.spec.ts` - Strength + AMRAP creation, navigation, cancel, completion
- `complete-set-flow.spec.ts` - Set advancement in strength blocks
- `workout-history.spec.ts` - History navigation and detail view

---

## High Priority

### 1. Timed Block Execution Flow
**Coverage impact**: Timed block view components at 0%

Tests to add:
- Start AMRAP timer, increment rounds, complete when time expires
- Run EMOM through minute transitions with exercise rotation
- Execute Tabata work/rest phases and record reps per round
- Complete For Time workout before time cap
- Complete For Time workout when time cap is reached

**File**: `src/__tests__/integration/timed-block-flow.spec.ts`

```typescript
describe('Timed Block Execution', () => {
  it('runs AMRAP timer and records rounds')
  it('runs EMOM and transitions between minutes')
  it('runs Tabata with work/rest phases')
  it('completes For Time before time cap')
})
```

### 2. Template Management Flow
**Coverage impact**: `templates.ts` repository at 6%

Tests to add:
- Create template from completed workout (via summary page)
- Start new workout from existing template
- View template list
- Delete template

**File**: `src/__tests__/integration/template-flow.spec.ts`

### 3. Rest Timer Flow
**Coverage impact**: `WorkoutRestTimerWidget.vue` at 0%

Tests to add:
- Rest timer appears after completing a set
- Skip rest timer early
- Rest timer auto-dismisses after duration

**File**: `src/__tests__/integration/rest-timer-flow.spec.ts`

---

## Medium Priority

### 4. Workout Persistence/Recovery
**Coverage impact**: `useWorkoutPersistence.ts` at 71%

Tests to add:
- In-progress workout persists across page refresh
- Resume workout from where user left off
- Active block state is preserved

### 5. Custom Exercise Management
**Coverage impact**: `customExercises.ts` repository at 35%

Tests to add:
- Add custom exercise via exercises page
- Use custom exercise in workout
- Filter exercises by muscle group

### 6. Data Import/Export
**Coverage impact**: `dataExport.ts` at 5%, `dataImport.ts` at 3%

Tests to add:
- Export workout data (verify file download)
- Import workout data and verify integrity
- Handle import errors gracefully

---

## Lower Priority

### 7. Block Management in Builder Mode

Tests to add:
- Reorder blocks in playlist
- Remove block from workout
- Edit timed block configuration after creation

### 8. Settings Changes

Tests to add:
- Switch weight unit kg to lbs
- Verify unit conversion displays correctly in workout views

---

## Test Utilities Available

- `createTestApp()` - Full app with router, returns user interaction helpers
- `withSetup()` - For composables needing Vue lifecycle
- `resetDatabase()` - Clear IndexedDB between tests
- `dbWorkoutBuilder()` - Create test workout data

## Running Tests

```bash
pnpm test:unit                                    # Run all tests
pnpm test:unit src/__tests__/integration/         # Run integration tests only
pnpm test:unit --coverage                         # Run with coverage report
```
