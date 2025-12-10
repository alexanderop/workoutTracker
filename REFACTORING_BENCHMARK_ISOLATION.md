# Refactoring Plan: Complete Benchmark Isolation

**Status:** Approved - Ready for Implementation
**Date:** 2025-12-10

---

## Overview

Completely isolate benchmark workouts from normal workouts by creating a parallel architecture with dedicated view, state management, and composables. Benchmarks will only share dumb presentational UI components.

## Current Problems

**State Coupling:**
- `src/stores/workoutState.ts` includes `benchmarkId`, `globalTimerStartedAt`, `activeExerciseIndex`
- `src/types/workout.ts` polluted with benchmark-only fields

**Logic Coupling:**
- `src/features/workout/composables/useWorkout.ts:455-573` - Exercise navigation only used by benchmarks
- `src/features/workout/composables/useWorkoutMode.ts` has benchmark initialization logic
- `src/features/workout/components/WorkoutActiveMode.vue` has benchmark-specific composables and conditional rendering

**View Coupling:**
- `src/views/ActiveWorkout.vue` conditionally handles both workout types
- Cross-feature import: `BenchmarkExerciseQueueDrawer` imported from benchmarks feature

**Component Misplacement:**
- 3 benchmark components live in `src/features/workout/components/`:
  - `BenchmarkForTimeView.vue`
  - `BenchmarkExerciseDisplay.vue`
  - `BenchmarkCompletionScreen.vue`

## New Architecture

### File Structure

```
src/features/benchmarks/
├── views/
│   └── ActiveBenchmarkWorkout.vue          # NEW - Dedicated active benchmark view
├── state/
│   └── benchmarkState.ts                   # NEW - Singleton state (like workoutState.ts)
├── composables/
│   ├── useBenchmark.ts                     # NEW - Core state operations
│   ├── useBenchmarkMode.ts                 # NEW - Mode transitions
│   ├── useBenchmarkPersistence.ts          # NEW - Auto-save to IndexedDB
│   └── useBenchmarkExerciseNavigation.ts   # NEW - Exercise progression
└── components/
    ├── BenchmarkActiveMode.vue             # NEW - Active mode container
    ├── BenchmarkForTimeView.vue            # MOVE from workout/components
    ├── BenchmarkExerciseDisplay.vue        # MOVE from workout/components
    └── BenchmarkCompletionScreen.vue       # MOVE from workout/components
```

### Database Changes

**New Types (`src/types/benchmark.ts`):**
- `BenchmarkWorkout` type (separate from `Workout`)
- Contains only: `benchmarkId`, `name`, `blocks`, `selectedBlockIndex`, `activeExerciseIndex`, `startedAt`, `globalTimerStartedAt`, `mode`

**New Schema (`src/db/schema.ts`):**
- `DbActiveBenchmarkWorkout` type with `id: 'current-benchmark'`
- Separate table: `activeBenchmark`

**Remove from `src/types/workout.ts`:**
- `benchmarkId: string | null`
- `globalTimerStartedAt: number | null`
- `activeExerciseIndex: number | null`

## Implementation Steps

### Step 1: Create Benchmark Infrastructure (No Breaking Changes)

**1.1 Create Type System**
- Create `src/types/benchmark.ts` with `BenchmarkWorkout` type
- Create `src/db/schema.ts` additions for `DbActiveBenchmarkWorkout`

**1.2 Create Singleton State**
- Create `src/features/benchmarks/state/benchmarkState.ts`
- Exports: `getBenchmarkWorkoutRef()`, `resetBenchmarkWorkout()`, `restoreBenchmarkWorkout()`

**1.3 Create Core Composables**
- `src/features/benchmarks/composables/useBenchmark.ts` - State operations, current block/exercise, progress tracking
- `src/features/benchmarks/composables/useBenchmarkMode.ts` - Mode transitions, block navigation
- `src/features/benchmarks/composables/useBenchmarkExerciseNavigation.ts` - Exercise progression logic
- `src/features/benchmarks/composables/useBenchmarkPersistence.ts` - Auto-save, load, complete, discard

**1.4 Create Database Layer**
- Add `activeBenchmark` table to Dexie schema
- Create `src/db/interfaces.ts` addition for `ActiveBenchmarkWorkoutRepository`
- Create `src/db/implementations/dexie/activeBenchmarkWorkout.ts`
- Create converters: `benchmarkWorkoutToDb()`, `dbToBenchmarkWorkout()` in `src/db/converters.ts`
- Export repository getter in `src/db/index.ts`

