# Session Handoff Plan: Exercise Dialog Refactoring

## 1. Primary Request and Intent

The user requested a refactoring of exercise dialog components in their Vue 3 workout tracking app. The goals are:

1. **Exercise Picker Consolidation** (Priority): Merge `WorkoutAddExerciseDialog` and `WorkoutExercisePicker` into a single unified component supporting both dialog and overlay presentation modes
2. **Timed Block Exercise List Extraction** (Secondary): Extract shared exercise list template from AMRAP/EMOM/ForTime config dialogs (~150 lines of duplication)

## 2. Key Technical Concepts

- **Vue 3.5+ patterns**: `defineModel`, reactive props destructure
- **TDD approach**: Integration tests first using `@testing-library/vue` and `vitest`
- **Feature-based architecture**: Bulletproof pattern with feature boundary rules
- **shadcn-vue components**: Dialog, MobileDialogContent
- **Composables**: `useExerciseSearch()` for unified exercise data source
- **Discriminated presentation modes**: 'dialog' vs 'overlay' rendering

## 3. Files and Code Sections

### `/Users/alex/.claude/plans/cozy-scribbling-cake.md`
- **Why important**: Contains the full implementation plan with all decisions from code review
- **Status**: Approved and being followed

### `/Users/alex/Projects/Vue/workoutTracker/src/features/workout/components/WorkoutExercisePicker.vue`
- **Why important**: The unified component that replaces both old picker implementations
- **Changes made**: Completely rewritten with new API
- **Code snippet** (key props):
```typescript
type Props = {
  /** 'dialog' for modal presentation, 'overlay' for inline absolute positioning */
  presentation?: 'dialog' | 'overlay'
  /** 'single' closes picker on selection, 'multi' stays open for multiple selections */
  mode?: 'single' | 'multi'
  /** Show "Create Custom Exercise" button. Only applies when presentation='dialog' */
  showCreate?: boolean
}

type Emits = {
  select: [exercise: { name: string; icon: string }]
}

const open = defineModel<boolean>('open', { required: true })
```

### `/Users/alex/Projects/Vue/workoutTracker/src/__tests__/integration/exercise-picker.spec.ts`
- **Why important**: Integration tests for the unified component
- **Status**: 4 tests created and passing
- **Tests cover**: Dialog opening, search filtering, exercise selection, Create button visibility

### `/Users/alex/Projects/Vue/workoutTracker/src/views/CreateTemplateView.vue`
- **Why important**: First template view migrated to new component
- **Changes made**:
  - Import changed from `WorkoutAddExerciseDialog` to `WorkoutExercisePicker`
  - Handler signature updated to accept `{ name: string; icon: string }` instead of `string`
  - Component usage updated with `presentation="dialog"` and `:show-create="true"`

### `/Users/alex/Projects/Vue/workoutTracker/src/views/TemplateDetailView.vue`
- **Why important**: Second template view migrated to new component
- **Changes made**:
  - Import changed to `WorkoutExercisePicker`
  - Added wrapper function `handleAddExercise` to adapt signature
  - Component usage updated

### `/Users/alex/Projects/Vue/workoutTracker/src/features/workout/index.ts`
- **Why important**: Feature public API - NEEDS EXPORT ADDED
- **Current exports include**: WorkoutAddExerciseDialog (line 6)
- **Needs**: Add export for `WorkoutExercisePicker`

## 4. Problem Solving

**Solved:**
- Unified component working with both dialog and overlay modes
- Tests passing for dialog mode behavior
- Existing timed-block-exercise-picker.spec.ts still passes (overlay mode)

**Current Issue:**
- TypeScript error: `Module '"@/features/workout"' has no exported member 'WorkoutExercisePicker'`
- Need to add export to `src/features/workout/index.ts`

## 5. Pending Tasks

From the todo list:
1. **IN PROGRESS**: Migrate template views - need to fix export issue
2. Update timed block dialogs to use `presentation="overlay"` prop explicitly
3. Delete `WorkoutAddExerciseDialog.vue` and update exports
4. Write tests for `WorkoutTimedBlockExerciseList`
5. Create `WorkoutTimedBlockExerciseList` component
6. Refactor AMRAP/EMOM/ForTime dialogs to use shared exercise list

## 6. Current Work

Was in the middle of migrating template views when the type check failed. The immediate issue is:

**File**: `/Users/alex/Projects/Vue/workoutTracker/src/features/workout/index.ts`

**Error**: `Module '"@/features/workout"' has no exported member 'WorkoutExercisePicker'`

**Solution needed**: Add this line to the exports:
```typescript
export { default as WorkoutExercisePicker } from './components/WorkoutExercisePicker.vue'
```

## 7. Next Step

Add the `WorkoutExercisePicker` export to `/Users/alex/Projects/Vue/workoutTracker/src/features/workout/index.ts`, then run type-check and tests to verify the migration is complete.

---

## Quick Resume Commands

```bash
# Run tests to verify state
pnpm test:unit src/__tests__/integration/exercise-picker.spec.ts src/__tests__/integration/timed-block-exercise-picker.spec.ts

# Type check
pnpm type-check
```

## Plan File Reference
Full plan at: `/Users/alex/.claude/plans/cozy-scribbling-cake.md`
