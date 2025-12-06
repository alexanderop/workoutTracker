# Templates Feature

Provides workout template management and starting workouts from templates.

## Purpose

This feature handles saved workout templates - reusable workout configurations that users can start quickly. Templates store exercise selections and default set counts, enabling one-tap workout creation.

## Public API (`index.ts`)

### Components
- `TemplateExerciseList` - Displays/edits exercises within a template

### Types
- `TemplateExercise` - Exercise item in a template (name, equipment, thumbnail, defaultSetCount)

### Composables
- `useTemplateDetail(templateId)` - Full template CRUD and workout launching

## Key Concepts

### Template Structure
Templates persist as `DbWorkoutTemplate` in IndexedDB:
- **name** - Template display name
- **blocks** - Array of `DbTemplateStrengthBlock` (only strength blocks currently)
- **createdAt** / **updatedAt** - Timestamps

### useTemplateDetail Composable
State machine pattern with loading states:
```typescript
type TemplateDetailState =
  | { status: 'loading' }
  | { status: 'success'; template: DbWorkoutTemplate }
  | { status: 'not-found' }
```

Key methods:
- `loadTemplate()` - Fetches template from DB
- `saveTemplate()` - Persists changes
- `deleteTemplate()` - Removes template
- `startWorkout()` - Creates active workout from template
- `addExercise()` / `removeExercise()` - Modify exercise list
- `isEdited` computed - Tracks unsaved changes

### Starting a Workout
`startWorkout()` flow:
1. Calls `templatesRepository.startFromTemplate()`
2. Saves to `activeWorkoutRepository`
3. Converts DB format to in-memory workout
4. Calls `restoreWorkout()` to populate singleton state

## Data Flow

```
DbWorkoutTemplate (IndexedDB)
        ↓
templatesRepository.startFromTemplate()
        ↓
DbActiveWorkout (IndexedDB)
        ↓
dbToWorkout() converter
        ↓
restoreWorkout() → workout singleton ref
```

## Common Tasks

### Add timed block support to templates
1. Update `DbWorkoutTemplate.blocks` type in `src/db/schema.ts`
2. Update `extractExercisesFromBlocks()` in `useTemplateDetail.ts`
3. Update `exercisesToBlocks()` for saving
4. Add UI components for timed block configuration
