# Exercises Feature

Provides exercise definition management and selection UI.

## Purpose

This feature handles the exercise library - user-defined and built-in exercises that can be added to workouts. It provides selection dialogs, form handling for creating/editing exercises, and predefined option lists.

## Public API (`index.ts`)

### Components
- `ExerciseSelectorDialog` - Modal for picking exercises to add to workouts
- `ExerciseSettingsItem` - Row component for exercise management in settings

### Composables
- `useExerciseForm()` - Form state and validation for creating/editing exercises

### Data
- `EQUIPMENT_OPTIONS` - Barbell, dumbbell, machine, cable, bodyweight, etc.
- `MUSCLE_OPTIONS` - Chest, back, legs, shoulders, arms, core
- `TYPE_OPTIONS` - Compound, isolation, stability, cardio
- `METRICS_OPTIONS` - Weight+reps, reps-only, duration, distance+duration, weight+distance

## Key Concepts

### Exercise Properties
Each exercise has:
- **name** - Display name (required)
- **icon** - Emoji thumbnail
- **equipment** - Equipment type (optional)
- **muscle** - Target muscle group (optional)
- **type** - Movement classification
- **metrics** - How to track sets (determines input fields)

### Data Flow
- Exercise definitions live in `src/stores/exercises` (Pinia)
- This feature provides UI components that interact with the store
- Custom exercises persist to IndexedDB via `src/db/repositories/`

## Common Tasks

### Add a new equipment type
1. Add to `Equipment` type in `src/types/exercises.ts`
2. Add option to `EQUIPMENT_OPTIONS` in `data/exerciseOptions.ts`

### Modify exercise form validation
Edit `useExerciseForm.ts` - check the `isNameValid` computed and `isSaveDisabled`
