# Workout Feature

Core workout execution logic - the heart of the application.

## Purpose

This feature handles building and executing workouts. Users construct workouts from blocks (strength exercises, timed intervals), then execute them in active mode with set tracking, timers, and progress persistence.

## Public API (`index.ts`)

### Components
- `WorkoutBuilderMode` - Block playlist for configuring workout
- `WorkoutActiveMode` - Immersive execution view
- `WorkoutAddBlockDialog` - Add strength or timed blocks
- `WorkoutAddExerciseDialog` - Quick exercise addition
- `WorkoutCancelDialog` - Confirm workout abandonment
- `WorkoutFinishDialog` - Complete workout with summary
- `WorkoutQueueDrawer` - View/manage block queue during execution
- `WorkoutConfigureAmrapDialog` / `EmomDialog` / `TabataDialog` / `ForTimeDialog` - Timed block config
- `WorkoutDetailExerciseCard` / `WorkoutDetailStatsRow` - Completed workout display
- `WorkoutEditExerciseDialog` - Edit exercise name/equipment mid-workout

### Composables
- `useWorkout()` - Primary workout state management
- `useWorkoutMode()` - Builder/active mode transitions
- `useWorkoutDetail(workoutId)` - Load completed workout for viewing
- `useWorkoutPersistence()` - Auto-save active workout to IndexedDB
- `useAppInitialization()` - Restore active workout on app load

### Utilities
- `getDefaultWorkoutName()` - Generate workout name from date/exercises

## Key Concepts

### Workout State Singleton
All workout state lives in a single `ref<Workout>` at `src/stores/workoutState.ts`:
```typescript
type Workout = {
  id: string
  name: string
  mode: 'builder' | 'active'
  blocks: Array<WorkoutBlock>
  selectedBlockIndex: number
  activeSetIndex: number | null
  startedAt: number | null
}
```

Access via `useWorkout()` or `getWorkoutRef()` - same instance everywhere.

### Block Types (Discriminated Union)
Blocks use `kind` field for type discrimination:
- `StrengthBlock` - Sets with kg/reps/RIR tracking
- `AmrapBlock` - As Many Rounds As Possible
- `EmomBlock` - Every Minute On the Minute
- `TabataBlock` - 20s work / 10s rest intervals
- `ForTimeBlock` - Complete workout ASAP

### Workout Modes
1. **Builder mode** - Configure blocks, add/remove/reorder
2. **Active mode** - Execute workout, track sets, run timers

Transition via `useWorkoutMode().startWorkout()` / `returnToBuilder()`

### Set Completion Flow
`completeSet(set)` returns next action:
```typescript
type CompleteSetResult =
  | { kind: 'completed'; nextAction: 'next-set'; blockIndex; setId }
  | { kind: 'completed'; nextAction: 'next-block'; blockIndex }
  | { kind: 'completed'; nextAction: 'workout-complete' }
  | { kind: 'uncompleted' }
```

### Persistence
- `useWorkoutPersistence()` watches workout state and auto-saves
- `useAppInitialization()` restores on app mount
- Completed workouts save to `DbCompletedWorkout` table

## Component Hierarchy

```
WorkoutView (view)
├── WorkoutBuilderMode
│   ├── WorkoutBlockPlaylist
│   │   └── WorkoutBlockPlaylistItem
│   ├── WorkoutAddBlockDialog
│   └── WorkoutAddExerciseDialog
└── WorkoutActiveMode
    ├── WorkoutHeader
    ├── WorkoutActiveStrengthView (for strength blocks)
    │   ├── WorkoutSetTable
    │   │   └── WorkoutSetTableRow
    │   └── WorkoutPreviousHistory
    ├── StandaloneTimerRunner (for timed blocks)
    └── WorkoutActiveModeFooter
```

## Common Tasks

### Add a new block type
1. Add type to `src/types/blocks.ts`
2. Add `add{Type}Block()` method in `useWorkout.ts`
3. Create config dialog component
4. Add to `WorkoutAddBlockDialog`
5. Handle in `WorkoutActiveMode` renderer

### Modify set tracking fields
1. Update `Set` type in `src/types/workout.ts`
2. Update `isSetReady()` validation in `useWorkout.ts`
3. Update `WorkoutSetTableRow` inputs

### Change persistence timing
Edit `useWorkoutPersistence.ts` - modify the `watchEffect` debounce
