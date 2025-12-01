# Composables Guide

## Directory Structure

```
src/composables/
├── useWorkout.ts           # Core workout state (singleton)
├── useWorkoutPersistence.ts # IndexedDB auto-save/restore
├── useWorkoutMode.ts       # Builder/active mode management
├── useWorkoutDetail.ts     # Workout history detail view
├── useRestTimer.ts         # Rest timer between sets
├── useWorkoutWakeLock.ts   # Screen wake lock during workouts
├── useTheme.ts             # Dark/light theme management
├── useEnterAnimation.ts    # Staggered list animations
├── useAnimatedCounter.ts   # Number animation
├── useExerciseForm.ts      # Custom exercise form state
├── useAppInitialization.ts # App startup logic
└── timers/
    ├── useAmrapTimer.ts    # AMRAP countdown
    ├── useEmomTimer.ts     # EMOM minute transitions
    ├── useTabataTimer.ts   # Tabata work/rest phases
    └── useForTimeTimer.ts  # For Time count-up
```

## Core Composables

### useWorkout()

**Singleton pattern** - all components share the same workout state via `workout.value`.

Location: `src/composables/useWorkout.ts`

```ts
const {
  workout,           // Ref<Workout> - the shared state
  selectedBlock,     // Current block being edited/executed
  exercises,         // Computed: strength blocks only (legacy)

  // Block operations
  selectBlock,
  removeBlock,
  reorderBlocks,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  updateStrengthBlock,
  setBlockResult,

  // Set operations (strength blocks)
  addExercise,       // Add strength block
  completeSet,       // Mark set complete, returns next action
  addSet,
  removeSet,
  setSetCount,
  updateSetValue,
} = useWorkout()
```

**Key functions:**
- `resetWorkout()` - Clear to initial empty state
- `restoreWorkout(workout)` - Restore from saved state
- `getWorkoutRef()` - Get raw ref for persistence layer

### useWorkoutPersistence(workout)

Handles auto-save to IndexedDB with debouncing.

Location: `src/composables/useWorkoutPersistence.ts`

```ts
const {
  persistenceState,        // 'idle' | 'loading' | 'saving' | 'error'
  hasUnsavedChanges,
  isInitialized,

  loadActiveWorkout,       // Load from DB, returns Workout | null
  hasActiveWorkout,        // Check if workout exists in DB
  discardActiveWorkout,    // Delete without saving to history
  completeWorkout,         // Save to history, returns DbCompletedWorkout
  startNewWorkoutSession,  // Initialize new workout timestamp
  markInitialized,         // For resumed workouts
  saveNow,                 // Force immediate save
} = useWorkoutPersistence(workoutRef)
```

### useRestTimer()

Rest timer between sets with audio notification.

Location: `src/composables/useRestTimer.ts`

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

All timers follow a similar pattern with state machine for phases.

### useAmrapTimer(config)

AMRAP (As Many Rounds As Possible) countdown timer.

Location: `src/composables/timers/useAmrapTimer.ts`

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

Location: `src/composables/timers/useEmomTimer.ts`

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

Location: `src/composables/timers/useTabataTimer.ts`

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

Location: `src/composables/timers/useForTimeTimer.ts`

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

## Patterns

### Singleton State

`useWorkout()` uses singleton pattern - state is shared across all component instances:

```ts
// In useWorkout.ts
const workout = ref<Workout>(createInitialWorkout()) // Module-level

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
