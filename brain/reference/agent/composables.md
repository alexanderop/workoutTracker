# Composables Guide

## Directory Structure

Composables are split between **shared** (`src/composables/`) and **feature-specific** (`src/features/*/composables/`).

```
src/composables/                    # Shared composables
├── useAnimatedCounter.ts           # Number animation
├── useBenchmarksList.ts            # Benchmark list loading and formatting
├── useDialogState.ts               # Single-dialog-at-a-time state (mutual exclusion)
├── useEnterAnimation.ts            # Staggered list animations
├── useExerciseSearch.ts            # Exercise search/filter
├── useFormDraft.ts                 # Form draft persistence via IndexedDB
├── useGlobalWakeLock.ts            # App-wide wake lock state
├── useImageConversion.ts           # Image-to-WebP conversion with error state
├── useNumberLocale.ts              # Locale-aware number formatting
├── usePwaUpdate.ts                 # PWA service worker update handling
├── useRecentWorkouts.ts            # Recent completed workouts with formatted dates
├── useScreenWakeLock.ts            # Screen wake lock API
├── useSwipeableDelete.ts           # Swipe-to-delete gesture state
├── useTimedBlockExercises.ts       # Timed block exercise management
├── useTouchDevice.ts               # Touch input detection via media query
├── useVersionCheck.ts              # App version polling and update detection
├── useWeightDisplay.ts             # Weight unit formatting
├── useWorkoutCalendar.ts           # Workout calendar data (week/month views)
├── useWorkoutsList.ts              # Workout template list loading and formatting
├── persistence/
│   └── createPersistenceCore.ts    # Shared auto-save/load/discard logic (debounced)
└── timers/
    ├── useBaseTimer.ts             # Shared timer state and interval management (base)
    ├── useRestTimer.ts             # Rest timer between sets
    ├── useAmrapTimer.ts            # AMRAP countdown
    ├── useBenchmarkGlobalTimer.ts  # Singleton elapsed timer for benchmark workouts
    ├── useEmomTimer.ts             # EMOM minute transitions
    ├── useTabataTimer.ts           # Tabata work/rest phases
    ├── useForTimeTimer.ts          # For Time count-up
    └── useTimerAudio.ts            # Timer audio notifications

src/features/workout/composables/   # Workout feature composables
├── useWorkout.ts                   # Core workout state (singleton)
├── useWorkoutPersistence.ts        # IndexedDB auto-save/restore
├── useWorkoutMode.ts               # Builder/active mode management
├── useWorkoutDetail.ts             # Workout history detail view
├── useWorkoutDurationTimer.ts      # Workout elapsed time
├── useSummaryStats.ts              # Animated summary statistics for completed workouts
└── useAppInitialization.ts         # App startup logic
```

## Core Composables

### useWorkout()

**Singleton pattern** - all components share the same workout state. The `workout` ref is obtained via `getWorkoutRef()` from `src/stores/workoutState.ts` at module level; it is not declared inside the composable.

Location: `src/features/workout/composables/useWorkout.ts`

```ts
const {
  workout,           // Ref<Workout> - the shared singleton state
  selectedBlock,     // Computed: block at selectedBlockIndex (any kind)
  selectedExercise,  // Computed: selectedBlock if it's a strength block (backward compat)
  exercises,         // Computed: strength blocks only (backward compat)

  // Block operations
  selectBlock,
  removeBlock,
  reorderBlocks,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  addCardioBlock,
  updateStrengthBlock,
  setBlockResult,

  // Exercise-based methods (backward compatibility)
  selectExercise,
  addExercise,       // Add strength block
  removeExercise,
  updateExercise,
  reorderExercises,

  // Set operations (strength blocks)
  completeSet,       // Mark set complete, returns CompleteSetResult
  addSet,
  removeSet,
  duplicateSet,
  setSetCount,
  updateSetValue,
  activateSet,       // For mode transitions
} = useWorkout()
```

**Re-exported from `src/stores/workoutState.ts` for backward compatibility:**
- `resetWorkout()` - Clear to initial empty state
- `restoreWorkout(workout)` - Restore from saved state
- `getWorkoutRef()` - Get raw ref for persistence layer

### useWorkoutPersistence(workout)

Handles auto-save to IndexedDB with debouncing. Internally uses `createPersistenceCore` from `src/composables/persistence/createPersistenceCore.ts`.

Location: `src/features/workout/composables/useWorkoutPersistence.ts`

