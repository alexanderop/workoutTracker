# Refactoring Plan: Complete Benchmark Isolation

**Status:** Approved - Ready for Implementation
**Date:** 2025-12-10
**Updated:** 2025-12-10 (Post-Review)

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
- **Cross-feature import #1**: `BenchmarkExerciseQueueDrawer` imported from benchmarks feature into workout view
- **Cross-feature import #2**: `WorkoutExercisePicker` imported from workout feature into `BenchmarkDetailView.vue:12`

**Component Misplacement:**
- 3 benchmark components live in `src/features/workout/components/`:
  - `BenchmarkForTimeView.vue`
  - `BenchmarkExerciseDisplay.vue`
  - `BenchmarkCompletionScreen.vue`

**Composable Misplacement:**
- 3 benchmark-only composables live in `src/composables/workout/`:
  - `useBenchmarkAnimation.ts` (used by WorkoutActiveMode.vue:17, BenchmarkExerciseDisplay.vue)
  - `useBenchmarkFirstAttempt.ts` (used by WorkoutActiveMode.vue:18)
  - `useBenchmarkSplitComparison.ts` (used by WorkoutActiveMode.vue:19, BenchmarkForTimeView.vue:9)

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
│   ├── useBenchmarkExerciseNavigation.ts   # NEW - Exercise progression
│   ├── useBenchmarkAnimation.ts            # MOVE from src/composables/workout/
│   ├── useBenchmarkFirstAttempt.ts         # MOVE from src/composables/workout/
│   └── useBenchmarkSplitComparison.ts      # MOVE from src/composables/workout/
└── components/
    ├── BenchmarkActiveMode.vue             # NEW - Active mode container
    ├── BenchmarkForTimeView.vue            # MOVE from workout/components
    ├── BenchmarkExerciseDisplay.vue        # MOVE from workout/components
    ├── BenchmarkCompletionScreen.vue       # MOVE from workout/components
    └── BenchmarkExercisePicker.vue         # NEW - Benchmark-specific exercise picker