### Step 2: Create Benchmark View & Components

**2.1 Move Existing Components**
- Move `src/features/workout/components/BenchmarkForTimeView.vue` → `src/features/benchmarks/components/`
- Move `src/features/workout/components/BenchmarkExerciseDisplay.vue` → `src/features/benchmarks/components/`
- Move `src/features/workout/components/BenchmarkCompletionScreen.vue` → `src/features/benchmarks/components/`
- Update all imports in moved components

**2.2 Create New Components**
- Create `src/features/benchmarks/components/BenchmarkActiveMode.vue` - Active mode orchestration (mirrors WorkoutActiveMode but benchmark-specific)

**2.3 Create View**
- Create `src/features/benchmarks/views/ActiveBenchmarkWorkout.vue` - Main benchmark execution view
- Uses benchmark composables exclusively
- Initializes benchmark timer
- Handles load/restore/complete/discard flows

**2.4 Add Route**
- Add `RouteNames.ActiveBenchmark = 'ActiveBenchmark'` to `src/router/index.ts`
- Add route: `{ path: '/benchmark/active', name: RouteNames.ActiveBenchmark, component: ActiveBenchmarkWorkout }`

### Step 3: Switch Benchmark Flows

**3.1 Update Benchmark Detail View**
- Modify `src/views/BenchmarkDetailView.vue` to route to `RouteNames.ActiveBenchmark` instead of `RouteNames.ActiveWorkout`
- Update `src/features/benchmarks/composables/useBenchmarkDetail.ts`:
  - Change `startWorkout()` to use new `ActiveBenchmarkWorkoutRepository`
  - Create benchmark workout and save to `activeBenchmark` table

**3.2 Test Benchmark Flow**
- Verify benchmark creation works
- Verify benchmark execution works
- Verify benchmark completion saves correctly
- Verify benchmark history displays

### Step 4: Remove Workout Feature Coupling

**4.1 Clean Up Workout Composables**
- Remove from `src/features/workout/composables/useWorkout.ts`:
  - Lines 455-573: `advanceToNextExercise()`, `goToPreviousExercise()`
  - Computed properties: `currentExercisePosition`, `totalExerciseCount`, `globalExerciseIndex`

- Remove from `src/features/workout/composables/useWorkoutMode.ts`:
  - Benchmark initialization in `initializeTimestamps()`
  - Benchmark exercise index in `initializeFirstBlock()`
  - Benchmark reset in `advanceToNextBlock()`

**4.2 Clean Up Workout Components**
- Remove from `src/features/workout/components/WorkoutActiveMode.vue`:
  - Props: `isBenchmarkMode`, `benchmarkTimer`
  - Benchmark composables: `useBenchmarkAnimation`, `useBenchmarkFirstAttempt`, `useBenchmarkSplitComparison`
  - Conditional rendering for `BenchmarkForTimeView`
  - Benchmark-specific header logic

- Remove from `src/features/workout/components/WorkoutActiveModeFooter.vue`:
  - Benchmark-specific "Done" button logic
  - Benchmark-specific back button

**4.3 Clean Up Active Workout View**
- Remove from `src/views/ActiveWorkout.vue`:
  - Benchmark mode detection (`isBenchmarkMode`)
  - Benchmark timer initialization
  - Import of `BenchmarkExerciseQueueDrawer`
  - Conditional queue drawer rendering
  - All benchmark-specific props passed to components

**4.4 Clean Up Types**
- Remove from `src/types/workout.ts`:
  - `benchmarkId: string | null`
  - `globalTimerStartedAt: number | null`
  - `activeExerciseIndex: number | null`

- Remove from `src/stores/workoutState.ts`:
  - Same three fields from initial state

### Step 5: Database Schema Cleanup

**5.1 Migration Strategy**
- Keep benchmark fields in `DbActiveWorkout` as nullable temporarily
- Once all flows tested, create migration to:
  - Move any active benchmark workouts to new table
  - Remove benchmark fields from schema
  - Bump database version

**5.2 Remove Benchmark Fields**
- Remove from `src/db/schema.ts`:
  - `DbActiveWorkout.benchmarkId`
  - `DbActiveWorkout.globalTimerStartedAt`
  - `DbActiveWorkout.activeExerciseIndex`
  - `DbCompletedWorkout.benchmarkId`

- Keep `DbForTimeResult.splitTimes` (can be useful for regular ForTime blocks)