```ts
const {
  persistenceState,        // Ref<{ status: 'idle' | 'loading' | 'saving' | 'error' }>
  hasUnsavedChanges,
  isInitialized,

  loadActiveWorkout,       // Load from DB, returns Workout | null
  hasActiveWorkout,        // Check if workout exists in DB
  discardActiveWorkout,    // Delete without saving to history
  completeWorkout,         // Save to history, returns DbCompletedWorkout | null
  startNewWorkoutSession,  // Initialize new workout timestamp (fresh start)
  markInitialized,         // For resumed workouts
  saveNow,                 // Force immediate save
} = useWorkoutPersistence(workoutRef)
```

Also exports `resetWorkoutPersistence()` (used in tests for clean state between files).

### useRestTimer()

Rest timer between sets with audio notification.

Location: `src/composables/timers/useRestTimer.ts`

```ts
const {
  isRunning,
  remainingSeconds,
  totalSeconds,
  progress,           // 0-1 for progress bar

  start,              // start(seconds)
  pause,
  resume,
  stop,
  addTime,            // addTime(seconds) - add/subtract time
} = useRestTimer()
```

## Timer Composables

All timers follow a similar pattern with state machine for phases. `useBaseTimer.ts` provides the shared interval management used by AMRAP, EMOM, Tabata, and ForTime.

Location: `src/composables/timers/`

### useAmrapTimer(config)

AMRAP (As Many Rounds As Possible) countdown timer.

```ts
const {
  phase,              // 'idle' | 'countdown' | 'active' | 'complete'
  remainingSeconds,
  rounds,
  partialReps,

  start,
  pause,
  resume,
  stop,
  recordRound,        // Increment round counter
  setPartialReps,     // Set partial reps for incomplete round
} = useAmrapTimer({ durationMinutes: 12 })
```

### useEmomTimer(config, exercises)

EMOM (Every Minute On the Minute) with exercise rotation.

```ts
const {
  phase,              // 'idle' | 'countdown' | 'active' | 'rest' | 'complete'
  currentMinute,
  totalMinutes,
  secondsInMinute,
  currentExercise,    // Current exercise for this minute

  start,
  pause,
  resume,
  stop,
} = useEmomTimer({ minutes: 10 }, exercises)
```

### useTabataTimer(config)

Tabata intervals (work/rest phases).

```ts
const {
  phase,              // 'idle' | 'countdown' | 'work' | 'rest' | 'complete'
  currentRound,
  totalRounds,
  secondsRemaining,
  isWorkPhase,

  start,
  pause,
  resume,
  stop,
  recordReps,         // Record reps for current round
} = useTabataTimer({ rounds: 8, workSeconds: 20, restSeconds: 10 })
```

### useForTimeTimer(config)

For Time count-up timer with optional cap.

```ts
const {
  phase,              // 'idle' | 'countdown' | 'active' | 'complete'
  elapsedSeconds,
  timeCapSeconds,     // null if no cap
  isTimeCapped,       // true if stopped due to cap

  start,
  pause,
  resume,
  stop,
  complete,           // Mark as complete (finished workout)
} = useForTimeTimer({ timeCapMinutes: 20 })
```

### useBenchmarkGlobalTimer()

**Singleton** elapsed timer for benchmark workouts. Continues counting across app closes via timestamp-based calculation.

Location: `src/composables/timers/useBenchmarkGlobalTimer.ts`

## Patterns

### Singleton State

`useWorkout()` uses singleton pattern - state is shared across all component instances. The ref is created at module level in `src/stores/workoutState.ts` via `getWorkoutRef()` and accessed at module level in `useWorkout.ts`:

```ts
// In workoutState.ts (store)
const workout = ref<Workout>(createInitialWorkout()) // Module-level singleton

export function getWorkoutRef() { return workout }

// In useWorkout.ts
const workout = getWorkoutRef() // Module-level, shared across all callers

export function useWorkout() {
  // All callers share the same `workout` ref
  return { workout, ... }
}
```

### Discriminated Unions

Timer phases use discriminated unions for type safety:

```ts
type Phase = 'idle' | 'countdown' | 'active' | 'complete'

if (phase.value === 'active') {
  // TypeScript knows we're in active phase
}
```

### Result Types

`completeSet()` returns a discriminated union indicating next action:

```ts
const result = completeSet(set)
if (result.kind === 'completed') {
  if (result.nextAction === 'next-set') {
    // Start rest timer
  } else if (result.nextAction === 'next-block') {
    // Move to next block
  } else if (result.nextAction === 'workout-complete') {
    // Show completion dialog
  }
}
```