```

### Database Changes

**New Types (`src/types/benchmark.ts`):**

```typescript
export type BenchmarkWorkout = {
  id: number
  name: string
  benchmarkId: string  // Reference to benchmark definition
  blocks: Array<ForTimeBlock>  // Only ForTime blocks (can be multiple for rounds-type benchmarks)
  selectedBlockIndex: number
  activeExerciseIndex: number  // Exercise position across all blocks
  startedAt: number
  globalTimerStartedAt: number  // For overall benchmark timer
  mode: WorkoutMode  // 'preparation' | 'active' | 'completed'
}
```

**New Schema (`src/db/schema.ts`):**
- Add `DbActiveBenchmarkWorkout` type (mirrors BenchmarkWorkout structure with `id: 'current-benchmark'`)
- Add `activeBenchmark` table to Dexie schema
- **KEEP** benchmark fields in existing tables (no migration needed):
  - `DbActiveWorkout.benchmarkId` (keep as nullable)
  - `DbActiveWorkout.globalTimerStartedAt` (keep as nullable)
  - `DbActiveWorkout.activeExerciseIndex` (keep as nullable)
  - `DbCompletedWorkout.benchmarkId` (REQUIRED for personal best tracking)

**Strategy**: New benchmarks use `activeBenchmark` table, old tables remain unchanged for backward compatibility.

## Implementation Steps

### Step 1: Create Benchmark Infrastructure (No Breaking Changes)

**1.1 Create Type System**
- Create `src/types/benchmark.ts` with complete `BenchmarkWorkout` type (see Database Changes section above)
- Update `src/db/schema.ts`:
  - Add `DbActiveBenchmarkWorkout` type
  - Keep existing benchmark fields in `DbActiveWorkout` and `DbCompletedWorkout` (backward compatibility)

**1.2 Create Singleton State**
- Create `src/features/benchmarks/state/benchmarkState.ts`
- Exports:
  - `getBenchmarkWorkoutRef()` - Returns reactive ref to benchmark workout
  - `resetBenchmarkWorkout()` - Clears state to initial values
  - `restoreBenchmarkWorkout(workout: BenchmarkWorkout)` - Loads saved workout into state

**1.3 Create Core Composables**

Create `src/features/benchmarks/composables/useBenchmark.ts`:
- State operations: `updateBenchmarkWorkout()`, `getBenchmarkWorkout()`
- Current block/exercise: `currentBlock`, `currentExercise`, `currentBlockExercises`
- Progress tracking: `isFirstBlock`, `isLastBlock`, `blocksCompleted`

Create `src/features/benchmarks/composables/useBenchmarkMode.ts`:
- Mode transitions: `enterActiveMode()`, `enterCompletionMode()`
- Block navigation: `advanceToNextBlock()`, `goToPreviousBlock()`
- Initialization: `initializeTimestamps()`, `initializeFirstBlock()`

Create `src/features/benchmarks/composables/useBenchmarkExerciseNavigation.ts`:
- **API Specification:**
  ```typescript
  {
    // Navigation functions
    advanceToNextExercise: () => 'next-exercise' | 'next-block' | 'completed',
    goToPreviousExercise: () => 'previous-exercise' | 'previous-block' | 'at-start',

    // Position tracking (mirrors useWorkout.ts:455-573 logic)
    currentExercisePosition: ComputedRef<number>,  // 1-based position within current block
    totalExerciseCount: ComputedRef<number>,       // Total exercises in current block
    globalExerciseIndex: ComputedRef<number>,      // 0-based index across ALL blocks

    // Block boundary detection
    isFirstExerciseInBlock: ComputedRef<boolean>,
    isLastExerciseInBlock: ComputedRef<boolean>,
  }
  ```
- Handles crossing round boundaries for rounds-type benchmarks
- Updates `activeExerciseIndex` and `selectedBlockIndex` in state

Create `src/features/benchmarks/composables/useBenchmarkPersistence.ts`:
- Auto-save: `saveNow()`, watch-based auto-save
- Load/restore: `loadActiveBenchmark()`, `hasActiveBenchmark()`
- Completion: `completeBenchmark()` - saves to completed workouts with `benchmarkId`
- Discard: `discardActiveBenchmark()`

**1.4 Create Database Layer**
- Update `src/db/implementations/dexie/database.ts`:
  - Bump version from 1 to 2
  - Add `activeBenchmark: 'id'` to stores
- Create `src/db/interfaces.ts` addition for `ActiveBenchmarkWorkoutRepository` interface
- Create `src/db/implementations/dexie/activeBenchmarkWorkout.ts` repository implementation
- Create converters in `src/db/converters.ts`:
  - `benchmarkWorkoutToDb(workout: BenchmarkWorkout): DbActiveBenchmarkWorkout`
  - `dbToBenchmarkWorkout(db: DbActiveBenchmarkWorkout): BenchmarkWorkout`
- Export repository getter `getActiveBenchmarkWorkoutRepository()` in `src/db/index.ts`

### Step 2: Create Benchmark View & Components

**2.1 Move Benchmark-Specific Files**

Move components:
- `src/features/workout/components/BenchmarkForTimeView.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkExerciseDisplay.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkCompletionScreen.vue` → `src/features/benchmarks/components/`

Move composables:
- `src/composables/workout/useBenchmarkAnimation.ts` → `src/features/benchmarks/composables/`
- `src/composables/workout/useBenchmarkFirstAttempt.ts` → `src/features/benchmarks/composables/`
- `src/composables/workout/useBenchmarkSplitComparison.ts` → `src/features/benchmarks/composables/`

Update imports in moved files:
- All moved components should import from `@/features/benchmarks/composables/` instead of `@/composables/workout/`
- Update any cross-feature imports to use shared components

**2.2 Create Benchmark Exercise Picker**
- Create `src/features/benchmarks/components/BenchmarkExercisePicker.vue`
- Either duplicate logic from `WorkoutExercisePicker` or extract shared logic to `src/components/`
- This eliminates the cross-feature import from `BenchmarkDetailView.vue:12`

**2.3 Create New Components**
- Create `src/features/benchmarks/components/BenchmarkActiveMode.vue`
- Mirrors `WorkoutActiveMode.vue` structure but benchmark-specific
- Uses: `useBenchmark`, `useBenchmarkMode`, `useBenchmarkExerciseNavigation`, `useBenchmarkAnimation`, `useBenchmarkFirstAttempt`, `useBenchmarkSplitComparison`
- Renders: `BenchmarkForTimeView`, `BenchmarkExerciseDisplay`, `BenchmarkCompletionScreen`

**2.4 Create Benchmark View**
- Create `src/features/benchmarks/views/ActiveBenchmarkWorkout.vue`
- **Completion Flow Specification:**
  ```typescript
  // On mount: Load or restore active benchmark
  const { loadActiveBenchmark, hasActiveBenchmark } = useBenchmarkPersistence()
  const benchmarkTimer = useBenchmarkGlobalTimer()

  onMounted(async () => {
    if (await hasActiveBenchmark()) {
      const workout = await loadActiveBenchmark()
      restoreBenchmarkWorkout(workout)
      // Restore timer from globalTimerStartedAt if in active mode
      if (workout.mode === 'active' && workout.globalTimerStartedAt) {
        benchmarkTimer.initializeFromWorkout(workout.globalTimerStartedAt)
      }
    }
  })

  // Completion handler
  async function handleConfirmFinish(name: string) {
    const workout = getBenchmarkWorkout()
    workout.name = name
    await saveNow()

    // Save to completed workouts with benchmarkId
    const completed = await completeBenchmark()

    if (completed) {
      resetBenchmarkWorkout()
      // Navigate to WorkoutSummary (reuse existing view)
      router.push({ name: RouteNames.WorkoutSummary, params: { id: completed.id } })

      // Update benchmark lastUsedAt timestamp
      await updateBenchmarkUsage(workout.benchmarkId)
    }
  }

  // Discard handler
  async function handleDiscard() {
    await discardActiveBenchmark()
    resetBenchmarkWorkout()
    router.push({ name: RouteNames.Benchmarks })
  }
  ```
- Includes `BenchmarkExerciseQueueDrawer` (same feature, no cross-feature import)
- Uses `useBenchmarkGlobalTimer` from `src/composables/timers/` (shared timer infrastructure)

**2.5 Add Route** (after view is created and tested)
- Add `RouteNames.ActiveBenchmark = 'ActiveBenchmark'` to `src/router/index.ts`
- Add route: `{ path: '/benchmark/active', name: RouteNames.ActiveBenchmark, component: () => import('@/features/benchmarks/views/ActiveBenchmarkWorkout.vue') }`

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

**CRITICAL: Steps 4.1-4.3 must be completed BEFORE 4.4 to avoid breaking changes**

**4.1 Clean Up Workout Components FIRST**
- Update `src/features/workout/components/WorkoutActiveMode.vue`:
  - Remove props: `isBenchmarkMode`, `benchmarkTimer`
  - Remove imports: `useBenchmarkAnimation`, `useBenchmarkFirstAttempt`, `useBenchmarkSplitComparison`
  - Remove imports: `BenchmarkForTimeView`, `BenchmarkExerciseDisplay`, `BenchmarkCompletionScreen`
  - Remove conditional rendering for benchmark views
  - Remove benchmark-specific header logic
  - Remove calls to: `advanceToNextExercise`, `goToPreviousExercise`, `currentExercisePosition`, `totalExerciseCount`, `globalExerciseIndex`

- Update `src/features/workout/components/WorkoutActiveModeFooter.vue`:
  - Remove benchmark-specific "Done" button logic
  - Remove benchmark-specific back button

**4.2 Clean Up Active Workout View**
- Update `src/views/ActiveWorkout.vue`:
  - Remove benchmark mode detection (`isBenchmarkMode` computed)
  - Remove benchmark timer initialization (`useBenchmarkGlobalTimer` import and usage)
  - Remove import: `BenchmarkExerciseQueueDrawer`
  - Remove conditional queue drawer rendering
  - Remove all benchmark-specific props passed to `WorkoutActiveMode`
  - Simplify to only handle regular workouts

**4.3 Update Benchmark Detail View**
- Update `src/views/BenchmarkDetailView.vue`:
  - Remove import: `WorkoutExercisePicker` from workout feature
  - Add import: `BenchmarkExercisePicker` from benchmarks feature
  - Update component reference

**4.4 Clean Up Composables AFTER Components Updated**
- Update `src/features/workout/composables/useWorkout.ts`:
  - Remove lines 455-573: `advanceToNextExercise()`, `goToPreviousExercise()`
  - Remove computed properties: `currentExercisePosition`, `totalExerciseCount`, `globalExerciseIndex`
  - These are now safe to remove since WorkoutActiveMode no longer uses them

- Update `src/features/workout/composables/useWorkoutMode.ts`:
  - Remove benchmark-specific logic from `initializeTimestamps()`
  - Remove benchmark exercise index from `initializeFirstBlock()`
  - Remove benchmark reset from `advanceToNextBlock()`

**4.5 Clean Up Types and State**
- Update `src/types/workout.ts`:
  - Remove `benchmarkId: string | null`
  - Remove `globalTimerStartedAt: number | null`
  - Remove `activeExerciseIndex: number | null`

- Update `src/stores/workoutState.ts`:
  - Remove same three fields from initial state
  - Remove from type definitions

### Step 5: Verify Database Isolation (No Migration Needed)

**5.1 Verification Checklist**
- ✅ New benchmarks use `activeBenchmark` table via `ActiveBenchmarkWorkoutRepository`
- ✅ Benchmark fields remain in `DbActiveWorkout` and `DbCompletedWorkout` (backward compatibility)
- ✅ `DbCompletedWorkout.benchmarkId` is **REQUIRED** and must be kept for personal best queries
- ✅ `DbForTimeResult.splitTimes` kept (useful for regular ForTime blocks too)
- ✅ Database version bumped to 2 with new `activeBenchmark` table

**5.2 Test Data Integrity**
- Verify existing completed benchmarks still display in history
- Verify personal best calculation still works (queries `workouts` table by `benchmarkId`)
- Verify old workouts with `benchmarkId !== null` don't break anything
- Run `pnpm type-check` to ensure no type errors

**Note**: No data migration required. Old tables keep benchmark fields for backward compatibility. New benchmark workouts use the new `activeBenchmark` table going forward.

### Step 6: Testing & Verification

**6.1 Unit Tests - New Composables**
Create tests in `src/__tests__/composables/`:
- `useBenchmark.spec.ts` - State operations, current block/exercise, progress tracking
- `useBenchmarkMode.spec.ts` - Mode transitions, block navigation, initialization
- `useBenchmarkExerciseNavigation.spec.ts` - Exercise navigation, position tracking, boundary crossing
- `useBenchmarkPersistence.spec.ts` - Auto-save, load, complete, discard operations

**6.2 Update Existing Integration Tests**
Update `src/__tests__/integration/benchmark-flows.spec.ts`:
- **Complete rewrite required** (~623 lines)
- Change route from `RouteNames.ActiveWorkout` to `RouteNames.ActiveBenchmark`
- Update all component selectors (new component structure)
- Test against `ActiveBenchmarkWorkout.vue` instead of `ActiveWorkout.vue`
- Verify benchmark-specific features work in isolation

Update `src/__tests__/components/BenchmarkExerciseList.spec.ts`:
- Update imports to reflect moved components
- Update paths from `@/features/workout/components/` to `@/features/benchmarks/components/`

**6.3 Integration Test Coverage**
Ensure tests cover:
- Benchmark creation and starting from BenchmarkDetailView
- Exercise progression with `advanceToNextExercise()`
- Exercise navigation across round boundaries (rounds-type benchmarks)
- Split time tracking during execution
- Personal best comparison display
- Benchmark completion and save to completed workouts
- App close/resume with active benchmark (restore from IndexedDB)
- Navigation from completed benchmark to WorkoutSummary view

**6.4 Edge Case Testing**
Add tests for:
- **Migration scenario**: Existing completed benchmarks still display correctly
- **Personal best with 10+ attempts**: Performance and accuracy
- **Rapid exercise navigation**: No race conditions in state updates
- **App background/foreground**: Timer synchronization during benchmark
- **Rounds-type benchmark with 20+ rounds**: Stress test exercise navigation
- **Timer restoration**: Correct time display after app reload during active benchmark
- **Cross-feature isolation**: Verify ESLint catches any cross-feature imports

**6.5 Regression Testing**
- Verify normal workout flows unchanged (create, execute, complete)
- Verify workout exercise navigation still works
- Verify workout completion still works
- Run full test suite: `pnpm test`

**6.6 Manual Testing Checklist**
- [ ] Create new single-block benchmark (e.g., "Cindy")
- [ ] Create new rounds-type benchmark (e.g., "Murph" - 10 rounds)
- [ ] Start benchmark, navigate through exercises
- [ ] Complete benchmark, verify personal best recorded
- [ ] Start second attempt, verify personal best comparison shows
- [ ] Close app mid-benchmark, reopen, verify state restored
- [ ] Complete benchmark, verify appears in history
- [ ] Create and complete normal workout, verify no regression
- [ ] Check browser console for errors
- [ ] Run `pnpm lint` and `pnpm type-check` - both pass

### Step 7: Documentation & Cleanup

**7.1 Update CLAUDE.md Files**

Update `src/features/CLAUDE.md`:
- Update benchmarks row in feature table to reflect complete isolation
- Document that benchmarks no longer share state/composables with workouts
- Add note about cross-feature import rules being enforced

Create/Update `src/features/benchmarks/CLAUDE.md`:
- Document new composables:
  - `useBenchmark` - Core state operations
  - `useBenchmarkMode` - Mode transitions
  - `useBenchmarkExerciseNavigation` - Exercise progression API
  - `useBenchmarkPersistence` - Database operations
- Document component architecture (ActiveBenchmarkWorkout → BenchmarkActiveMode → specific views)
- Document state management pattern (benchmarkState.ts singleton)
- Document timer integration (useBenchmarkGlobalTimer from shared composables)
- Add examples of typical flows (create, execute, complete)

Update `src/db/CLAUDE.md`:
- Document `activeBenchmark` table and `ActiveBenchmarkWorkoutRepository`
- Document `DbActiveBenchmarkWorkout` schema
- Note that benchmark fields remain in old tables for backward compatibility

**7.2 Remove Dead Code**
- Search for any remaining benchmark-related code in workout feature:
  ```bash
  rg -n "benchmark" src/features/workout --type vue --type ts
  ```
- Remove unused imports from moved components
- Run `pnpm knip` to find unused exports:
  ```bash
  pnpm knip
  ```
- Remove any exports flagged by knip that are no longer used

**7.3 Verify ESLint Rules**
- Run `pnpm lint` to ensure no cross-feature imports
- Verify ESLint catches violations:
  - Features cannot import from other features (except benchmarks can use shared UI)
  - Views can import from any feature
  - Shared composables/components can be imported by anyone

---

## Critical Files Summary

### New Files to Create (10 files)

**Types & State:**
- `src/types/benchmark.ts` - BenchmarkWorkout type definition
- `src/features/benchmarks/state/benchmarkState.ts` - Singleton state management

**Composables:**
- `src/features/benchmarks/composables/useBenchmark.ts` - Core state operations
- `src/features/benchmarks/composables/useBenchmarkMode.ts` - Mode transitions
- `src/features/benchmarks/composables/useBenchmarkExerciseNavigation.ts` - Exercise progression
- `src/features/benchmarks/composables/useBenchmarkPersistence.ts` - Database operations

**Components & Views:**
- `src/features/benchmarks/components/BenchmarkActiveMode.vue` - Active mode container
- `src/features/benchmarks/components/BenchmarkExercisePicker.vue` - Exercise picker (eliminates cross-feature import)
- `src/features/benchmarks/views/ActiveBenchmarkWorkout.vue` - Main benchmark view

**Database:**
- `src/db/implementations/dexie/activeBenchmarkWorkout.ts` - Repository implementation

### Files to Move (6 files)

**Components:**
- `src/features/workout/components/BenchmarkForTimeView.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkExerciseDisplay.vue` → `src/features/benchmarks/components/`
- `src/features/workout/components/BenchmarkCompletionScreen.vue` → `src/features/benchmarks/components/`

**Composables:**
- `src/composables/workout/useBenchmarkAnimation.ts` → `src/features/benchmarks/composables/`
- `src/composables/workout/useBenchmarkFirstAttempt.ts` → `src/features/benchmarks/composables/`
- `src/composables/workout/useBenchmarkSplitComparison.ts` → `src/features/benchmarks/composables/`

### Files to Modify (20+ files)

**Database Layer:**
- `src/db/schema.ts` - Add DbActiveBenchmarkWorkout, keep old benchmark fields
- `src/db/converters.ts` - Add benchmark converters
- `src/db/interfaces.ts` - Add ActiveBenchmarkWorkoutRepository interface
- `src/db/index.ts` - Export benchmark repository getter
- `src/db/implementations/dexie/database.ts` - Bump version to 2, add activeBenchmark table

**Router:**
- `src/router/index.ts` - Add ActiveBenchmark route

**Workout Feature (Remove Benchmark Code):**
- `src/features/workout/composables/useWorkout.ts` - Remove lines 455-573 (exercise navigation)
- `src/features/workout/composables/useWorkoutMode.ts` - Remove benchmark initialization
- `src/features/workout/components/WorkoutActiveMode.vue` - Remove benchmark props/composables/rendering
- `src/features/workout/components/WorkoutActiveModeFooter.vue` - Remove benchmark buttons

**Views:**
- `src/views/ActiveWorkout.vue` - Remove benchmark handling and cross-feature import
- `src/views/BenchmarkDetailView.vue` - Route to ActiveBenchmark, use BenchmarkExercisePicker

**Benchmarks Feature:**
- `src/features/benchmarks/composables/useBenchmarkDetail.ts` - Use ActiveBenchmarkWorkoutRepository

**Types & State:**
- `src/types/workout.ts` - Remove benchmarkId, globalTimerStartedAt, activeExerciseIndex
- `src/stores/workoutState.ts` - Remove same three fields

**Tests:**
- `src/__tests__/integration/benchmark-flows.spec.ts` - Complete rewrite for new view
- `src/__tests__/components/BenchmarkExerciseList.spec.ts` - Update imports

**Documentation:**
- `src/features/CLAUDE.md` - Update benchmarks row
- `src/features/benchmarks/CLAUDE.md` - Document new architecture (create or update)
- `src/db/CLAUDE.md` - Document activeBenchmark table

### Test Files to Create (4 files)
- `src/__tests__/composables/useBenchmark.spec.ts`
- `src/__tests__/composables/useBenchmarkMode.spec.ts`
- `src/__tests__/composables/useBenchmarkExerciseNavigation.spec.ts`
- `src/__tests__/composables/useBenchmarkPersistence.spec.ts`

---

**Total Files Affected**: 40+ files (10 new, 6 moved, 20+ modified, 4 new tests)

---

## Benefits

1. **Complete Isolation** - No shared state, no conditional logic
2. **Type Safety** - `BenchmarkWorkout` only contains relevant fields
3. **Maintainability** - Clear separation of concerns, easier to modify
4. **Testability** - Test features independently
5. **Performance** - No unnecessary benchmark logic in workout flows
6. **Bulletproof Compliance** - No cross-feature imports except dumb UI components

---

## Risk Assessment & Mitigation

**Low Risk Areas:**
- ✅ Creating parallel infrastructure (Steps 1-2) has no impact on existing flows
- ✅ No data migration required - old tables remain unchanged
- ✅ Can test thoroughly before switching flows (Step 3)
- ✅ Can rollback easily by reverting route change in BenchmarkDetailView

**Medium Risk Areas:**
- ⚠️ Step 4 cleanup requires careful ordering (components before composables)
- ⚠️ Integration test rewrite (~623 lines) is substantial work
- ⚠️ Cross-feature import fixes require creating new components

**Mitigation Strategies:**
- Follow step order exactly (especially Step 4.1 → 4.4 sequence)
- Run `pnpm type-check && pnpm lint && pnpm test` after each major step
- Test benchmark flows manually before Step 4 cleanup
- Keep git commits atomic per step for easy rollback

**Critical Testing Focus:**
- Benchmark creation and starting from BenchmarkDetailView
- Exercise progression and navigation across round boundaries
- Split time tracking and personal best comparison
- Completion flow and save to completed workouts
- App close/resume with active benchmark (IndexedDB restore)
- Personal best calculation with existing historical data
- No regression in normal workout flows

---

## Complexity Estimate

| Phase | Files Affected | Estimated Time | Risk Level |
|-------|----------------|----------------|------------|
| **Step 1**: Infrastructure | 10 new files | 8-10 hours | Low |
| **Step 2**: View & Components | 7 moved, 3 new, 3 modified | 6-8 hours | Medium |
| **Step 3**: Switch Flows | 2 modified | 2-3 hours | Low |
| **Step 4**: Cleanup | 7 modified | 4-6 hours | High |
| **Step 5**: Verify DB | Testing only | 1-2 hours | Low |
| **Step 6**: Testing | 6 modified, 4 new tests | 10-12 hours | High |
| **Step 7**: Documentation | 3 docs | 2-3 hours | Low |
| **TOTAL** | **40+ files** | **33-44 hours** | **Medium** |

**Notes:**
- Complexity reduced from initial estimate due to no data migration
- Integration test rewrite is most time-consuming task (Step 6.2)
- Database version bump is straightforward (just add new table)
- BenchmarkExercisePicker creation adds 2-3 hours to Step 2

---

## Quick Start for Developers

**Before Starting:**
1. Read this entire plan thoroughly
2. Understand Bulletproof architecture rules (no cross-feature imports)
3. Review existing benchmark implementation in `ActiveWorkout.vue` and related files

**Implementation:**
1. Follow steps **sequentially** (1 → 7)
2. **Do not skip Step 4.1-4.3** before 4.4 (breaking change risk)
3. Run validation after each step:
   ```bash
   pnpm type-check  # TypeScript validation
   pnpm lint        # Code quality & cross-feature import detection
   pnpm test        # Run all tests
   ```
4. Commit atomically per step for easy rollback
5. Test manually after Steps 2, 3, and 6

**Key Commands:**
```bash
# Validation
pnpm type-check && pnpm lint && pnpm test

# Find unused exports after cleanup
pnpm knip

# Search for remaining benchmark code in workout feature
rg -n "benchmark" src/features/workout --type vue --type ts
```

**Questions or issues?** Review this plan or check the codebase documentation in `CLAUDE.md` files.