**5.3 Update Converters**
- Remove benchmark field handling from `src/db/converters.ts`:
  - `workoutToDb()` - Remove benchmark fields
  - `dbToWorkout()` - Remove benchmark fields

### Step 6: Testing & Verification

**6.1 Unit Tests**
- Test `useBenchmark()` composable
- Test `useBenchmarkMode()` composable
- Test `useBenchmarkExerciseNavigation()` composable
- Test `useBenchmarkPersistence()` composable

**6.2 Integration Tests**
- Test full benchmark creation flow
- Test benchmark execution with exercise progression
- Test benchmark completion and history saving
- Test benchmark resume after app close

**6.3 Manual Testing**
- Create new benchmark
- Start benchmark workout
- Complete benchmark workout
- Verify history and personal best tracking
- Verify no regression in normal workout flows

### Step 7: Documentation & Cleanup

**7.1 Update CLAUDE.md Files**
- Update `src/features/CLAUDE.md` to reflect benchmark isolation
- Update `src/features/benchmarks/CLAUDE.md` with new architecture
- Document the separation between workout and benchmark features

**7.2 Remove Dead Code**
- Search for any remaining benchmark-related code in workout feature
- Remove unused imports
- Run `pnpm knip` to find unused exports

---

## Critical Files

### New Files (Create)
- `src/types/benchmark.ts`
- `src/features/benchmarks/state/benchmarkState.ts`
- `src/features/benchmarks/composables/useBenchmark.ts`
- `src/features/benchmarks/composables/useBenchmarkMode.ts`
- `src/features/benchmarks/composables/useBenchmarkExerciseNavigation.ts`
- `src/features/benchmarks/composables/useBenchmarkPersistence.ts`
- `src/features/benchmarks/components/BenchmarkActiveMode.vue`
- `src/features/benchmarks/views/ActiveBenchmarkWorkout.vue`
- `src/db/implementations/dexie/activeBenchmarkWorkout.ts`

### Files to Modify

- `src/types/workout.ts` - Remove benchmark fields
- `src/stores/workoutState.ts` - Remove benchmark fields
- `src/db/schema.ts` - Add `DbActiveBenchmarkWorkout`, remove benchmark fields from workout types
- `src/db/converters.ts` - Add benchmark converters, remove from workout converters
- `src/db/index.ts` - Export benchmark repository
- `src/router/index.ts` - Add benchmark route
- `src/features/workout/composables/useWorkout.ts` - Remove exercise navigation (lines 455-573)
- `src/features/workout/composables/useWorkoutMode.ts` - Remove benchmark initialization
- `src/features/workout/components/WorkoutActiveMode.vue` - Remove benchmark rendering
- `src/features/workout/components/WorkoutActiveModeFooter.vue` - Remove benchmark buttons
- `src/views/ActiveWorkout.vue` - Remove benchmark handling
- `src/views/BenchmarkDetailView.vue` - Route to new benchmark view
- `src/features/benchmarks/composables/useBenchmarkDetail.ts` - Use new repository

### Files to Move

- `src/features/workout/components/BenchmarkForTimeView.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkExerciseDisplay.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkCompletionScreen.vue` → `src/features/benchmarks/components/`

---

## Benefits

1. **Complete Isolation** - No shared state, no conditional logic
2. **Type Safety** - `BenchmarkWorkout` only contains relevant fields
3. **Maintainability** - Clear separation of concerns, easier to modify
4. **Testability** - Test features independently
5. **Performance** - No unnecessary benchmark logic in workout flows
6. **Bulletproof Compliance** - No cross-feature imports except dumb UI components

---

## Migration Risk Assessment

**Low Risk:**
- Creating parallel infrastructure has no impact on existing flows
- Can test thoroughly before switching flows
- Can rollback easily by routing back to old view

**Testing Focus:**
- Benchmark creation and starting
- Exercise progression and navigation
- Split time tracking
- Personal best comparison
- Completion and history saving
- App close/resume with active benchmark

---

## Quick Start for Developers

1. **Review this plan**: Read through the entire plan before starting
2. **Follow steps sequentially**: Each step is designed to be non-breaking until Step 4
3. **Run tests after each step**: Ensure no regressions
4. **Key commands**:
   ```bash
   pnpm type-check  # TypeScript validation
   pnpm lint        # Code quality
   pnpm test        # Run all tests
   pnpm knip        # Find unused exports
   ```

---

**Questions or issues?** Review this plan or check the codebase documentation in `CLAUDE.md` files.
